import { db } from "@/lib/db";
import { shopItems, shopPurchases, users } from "@/lib/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";

export const getAllShopItems = async () => {
  try {
    const items = await db
      .select({
        item: shopItems,
        purchaseCount: sql<number>`(
          SELECT COUNT(*) FROM "shopPurchase" 
          WHERE "shopPurchase"."itemId" = ${shopItems.id}
        )`,
      })
      .from(shopItems)
      .orderBy(desc(shopItems.createdAt));

    return items.map((row) => ({
      ...row.item,
      purchaseCount: row.purchaseCount,
    }));
  } catch (error) {
    console.log("Error fetching shop items", error);
    return [];
  }
};

export const getShopItemById = async (id: string) => {
  try {
    const [item] = await db
      .select()
      .from(shopItems)
      .where(eq(shopItems.id, id));
    return item ?? null;
  } catch (error) {
    console.log("Error fetching shop item", error);
    return null;
  }
};

export const createShopItem = async (data: {
  name: string;
  description?: string;
  imageUrl?: string;
  pointsCost: number;
  stock: number;
  maxPerUser?: number;
  enabled?: boolean;
}) => {
  try {
    const [item] = await db
      .insert(shopItems)
      .values({
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        pointsCost: data.pointsCost,
        stock: data.stock,
        maxPerUser: data.maxPerUser ?? 1,
        enabled: data.enabled ?? true,
      })
      .returning();
    return item;
  } catch (error) {
    console.log("Error creating shop item", error);
    return null;
  }
};

export const updateShopItem = async (
  id: string,
  data: {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    pointsCost?: number;
    stock?: number;
    maxPerUser?: number | null;
    enabled?: boolean;
  },
) => {
  try {
    const [item] = await db
      .update(shopItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(shopItems.id, id))
      .returning();
    return item;
  } catch (error) {
    console.log("Error updating shop item", error);
    return null;
  }
};

export const deleteShopItem = async (id: string) => {
  try {
    await db.delete(shopItems).where(eq(shopItems.id, id));
    return true;
  } catch (error) {
    console.log("Error deleting shop item", error);
    return false;
  }
};

export const getShopStats = async () => {
  try {
    const [itemCount] = await db.select({ count: count() }).from(shopItems);

    const [enabledCount] = await db
      .select({ count: count() })
      .from(shopItems)
      .where(eq(shopItems.enabled, true));

    const [purchaseCount] = await db
      .select({ count: count() })
      .from(shopPurchases);

    const [totalPointsSpent] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${shopPurchases.pointsSpent}), 0)`,
      })
      .from(shopPurchases);

    return {
      totalItems: itemCount.count,
      enabledItems: enabledCount.count,
      totalPurchases: purchaseCount.count,
      totalPointsSpent: totalPointsSpent.total,
    };
  } catch (error) {
    console.log("Error fetching shop stats", error);
    return {
      totalItems: 0,
      enabledItems: 0,
      totalPurchases: 0,
      totalPointsSpent: 0,
    };
  }
};

export const getItemPurchases = async (itemId: string) => {
  try {
    return await db
      .select({
        purchase: shopPurchases,
        userName: users.name,
        userEmail: users.email,
      })
      .from(shopPurchases)
      .innerJoin(users, eq(users.id, shopPurchases.userId))
      .where(eq(shopPurchases.itemId, itemId))
      .orderBy(desc(shopPurchases.createdAt));
  } catch (error) {
    console.log("Error fetching item purchases", error);
    return [];
  }
};
