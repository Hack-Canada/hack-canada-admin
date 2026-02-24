import { RESULTS_PER_PAGE } from "@/lib/constants";
import { db } from "@/lib/db";
import { rsvp, users } from "@/lib/db/schema";
import { and, count, desc, eq, ilike, sql } from "drizzle-orm";

export const getRsvps = async (
  offsetAmt: number,
  filters?: {
    name?: string;
    dietaryRestrictions?: string;
    tshirtSize?: string;
  },
) => {
  try {
    const conditions = [];

    if (filters?.name) {
      conditions.push(ilike(users.name, `%${filters.name}%`));
    }
    if (filters?.dietaryRestrictions && filters.dietaryRestrictions !== "all") {
      conditions.push(
        ilike(rsvp.dietaryRestrictions, `%${filters.dietaryRestrictions}%`),
      );
    }
    if (filters?.tshirtSize && filters.tshirtSize !== "all") {
      conditions.push(eq(rsvp.tshirtSize, filters.tshirtSize));
    }

    return await db
      .select({
        rsvp: rsvp,
        userName: users.name,
        userEmail: users.email,
        applicationStatus: users.applicationStatus,
      })
      .from(rsvp)
      .innerJoin(users, eq(users.id, rsvp.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(RESULTS_PER_PAGE)
      .offset(offsetAmt)
      .orderBy(desc(rsvp.createdAt));
  } catch (error) {
    console.log("Error fetching RSVPs", error);
    return [];
  }
};

export const getNumRsvps = async (filters?: {
  name?: string;
  dietaryRestrictions?: string;
  tshirtSize?: string;
}) => {
  try {
    const conditions = [];

    if (filters?.name) {
      conditions.push(ilike(users.name, `%${filters.name}%`));
    }
    if (filters?.dietaryRestrictions && filters.dietaryRestrictions !== "all") {
      conditions.push(
        ilike(rsvp.dietaryRestrictions, `%${filters.dietaryRestrictions}%`),
      );
    }
    if (filters?.tshirtSize && filters.tshirtSize !== "all") {
      conditions.push(eq(rsvp.tshirtSize, filters.tshirtSize));
    }

    const [result] = await db
      .select({ count: count() })
      .from(rsvp)
      .innerJoin(users, eq(users.id, rsvp.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.count;
  } catch (error) {
    console.log("Error fetching number of RSVPs", error);
    return 0;
  }
};

export const getRsvpStats = async () => {
  try {
    const [total] = await db.select({ count: count() }).from(rsvp);

    const tshirtSizes = await db
      .select({
        size: rsvp.tshirtSize,
        count: count(),
      })
      .from(rsvp)
      .groupBy(rsvp.tshirtSize);

    const dietaryCounts = await db
      .select({
        diet: rsvp.dietaryRestrictions,
        count: count(),
      })
      .from(rsvp)
      .groupBy(rsvp.dietaryRestrictions);

    return {
      total: total.count,
      tshirtSizes,
      dietaryCounts,
    };
  } catch (error) {
    console.log("Error fetching RSVP stats", error);
    return { total: 0, tshirtSizes: [], dietaryCounts: [] };
  }
};
