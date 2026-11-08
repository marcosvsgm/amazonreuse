CREATE TABLE "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "unitId" TEXT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "startsAt" DATETIME NOT NULL,
  "endsAt" DATETIME NOT NULL,
  "includeCharts" BOOLEAN NOT NULL DEFAULT true,
  "includeAttachments" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT NOT NULL DEFAULT '',
  "responsible" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL
);
CREATE INDEX "Report_tenantId_createdAt_idx" ON "Report"("tenantId", "createdAt");
CREATE INDEX "Report_unitId_type_idx" ON "Report"("unitId", "type");
