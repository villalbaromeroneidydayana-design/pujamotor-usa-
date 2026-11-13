export class AppDomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppDomainError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthenticatedError extends AppDomainError {
  constructor(
    message = "Sesión administrativa no iniciada o expirada. Inicie sesión para continuar."
  ) {
    super(message, "UNAUTHENTICATED", 401);
  }
}

export class UnauthorizedAccessError extends AppDomainError {
  constructor(
    message = "No cuenta con permisos suficientes para ejecutar esta operación."
  ) {
    super(message, "FORBIDDEN_RBAC", 403);
  }
}

export class PasswordChangeRequiredError extends AppDomainError {
  constructor(
    message = "Por seguridad, debe cambiar su contraseña temporal obligatoriamente antes de realizar operaciones en el sistema."
  ) {
    super(message, "PASSWORD_CHANGE_REQUIRED", 403);
  }
}

export class TooManyRequestsError extends AppDomainError {
  public readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message, "TOO_MANY_LOGIN_ATTEMPTS", 429, { retryAfterSeconds });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class IntegrationNotConfiguredError extends AppDomainError {
  constructor(providerName: string, requiredVars: string[]) {
    super(
      `El conector autorizado ${providerName} requiere credenciales válidas configuradas antes de activarse en vivo.`,
      "INTEGRATION_CREDENTIALS_MISSING",
      422,
      { providerName, requiredVars }
    );
  }
}
