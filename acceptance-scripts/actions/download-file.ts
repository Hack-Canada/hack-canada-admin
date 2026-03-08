"use server";

import { getCurrentUser } from "@/auth";
import { db } from "@/lib/db";
import { users, hackerApplications, rsvp } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAllCheckInsForDownload } from "@/data/check-ins";

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

export const getDownloadableRsvpList = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    const rows = await db
      .select({
        name: users.name,
        email: users.email,
        tshirtSize: rsvp.tshirtSize,
        dietaryRestrictions: rsvp.dietaryRestrictions,
        emergencyContactName: rsvp.emergencyContactName,
        emergencyContactPhone: rsvp.emergencyContactPhoneNumber,
        emergencyContactRelation: rsvp.relationshipToParticipant,
        alternativePhone: rsvp.alternativePhoneNumber,
        mediaConsent: rsvp.mediaConsent,
        rsvpDate: rsvp.createdAt,
      })
      .from(rsvp)
      .innerJoin(users, eq(users.id, rsvp.userId))
      .orderBy(desc(rsvp.createdAt));

    return rows;
  } catch (error) {
    console.log("Error fetching RSVP data for download", error);
    return [];
  }
};

export const getDownloadableCheckIns = async (filters?: {
  name?: string;
  eventName?: string;
}) => {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return {
      error: "Unauthorized",
    };
  }

  try {
    return await getAllCheckInsForDownload(filters);
  } catch (error) {
    console.log("Error fetching check-ins for download", error);
    return [];
  }
};
