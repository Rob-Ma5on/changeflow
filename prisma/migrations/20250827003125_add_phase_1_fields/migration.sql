-- CreateEnum
CREATE TYPE "public"."ECRPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "public"."CustomerImpact" AS ENUM ('DIRECT_IMPACT', 'INDIRECT_IMPACT', 'NO_IMPACT');

-- CreateEnum
CREATE TYPE "public"."EstimatedCostRange" AS ENUM ('UNDER_1K', 'FROM_1K_TO_10K', 'FROM_10K_TO_50K', 'FROM_50K_TO_100K', 'OVER_100K');

-- CreateEnum
CREATE TYPE "public"."EffectivityType" AS ENUM ('DATE_BASED', 'IMMEDIATE');

-- CreateEnum
CREATE TYPE "public"."MaterialDisposition" AS ENUM ('USE_AS_IS', 'REWORK', 'SCRAP', 'RETURN_TO_VENDOR', 'SORT_INSPECT', 'NO_IMPACT');

-- CreateEnum
CREATE TYPE "public"."CustomerNotificationRequired" AS ENUM ('FORMAL', 'INFORMATIONAL', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."ResponseDeadline" AS ENUM ('HOURS_24', 'HOURS_48', 'DAYS_5', 'DAYS_10', 'DAYS_30');

-- CreateEnum
CREATE TYPE "public"."ImplementationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'VERIFIED');

-- AlterTable
ALTER TABLE "public"."ecns" ADD COLUMN     "acknowledgmentStatus" TEXT,
ADD COLUMN     "actualImplementationDate" TIMESTAMP(3),
ADD COLUMN     "closureApprover" TEXT,
ADD COLUMN     "closureDate" TIMESTAMP(3),
ADD COLUMN     "customerNotificationRequired" "public"."CustomerNotificationRequired" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "distributionList" TEXT,
ADD COLUMN     "finalDocumentationSummary" TEXT,
ADD COLUMN     "implementationStatus" "public"."ImplementationStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "internalStakeholders" TEXT,
ADD COLUMN     "notificationMethod" TEXT NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "responseDeadline" "public"."ResponseDeadline";

-- AlterTable
ALTER TABLE "public"."ecos" ADD COLUMN     "documentUpdates" TEXT,
ADD COLUMN     "effectiveDate" TIMESTAMP(3),
ADD COLUMN     "effectivityType" "public"."EffectivityType" NOT NULL DEFAULT 'DATE_BASED',
ADD COLUMN     "estimatedTotalCost" DECIMAL(65,30),
ADD COLUMN     "implementationTeam" TEXT,
ADD COLUMN     "inventoryImpact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "materialDisposition" "public"."MaterialDisposition" NOT NULL DEFAULT 'NO_IMPACT';

-- AlterTable
ALTER TABLE "public"."ecrs" ADD COLUMN     "customerImpact" "public"."CustomerImpact" NOT NULL DEFAULT 'NO_IMPACT',
ADD COLUMN     "estimatedCostRange" "public"."EstimatedCostRange",
ADD COLUMN     "priority" "public"."ECRPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "reasonForChange" TEXT,
ADD COLUMN     "stakeholders" TEXT,
ADD COLUMN     "targetImplementationDate" TIMESTAMP(3);
