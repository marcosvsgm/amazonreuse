ALTER TABLE "User" ADD COLUMN "unitId" TEXT;
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "lastLoginAt" DATETIME;
CREATE TABLE "UserInvitation" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT NOT NULL,"unitId" TEXT,"email" TEXT NOT NULL,"name" TEXT NOT NULL,"role" TEXT NOT NULL,"tokenHash" TEXT NOT NULL UNIQUE,"expiresAt" DATETIME NOT NULL,"acceptedAt" DATETIME,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE);
CREATE INDEX "UserInvitation_tenantId_email_idx" ON "UserInvitation"("tenantId","email");
CREATE TABLE "RolePermission" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT,"role" TEXT NOT NULL,"module" TEXT NOT NULL,"view" BOOLEAN NOT NULL DEFAULT false,"create" BOOLEAN NOT NULL DEFAULT false,"update" BOOLEAN NOT NULL DEFAULT false,"delete" BOOLEAN NOT NULL DEFAULT false,"export" BOOLEAN NOT NULL DEFAULT false,"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "RolePermission_tenantId_role_module_key" ON "RolePermission"("tenantId","role","module");
