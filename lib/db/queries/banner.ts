import { eq, desc, sql, and, or, gt, isNull } from "drizzle-orm";
import { db } from "..";
import { banners, type NewBanner } from "../schema";

export async function getAllBanners() {
  return await db.select().from(banners).orderBy(desc(banners.createdAt));
}

export async function getBannerById(id: string) {
  const [banner] = await db.select().from(banners).where(eq(banners.id, id));
  return banner ?? null;
}

export async function createBanner(
  data: Omit<NewBanner, "id" | "createdAt" | "updatedAt">,
) {
  const [created] = await db.insert(banners).values(data).returning();
  return created;
}

export async function updateBanner(
  id: string,
  data: Partial<Omit<NewBanner, "id" | "createdAt" | "updatedAt">>,
) {
  const [updated] = await db
    .update(banners)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(banners.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteBanner(id: string) {
  await db.delete(banners).where(eq(banners.id, id));
  return true;
}

export async function getActiveBanners() {
  const now = new Date();
  return await db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.isActive, true),
        or(isNull(banners.expiresAt), gt(banners.expiresAt, now)),
      ),
    )
    .orderBy(desc(banners.createdAt));
}

export async function getNumBanners() {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(banners);
  return Number(result.count);
}

export async function getBannerCounts() {
  const all = await getAllBanners();
  const now = new Date();

  let active = 0;
  let inactive = 0;
  let expired = 0;

  for (const banner of all) {
    if (banner.expiresAt && banner.expiresAt < now) {
      expired++;
    } else if (banner.isActive) {
      active++;
    } else {
      inactive++;
    }
  }

  return { total: all.length, active, inactive, expired };
}
