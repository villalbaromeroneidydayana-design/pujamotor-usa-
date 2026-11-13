import { NextRequest, NextResponse } from "next/server";
import { ensureSystemBootstrapped } from "@/shared/db/bootstrap";
import { vehicleEngineService } from "@/modules/vehicles/vehicle-engine.service";
import { calculatorService } from "@/modules/calculator/calculator.service";
import { requireServerPermission } from "@/modules/admin/auth.service";
import { AppDomainError } from "@/shared/errors/domain-errors";

export async function POST(req: NextRequest) {
  try {
    await ensureSystemBootstrapped();
    const body = await req.json();

    if (body.action === "UPDATE_LOT_CONDITIONS") {
      const session = await requireServerPermission(req, "EDIT_VEHICLE_AND_LOT");

      const updated = await vehicleEngineService.updateLotConditionsAdmin({
        lotId: body.lotId,
        currentBidUsd:
          body.currentBidUsd !== undefined ? Number(body.currentBidUsd) : undefined,
        buyItNowPriceUsd:
          body.buyItNowPriceUsd !== undefined
            ? body.buyItNowPriceUsd === null || body.buyItNowPriceUsd === ""
              ? null
              : Number(body.buyItNowPriceUsd)
            : undefined,
        saleStatus: body.saleStatus,
        availabilityStatus: body.availabilityStatus,
        primaryDamage: body.primaryDamage,
        runAndDriveStatus: body.runAndDriveStatus,
        hasKeys: body.hasKeys,
        odometerValue:
          body.odometerValue !== undefined && body.odometerValue !== ""
            ? Number(body.odometerValue)
            : undefined,
        vin: body.vin,
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json({ lot: updated });
    }

    if (body.action === "CREATE_MANUAL_VERIFIED_LOT") {
      const session = await requireServerPermission(req, "EDIT_VEHICLE_AND_LOT");

      const outcome = await vehicleEngineService.upsertVehicleAndLot(
        {
          sourceCode: "MANUAL_VERIFIED",
          dataEnvironment: body.dataEnvironment || "PRODUCTION_REAL",
          lotNumber: String(body.lotNumber).trim(),
          yardName:
            body.yardName || `${body.yardState || "TX"} - ${body.yardCity || "HOUSTON"}`,
          yardState: (body.yardState || "TX").toUpperCase(),
          yardCity: (body.yardCity || "HOUSTON").toUpperCase(),
          vin: body.vin ? String(body.vin).trim().toUpperCase() : null,
          make: String(body.make || "").toUpperCase(),
          model: String(body.model || "").toUpperCase(),
          trim: body.trim || null,
          year: Number(body.year) || 2022,
          bodyStyle: body.bodyStyle || "SUV",
          engineSpec: body.engineSpec || null,
          odometerValue: body.odometerValue ? Number(body.odometerValue) : null,
          titleCode:
            body.titleCode || `${body.yardState || "TX"} - CERT OF TITLE-SALVAGE`,
          titleCategory: body.titleCategory || "SALVAGE",
          primaryDamage: body.primaryDamage || "FRONT END",
          runAndDriveStatus: body.runAndDriveStatus || "RUNS_AND_DRIVES",
          hasKeys: body.hasKeys ?? true,
          currentBidUsd: Number(body.currentBidUsd) || 0,
          buyItNowPriceUsd: body.buyItNowPriceUsd ? Number(body.buyItNowPriceUsd) : null,
          auctionDate: body.auctionDate
            ? new Date(body.auctionDate)
            : new Date(Date.now() + 5 * 86400000),
          authorizedMedia: body.photoUrl
            ? [
                {
                  mediaType: "PHOTO_EXTERIOR",
                  title: body.photoTitle || "Fotografía autorizada vinculada al lote",
                  url: body.photoUrl,
                  originReference:
                    body.originReference ||
                    "Inspección autorizada verificada por operador",
                  isAuthorizedCopy: true,
                  isPrimary: true,
                },
              ]
            : undefined,
        },
        {
          actorUserId: session.userId,
          actorRole: session.role,
          changeSourceLabel: "ADMIN_MANUAL_VERIFIED_ENTRY",
        }
      );

      return NextResponse.json({ outcome });
    }

    if (body.action === "ATTACH_AUTHORIZED_MEDIA") {
      const session = await requireServerPermission(req, "MANAGE_AUTHORIZED_MEDIA");

      const createdMedia = await vehicleEngineService.addAuthorizedMedia({
        lotId: body.lotId,
        media: {
          mediaType: body.mediaType || "PHOTO_EXTERIOR",
          title: body.title || "Fotografía autorizada de lote",
          url: body.url,
          originReference: body.originReference,
          isAuthorizedCopy: Boolean(body.isAuthorizedCopy),
          isPrimary: Boolean(body.isPrimary),
        },
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json({ media: createdMedia });
    }

    if (body.action === "SET_PRIMARY_MEDIA") {
      const session = await requireServerPermission(req, "MANAGE_AUTHORIZED_MEDIA");
      const updatedMediaList = await vehicleEngineService.setPrimaryMedia({
        lotId: body.lotId,
        mediaId: body.mediaId,
        actorUserId: session.userId,
        actorRole: session.role,
      });
      return NextResponse.json({ media: updatedMediaList });
    }

    if (body.action === "DELETE_MEDIA") {
      const session = await requireServerPermission(req, "MANAGE_AUTHORIZED_MEDIA");
      const remainingMedia = await vehicleEngineService.deleteMedia({
        lotId: body.lotId,
        mediaId: body.mediaId,
        actorUserId: session.userId,
        actorRole: session.role,
      });
      return NextResponse.json({ media: remainingMedia });
    }

    if (body.action === "REORDER_MEDIA") {
      const session = await requireServerPermission(req, "MANAGE_AUTHORIZED_MEDIA");
      const reordered = await vehicleEngineService.reorderMedia({
        lotId: body.lotId,
        mediaIdsInOrder: body.mediaIdsInOrder,
        actorUserId: session.userId,
        actorRole: session.role,
      });
      return NextResponse.json({ media: reordered });
    }

    if (body.action === "UPDATE_TARIFF_RULES") {
      const session = await requireServerPermission(req, "EDIT_TARIFF_RULES");

      const updatedTariffs = await calculatorService.updateTariffParameters({
        gateFeeUsd: body.gateFeeUsd !== undefined ? Number(body.gateFeeUsd) : undefined,
        environmentalFeeUsd:
          body.environmentalFeeUsd !== undefined
            ? Number(body.environmentalFeeUsd)
            : undefined,
        brokerPercentage:
          body.brokerPercentage !== undefined ? Number(body.brokerPercentage) : undefined,
        brokerMinFeeUsd:
          body.brokerMinFeeUsd !== undefined ? Number(body.brokerMinFeeUsd) : undefined,
        fixedDocumentationFeeUsd:
          body.fixedDocumentationFeeUsd !== undefined
            ? Number(body.fixedDocumentationFeeUsd)
            : undefined,
        inlandTransportMatrix: body.inlandTransportMatrix,
        destinationCustomsRules: body.destinationCustomsRules,
        actorUserId: session.userId,
        actorRole: session.role,
      });

      return NextResponse.json(updatedTariffs);
    }

    return NextResponse.json(
      { error: "Acción administrativa no reconocida." },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AppDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message =
      error instanceof Error ? error.message : "Error en operación administrativa.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
