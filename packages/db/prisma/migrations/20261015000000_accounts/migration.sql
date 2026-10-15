-- CreateEnum
CREATE TYPE "SiteRole" AS ENUM ('owner', 'admin', 'editor', 'staff', 'viewer', 'client');

-- CreateEnum
CREATE TYPE "SiteUserStatus" AS ENUM ('invited', 'unverified', 'active', 'locked', 'disabled');

-- CreateEnum
CREATE TYPE "SiteUserSource" AS ENUM ('invite', 'signup', 'console');

-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('user', 'ghost');

-- CreateEnum
CREATE TYPE "SessionAudience" AS ENUM ('admin', 'storefront');

-- CreateEnum
CREATE TYPE "SiteTokenPurpose" AS ENUM ('invite', 'verify_email', 'reset_password', 'magic_link');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'locked', 'disabled');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('site_user', 'platform_admin', 'system');

-- DropForeignKey
ALTER TABLE "PlatformAdmin" DROP CONSTRAINT "PlatformAdmin_userId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_userId_fkey";

-- DropForeignKey
ALTER TABLE "Membership" DROP CONSTRAINT "Membership_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "PageVersion" DROP CONSTRAINT "PageVersion_publishedById_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorUserId_fkey";

-- DropIndex
DROP INDEX "PlatformAdmin_userId_key";

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "customerId" UUID,
ADD COLUMN     "featureOverrides" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "limitOverrides" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "permissionPolicy" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "PlatformAdmin" DROP COLUMN "userId",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "totpSecret" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PageVersion" DROP COLUMN "publishedById",
ADD COLUMN     "publishedByPlatformAdminId" UUID,
ADD COLUMN     "publishedBySiteUserId" UUID;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "actorUserId",
ADD COLUMN     "actorId" UUID,
ADD COLUMN     "actorType" "AuditActorType" NOT NULL DEFAULT 'system',
ADD COLUMN     "ghostGrantId" UUID;

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Membership";

-- DropEnum
DROP TYPE "MembershipRole";

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "taxCode" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "note" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSession" (
    "id" UUID NOT NULL,
    "platformAdminId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GhostGrant" (
    "id" UUID NOT NULL,
    "platformAdminId" UUID NOT NULL,
    "targetTenantId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sessionExpiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GhostGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SiteUser" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "username" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "SiteRole" NOT NULL,
    "status" "SiteUserStatus" NOT NULL DEFAULT 'invited',
    "source" "SiteUserSource" NOT NULL DEFAULT 'console',
    "emailVerifiedAt" TIMESTAMP(3),
    "contactPhone" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "tempPasswordExpiresAt" TIMESTAMP(3),
    "totpSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSession" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "siteUserId" UUID,
    "kind" "SessionKind" NOT NULL DEFAULT 'user',
    "audience" "SessionAudience" NOT NULL,
    "ghostGrantId" UUID,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteToken" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "siteUserId" UUID NOT NULL,
    "purpose" "SiteTokenPurpose" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSession_tokenHash_key" ON "PlatformSession"("tokenHash");

-- CreateIndex
CREATE INDEX "PlatformSession_platformAdminId_idx" ON "PlatformSession"("platformAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "GhostGrant_tokenHash_key" ON "GhostGrant"("tokenHash");

-- CreateIndex
CREATE INDEX "GhostGrant_targetTenantId_idx" ON "GhostGrant"("targetTenantId");

-- CreateIndex
CREATE INDEX "SiteUser_tenantId_idx" ON "SiteUser"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteUser_tenantId_id_key" ON "SiteUser"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SiteUser_tenantId_email_key" ON "SiteUser"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "SiteUser_tenantId_phone_key" ON "SiteUser"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "SiteUser_tenantId_username_key" ON "SiteUser"("tenantId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSession_tokenHash_key" ON "SiteSession"("tokenHash");

-- CreateIndex
CREATE INDEX "SiteSession_tenantId_idx" ON "SiteSession"("tenantId");

-- CreateIndex
CREATE INDEX "SiteSession_tenantId_siteUserId_idx" ON "SiteSession"("tenantId", "siteUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSession_tenantId_id_key" ON "SiteSession"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SiteToken_tokenHash_key" ON "SiteToken"("tokenHash");

-- CreateIndex
CREATE INDEX "SiteToken_tenantId_idx" ON "SiteToken"("tenantId");

-- CreateIndex
CREATE INDEX "SiteToken_tenantId_siteUserId_idx" ON "SiteToken"("tenantId", "siteUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteToken_tenantId_id_key" ON "SiteToken"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Site_tenantId_key" ON "Site"("tenantId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSession" ADD CONSTRAINT "PlatformSession_platformAdminId_fkey" FOREIGN KEY ("platformAdminId") REFERENCES "PlatformAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostGrant" ADD CONSTRAINT "GhostGrant_platformAdminId_fkey" FOREIGN KEY ("platformAdminId") REFERENCES "PlatformAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GhostGrant" ADD CONSTRAINT "GhostGrant_targetTenantId_fkey" FOREIGN KEY ("targetTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSetting" ADD CONSTRAINT "PlatformSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "PlatformAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteUser" ADD CONSTRAINT "SiteUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSession" ADD CONSTRAINT "SiteSession_tenantId_siteUserId_fkey" FOREIGN KEY ("tenantId", "siteUserId") REFERENCES "SiteUser"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SiteSession" ADD CONSTRAINT "SiteSession_ghostGrantId_fkey" FOREIGN KEY ("ghostGrantId") REFERENCES "GhostGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSession" ADD CONSTRAINT "SiteSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteToken" ADD CONSTRAINT "SiteToken_tenantId_siteUserId_fkey" FOREIGN KEY ("tenantId", "siteUserId") REFERENCES "SiteUser"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SiteToken" ADD CONSTRAINT "SiteToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_tenantId_publishedBySiteUserId_fkey" FOREIGN KEY ("tenantId", "publishedBySiteUserId") REFERENCES "SiteUser"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_publishedByPlatformAdminId_fkey" FOREIGN KEY ("publishedByPlatformAdminId") REFERENCES "PlatformAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Checks Prisma cannot express (D17, D21). Keep in sync with packages/core tenantSlug.ts.
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_slug_check" CHECK (
  "slug" ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$' AND "slug" NOT LIKE '%--%'
  AND "slug" NOT IN ('admin', 'console', 'preview', 'www', 'api', 'media', 'sites', 'app', 'mail', 'static', 'status')
);
ALTER TABLE "SiteUser" ADD CONSTRAINT "SiteUser_identifier_check" CHECK (
  "email" IS NOT NULL OR "phone" IS NOT NULL OR "username" IS NOT NULL
);
ALTER TABLE "SiteUser" ADD CONSTRAINT "SiteUser_email_check" CHECK ("email" = lower(btrim("email")) AND "email" LIKE '%_@_%');
ALTER TABLE "SiteUser" ADD CONSTRAINT "SiteUser_phone_check" CHECK ("phone" ~ '^0[0-9]{9,10}$');
ALTER TABLE "SiteUser" ADD CONSTRAINT "SiteUser_username_check" CHECK ("username" ~ '^[a-z0-9_]{3,70}$' AND "username" ~ '[a-z]');
ALTER TABLE "SiteSession" ADD CONSTRAINT "SiteSession_kind_check" CHECK (
  ("kind" = 'user' AND "siteUserId" IS NOT NULL AND "ghostGrantId" IS NULL)
  OR ("kind" = 'ghost' AND "audience" = 'admin' AND "ghostGrantId" IS NOT NULL AND "siteUserId" IS NULL)
);
