import { ensureSystemBootstrapped } from "../src/shared/db/bootstrap";
import { prisma } from "../src/shared/db/prisma";

async function main() {
  console.log("Inicializando base de datos y módulos centrales de AUTOS USA...");
  await ensureSystemBootstrapped();
  console.log("Semilla completada exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error en semilla:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

