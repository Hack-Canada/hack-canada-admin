import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { db } from "@/lib/db";
import {
  pointsTransactions,
  userBalance,
  challengesSubmitted,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getTransactionById, type PointsTransactionMetadata } from "@/data/points-admin";

const undoSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  deleteRelated: z.boolean().default(false),
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
    const validation = undoSchema.safeParse(body);

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

    const { transactionId, deleteRelated } = validation.data;

    const transactionData = await getTransactionById(transactionId);

    if (!transactionData) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 },
      );
    }

    const { transaction } = transactionData;
    const metadata = transaction.metadata as PointsTransactionMetadata | null;

    if (metadata?.type === "admin_undo") {
      return NextResponse.json(
        { success: false, message: "Cannot undo an undo transaction" },
        { status: 400 },
      );
    }

    const reversalPoints = -transaction.points;

    await db.transaction(async (tx) => {
      await tx.insert(pointsTransactions).values({
        userId: transaction.userId,
        points: reversalPoints,
        referenceId: transaction.referenceId,
        metadata: {
          type: "admin_undo",
          originalTransactionId: transactionId,
          originalType: metadata?.type,
          undoneBy: currentUser.id,
          undoneByName: currentUser.name,
        },
      });

      await tx
        .update(userBalance)
        .set({ points: sql`${userBalance.points} + ${reversalPoints}` })
        .where(eq(userBalance.userId, transaction.userId));

      if (deleteRelated && transaction.referenceId) {
        if (metadata?.type === "challenge_completion") {
          await tx
            .delete(challengesSubmitted)
            .where(eq(challengesSubmitted.id, transaction.referenceId));
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reversed ${Math.abs(transaction.points)} points${deleteRelated ? " and deleted related record" : ""}`,
    });
  } catch (error) {
    console.error("Error undoing transaction:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
