CREATE TABLE "AccessProfile" ("id" TEXT NOT NULL PRIMARY KEY,"tenantId" TEXT,"name" TEXT NOT NULL,"description" TEXT NOT NULL DEFAULT '',"permissions" TEXT NOT NULL DEFAULT '{}',"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL);
CREATE UNIQUE INDEX "AccessProfile_tenantId_name_key" ON "AccessProfile"("tenantId","name");
