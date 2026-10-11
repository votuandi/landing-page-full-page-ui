-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('trial', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('pending', 'verified', 'active', 'error', 'removed');

-- CreateEnum
CREATE TYPE "SslProvider" AS ENUM ('caddy', 'cloudflare');

-- CreateEnum
CREATE TYPE "PageKind" AS ENUM ('home', 'landing', 'system');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "StorageDriver" AS ENUM ('local', 's3');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('quarantine', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'won', 'lost', 'spam');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('pending', 'processing', 'done', 'failed');

-- CreateEnum
CREATE TYPE "IntegrationKind" AS ENUM ('webhook', 'google_sheets', 'telegram');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "features" TEXT[],
    "limits" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'trial',
    "planId" TEXT NOT NULL,
    "addons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "hostname" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "DomainStatus" NOT NULL DEFAULT 'pending',
    "verificationToken" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "sslProvider" "SslProvider" NOT NULL DEFAULT 'caddy',
    "cfHostnameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "presetId" TEXT,
    "themeOverrides" JSONB NOT NULL DEFAULT '{}',
    "locales" TEXT[] DEFAULT ARRAY['vi']::TEXT[],
    "defaultLocale" TEXT NOT NULL DEFAULT 'vi',
    "profile" JSONB NOT NULL DEFAULT '{}',
    "widgets" JSONB NOT NULL DEFAULT '{}',
    "seo" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "PageKind" NOT NULL DEFAULT 'landing',
    "title" JSONB,
    "sections" JSONB NOT NULL,
    "draftSections" JSONB,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageVersion" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "publishedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionContent" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "sectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "draftData" JSONB,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "categoryId" UUID,
    "brandId" UUID,
    "price" INTEGER,
    "salePrice" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "segments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "segment" TEXT,
    "kwp" DOUBLE PRECISION,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "coverMediaId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "segment" TEXT,
    "kind" TEXT,
    "posterMediaId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "segment" TEXT,
    "coverMediaId" UUID,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "group" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "segment" TEXT,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "logoMediaId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressItem" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "driver" "StorageDriver" NOT NULL,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'public',
    "status" "MediaStatus" NOT NULL DEFAULT 'quarantine',
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "variants" JSONB,
    "alt" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "siteId" UUID,
    "source" TEXT NOT NULL,
    "segment" TEXT,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "data" JSONB NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadIntegration" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "kind" "IntegrationKind" NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "configEncrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_userId_key" ON "PlatformAdmin"("userId");

-- CreateIndex
CREATE INDEX "Membership_tenantId_idx" ON "Membership"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_tenantId_id_key" ON "Membership"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_tenantId_userId_key" ON "Membership"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_hostname_key" ON "Domain"("hostname");

-- CreateIndex
CREATE INDEX "Domain_tenantId_idx" ON "Domain"("tenantId");

-- CreateIndex
CREATE INDEX "Domain_tenantId_siteId_idx" ON "Domain"("tenantId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_tenantId_id_key" ON "Domain"("tenantId", "id");

-- CreateIndex
CREATE INDEX "Site_tenantId_idx" ON "Site"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_tenantId_id_key" ON "Site"("tenantId", "id");

-- CreateIndex
CREATE INDEX "Page_tenantId_idx" ON "Page"("tenantId");

-- CreateIndex
CREATE INDEX "Page_tenantId_siteId_idx" ON "Page"("tenantId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_tenantId_id_key" ON "Page"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Page_tenantId_siteId_slug_key" ON "Page"("tenantId", "siteId", "slug");

-- CreateIndex
CREATE INDEX "PageVersion_tenantId_idx" ON "PageVersion"("tenantId");

-- CreateIndex
CREATE INDEX "PageVersion_tenantId_pageId_idx" ON "PageVersion"("tenantId", "pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageVersion_tenantId_id_key" ON "PageVersion"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PageVersion_tenantId_pageId_revision_key" ON "PageVersion"("tenantId", "pageId", "revision");

-- CreateIndex
CREATE INDEX "SectionContent_tenantId_idx" ON "SectionContent"("tenantId");

-- CreateIndex
CREATE INDEX "SectionContent_tenantId_siteId_idx" ON "SectionContent"("tenantId", "siteId");

-- CreateIndex
CREATE INDEX "SectionContent_tenantId_pageId_idx" ON "SectionContent"("tenantId", "pageId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionContent_tenantId_id_key" ON "SectionContent"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SectionContent_tenantId_pageId_sectionId_key" ON "SectionContent"("tenantId", "pageId", "sectionId");

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

-- CreateIndex
CREATE INDEX "Product_tenantId_status_order_idx" ON "Product"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_id_key" ON "Product"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_slug_key" ON "Product"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_idx" ON "ProductCategory"("tenantId");

-- CreateIndex
CREATE INDEX "ProductCategory_tenantId_status_order_idx" ON "ProductCategory"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_tenantId_id_key" ON "ProductCategory"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_tenantId_slug_key" ON "ProductCategory"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");

-- CreateIndex
CREATE INDEX "Project_tenantId_status_order_idx" ON "Project"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Project_tenantId_id_key" ON "Project"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Project_tenantId_slug_key" ON "Project"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Story_tenantId_idx" ON "Story"("tenantId");

-- CreateIndex
CREATE INDEX "Story_tenantId_status_order_idx" ON "Story"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Story_tenantId_id_key" ON "Story"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Story_tenantId_slug_key" ON "Story"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Post_tenantId_idx" ON "Post"("tenantId");

-- CreateIndex
CREATE INDEX "Post_tenantId_status_order_idx" ON "Post"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Post_tenantId_id_key" ON "Post"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Post_tenantId_slug_key" ON "Post"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Faq_tenantId_idx" ON "Faq"("tenantId");

-- CreateIndex
CREATE INDEX "Faq_tenantId_status_order_idx" ON "Faq"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Faq_tenantId_id_key" ON "Faq"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Faq_tenantId_slug_key" ON "Faq"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Testimonial_tenantId_idx" ON "Testimonial"("tenantId");

-- CreateIndex
CREATE INDEX "Testimonial_tenantId_status_order_idx" ON "Testimonial"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_tenantId_id_key" ON "Testimonial"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_tenantId_slug_key" ON "Testimonial"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Branch_tenantId_idx" ON "Branch"("tenantId");

-- CreateIndex
CREATE INDEX "Branch_tenantId_status_order_idx" ON "Branch"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_tenantId_id_key" ON "Branch"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_tenantId_slug_key" ON "Branch"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Certificate_tenantId_idx" ON "Certificate"("tenantId");

-- CreateIndex
CREATE INDEX "Certificate_tenantId_status_order_idx" ON "Certificate"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_tenantId_id_key" ON "Certificate"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_tenantId_slug_key" ON "Certificate"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Brand_tenantId_idx" ON "Brand"("tenantId");

-- CreateIndex
CREATE INDEX "Brand_tenantId_status_order_idx" ON "Brand"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_tenantId_id_key" ON "Brand"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_tenantId_slug_key" ON "Brand"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "PressItem_tenantId_idx" ON "PressItem"("tenantId");

-- CreateIndex
CREATE INDEX "PressItem_tenantId_status_order_idx" ON "PressItem"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PressItem_tenantId_id_key" ON "PressItem"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PressItem_tenantId_slug_key" ON "PressItem"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Service_tenantId_idx" ON "Service"("tenantId");

-- CreateIndex
CREATE INDEX "Service_tenantId_status_order_idx" ON "Service"("tenantId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Service_tenantId_id_key" ON "Service"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Service_tenantId_slug_key" ON "Service"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Media_key_key" ON "Media"("key");

-- CreateIndex
CREATE INDEX "Media_tenantId_idx" ON "Media"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_tenantId_id_key" ON "Media"("tenantId", "id");

-- CreateIndex
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_tenantId_id_key" ON "Lead"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Outbox_idempotencyKey_key" ON "Outbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Outbox_tenantId_idx" ON "Outbox"("tenantId");

-- CreateIndex
CREATE INDEX "Outbox_status_runAt_idx" ON "Outbox"("status", "runAt");

-- CreateIndex
CREATE UNIQUE INDEX "Outbox_tenantId_id_key" ON "Outbox"("tenantId", "id");

-- CreateIndex
CREATE INDEX "LeadIntegration_tenantId_idx" ON "LeadIntegration"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadIntegration_tenantId_id_key" ON "LeadIntegration"("tenantId", "id");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_tenantId_id_key" ON "AuditLog"("tenantId", "id");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAdmin" ADD CONSTRAINT "PlatformAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_tenantId_siteId_fkey" FOREIGN KEY ("tenantId", "siteId") REFERENCES "Site"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_tenantId_siteId_fkey" FOREIGN KEY ("tenantId", "siteId") REFERENCES "Site"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_tenantId_pageId_fkey" FOREIGN KEY ("tenantId", "pageId") REFERENCES "Page"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionContent" ADD CONSTRAINT "SectionContent_tenantId_siteId_fkey" FOREIGN KEY ("tenantId", "siteId") REFERENCES "Site"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SectionContent" ADD CONSTRAINT "SectionContent_tenantId_pageId_fkey" FOREIGN KEY ("tenantId", "pageId") REFERENCES "Page"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SectionContent" ADD CONSTRAINT "SectionContent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_categoryId_fkey" FOREIGN KEY ("tenantId", "categoryId") REFERENCES "ProductCategory"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_brandId_fkey" FOREIGN KEY ("tenantId", "brandId") REFERENCES "Brand"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_tenantId_parentId_fkey" FOREIGN KEY ("tenantId", "parentId") REFERENCES "ProductCategory"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_coverMediaId_fkey" FOREIGN KEY ("tenantId", "coverMediaId") REFERENCES "Media"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_tenantId_posterMediaId_fkey" FOREIGN KEY ("tenantId", "posterMediaId") REFERENCES "Media"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_tenantId_coverMediaId_fkey" FOREIGN KEY ("tenantId", "coverMediaId") REFERENCES "Media"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_logoMediaId_fkey" FOREIGN KEY ("tenantId", "logoMediaId") REFERENCES "Media"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressItem" ADD CONSTRAINT "PressItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_siteId_fkey" FOREIGN KEY ("tenantId", "siteId") REFERENCES "Site"("tenantId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadIntegration" ADD CONSTRAINT "LeadIntegration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
