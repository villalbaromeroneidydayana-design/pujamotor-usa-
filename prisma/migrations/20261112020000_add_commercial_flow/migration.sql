-- AlterTable
ALTER TABLE "CustomerLead" ADD COLUMN "targetVehicle" TEXT;
ALTER TABLE "CustomerLead" ADD COLUMN "minYear" INTEGER;
ALTER TABLE "CustomerLead" ADD COLUMN "maxBudgetUsd" REAL;

-- AlterTable
ALTER TABLE "AdvisoryCase" ADD COLUMN "isThinking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdvisoryCase" ADD COLUMN "lastContactAt" DATETIME;
ALTER TABLE "AdvisoryCase" ADD COLUMN "nextFollowUpAt" DATETIME;
ALTER TABLE "AdvisoryCase" ADD COLUMN "selectedLotNumber" TEXT;
ALTER TABLE "AdvisoryCase" ADD COLUMN "idDocumentUrl" TEXT;
ALTER TABLE "AdvisoryCase" ADD COLUMN "contractSignedUrl" TEXT;
ALTER TABLE "AdvisoryCase" ADD COLUMN "hasCarfaxReport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdvisoryCase" ADD COLUMN "carfaxReportUrl" TEXT;
ALTER TABLE "AdvisoryCase" ADD COLUMN "auctionEvidenceRef" TEXT;
ALTER TABLE "AdvisoryCase" ADD COLUMN "auctionWonPriceUsd" REAL;
ALTER TABLE "AdvisoryCase" ADD COLUMN "brokerFeeAgreedUsd" REAL;

-- CreateTable
CREATE TABLE "ClientPresentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "presentationCode" TEXT NOT NULL,
    "customerLeadId" TEXT NOT NULL,
    "advisoryCaseId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "selectedLotNumbersJson" TEXT NOT NULL,
    "targetBidMinPercent" REAL NOT NULL DEFAULT 40,
    "targetBidMaxPercent" REAL NOT NULL DEFAULT 60,
    "advisorName" TEXT,
    "advisorPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientPresentation_customerLeadId_fkey" FOREIGN KEY ("customerLeadId") REFERENCES "CustomerLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientPresentation_advisoryCaseId_fkey" FOREIGN KEY ("advisoryCaseId") REFERENCES "AdvisoryCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientPresentation_presentationCode_key" ON "ClientPresentation"("presentationCode");

-- CreateIndex
CREATE INDEX "ClientPresentation_presentationCode_idx" ON "ClientPresentation"("presentationCode");

-- CreateIndex
CREATE INDEX "ClientPresentation_customerLeadId_idx" ON "ClientPresentation"("customerLeadId");

