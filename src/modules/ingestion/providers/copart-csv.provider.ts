import crypto from "crypto";
import {
  NormalizedAuctionLotDTO,
  AuthorizedMediaInput,
} from "../contracts/auction-provider.interface";
import { sanitizeCsvCell } from "../validators/lot-completeness.validator";

export interface CsvRowWarning {
  rowNumber: number;
  lotNumber?: string;
  reason: string;
}

export interface CsvParseOutcome {
  fileHashSha256: string;
  totalRows: number;
  validLots: NormalizedAuctionLotDTO[];
  rowErrors: Array<{ rowNumber: number; lotNumber?: string; reason: string }>;
  rowWarnings: CsvRowWarning[];
  duplicateLotsCount: number;
}

/**
 * Parser y normalizador robusto para archivos CSV descargados legítimamente
 * desde cuentas de miembro de Copart (Copart Sales Data CSV / Member Watchlist / CSV Exports).
 *
 * Características de Calidad de Datos:
 * 1. Resiliente a variaciones de encabezados de Copart (español, inglés estándar, nombres abreviados o comprimidos).
 * 2. Deduplicación por `lotNumber` dentro del mismo archivo: conserva la última versión válida y registra advertencia.
 * 3. Detección y saneamiento riguroso de inyecciones CSV (=, +, -, @).
 * 4. Extracción tolerante y validada de VIN (17 caracteres o enmascarado legítimo de subasta).
 * 5. Mapeo formal de daño primario, secundario, título, condición operativa y precios.
 * 6. Soporte de múltiples fotografías autorizadas cuando vengan delimitadas por punto y coma o coma en el CSV.
 */
export class CopartCsvProvider {
  parseCsvContent(
    csvContent: string,
    dataEnvironment: "PRODUCTION_REAL" | "DEMO_SANDBOX" = "PRODUCTION_REAL"
  ): CsvParseOutcome {
    const fileHashSha256 = crypto
      .createHash("sha256")
      .update(csvContent, "utf8")
      .digest("hex");

    const lines = csvContent
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return {
        fileHashSha256,
        totalRows: 0,
        validLots: [],
        rowErrors: [{ rowNumber: 1, reason: "El archivo CSV no contiene filas de datos." }],
        rowWarnings: [],
        duplicateLotsCount: 0,
      };
    }

    const rawHeaders = this.splitCsvLine(lines[0]);
    const headers = rawHeaders.map((h) =>
      sanitizeCsvCell(h)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
    );

    // Mapa temporal para deduplicar filas dentro del mismo archivo conservando la última versión
    const validLotsMap = new Map<string, NormalizedAuctionLotDTO>();
    const rowErrors: Array<{ rowNumber: number; lotNumber?: string; reason: string }> = [];
    const rowWarnings: CsvRowWarning[] = [];
    let duplicateLotsCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const rowValues = this.splitCsvLine(lines[i]);
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h] = sanitizeCsvCell(rowValues[idx] ?? "");
      });

      // Mapeo flexible de Número de Lote (Copart Sales Data usa 'Lot number', 'Lot #', 'lot_number', 'Lot/Inv #')
      const lotNumberRaw =
        record["lotnumber"] ||
        record["lotinv"] ||
        record["lot"] ||
        record["lotno"] ||
        record["itemnumber"] ||
        record["numerolote"] ||
        record["lote"] ||
        "";
      const lotNumber = lotNumberRaw.replace(/[^a-zA-Z0-9_-]/g, "").trim();

      if (!lotNumber) {
        rowErrors.push({
          rowNumber: i + 1,
          reason: "Fila rechazada: Falta columna obligatoria o valor de 'Lot number' / 'Número de lote'.",
        });
        continue;
      }

      // Validación de Año
      const yearRaw = parseInt(
        record["year"] || record["modelyear"] || record["anio"] || record["ano"] || "0",
        10
      );
      const currentYear = new Date().getFullYear();
      if (Number.isNaN(yearRaw) || yearRaw < 1920 || yearRaw > currentYear + 2) {
        rowErrors.push({
          rowNumber: i + 1,
          lotNumber,
          reason: `Año de vehículo inválido o fuera de rango [${yearRaw}].`,
        });
        continue;
      }

      // Validación de Marca y Modelo
      const make = (
        record["make"] ||
        record["vehiclerange"] ||
        record["marca"] ||
        ""
      ).trim();

      const model = (
        record["modeldetail"] ||
        record["modelgroup"] ||
        record["model"] ||
        record["modelo"] ||
        ""
      ).trim();

      if (!make || !model) {
        rowErrors.push({
          rowNumber: i + 1,
          lotNumber,
          reason: "Datos de vehículo incompletos: Marca o Modelo no especificados.",
        });
        continue;
      }

      // VIN: análisis de enmascaramiento oficial de Copart (* o < 17 caracteres)
      const vinRaw = (record["vin"] || record["fullvin"] || "").trim().toUpperCase();
      const isVinMasked =
        vinRaw.includes("*") || (vinRaw.length > 0 && vinRaw.length < 17);
      const validVin = vinRaw.length >= 8 ? vinRaw : null;

      // Kilometraje / Odómetro
      const odometerRaw =
        record["odometer"] ||
        record["odometerrange"] ||
        record["mileage"] ||
        record["kilometraje"] ||
        record["millas"] ||
        "";
      const cleanOdometer = odometerRaw.replace(/[^0-9]/g, "");
      const odometerValue = cleanOdometer !== "" ? parseInt(cleanOdometer, 10) : null;

      // Ubicación de Yarda Copart
      const yardState = (
        record["locationstate"] ||
        record["yardstate"] ||
        record["state"] ||
        record["saletitlestate"] ||
        "TX"
      )
        .trim()
        .toUpperCase();

      const yardCity = (
        record["locationcity"] ||
        record["yardcity"] ||
        record["city"] ||
        "UNKNOWN"
      )
        .trim()
        .toUpperCase();

      const yardName =
        record["yardname"] ||
        record["location"] ||
        record["copartfacility"] ||
        `${yardState} - ${yardCity}`;

      // Título
      const titleTypeRaw = (
        record["saletitletype"] ||
        record["titlecode"] ||
        record["titletype"] ||
        record["title"] ||
        record["certificadotitulo"] ||
        "SALVAGE"
      ).toUpperCase();
      const titleCategory = this.mapTitleCategory(titleTypeRaw);

      // Daño primario y secundario
      const primaryDamage = (
        record["damagedescription"] ||
        record["primarydamage"] ||
        record["damage"] ||
        record["danoprimario"] ||
        "ALL OVER"
      ).toUpperCase();

      const secondaryDamage = (
        record["secondarydamage"] ||
        record["danosecundario"] ||
        ""
      ).toUpperCase() || null;

      // Condición operativa
      const runsRaw = (
        record["runsdrives"] ||
        record["runanddrive"] ||
        record["condition"] ||
        record["highlights"] ||
        ""
      ).toUpperCase();
      const runAndDriveStatus = this.mapRunAndDrive(runsRaw);

      // Confirmación de llaves
      const keysRaw = (
        record["haskeysyesorno"] ||
        record["haskeys"] ||
        record["keys"] ||
        record["llaves"] ||
        ""
      ).toUpperCase();
      const hasKeys =
        keysRaw === "YES" || keysRaw === "SI" || keysRaw === "TRUE" || keysRaw === "Y"
          ? true
          : keysRaw === "NO" || keysRaw === "FALSE" || keysRaw === "N"
          ? false
          : null;

      // Precios de puja y Buy-It-Now
      const currentBidRaw =
        record["highbidnonvixsealedvix"] ||
        record["highbidnonvix"] ||
        record["currentbid"] ||
        record["highbid"] ||
        record["bid"] ||
        record["pujaactual"] ||
        "0";
      const currentBidUsd = Math.max(0, parseFloat(currentBidRaw.replace(/[^0-9.]/g, "")) || 0);

      const buyNowRaw =
        record["buyitnowprice"] ||
        record["buyitnow"] ||
        record["compraya"] ||
        "";
      const buyItNowPriceUsd =
        buyNowRaw && parseFloat(buyNowRaw.replace(/[^0-9.]/g, "")) > 0
          ? parseFloat(buyNowRaw.replace(/[^0-9.]/g, ""))
          : null;

      // Valores de mercado y costos de reparación
      const retailRaw = record["estretailvalue"] || record["acv"] || record["retailvalue"] || "";
      const estimatedRetailValue =
        retailRaw && parseFloat(retailRaw.replace(/[^0-9.]/g, "")) > 0
          ? parseFloat(retailRaw.replace(/[^0-9.]/g, ""))
          : null;

      const repairRaw = record["repaircost"] || record["estrepaircost"] || "";
      const repairCostEstimate =
        repairRaw && parseFloat(repairRaw.replace(/[^0-9.]/g, "")) > 0
          ? parseFloat(repairRaw.replace(/[^0-9.]/g, ""))
          : null;

      // Fecha de subasta
      const saleDateRaw =
        record["saledatemdcy"] ||
        record["auctiondate"] ||
        record["saledate"] ||
        record["fechasubasta"] ||
        "";
      const auctionDate = this.parseAuctionDate(saleDateRaw);

      // Fotografías autorizadas (si vienen informadas con permiso documental explícito en el CSV)
      const authorizedMedia: AuthorizedMediaInput[] = [];
      const imageUrlsRaw = record["imageurls"] || record["photourls"] || record["images"] || "";
      if (imageUrlsRaw) {
        const urls = imageUrlsRaw
          .split(/[;,]/)
          .map((u) => u.trim())
          .filter((u) => /^https?:\/\//i.test(u) || u.startsWith("/media/"));
        urls.forEach((u, idx) => {
          authorizedMedia.push({
            mediaType: "PHOTO_EXTERIOR",
            title: `Foto autorizada ${idx + 1} (${lotNumber})`,
            url: u,
            originReference: `Copart Member Authorized Export CSV (${lotNumber})`,
            isAuthorizedCopy: true,
            isPrimary: idx === 0,
          });
        });
      }

      const lotDto: NormalizedAuctionLotDTO = {
        sourceCode: "COPART_CSV_MEMBER",
        dataEnvironment,
        sourceQueriedAt: new Date(),
        lotNumber,
        auctionHouse: "COPART",
        yardName,
        yardState,
        yardCity,
        yardZip: record["locationzip"] || record["yardzip"] || null,
        vin: validVin,
        isVinMasked,
        make: make.toUpperCase(),
        model: model.toUpperCase(),
        trim: record["trim"] || null,
        year: yearRaw,
        bodyStyle: (record["bodystyle"] || "SUV / SEDAN").toUpperCase(),
        engineSpec: record["engine"] || record["enginespec"] || null,
        cylinders: record["cylinders"] ? parseInt(record["cylinders"], 10) || null : null,
        transmission: (record["transmission"] || "AUTOMATIC").toUpperCase(),
        drivetrain: (record["drive"] || record["drivetrain"] || "").toUpperCase() || null,
        fuelType: (record["fueltype"] || record["fuel"] || "GASOLINE").toUpperCase(),
        exteriorColor: (record["color"] || "").toUpperCase() || null,
        odometerValue,
        odometerUnit: "MILES",
        odometerBrand: this.mapOdometerBrand(
          record["odometerbrand"] || record["odometerd"] || "ACTUAL"
        ),
        titleCode: `${yardState} - ${titleTypeRaw}`,
        titleCategory,
        primaryDamage,
        secondaryDamage,
        runAndDriveStatus,
        hasKeys,
        estimatedRetailValue,
        repairCostEstimate,
        currentBidUsd,
        buyItNowPriceUsd,
        auctionDate,
        saleStatus: buyItNowPriceUsd ? "BUY_IT_NOW_AVAILABLE" : "UPCOMING",
        authorizedMedia: authorizedMedia.length > 0 ? authorizedMedia : undefined,
      };

      // Si el lote ya fue procesado en este mismo archivo, deduplicar conservando la última fila
      if (validLotsMap.has(lotNumber)) {
        duplicateLotsCount++;
        rowWarnings.push({
          rowNumber: i + 1,
          lotNumber,
          reason: `Lote duplicado dentro del archivo CSV. Se conservó la versión más reciente (Fila ${i + 1}).`,
        });
      }

      validLotsMap.set(lotNumber, lotDto);
    }

    return {
      fileHashSha256,
      totalRows: lines.length - 1,
      validLots: Array.from(validLotsMap.values()),
      rowErrors,
      rowWarnings,
      duplicateLotsCount,
    };
  }

  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private mapTitleCategory(
    raw: string
  ): "CLEAN" | "SALVAGE" | "REBUILT" | "EXPORT_ONLY" | "NON_REPAIRABLE" | "PENDING" {
    if (
      raw.includes("DESTRUCTION") ||
      raw.includes("NON-REPAIRABLE") ||
      raw.includes("NON REPAIRABLE") ||
      raw.includes("JUNK") ||
      raw.includes("PARTS ONLY") ||
      raw.includes("DISMANTLE")
    ) {
      return "NON_REPAIRABLE";
    }
    if (raw.includes("EXPORT") || raw.includes("BOS - BILL OF SALE")) {
      return "EXPORT_ONLY";
    }
    if (raw.includes("REBUILT") || raw.includes("RECONSTRUCTED")) {
      return "REBUILT";
    }
    if (
      raw.includes("CLEAN") ||
      raw.includes("ORIGINAL") ||
      raw.includes("CLEAR") ||
      (raw.includes("CERT OF TITLE") && !raw.includes("SALVAGE"))
    ) {
      return "CLEAN";
    }
    if (raw.includes("SALVAGE") || raw.includes("CERTIFICATE OF SALVAGE")) {
      return "SALVAGE";
    }
    return "PENDING";
  }

  private mapRunAndDrive(
    raw: string
  ): "RUNS_AND_DRIVES" | "ENGINE_START_PROGRAM" | "ENHANCED" | "STATIONARY" | "UNKNOWN" {
    if (raw.includes("RUN") || raw.includes("DRIVE") || raw === "DEFAULT") {
      return "RUNS_AND_DRIVES";
    }
    if (raw.includes("START") || raw.includes("ENG")) {
      return "ENGINE_START_PROGRAM";
    }
    if (raw.includes("ENHANCED")) {
      return "ENHANCED";
    }
    if (raw.includes("NO") || raw.includes("STATIONARY") || raw.includes("INOP")) {
      return "STATIONARY";
    }
    return "UNKNOWN";
  }

  private mapOdometerBrand(raw: string): "ACTUAL" | "EXEMPT" | "NOT_ACTUAL" | "INOPERABLE" {
    const u = raw.toUpperCase();
    if (u.includes("EXEMPT") || u === "E") return "EXEMPT";
    if (u.includes("NOT") || u === "N") return "NOT_ACTUAL";
    if (u.includes("INOP")) return "INOPERABLE";
    return "ACTUAL";
  }

  private parseAuctionDate(raw: string): Date | null {
    if (!raw || raw.toUpperCase().includes("FUTURE") || raw === "0" || raw === "N/A") {
      return null;
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  }
}

export const copartCsvProvider = new CopartCsvProvider();
