import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const CACHE_REVALIDATE_SECONDS = 120; // 2 minutes - admin changes propagate within this window

async function getCompanyInfoUncached() {
  try {
    return await prisma.companyInfo.findUnique({
      where: { id: 1 },
    });
  } catch (error) {
    console.error("Error fetching company info:", error);
    return null;
  }
}

async function getMainOfficeUncached() {
  try {
    const offices = await prisma.office.findMany({
      where: { isMainOffice: true },
      take: 1,
    });
    let mainOffice = offices[0] ?? null;
    if (!mainOffice) {
      mainOffice = await prisma.office.findFirst();
    }
    return mainOffice;
  } catch (error) {
    console.error("Error fetching office for LocalBusiness schema:", error);
    return null;
  }
}

/**
 * Cached company info. Used in layout and pages to avoid duplicate DB calls.
 * Revalidates every CACHE_REVALIDATE_SECONDS.
 */
export function getCachedCompanyInfo() {
  return unstable_cache(
    getCompanyInfoUncached,
    ["company-info"],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: ["company-info"] }
  )();
}

/**
 * Cached main office. Used in layout for StructuredData.
 * Revalidates every CACHE_REVALIDATE_SECONDS.
 */
export function getCachedMainOffice() {
  return unstable_cache(
    getMainOfficeUncached,
    ["main-office"],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: ["office"] }
  )();
}
