import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { db } from "@/lib/db";
import { pointsBannedUsers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isUserBanned } from "@/data/points-admin";

const unbanSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
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
    const validation = unbanSchema.safeParse(body);

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

    const { userId } = validation.data;

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

    const banned = await isUserBanned(userId);
    if (!banned) {
      return NextResponse.json(
        { success: false, message: "User is not banned" },
        { status: 400 },
      );
    }

    await db
      .delete(pointsBannedUsers)
      .where(eq(pointsBannedUsers.userId, userId));

    return NextResponse.json({
      success: true,
      message: `${targetUser.name} has been unbanned and can now earn points again`,
    });
  } catch (error) {
    console.error("Error unbanning user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
