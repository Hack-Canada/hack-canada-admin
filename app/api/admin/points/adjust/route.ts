import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { db } from "@/lib/db";
import { pointsTransactions, userBalance, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const adjustSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  points: z.number().refine((val) => val !== 0, "Points cannot be zero"),
  reason: z.string().min(1, "Reason is required"),
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
    const validation = adjustSchema.safeParse(body);

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

    const { userId, points, reason } = validation.data;

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

    await db.transaction(async (tx) => {
      await tx.insert(pointsTransactions).values({
        userId,
        points,
        metadata: {
          type: "admin_adjustment",
          reason,
          adjustedBy: currentUser.id,
          adjustedByName: currentUser.name,
        },
      });

      await tx
        .insert(userBalance)
        .values({
          userId,
          points,
        })
        .onConflictDoUpdate({
          target: userBalance.userId,
          set: { points: sql`${userBalance.points} + ${points}` },
        });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${points > 0 ? "added" : "removed"} ${Math.abs(points)} points ${points > 0 ? "to" : "from"} ${targetUser.name}`,
    });
  } catch (error) {
    console.error("Error adjusting points:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
