import crypto from "crypto";
import { getEnv } from "@/config/env";

const ENCRYPTED_PREFIX = "enc:gcm:v1:";

function getDerivedAesKey(): Buffer {
  const rawKey = getEnv().ENCRYPTION_KEY_PII;
  return crypto.createHash("sha256").update(rawKey, "utf8").digest();
}

/**
 * Cifra un dato personal sensible (PII) usando AES-256-GCM con IV aleatorio de 12 bytes
 * y etiqueta de autenticación de 16 bytes.
 */
export function encryptPii(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (isEncryptedPii(plaintext)) return plaintext;

  const key = getDerivedAesKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Descifra un valor previamente cifrado con AES-256-GCM.
 */
export function decryptPii(value: string | null | undefined): string {
  if (!value) return "";
  if (!isEncryptedPii(value)) return value;

  const payload = value.slice(ENCRYPTED_PREFIX.length);
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de texto cifrado PII inválido.");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getDerivedAesKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function isEncryptedPii(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(ENCRYPTED_PREFIX));
}

/**
 * Enmascara un correo electrónico para registros de auditoría o vistas públicas (ej. ca***s@dominio.com)
 */
export function maskEmail(rawEmail: string | null | undefined): string {
  if (!rawEmail) return "";
  const plain = isEncryptedPii(rawEmail) ? decryptPii(rawEmail) : rawEmail;
  const trimmed = plain.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return "***@***";

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  const visibleStart = local.slice(0, Math.min(2, local.length));
  const visibleEnd = local.length > 3 ? local.slice(-1) : "";
  return `${visibleStart}***${visibleEnd}@${domain}`;
}

/**
 * Enmascara un número telefónico dejando visibles únicamente los últimos 4 dígitos (ej. ***-***-5678)
 */
export function maskPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "";
  const plain = isEncryptedPii(rawPhone) ? decryptPii(rawPhone) : rawPhone;
  const digits = plain.replace(/\D/g, "");
  if (digits.length <= 4) return "***-****";
  return `***-***-${digits.slice(-4)}`;
}

const SENSITIVE_SECRET_KEYS =
  /password|passwd|secret|token|cookie|authorization|apikey|client_secret|clientsecret|privatekey/i;
const EMAIL_KEYS = /email|correo/i;
const PHONE_KEYS = /phone|whatsapp|telefono|celular|mobile/i;

/**
 * Sanitiza recursivamente un objeto antes de guardarlo en AuditLog:
 * - Elimina/redacta contraseñas, secretos o tokens.
 * - Enmascara correos electrónicos y números telefónicos.
 */
export function sanitizeAuditDetails(
  input: Record<string, unknown>
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(input)) {
    if (SENSITIVE_SECRET_KEYS.test(key)) {
      output[key] = "[REDACTED_SECRET]";
      continue;
    }

    if (typeof val === "string") {
      if (EMAIL_KEYS.test(key) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        output[key] = maskEmail(val);
      } else if (PHONE_KEYS.test(key)) {
        output[key] = maskPhone(val);
      } else if (isEncryptedPii(val)) {
        output[key] = "[ENCRYPTED_PII]";
      } else {
        output[key] = val;
      }
    } else if (Array.isArray(val)) {
      output[key] = val.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? sanitizeAuditDetails(item as Record<string, unknown>)
          : item
      );
    } else if (val && typeof val === "object") {
      output[key] = sanitizeAuditDetails(val as Record<string, unknown>);
    } else {
      output[key] = val;
    }
  }

  return output;
}

/**
 * Hash seguro de contraseñas mediante scrypt (N=16384, r=8, p=1) y sal aleatoria de 16 bytes.
 */
export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString("hex");
  return `scrypt$v1$${salt}$${derived}`;
}

/**
 * Verifica una contraseña en texto plano contra un hash almacenado usando comparación en tiempo constante.
 */
export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "v1") {
    return false;
  }
  const [, , salt, expectedHex] = parts;
  const derived = crypto.scryptSync(plainPassword, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, "hex");
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

