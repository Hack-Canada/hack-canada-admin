import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";

import { db } from "@/lib/db";
import { pointsTransactions, userBalance } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";

const transactionSchema = z.object({
	userId: z.string(),
	points: z.number(),
	referenceId: z.string().optional(),
	metadata: z.any().optional(),
});

export async function POST(req: NextRequest) {
	try {
		const currentUser = await getCurrentUser();

		if (!currentUser || currentUser.role !== "admin") {
			return NextResponse.json(
				{ success: false, message: "Unauthorized" },
				{ status: 401 },
			);
		}

		const body = await req.json();

		const validationResult = transactionSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{
					success: false,
					message: "Invalid request data",
					error: validationResult.error.errors,
				},
				{ status: 400 },
			);
		}

		const { data } = validationResult;

		// Atomic transaction to ensure user balances & transactions are synced 
		await db.transaction(async (tx) => {
			await tx.insert(pointsTransactions).values({
				userId: data.userId,
				points: data.points,
				referenceId: data.referenceId,
				metadata: data.metadata,
			});

			// Create or insert
			await tx
				.insert(userBalance)
				.values({
					userId: data.userId,
					points: data.points,
				})
				.onConflictDoUpdate({
					target: userBalance.userId,
					set: { points: sql`${userBalance.points} + ${data.points}` },
				});
		});

		return NextResponse.json({
			success: true,
			message: "Point transaction successful",
		});
	} catch (error) {
		console.error("Error processing point transaction:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Internal server error",
			},
			{ status: 500 },
		);
	}
}
