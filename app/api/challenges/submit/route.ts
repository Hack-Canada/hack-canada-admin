import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/auth";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

import type { ApiResponse } from "@/types/api";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/db/queries/user";
import {
  auditLogs,
  challenges,
  challengesSubmitted,
  ChallengeSubmission,
} from "@/lib/db/schema";

interface ChallengeSubmissionRequest {
  userId: string;
  challengeId: string;
}

// Validate request body
const checkInSchema: z.ZodType<ChallengeSubmissionRequest> = z.object({
  userId: z.string().uuid(),
  challengeId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<ChallengeSubmission>>> {
  try {
    const currentUser = await getCurrentUser();

    // Check if user is authenticated and has admin/organizer role
    if (
      !currentUser?.id ||
      !(currentUser?.role == "admin" || currentUser?.role === "organizer")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          error: "Insufficient permissions",
        },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { userId, challengeId } = checkInSchema.parse(body);

    const existingUser = await getUserById(userId);

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          error: "Invalid user ID",
        },
        { status: 404 },
      );
    }

    if (existingUser.role === "unassigned") {
      // Log the action to report the user
      await db.insert(auditLogs).values({
        userId: existingUser.id,
        action: "create",
        entityType: "challenge_submission",
        entityId: existingUser.id,
        metadata: JSON.stringify({
          description: `${existingUser.name.split(" ")[0]} tried to submit a challenge submission for ${challengeId}`,
          issue: "User does not have an assigned role",
        }),
      });

      return NextResponse.json(
        {
          success: false,
          message: "User does not have an assigned role",
          error: "Invalid user role",
        },
        { status: 400 },
      );
    }

    return await db.transaction(async (tx) => {
      // 1. Fetch challenge details with a lock to ensure atomicity for maxCompletions check
      // Note: 'for update' locks the row so other transactions waiting to submit for this challenge will wait
      const [challenge] = await tx
        .select()
        .from(challenges)
        .where(eq(challenges.id, challengeId))
        .for("update");

      if (!challenge) {
        return NextResponse.json(
          {
            success: false,
            message: "Challenge not found",
            error: "Invalid challenge ID",
          },
          { status: 404 },
        );
      }

      // 2. Check if user already submitted
      // We check this inside transaction for consistency, though unique constraint also protects
      const existingSubmission = await tx.query.challengesSubmitted.findFirst({
        where: and(
          eq(challengesSubmitted.userId, userId),
          eq(challengesSubmitted.challengeId, challengeId),
        ),
      });

      if (existingSubmission) {
        return NextResponse.json(
          {
            success: false,
            message: "User already completed this challenge",
            error: "Duplicate check-in",
            data: existingSubmission,
          },
          { status: 400 },
        );
      }

      // 3. Check max completions
      if (challenge.maxCompletions !== null) {
        const [submissionCount] = await tx
          .select({ count: count() })
          .from(challengesSubmitted)
          .where(eq(challengesSubmitted.challengeId, challengeId));

        if (submissionCount.count >= challenge.maxCompletions) {
          return NextResponse.json(
            {
              success: false,
              message: "Maximum submissions reached for this challenge",
              error: "Max completions limit exceeded",
            },
            { status: 400 },
          );
        }
      }

      // 4. Create new submission
      const [newChallengeSubmission] = await tx
        .insert(challengesSubmitted)
        .values({
          userId,
          challengeId,
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: "Challenge completed",
        data: newChallengeSubmission,
        userName: existingUser.name,
      });
    });
  } catch (error) {
    console.error("Check-in error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          error: error.errors[0].message,
        },
        { status: 400 },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
