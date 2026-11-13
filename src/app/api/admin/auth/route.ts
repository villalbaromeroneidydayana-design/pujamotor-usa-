import { NextRequest, NextResponse } from "next/server";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import {
  authenticateUserCredentials,
  changeUserPassword,
  getPermissionsForRole,
  getVerifiedSessionFromRequest,
  requireServerSession,
  SESSION_COOKIE_NAME,
} from "@/modules/admin/auth.service";
import { auditService } from "@/modules/admin/audit.service";
import {
  AppDomainError,
  TooManyRequestsError,
} from "@/shared/errors/domain-errors";

function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function GET(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    const session = await getVerifiedSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
        mustChangePassword: session.mustChangePassword,
        permissions: getPermissionsForRole(session.role),
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const clientIp = extractClientIp(req);

  try {
    await ensureSystemBootstrapped();
    const body = await req.json();

    if (body.action === "LOGOUT") {
      const existingSession = await getVerifiedSessionFromRequest(req);
      if (existingSession) {
        await auditService.record({
          actorUserId: existingSession.userId,
          actorRole: existingSession.role,
          action: "ADMIN_SESSION_LOGOUT",
          module: "ADMIN_SECURITY",
          targetType: "UserSession",
          targetId: existingSession.userId,
          details: { email: existingSession.email },
          ipAddress: clientIp,
        });
      }

      const res = NextResponse.json({ authenticated: false });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return res;
    }

    if (body.action === "CHANGE_PASSWORD") {
      const session = await requireServerSession(req, {
        allowWhenPasswordChangeRequired: true,
      });

      const currentPassword = String(body.currentPassword || "");
      const newPassword = String(body.newPassword || "");

      const { sessionToken, user } = await changeUserPassword({
        userId: session.userId,
        currentPassword,
        newPassword,
      });

      await auditService.record({
        actorUserId: user.id,
        actorRole: user.role,
        action: "ADMIN_PASSWORD_CHANGED",
        module: "ADMIN_SECURITY",
        targetType: "User",
        targetId: user.id,
        details: { email: user.email, mandatoryInitialChangeCompleted: true },
        ipAddress: clientIp,
      });

      const res = NextResponse.json({
        authenticated: true,
        user: {
          ...user,
          permissions: getPermissionsForRole(user.role),
        },
      });

      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 8 * 60 * 60,
      });

      return res;
    }

    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Debe ingresar correo electrónico y contraseña." },
        { status: 400 }
      );
    }

    const { sessionToken, user } = await authenticateUserCredentials(
      email,
      password,
      clientIp
    );

    await auditService.record({
      actorUserId: user.id,
      actorRole: user.role,
      action: "ADMIN_SESSION_LOGIN",
      module: "ADMIN_SECURITY",
      targetType: "UserSession",
      targetId: user.id,
      details: {
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      ipAddress: clientIp,
    });

    const res = NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        permissions: getPermissionsForRole(user.role),
      },
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 horas
    });

    return res;
  } catch (error) {
    if (error instanceof TooManyRequestsError) {
      await auditService.record({
        actorRole: "PUBLIC_VISITOR",
        action: "ADMIN_LOGIN_RATE_LIMITED",
        module: "ADMIN_SECURITY",
        targetType: "UserSession",
        details: { retryAfterSeconds: error.retryAfterSeconds },
        ipAddress: clientIp,
      });

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds),
          },
        }
      );
    }

    if (error instanceof AppDomainError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    const message =
      error instanceof Error ? error.message : "Error de autenticación.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
