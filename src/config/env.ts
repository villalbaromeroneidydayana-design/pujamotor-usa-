import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1).default("file:./autos_usa.db"),
    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET debe tener al menos 32 caracteres de entropía.")
      .refine(
        (v) => !v.startsWith("<") && !v.includes("placeholder"),
        "AUTH_SECRET no puede ser un valor de plantilla."
      ),
    ENCRYPTION_KEY_PII: z
      .string()
      .min(32, "ENCRYPTION_KEY_PII debe tener al menos 32 caracteres de entropía.")
      .refine(
        (v) => !v.startsWith("<") && !v.includes("placeholder"),
        "ENCRYPTION_KEY_PII no puede ser un valor de plantilla."
      ),
    ALLOW_DEMO_DATA_IN_PUBLIC_CATALOG: z
      .string()
      .default("true")
      .transform((v) => v.toLowerCase() === "true"),
    COPART_INTEGRATION_MODE: z
      .enum(["CSV_MEMBER_EXPORT", "B2B_API_AUTHORIZED"])
      .default("CSV_MEMBER_EXPORT"),
    COPART_B2B_API_BASE_URL: z.string().optional().default(""),
    COPART_B2B_CLIENT_ID: z.string().optional().default(""),
    COPART_B2B_CLIENT_SECRET: z.string().optional().default(""),
    COPART_B2B_MEMBER_NUMBER: z.string().optional().default(""),
    NHTSA_VPIC_API_URL: z
      .string()
      .url()
      .default("https://vpic.nhtsa.dot.gov/api/vehicles"),
    STORAGE_DRIVER: z.enum(["LOCAL", "S3_COMPATIBLE"]).default("LOCAL"),
  })
  .refine((data) => data.AUTH_SECRET !== data.ENCRYPTION_KEY_PII, {
    message:
      "Seguridad crítica: AUTH_SECRET y ENCRYPTION_KEY_PII deben ser secretos estrictamente independientes y distintos.",
    path: ["ENCRYPTION_KEY_PII"],
  });

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = JSON.stringify(parsed.error.flatten().fieldErrors);
    throw new Error(
      `Configuración de seguridad inválida en variables de entorno (.env): ${errors}`
    );
  }
  return parsed.data;
}

export function isCopartB2bConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.COPART_B2B_API_BASE_URL &&
      env.COPART_B2B_CLIENT_ID &&
      env.COPART_B2B_CLIENT_SECRET
  );
}
