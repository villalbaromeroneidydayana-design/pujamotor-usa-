async function checkUrl(url: string) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    return { status: res.status, ok: res.ok, length: text.length };
  } catch (err: any) {
    return { status: 0, ok: false, length: 0, error: err.message };
  }
}

async function main() {
  const baseUrl = "https://pujamotor-usa-b6ep.vercel.app";
  console.log("================================================================================");
  console.log("PUJAMOTOR USA — AUDITORÍA DEL DESPLIEGUE PÚBLICO EN VERCEL");
  console.log(`URL Oficial: ${baseUrl}`);
  console.log("================================================================================");

  const paths = [
    { label: "Página Principal (Home)", path: "/" },
    { label: "Calculadora de Costos", path: "/calculadora" },
    { label: "Comparador de Vehículos", path: "/comparador" },
    { label: "Asesoría y Seguimiento", path: "/asesoria" },
    { label: "Contacto Oficial", path: "/contacto" },
    { label: "Términos del Servicio", path: "/terminos" },
    { label: "Política de Privacidad", path: "/privacidad" },
    { label: "API Catálogo", path: "/api/catalog" },
    { label: "Fotografía Equipo Operaciones", path: "/images/pujamotor-team-operations.jpg" },
    { label: "Fotografía Transporte Hauler (Área E)", path: "/images/pujamotor-transport-hauler.jpg" },
    { label: "Foto Real Toyota RAV4", path: "/images/vehicles/toyota-rav4-2022.jpg" },
    { label: "Foto Real Ford F-150", path: "/images/vehicles/ford-f150-2023.jpg" },
    { label: "Foto Real Honda Civic", path: "/images/vehicles/honda-civic-2022.jpg" },
    { label: "Foto Real Chevrolet Tahoe", path: "/images/vehicles/chevrolet-tahoe-2023.jpg" },
    { label: "Foto Real BMW 330i", path: "/images/vehicles/bmw-330i-2021.jpg" },
    { label: "Foto Real Ford Transit", path: "/images/vehicles/ford-transit-2022.jpg" },
  ];

  for (const item of paths) {
    const fullUrl = `${baseUrl}${item.path}`;
    const result = await checkUrl(fullUrl);
    const mark = result.ok ? "PASS" : "FAIL";
    console.log(`[${mark}] ${item.label.padEnd(38)} | HTTP ${result.status} | ${item.path} (${result.length} bytes)`);
  }

  // Comprobar respuesta JSON de /api/catalog
  try {
    const catRes = await fetch(`${baseUrl}/api/catalog`);
    const catJson = await catRes.json();
    console.log("\n--- DETALLES DEL CATÁLOGO EN PRODUCCIÓN ---");
    console.log(`Estatus API /api/catalog: HTTP ${catRes.status}`);
    console.log(`Total de lotes en respuesta: ${catJson.lots?.length ?? 0}`);
    console.log("Respuesta:", JSON.stringify(catJson).slice(0, 300));
  } catch (e: any) {
    console.log("Error al consultar JSON del catálogo:", e.message);
  }

  // Comprobar /api/calculator POST
  try {
    const calcRes = await fetch(`${baseUrl}/api/calculator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auctionBidUsd: 14000,
        vehicleType: "SUV",
        destinationZip: "33126",
      }),
    });
    const calcJson = await calcRes.json();
    console.log("\n--- DETALLES DE LA CALCULADORA EN PRODUCCIÓN ---");
    console.log(`Estatus API /api/calculator: HTTP ${calcRes.status}`);
    console.log("Cálculo:", JSON.stringify(calcJson).slice(0, 300));
  } catch (e: any) {
    console.log("Error en calculadora:", e.message);
  }
}

main();

