import crypto from "crypto";
import readline from "readline";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/shared/security/crypto-pii";

const prisma = new PrismaClient();

function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function validatePasswordPolicy(password: string): string | null {
  if (password.length < 12) {
    return "La contraseña debe tener al menos 12 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Debe incluir al menos una letra mayúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "Debe incluir al menos una letra minúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "Debe incluir al menos un número.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Debe incluir al menos un carácter especial.";
  }
  return null;
}

async function main() {
  console.log("==================================================================");
  console.log(" AUTOS USA — PROCEDIMIENTO SEGURO DE ESTABLECIMIENTO DE CONTRASEÑA");
  console.log(" (Uso administrativo local interactivo / Out-of-band CLI)");
  console.log("==================================================================\n");

  const email = await prompt("Ingrese el correo institucional del usuario: ");
  if (!email) {
    console.error("Error: Debe ingresar un correo válido.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.error(`Error: No se encontró ningún usuario con el correo especificado.`);
    process.exit(1);
  }

  console.log(`Usuario encontrado: ${user.fullName} [Rol: ${user.role}]`);

  const password = await prompt("Ingrese la nueva contraseña: ");
  const policyErr = validatePasswordPolicy(password);
  if (policyErr) {
    console.error(`Error de política: ${policyErr}`);
    process.exit(1);
  }

  const confirm = await prompt("Confirme la nueva contraseña: ");
  if (password !== confirm) {
    console.error("Error: Las contraseñas no coinciden.");
    process.exit(1);
  }

  const mustChangeChoice = await prompt("¿Exigir cambio en el próximo inicio de sesión? (s/N): ");
  const mustChange = mustChangeChoice.toLowerCase() === "s" || mustChangeChoice.toLowerCase() === "si";

  const passwordHash = hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: mustChange,
      updatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorRole: "SUPER_ADMIN",
      actorUserId: user.id,
      action: "USER_PASSWORD_RESET_CLI",
      module: "ADMIN_SECURITY",
      targetType: "User",
      targetId: user.id,
      detailsJson: JSON.stringify({
        account: email.slice(0, 3) + "***@" + email.split("@")[1],
        mustChangePassword: mustChange,
        channel: "CLI_OUT_OF_BAND",
      }),
      ipAddress: "127.0.0.1",
    },
  });

  console.log("\n[OK] Contraseña actualizada con éxito en la base de datos.");
  console.log("[OK] Ningún dato sensible ha sido expuesto en logs ni reportes.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error inesperado:", e);
  await prisma.$disconnect();
  process.exit(1);
});

