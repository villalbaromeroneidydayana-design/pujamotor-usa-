import crypto from "crypto";
import type { NextRequest } from "next/server";
import { getEnv } from "@/config/env";
import { prisma } from "@/shared/db/prisma";
import { hashPassword, verifyPassword } from "@/shared/security/crypto-pii";
import {
  assertLoginRateLimitAllowed,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from "@/shared/security/login-rate-limiter";
import {
  AppDomainError,
  PasswordChangeRequiredError,
  UnauthenticatedError,
  UnauthorizedAccessError,
} from "@/shared/errors/domain-errors";

export const SESSION_COOKIE_NAME = "autos_usa_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

export type UserRole =
  | "SUPER_ADMIN"
  | "INVENTORY_MANAGER"
  | "COMMERCIAL_ADVISOR"
  | "AUDITOR_READONLY"
  | "PUBLIC_VISITOR";

export type PermissionCode =
  | "VIEW_ADMIN_OVERVIEW"
  | "INGEST_LOT_DATA"
  | "EDIT_VEHICLE_AND_LOT"
  | "MANAGE_AUTHORIZED_MEDIA"
  | "EDIT_TARIFF_RULES"
  | "MANAGE_CRM_LEADS_AND_CASES"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_SYSTEM_USERS";

const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  SUPER_ADMIN: [
    "VIEW_ADMIN_OVERVIEW",
    "INGEST_LOT_DATA",
    "EDIT_VEHICLE_AND_LOT",
    "MANAGE_AUTHORIZED_MEDIA",
    "EDIT_TARIFF_RULES",
    "MANAGE_CRM_LEADS_AND_CASES",
    "VIEW_AUDIT_LOGS",
    "MANAGE_SYSTEM_USERS",
  ],
  INVENTORY_MANAGER: [
    "VIEW_ADMIN_OVERVIEW",
    "INGEST_LOT_DATA",
    "EDIT_VEHICLE_AND_LOT",
    "MANAGE_AUTHORIZED_MEDIA",
    "VIEW_AUDIT_LOGS",
  ],
  COMMERCIAL_ADVISOR: [
    "VIEW_ADMIN_OVERVIEW",
    "MANAGE_CRM_LEADS_AND_CASES",
    "VIEW_AUDIT_LOGS",
  ],
  AUDITOR_READONLY: ["VIEW_ADMIN_OVERVIEW", "VIEW_AUDIT_LOGS"],
  PUBLIC_VISITOR: [],
};

export const ROLE_LABELS: Record<UserRole, { name: string; description: string }> = {
  SUPER_ADMIN: {
    name: "Super Administrador",
    description:
      "Control total de arquitectura, reglas tarifarias, fuentes de datos, usuarios y auditoría.",
  },
  INVENTORY_MANAGER: {
    name: "Gestor de Inventario y Lotes",
    description:
      "Autorizado para importar CSV de Copart, enriquecer VIN con NHTSA, validar lotes y gestionar fotografías autorizadas.",
  },
  COMMERCIAL_ADVISOR: {
    name: "Asesor Comercial / Exportación",
    description:
      "Autorizado para gestionar clientes, solicitudes de cotización, expedientes de asesoría y seguimiento logístico.",
  },
  AUDITOR_READONLY: {
    name: "Auditor de Operaciones (Solo Lectura)",
    description:
      "Acceso exclusivo de consulta a registros de actividad, historial de cambios de lotes y fuentes de datos.",
  },
  PUBLIC_VISITOR: {
    name: "Visitante Público",
    description:
      "Acceso al catálogo público verificado, comparador, calculadora de costos y solicitud de información.",
  },
};

export interface VerifiedSessionUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
  iat: number;
  exp: number;
}

export function hasPermission(role: UserRole, permission: PermissionCode): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes(permission);
}

export function assertPermission(role: UserRole, permission: PermissionCode): void {
  if (!hasPermission(role, permission)) {
    throw new UnauthorizedAccessError(
      `El rol '${role}' (${ROLE_LABELS[role]?.name ?? role}) no tiene el permiso requerido '${permission}'.`
    );
  }
}

export function getPermissionsForRole(role: UserRole): PermissionCode[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Genera un token de sesión firmado criptográficamente con HMAC-SHA256 usando AUTH_SECRET.
 */
export function createSessionToken(
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    mustChangePassword?: boolean;
  },
  customDurationMs = SESSION_DURATION_MS
): string {
  const now = Date.now();
  const payload: VerifiedSessionUser = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
    iat: now,
    exp: now + customDurationMs,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", getEnv().AUTH_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifica la firma HMAC-SHA256 en tiempo constante y comprueba la vigencia del token de sesión.
 */
export function verifySessionToken(
  token: string | undefined | null
): VerifiedSessionUser | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getEnv().AUTH_SECRET)
    .update(payloadB64)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as VerifiedSessionUser;

    if (!parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Autentica credenciales contra la tabla User con control de tasa de intentos fallidos y bloqueo temporal.
 */
export async function authenticateUserCredentials(
  email: string,
  plainPassword: string,
  ipAddress = "127.0.0.1"
) {
  const normalizedEmail = email.trim().toLowerCase();

  // Verificar límite de intentos y bloqueo temporal antes de procesar
  assertLoginRateLimitAllowed(ipAddress, normalizedEmail);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    recordFailedLoginAttempt(ipAddress, normalizedEmail);
    throw new UnauthenticatedError("Credenciales inválidas o cuenta inactiva.");
  }

  const isPasswordValid = verifyPassword(plainPassword, user.passwordHash);
  if (!isPasswordValid) {
    const attemptInfo = recordFailedLoginAttempt(ipAddress, normalizedEmail);
    if (attemptInfo.isLockedOut) {
      throw new UnauthenticatedError(
        `Credenciales inválidas. Se alcanzó el límite de intentos fallidos; la cuenta ha sido bloqueada temporalmente por ${attemptInfo.retryAfterSeconds} segundos.`
      );
    }
    throw new UnauthenticatedError("Credenciales inválidas o cuenta inactiva.");
  }

  // Inicio de sesión válido: limpiar contador de fallos
  resetLoginAttempts(ipAddress, normalizedEmail);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const role = user.role as UserRole;
  const sessionToken = createSessionToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role,
    mustChangePassword: user.mustChangePassword,
  });

  return {
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

/**
 * Valida la complejidad de una nueva contraseña y actualiza el hash del usuario,
 * desactivando la bandera mustChangePassword.
 */
export async function changeUserPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user || !user.isActive) {
    throw new UnauthenticatedError("Usuario no válido.");
  }

  if (!verifyPassword(input.currentPassword, user.passwordHash)) {
    throw new UnauthenticatedError("La contraseña actual ingresada es incorrecta.");
  }

  const nextPwd = input.newPassword;
  if (nextPwd === input.currentPassword) {
    throw new AppDomainError(
      "La nueva contraseña debe ser diferente de la contraseña temporal o actual.",
      "INVALID_NEW_PASSWORD",
      400
    );
  }

  const hasMinLen = nextPwd.length >= 12;
  const hasUpper = /[A-Z]/.test(nextPwd);
  const hasLower = /[a-z]/.test(nextPwd);
  const hasDigit = /[0-9]/.test(nextPwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(nextPwd);

  if (!hasMinLen || !hasUpper || !hasLower || !hasDigit || !hasSymbol) {
    throw new AppDomainError(
      "La nueva contraseña debe tener al menos 12 caracteres e incluir mayúsculas, minúsculas, números y caracteres especiales.",
      "WEAK_PASSWORD",
      400
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(nextPwd),
      mustChangePassword: false,
    },
  });

  const role = updated.role as UserRole;
  const sessionToken = createSessionToken({
    id: updated.id,
    email: updated.email,
    fullName: updated.fullName,
    role,
    mustChangePassword: false,
  });

  return {
    sessionToken,
    user: {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role,
      mustChangePassword: false,
    },
  };
}

/**
 * Extrae y verifica la sesión del servidor exclusivamente desde la cookie HttpOnly firmada,
 * contrastando contra la tabla User en la base de datos para impedir suplantación de rol.
 */
export async function getVerifiedSessionFromRequest(
  req: NextRequest
): Promise<VerifiedSessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const verifiedPayload = verifySessionToken(token);
  if (!verifiedPayload) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: verifiedPayload.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      mustChangePassword: true,
      isActive: true,
    },
  });

  if (!dbUser || !dbUser.isActive) {
    return null;
  }

  return {
    userId: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    role: dbUser.role as UserRole,
    mustChangePassword: dbUser.mustChangePassword,
    iat: verifiedPayload.iat,
    exp: verifiedPayload.exp,
  };
}

export async function requireServerSession(
  req: NextRequest,
  options?: { allowWhenPasswordChangeRequired?: boolean }
): Promise<VerifiedSessionUser> {
  const session = await getVerifiedSessionFromRequest(req);
  if (!session) {
    throw new UnauthenticatedError(
      "Acceso denegado: Se requiere iniciar sesión administrativa válida."
    );
  }

  if (session.mustChangePassword && !options?.allowWhenPasswordChangeRequired) {
    throw new PasswordChangeRequiredError();
  }

  return session;
}

export async function requireServerPermission(
  req: NextRequest,
  permission: PermissionCode
): Promise<VerifiedSessionUser> {
  const session = await requireServerSession(req);
  assertPermission(session.role, permission);
  return session;
}
