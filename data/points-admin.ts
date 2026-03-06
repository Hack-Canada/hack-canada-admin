import { RESULTS_PER_PAGE } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  users,
  userBalance,
  pointsTransactions,
  pointsBannedUsers,
  checkIns,
  challengesSubmitted,
  challenges,
} from "@/lib/db/schema";
import {
  and,
  count,
  desc,
  eq,
  gte,
  lte,
  ilike,
  or,
  sql,
  isNotNull,
} from "drizzle-orm";

export type PointsTransactionMetadata = {
  type?:
    | "challenge_completion"
    | "shop_redemption"
    | "admin_adjustment"
    | "admin_undo";
  challengeName?: string;
  itemName?: string;
  reason?: string;
  originalTransactionId?: string;
};

export const getCheckedInUsersWithBalance = async (
  offsetAmt: number,
  filters?: {
    search?: string;
  },
) => {
  try {
    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`),
        ),
      );
    }

    const checkedInUserIds = db
      .selectDistinct({ userId: checkIns.userId })
      .from(checkIns);

    const baseConditions = [sql`${users.id} IN ${checkedInUserIds}`];

    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        points: sql<number>`COALESCE(${userBalance.points}, 0)`,
      })
      .from(users)
      .leftJoin(userBalance, eq(users.id, userBalance.userId))
      .where(
        conditions.length > 0
          ? and(...baseConditions, ...conditions)
          : and(...baseConditions),
      )
      .limit(RESULTS_PER_PAGE)
      .offset(offsetAmt)
      .orderBy(users.name);
  } catch (error) {
    console.log("Error fetching checked-in users with balance", error);
    return [];
  }
};

export const getNumCheckedInUsersWithBalance = async (filters?: {
  search?: string;
}) => {
  try {
    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`),
        ),
      );
    }

    const checkedInUserIds = db
      .selectDistinct({ userId: checkIns.userId })
      .from(checkIns);

    const baseConditions = [sql`${users.id} IN ${checkedInUserIds}`];

    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(
        conditions.length > 0
          ? and(...baseConditions, ...conditions)
          : and(...baseConditions),
      );

    return result.count;
  } catch (error) {
    console.log("Error fetching number of checked-in users", error);
    return 0;
  }
};

export const getUserPointsInfo = async (userId: string) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return null;

    const [balance] = await db
      .select({ points: userBalance.points })
      .from(userBalance)
      .where(eq(userBalance.userId, userId));

    const [banned] = await db
      .select()
      .from(pointsBannedUsers)
      .where(eq(pointsBannedUsers.userId, userId));

    const transactions = await db
      .select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, userId))
      .orderBy(desc(pointsTransactions.createdAt))
      .limit(50);

    return {
      ...user,
      points: balance?.points ?? 0,
      isBanned: !!banned,
      bannedInfo: banned ?? null,
      transactions,
    };
  } catch (error) {
    console.log("Error fetching user points info", error);
    return null;
  }
};

export type TransactionFilters = {
  userId?: string;
  type?: string;
  minPoints?: number;
  maxPoints?: number;
  startDate?: string;
  endDate?: string;
};

export const getPointsTransactions = async (
  offsetAmt: number,
  filters?: TransactionFilters,
) => {
  try {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(pointsTransactions.userId, filters.userId));
    }

    if (filters?.type && filters.type !== "all") {
      conditions.push(
        sql`${pointsTransactions.metadata}->>'type' = ${filters.type}`,
      );
    }

    if (filters?.minPoints !== undefined) {
      conditions.push(gte(pointsTransactions.points, filters.minPoints));
    }

    if (filters?.maxPoints !== undefined) {
      conditions.push(lte(pointsTransactions.points, filters.maxPoints));
    }

    if (filters?.startDate) {
      conditions.push(
        gte(pointsTransactions.createdAt, new Date(filters.startDate)),
      );
    }

    if (filters?.endDate) {
      conditions.push(
        lte(pointsTransactions.createdAt, new Date(filters.endDate)),
      );
    }

    return await db
      .select({
        transaction: pointsTransactions,
        userName: users.name,
        userEmail: users.email,
      })
      .from(pointsTransactions)
      .innerJoin(users, eq(users.id, pointsTransactions.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(RESULTS_PER_PAGE)
      .offset(offsetAmt)
      .orderBy(desc(pointsTransactions.createdAt));
  } catch (error) {
    console.log("Error fetching points transactions", error);
    return [];
  }
};

export const getNumPointsTransactions = async (filters?: TransactionFilters) => {
  try {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(pointsTransactions.userId, filters.userId));
    }

    if (filters?.type && filters.type !== "all") {
      conditions.push(
        sql`${pointsTransactions.metadata}->>'type' = ${filters.type}`,
      );
    }

    if (filters?.minPoints !== undefined) {
      conditions.push(gte(pointsTransactions.points, filters.minPoints));
    }

    if (filters?.maxPoints !== undefined) {
      conditions.push(lte(pointsTransactions.points, filters.maxPoints));
    }

    if (filters?.startDate) {
      conditions.push(
        gte(pointsTransactions.createdAt, new Date(filters.startDate)),
      );
    }

    if (filters?.endDate) {
      conditions.push(
        lte(pointsTransactions.createdAt, new Date(filters.endDate)),
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(pointsTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.count;
  } catch (error) {
    console.log("Error fetching number of transactions", error);
    return 0;
  }
};

export const getTransactionById = async (transactionId: string) => {
  try {
    const [result] = await db
      .select({
        transaction: pointsTransactions,
        userName: users.name,
        userEmail: users.email,
      })
      .from(pointsTransactions)
      .innerJoin(users, eq(users.id, pointsTransactions.userId))
      .where(eq(pointsTransactions.id, transactionId));

    return result ?? null;
  } catch (error) {
    console.log("Error fetching transaction by id", error);
    return null;
  }
};

export const getBannedUsers = async (offsetAmt: number) => {
  try {
    return await db
      .select({
        banned: pointsBannedUsers,
        userName: users.name,
        userEmail: users.email,
        bannedByName: sql<string | null>`(SELECT name FROM "user" WHERE id = ${pointsBannedUsers.bannedBy})`,
      })
      .from(pointsBannedUsers)
      .innerJoin(users, eq(users.id, pointsBannedUsers.userId))
      .limit(RESULTS_PER_PAGE)
      .offset(offsetAmt)
      .orderBy(desc(pointsBannedUsers.bannedAt));
  } catch (error) {
    console.log("Error fetching banned users", error);
    return [];
  }
};

export const getNumBannedUsers = async () => {
  try {
    const [result] = await db.select({ count: count() }).from(pointsBannedUsers);
    return result.count;
  } catch (error) {
    console.log("Error fetching number of banned users", error);
    return 0;
  }
};

export const isUserBanned = async (userId: string) => {
  try {
    const [result] = await db
      .select()
      .from(pointsBannedUsers)
      .where(eq(pointsBannedUsers.userId, userId));
    return !!result;
  } catch (error) {
    console.log("Error checking if user is banned", error);
    return false;
  }
};

export const getPointsStats = async () => {
  try {
    const [totalDistributed] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CASE WHEN ${pointsTransactions.points} > 0 THEN ${pointsTransactions.points} ELSE 0 END), 0)`,
      })
      .from(pointsTransactions);

    const [totalSpent] = await db
      .select({
        total: sql<number>`COALESCE(ABS(SUM(CASE WHEN ${pointsTransactions.points} < 0 THEN ${pointsTransactions.points} ELSE 0 END)), 0)`,
      })
      .from(pointsTransactions);

    const [transactionCount] = await db
      .select({ count: count() })
      .from(pointsTransactions);

    const [bannedCount] = await db
      .select({ count: count() })
      .from(pointsBannedUsers);

    return {
      totalDistributed: totalDistributed.total,
      totalSpent: totalSpent.total,
      transactionCount: transactionCount.count,
      bannedUsersCount: bannedCount.count,
    };
  } catch (error) {
    console.log("Error fetching points stats", error);
    return {
      totalDistributed: 0,
      totalSpent: 0,
      transactionCount: 0,
      bannedUsersCount: 0,
    };
  }
};
