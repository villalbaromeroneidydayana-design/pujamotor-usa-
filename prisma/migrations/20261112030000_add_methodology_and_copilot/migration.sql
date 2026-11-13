-- AlterTable
ALTER TABLE "AdvisoryCase" ADD COLUMN "methodology" TEXT NOT NULL DEFAULT 'SUBASTA_PRO_USA';
ALTER TABLE "AdvisoryCase" ADD COLUMN "currentStepNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AdvisoryCase" ADD COLUMN "stepChecklistJson" TEXT NOT NULL DEFAULT '{}';

