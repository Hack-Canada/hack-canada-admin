import { RESULTS_PER_PAGE } from "@/lib/constants";
import { db } from "@/lib/db";
import { checkIns, users } from "@/lib/db/schema";
import { and, count, desc, eq, ilike } from "drizzle-orm";

export const getCheckIns = async (
  offsetAmt: number,
  filters?: {
    name?: string;
    eventName?: string;
  },
) => {
  try {
    const conditions = [];

    if (filters?.name) {
      conditions.push(ilike(users.name, `%${filters.name}%`));
    }
    if (filters?.eventName && filters.eventName !== "all") {
      conditions.push(eq(checkIns.eventName, filters.eventName));
    }

    return await db
      .select({
        checkIn: checkIns,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(checkIns)
      .innerJoin(users, eq(users.id, checkIns.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(RESULTS_PER_PAGE)
      .offset(offsetAmt)
      .orderBy(desc(checkIns.createdAt));
  } catch (error) {
    console.log("Error fetching check-ins", error);
    return [];
  }
};

export const getNumCheckIns = async (filters?: {
  name?: string;
  eventName?: string;
}) => {
  try {
    const conditions = [];

    if (filters?.name) {
      conditions.push(ilike(users.name, `%${filters.name}%`));
    }
    if (filters?.eventName && filters.eventName !== "all") {
      conditions.push(eq(checkIns.eventName, filters.eventName));
    }

    const [result] = await db
      .select({ count: count() })
      .from(checkIns)
      .innerJoin(users, eq(users.id, checkIns.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.count;
  } catch (error) {
    console.log("Error fetching number of check-ins", error);
    return 0;
  }
};

export const getCheckInEvents = async () => {
  try {
    const events = await db
      .selectDistinct({ eventName: checkIns.eventName })
      .from(checkIns);
    return events.map((e) => e.eventName);
  } catch (error) {
    console.log("Error fetching check-in events", error);
    return [];
  }
};

export const getCheckInStats = async () => {
  try {
    const eventCounts = await db
      .select({
        eventName: checkIns.eventName,
        count: count(),
      })
      .from(checkIns)
      .groupBy(checkIns.eventName)
      .orderBy(desc(count()));

    const [total] = await db.select({ count: count() }).from(checkIns);

    return {
      total: total.count,
      events: eventCounts,
    };
  } catch (error) {
    console.log("Error fetching check-in stats", error);
    return { total: 0, events: [] };
  }
};
