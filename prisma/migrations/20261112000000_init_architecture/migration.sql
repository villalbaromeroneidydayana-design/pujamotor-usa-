-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "integrationType" TEXT NOT NULL,
    "description" TEXT,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IngestionBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataSourceId" TEXT NOT NULL,
    "fileName" TEXT,
    "fileHashSha256" TEXT,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "createdRecords" INTEGER NOT NULL DEFAULT 0,
    "updatedRecords" INTEGER NOT NULL DEFAULT 0,
    "incompleteRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorSummaryJson" TEXT,
    "triggeredByUserId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "IngestionBatch_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalCode" TEXT NOT NULL,
    "vin" TEXT,
    "isVinMasked" BOOLEAN NOT NULL DEFAULT false,
    "vinDecodedByNhtsa" BOOLEAN NOT NULL DEFAULT false,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "year" INTEGER NOT NULL,
    "bodyStyle" TEXT,
    "engineSpec" TEXT,
    "cylinders" INTEGER,
    "transmission" TEXT,
    "drivetrain" TEXT,
    "fuelType" TEXT,
    "exteriorColor" TEXT,
    "interiorColor" TEXT,
    "manufacturedIn" TEXT,
    "dataEnvironment" TEXT NOT NULL DEFAULT 'PRODUCTION_REAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuctionLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "lastBatchId" TEXT,
    "lotNumber" TEXT NOT NULL,
    "auctionHouse" TEXT NOT NULL DEFAULT 'COPART',
    "yardName" TEXT NOT NULL,
    "yardState" TEXT NOT NULL,
    "yardCity" TEXT NOT NULL,
    "yardZip" TEXT,
    "odometerValue" INTEGER,
    "odometerUnit" TEXT NOT NULL DEFAULT 'MILES',
    "odometerBrand" TEXT NOT NULL DEFAULT 'ACTUAL',
    "titleCode" TEXT,
    "titleCategory" TEXT NOT NULL,
    "primaryDamage" TEXT NOT NULL,
    "secondaryDamage" TEXT,
    "damageNotes" TEXT,
    "runAndDriveStatus" TEXT NOT NULL,
    "hasKeys" BOOLEAN,
    "estimatedRetailValue" REAL,
    "repairCostEstimate" REAL,
    "currentBidUsd" REAL NOT NULL DEFAULT 0,
    "buyItNowPriceUsd" REAL,
    "minBidIncrementUsd" REAL NOT NULL DEFAULT 100,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sellerType" TEXT,
    "requiresBrokerLicense" BOOLEAN NOT NULL DEFAULT true,
    "auctionDate" DATETIME,
    "saleStatus" TEXT NOT NULL DEFAULT 'UPCOMING',
    "availabilityStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "completenessStatus" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "missingFieldsJson" TEXT NOT NULL DEFAULT '[]',
    "verificationNotes" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "dataEnvironment" TEXT NOT NULL DEFAULT 'PRODUCTION_REAL',
    "sourceQueriedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuctionLot_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuctionLot_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuctionLot_lastBatchId_fkey" FOREIGN KEY ("lastBatchId") REFERENCES "IngestionBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LotChangeHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auctionLotId" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "changeSource" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changedFieldsJson" TEXT NOT NULL,
    "previousValuesJson" TEXT NOT NULL,
    "newValuesJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LotChangeHistory_auctionLotId_fkey" FOREIGN KEY ("auctionLotId") REFERENCES "AuctionLot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LotChangeHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auctionLotId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'PHOTO_EXTERIOR',
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "originReference" TEXT NOT NULL,
    "isAuthorizedCopy" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleMedia_auctionLotId_fkey" FOREIGN KEY ("auctionLotId") REFERENCES "AuctionLot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auctionLotId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "uploadedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleDocument_auctionLotId_fkey" FOREIGN KEY ("auctionLotId") REFERENCES "AuctionLot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TariffRuleSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "auctionFeeScheduleJson" TEXT NOT NULL,
    "brokerFeeRulesJson" TEXT NOT NULL,
    "inlandTransportMatrixJson" TEXT NOT NULL,
    "oceanFreightRatesJson" TEXT NOT NULL,
    "destinationCustomsRulesJson" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CostEstimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simulationCode" TEXT NOT NULL,
    "auctionLotId" TEXT,
    "tariffRuleSetId" TEXT NOT NULL,
    "vehicleSummary" TEXT NOT NULL,
    "originState" TEXT NOT NULL,
    "departurePort" TEXT NOT NULL,
    "destinationCountryCode" TEXT NOT NULL,
    "destinationCountryName" TEXT NOT NULL,
    "destinationPort" TEXT NOT NULL,
    "shippingModality" TEXT NOT NULL DEFAULT 'RORO',
    "bidAmountUsd" REAL NOT NULL,
    "auctionBuyerFeeUsd" REAL NOT NULL,
    "auctionVirtualBidFeeUsd" REAL NOT NULL,
    "auctionGateAndEnvFeeUsd" REAL NOT NULL,
    "brokerFeeUsd" REAL NOT NULL,
    "inlandTransportUsd" REAL NOT NULL,
    "oceanFreightUsd" REAL NOT NULL,
    "marineInsuranceUsd" REAL NOT NULL,
    "documentationFeesUsd" REAL NOT NULL,
    "customsDutyUsd" REAL NOT NULL,
    "importVatAndTaxesUsd" REAL NOT NULL,
    "additionalCostsUsd" REAL NOT NULL DEFAULT 0,
    "additionalCostsNote" TEXT,
    "totalEstimatedUsd" REAL NOT NULL,
    "isBindingQuote" BOOLEAN NOT NULL DEFAULT false,
    "disclaimerText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostEstimate_auctionLotId_fkey" FOREIGN KEY ("auctionLotId") REFERENCES "AuctionLot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CostEstimate_tariffRuleSetId_fkey" FOREIGN KEY ("tariffRuleSetId") REFERENCES "TariffRuleSet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneWhatsapp" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "companyName" TEXT,
    "customerType" TEXT NOT NULL DEFAULT 'INDIVIDUAL_BUYER',
    "leadSource" TEXT NOT NULL DEFAULT 'CATALOG_INQUIRY',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "consentPrivacy" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceCode" TEXT NOT NULL,
    "customerLeadId" TEXT NOT NULL,
    "auctionLotId" TEXT,
    "costEstimateId" TEXT,
    "requestedServices" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "maxBudgetUsd" REAL,
    "customerMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "advisorResponseNote" TEXT,
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteRequest_customerLeadId_fkey" FOREIGN KEY ("customerLeadId") REFERENCES "CustomerLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteRequest_auctionLotId_fkey" FOREIGN KEY ("auctionLotId") REFERENCES "AuctionLot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuoteRequest_costEstimateId_fkey" FOREIGN KEY ("costEstimateId") REFERENCES "CostEstimate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdvisoryCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "customerLeadId" TEXT NOT NULL,
    "auctionLotId" TEXT,
    "assignedAdvisorId" TEXT,
    "serviceScope" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'EVALUACION_LOTE',
    "maxAuthorizedBidUsd" REAL,
    "verifiedContractReady" BOOLEAN NOT NULL DEFAULT false,
    "operationalNotes" TEXT,
    "destinationCountry" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdvisoryCase_customerLeadId_fkey" FOREIGN KEY ("customerLeadId") REFERENCES "CustomerLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdvisoryCase_auctionLotId_fkey" FOREIGN KEY ("auctionLotId") REFERENCES "AuctionLot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdvisoryCase_assignedAdvisorId_fkey" FOREIGN KEY ("assignedAdvisorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrmInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerLeadId" TEXT NOT NULL,
    "advisoryCaseId" TEXT,
    "authorUserId" TEXT,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmInteraction_customerLeadId_fkey" FOREIGN KEY ("customerLeadId") REFERENCES "CustomerLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrmInteraction_advisoryCaseId_fkey" FOREIGN KEY ("advisoryCaseId") REFERENCES "AdvisoryCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CrmInteraction_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COMMERCIAL_ADVISOR',
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "detailsJson" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL DEFAULT '127.0.0.1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_code_key" ON "DataSource"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_internalCode_key" ON "Vehicle"("internalCode");

-- CreateIndex
CREATE INDEX "Vehicle_make_model_year_idx" ON "Vehicle"("make", "model", "year");

-- CreateIndex
CREATE INDEX "Vehicle_dataEnvironment_idx" ON "Vehicle"("dataEnvironment");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionLot_lotNumber_key" ON "AuctionLot"("lotNumber");

-- CreateIndex
CREATE INDEX "AuctionLot_lotNumber_idx" ON "AuctionLot"("lotNumber");

-- CreateIndex
CREATE INDEX "AuctionLot_yardState_saleStatus_idx" ON "AuctionLot"("yardState", "saleStatus");

-- CreateIndex
CREATE INDEX "AuctionLot_completenessStatus_dataEnvironment_isPublished_idx" ON "AuctionLot"("completenessStatus", "dataEnvironment", "isPublished");

-- CreateIndex
CREATE INDEX "AuctionLot_currentBidUsd_idx" ON "AuctionLot"("currentBidUsd");

-- CreateIndex
CREATE INDEX "LotChangeHistory_auctionLotId_createdAt_idx" ON "LotChangeHistory"("auctionLotId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TariffRuleSet_versionCode_key" ON "TariffRuleSet"("versionCode");

-- CreateIndex
CREATE UNIQUE INDEX "CostEstimate_simulationCode_key" ON "CostEstimate"("simulationCode");

-- CreateIndex
CREATE INDEX "CustomerLead_email_idx" ON "CustomerLead"("email");

-- CreateIndex
CREATE INDEX "CustomerLead_status_idx" ON "CustomerLead"("status");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_referenceCode_key" ON "QuoteRequest"("referenceCode");

-- CreateIndex
CREATE INDEX "QuoteRequest_referenceCode_idx" ON "QuoteRequest"("referenceCode");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisoryCase_caseNumber_key" ON "AdvisoryCase"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuditLog_module_createdAt_idx" ON "AuditLog"("module", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

