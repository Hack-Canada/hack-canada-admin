"use server";

import { getCurrentUser } from "@/auth";
import { db } from "@/lib/db";
import { users, hackerApplications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const getDownloadableFile = async (
  entity: "users" | "applications",
  filter?: string,
) => {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return {
      error: "Unauthorized",
    };
  }

  try {
    if (entity === "users") {
      if (filter && filter !== "all") {
        return await db
          .select()
          .from(users)
          .where(eq(users.applicationStatus, filter));
      }
      return await db.select().from(users);
    } else if (entity === "applications") {
      if (filter && filter !== "all") {
        return await db
          .select()
          .from(hackerApplications)
          .where(eq(hackerApplications.internalResult, filter));
      }
      return await db.select().from(hackerApplications);
    }
  } catch (error) {
    console.log("Error fetching data for download", error);
    return [];
  }
};
