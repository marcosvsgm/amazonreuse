ALTER TABLE "Campaign" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'CAMPAIGN';
ALTER TABLE "Campaign" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'OUTROS';
ALTER TABLE "Campaign" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Campaign" ADD COLUMN "objectives" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Campaign" ADD COLUMN "location" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Campaign" ADD COLUMN "responsible" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Campaign" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PLANNED';
ALTER TABLE "Campaign" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Campaign" ADD COLUMN "results" TEXT NOT NULL DEFAULT '';
CREATE INDEX "Campaign_unitId_status_idx" ON "Campaign"("unitId", "status");
CREATE TABLE "CampaignAttachment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campaignId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignAttachment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CampaignAttachment_campaignId_idx" ON "CampaignAttachment"("campaignId");
