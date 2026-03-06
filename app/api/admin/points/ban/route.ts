import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { db } from "@/lib/db";
import { pointsBannedUsers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isUserBanned } from "@/data/points-admin";

const banSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = banSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          error: validation.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const { userId, reason } = validation.data;

    const [targetUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const alreadyBanned = await isUserBanned(userId);
    if (alreadyBanned) {
      return NextResponse.json(
        { success: false, message: "User is already banned from earning points" },
        { status: 400 },
      );
    }

    await db.insert(pointsBannedUsers).values({
      userId,
      bannedBy: currentUser.id,
      reason: reason || null,
    });

    return NextResponse.json({
      success: true,
      message: `${targetUser.name} has been banned from earning points`,
    });
  } catch (error) {
    console.error("Error banning user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
