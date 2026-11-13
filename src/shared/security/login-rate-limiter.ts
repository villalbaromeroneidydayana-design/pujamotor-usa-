import { TooManyRequestsError } from "@/shared/errors/domain-errors";

interface AttemptRecord {
  failedCount: number;
  firstFailedAt: number;
  lockedUntil: number | null;
}

interface BurstRecord {
  requestCount: number;
  windowStartedAt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const FAILED_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos de espera tras 5 fallos

const MAX_BURST_REQUESTS_PER_MINUTE = 10;
const BURST_WINDOW_MS = 60 * 1000; // 1 minuto

const loginAttemptsByKey = new Map<string, AttemptRecord>();
const burstByIp = new Map<string, BurstRecord>();

function normalizeKey(ip: string, email: string): string {
  return `${ip.trim()}::${email.trim().toLowerCase()}`;
}

/**
 * Verifica que la IP y la cuenta no hayan superado el límite de solicitudes por minuto
 * ni estén en periodo de bloqueo temporal (cooldown) por intentos fallidos repetidos.
 */
export function assertLoginRateLimitAllowed(ip: string, email: string): void {
  const now = Date.now();
  const cleanIp = ip.trim() || "127.0.0.1";

  // 1. Control de ráfaga por IP (solicitudes por minuto)
  const burst = burstByIp.get(cleanIp);
  if (!burst || now - burst.windowStartedAt > BURST_WINDOW_MS) {
    burstByIp.set(cleanIp, { requestCount: 1, windowStartedAt: now });
  } else {
    burst.requestCount += 1;
    if (burst.requestCount > MAX_BURST_REQUESTS_PER_MINUTE) {
      const retryAfter = Math.max(
        1,
        Math.ceil((burst.windowStartedAt + BURST_WINDOW_MS - now) / 1000)
      );
      throw new TooManyRequestsError(
        `Demasiadas solicitudes de inicio de sesión desde esta dirección IP. Espere ${retryAfter} segundos antes de volver a intentar.`,
        retryAfter
      );
    }
  }

  // 2. Control de bloqueo por intentos fallidos sobre la cuenta
  const key = normalizeKey(cleanIp, email);
  const record = loginAttemptsByKey.get(key);
  if (!record) return;

  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfter = Math.max(1, Math.ceil((record.lockedUntil - now) / 1000));
    throw new TooManyRequestsError(
      `Cuenta temporalmente bloqueada por múltiples intentos fallidos de inicio de sesión. Tiempo de espera restante: ${retryAfter} segundos.`,
      retryAfter
    );
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttemptsByKey.delete(key);
  }
}

/**
 * Registra un intento fallido de inicio de sesión y activa el tiempo de espera si alcanza el umbral.
 */
export function recordFailedLoginAttempt(ip: string, email: string): {
  failedCount: number;
  isLockedOut: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const key = normalizeKey(ip || "127.0.0.1", email);
  const existing = loginAttemptsByKey.get(key);

  if (!existing || now - existing.firstFailedAt > FAILED_WINDOW_MS) {
    const initial: AttemptRecord = {
      failedCount: 1,
      firstFailedAt: now,
      lockedUntil: null,
    };
    loginAttemptsByKey.set(key, initial);
    return { failedCount: 1, isLockedOut: false, retryAfterSeconds: 0 };
  }

  existing.failedCount += 1;
  if (existing.failedCount >= MAX_FAILED_ATTEMPTS) {
    existing.lockedUntil = now + LOCKOUT_DURATION_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    loginAttemptsByKey.set(key, existing);
    return {
      failedCount: existing.failedCount,
      isLockedOut: true,
      retryAfterSeconds,
    };
  }

  loginAttemptsByKey.set(key, existing);
  return {
    failedCount: existing.failedCount,
    isLockedOut: false,
    retryAfterSeconds: 0,
  };
}

/**
 * Limpia el contador de intentos fallidos tras un inicio de sesión exitoso.
 */
export function resetLoginAttempts(ip: string, email: string): void {
  const key = normalizeKey(ip || "127.0.0.1", email);
  loginAttemptsByKey.delete(key);
}

/**
 * Reinicia todos los contadores en memoria (para pruebas automatizadas).
 */
export function clearAllLoginRateLimits(): void {
  loginAttemptsByKey.clear();
  burstByIp.clear();
}

