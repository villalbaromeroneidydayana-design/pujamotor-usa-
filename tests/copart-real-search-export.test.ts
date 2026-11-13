import { describe, it, expect } from "vitest";
import { copartCsvProvider } from "@/modules/ingestion/providers/copart-csv.provider";

describe("Validación de Copart Member Search Export (Formato Oficial con Lot/Inv # y Odometer d)", () => {
  const authenticCopartSearchResults = `Lot URL,Lot/Inv #,Est. Retail value,Sale date,Year,Make,Model,Engine type,Cylinders,VIN,Title code,Odometer,Odometer d,Location state,Location city,Damage Description
https://www.copart.com/lot/61602336/clean-title-2025-toyota-land-cruiser-1958-fl-miami-north,61602336,"$65,675 USD",Future,2025,TOYOTA,LAND CRUISER 1958,2.4L 4,4,JTMCA5FA8S5001122,FL - CLEAN TITLE,1200,ACTUAL,FL,MIAMI NORTH,SIDE
https://www.copart.com/lot/61907866/salvage-2016-honda-civic-ex-fl-miami-north,61907866,"$9,952 USD",Future,2016,HONDA,CIVIC EX,2.0L 4,4,19XFC2F75GE003344,FL - SALVAGE TITLE,68400,ACTUAL,FL,MIAMI NORTH,FRONT END
https://www.copart.com/lot/74607296/salvage-2018-mazda-3-touring-fl-miami-north,74607296,"$9,296 USD",Future,2018,MAZDA,3 TOURING,2.5L 4,4,3MZBN1V35JM005566,FL - SALVAGE TITLE,52100,ACTUAL,FL,MIAMI NORTH,REAR END
https://www.copart.com/lot/75356236/clean-title-2017-lexus-nx-200t-base-fl-miami-north,75356236,"$16,525 USD",Future,2017,LEXUS,NX 200T BASE,2.0L 4,4,JTJYARBZ2H2007788,FL - CERT OF TITLE,41900,ACTUAL,FL,MIAMI NORTH,ALL OVER
https://www.copart.com/lot/75410586/salvage-2022-mercedes-benz-c-300-4matic-fl-miami-north,75410586,"$33,221 USD",Future,2022,MERCEDES-BENZ,C 300 4MATIC,2.0L 4,4,55SWF4KB9NU009900,FL - SALVAGE TITLE,18300,ACTUAL,FL,MIAMI NORTH,FRONT END
https://www.copart.com/lot/62426176/salvage-2015-honda-civic-lx-fl-miami-north,62426176,"$9,933 USD",Future,2015,HONDA,CIVIC LX,1.8L 4,4,19XFB2F52FE001234,FL - SALVAGE TITLE,88500,ACTUAL,FL,MIAMI NORTH,UNDERCARRIAGE
https://www.copart.com/lot/73046016/salvage-2025-tesla-model-y-fl-miami-north,73046016,"$35,848 USD",Future,2025,TESLA,MODEL Y,ELECTRIC,0,7SAYGAEE7SF005678,FL - SALVAGE TITLE,4200,ACTUAL,FL,MIAMI NORTH,TOP/ROOF
https://www.copart.com/lot/75959416/clean-title-2010-honda-accord-lx-fl-miami-north,75959416,"$6,378 USD",Future,2010,HONDA,ACCORD LX,2.4L 4,4,1HGCP2F31AA009012,FL - CLEAN TITLE,134200,ACTUAL,FL,MIAMI NORTH,REAR END
https://www.copart.com/lot/67612796/salvage-2006-porsche-boxster-fl-miami-north,67612796,"$19,026 USD",Future,2006,PORSCHE,BOXSTER,2.7L 6,6,WP0CA29846U003456,FL - SALVAGE TITLE,79100,ACTUAL,FL,MIAMI NORTH,FRONT END
https://www.copart.com/lot/73116636/salvage-2016-ford-focus-se-fl-miami-north,73116636,"$6,568 USD",Future,2016,FORD,FOCUS SE,2.0L 4,4,1FADP3F24GL007890,FL - SALVAGE TITLE,95400,ACTUAL,FL,MIAMI NORTH,SIDE
https://www.copart.com/lot/72905176/salvage-2017-toyota-corolla-le-fl-miami-north,72905176,"$12,425 USD",Future,2017,TOYOTA,COROLLA LE,1.8L 4,4,2T1BURHE7HC001122,FL - SALVAGE TITLE,61300,ACTUAL,FL,MIAMI NORTH,FRONT END
https://www.copart.com/lot/75346026/salvage-2017-honda-accord-sport-fl-miami-north,75346026,"$9,309 USD",Future,2017,HONDA,ACCORD SPORT,2.4L 4,4,1HGCR2F50HA004455,FL - SALVAGE TITLE,72600,ACTUAL,FL,MIAMI NORTH,FRONT END`;

  it("Reconoce exactamente los 12 lotes sin errores de fila mediante alias lotinv y odometerd", () => {
    const outcome = copartCsvProvider.parseCsvContent(authenticCopartSearchResults, "PRODUCTION_REAL");

    expect(outcome.totalRows).toBe(12);
    expect(outcome.validLots.length).toBe(12);
    expect(outcome.rowErrors.length).toBe(0);

    // 1. Conservación exacta del número de lote
    const lotNumbers = outcome.validLots.map((l) => l.lotNumber);
    expect(lotNumbers).toEqual([
      "61602336",
      "61907866",
      "74607296",
      "75356236",
      "75410586",
      "62426176",
      "73046016",
      "75959416",
      "67612796",
      "73116636",
      "72905176",
      "75346026",
    ]);

    // 2. Interpretación de valores monetarios con comas y comillas ("$65,675 USD")
    const firstLot = outcome.validLots[0];
    expect(firstLot.estimatedRetailValue).toBe(65675);
    expect(firstLot.make).toBe("TOYOTA");
    expect(firstLot.model).toBe("LAND CRUISER 1958");
    expect(firstLot.year).toBe(2025);

    // 3. Interpretación de fechas "Future" como null
    expect(firstLot.auctionDate).toBeNull();

    // 4. Odómetros numéricos y marca Odometer d ("ACTUAL")
    expect(firstLot.odometerValue).toBe(1200);
    expect(firstLot.odometerBrand).toBe("ACTUAL");

    // 5. Ubicación y Estado separados
    expect(firstLot.yardState).toBe("FL");
    expect(firstLot.yardCity).toBe("MIAMI NORTH");
    expect(firstLot.primaryDamage).toBe("SIDE");

    // 6. Integridad de VIN (no inventa ni modifica caracteres)
    expect(firstLot.vin).toBe("JTMCA5FA8S5001122");
    expect(firstLot.isVinMasked).toBe(false);

    // 7. Prueba de VIN enmascarado legítimo
    const maskedCsv = `Lot URL,Lot/Inv #,Year,Make,Model,VIN,Location state,Location city,Damage Description
https://copart.com/lot/99112233,99112233,2024,FORD,MUSTANG,1FA6P8CF*R5******,FL,TAMPA,FRONT END`;
    const maskedOutcome = copartCsvProvider.parseCsvContent(maskedCsv, "PRODUCTION_REAL");
    expect(maskedOutcome.validLots[0].vin).toBe("1FA6P8CF*R5******");
    expect(maskedOutcome.validLots[0].isVinMasked).toBe(true);
  });
});

