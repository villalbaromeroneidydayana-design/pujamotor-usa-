import { getEnv } from "@/config/env";

export interface NhtsaDecodedVinData {
  vin: string;
  isValidVin: boolean;
  make: string;
  model: string;
  trim: string | null;
  year: number | null;
  bodyStyle: string | null;
  engineSpec: string | null;
  cylinders: number | null;
  transmission: string | null;
  drivetrain: string | null;
  fuelType: string | null;
  manufacturedIn: string | null;
  errorText: string | null;
  queriedAt: Date;
}

/**
 * Integración con la API pública y oficial NHTSA vPIC (U.S. Department of Transportation).
 * Permite verificar y enriquecer legítimamente especificaciones de cualquier VIN de 17 caracteres
 * sin recurrir a scraping ni servicios no autorizados.
 */
export class NhtsaVinProvider {
  async decodeVin(vin: string): Promise<NhtsaDecodedVinData> {
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length < 11 || cleanVin.includes("*")) {
      return {
        vin: cleanVin,
        isValidVin: false,
        make: "",
        model: "",
        trim: null,
        year: null,
        bodyStyle: null,
        engineSpec: null,
        cylinders: null,
        transmission: null,
        drivetrain: null,
        fuelType: null,
        manufacturedIn: null,
        errorText:
          "El VIN está parcialmente enmascarado o tiene menos de 11 caracteres. La decodificación oficial NHTSA requiere un VIN completo o parcial sin asteriscos.",
        queriedAt: new Date(),
      };
    }

    const baseUrl = getEnv().NHTSA_VPIC_API_URL;
    const url = `${baseUrl}/DecodeVinValuesExtended/${encodeURIComponent(cleanVin)}?format=json`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Error al consultar NHTSA vPIC API: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      Results?: Array<Record<string, string>>;
    };

    const row = payload.Results?.[0] ?? {};
    const make = (row.Make || "").trim().toUpperCase();
    const model = (row.Model || "").trim().toUpperCase();
    const yearNum = parseInt(row.ModelYear || "0", 10);
    const displacementL = row.DisplacementL ? `${Number(row.DisplacementL).toFixed(1)}L` : "";
    const engineConfig = row.EngineConfiguration || "";
    const cylindersNum = parseInt(row.EngineCylinders || "0", 10);
    const engineParts = [
      displacementL,
      engineConfig && cylindersNum ? `${engineConfig}${cylindersNum}` : cylindersNum ? `${cylindersNum} Cil.` : "",
      row.EngineModel || "",
    ].filter(Boolean);

    const plantParts = [row.PlantCity, row.PlantState, row.PlantCountry].filter(Boolean);

    return {
      vin: cleanVin,
      isValidVin: Boolean(make && model && yearNum > 1950),
      make,
      model,
      trim: row.Trim || row.Series || null,
      year: yearNum > 1950 ? yearNum : null,
      bodyStyle: row.BodyClass || row.VehicleType || null,
      engineSpec: engineParts.length > 0 ? engineParts.join(" ") : null,
      cylinders: cylindersNum > 0 ? cylindersNum : null,
      transmission: row.TransmissionStyle || null,
      drivetrain: row.DriveType || null,
      fuelType: row.FuelTypePrimary || null,
      manufacturedIn: plantParts.length > 0 ? plantParts.join(", ") : null,
      errorText: row.ErrorText || null,
      queriedAt: new Date(),
    };
  }
}

export const nhtsaVinProvider = new NhtsaVinProvider();

