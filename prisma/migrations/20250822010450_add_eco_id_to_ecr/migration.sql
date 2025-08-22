/*
  Warnings:

  - You are about to drop the column `ecrId` on the `ecos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ecos" DROP CONSTRAINT "ecos_ecrId_fkey";

-- AlterTable
ALTER TABLE "public"."ecos" DROP COLUMN "ecrId";

-- AlterTable
ALTER TABLE "public"."ecrs" ADD COLUMN     "ecoId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."ecrs" ADD CONSTRAINT "ecrs_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "public"."ecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
