import { NextResponse } from "next/server";
import { eq, or, sql } from "drizzle-orm";

import { getCurrentUser } from "@/auth";
import { db } from "@/lib/db";
import {
  users,
  hackerApplications,
  applicationReviews,
} from "@/lib/db/schema";
import { ApiResponse } from "@/types/api";

function weightedRandomRating(): number {
  const weights = [1, 2, 4, 8, 12, 16, 12, 8, 4, 2];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return i + 1;
    }
  }
  return 5;
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const randomTime =
    pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
}

function randomDuration(): number {
  return Math.floor(Math.random() * (180 - 30 + 1)) + 30;
}

export async function POST(
  req: Request,
): Promise<NextResponse<ApiResponse<{ reviewsCreated: number }>>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id || currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          error: "Only admins can seed review data",
        },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetCount = body.count ?? 150;

    const submittedApplications = await db
      .select({ id: hackerApplications.id })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted"));

    if (submittedApplications.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No submitted applications found",
          error: "Cannot seed reviews without submitted applications",
        },
        { status: 400 },
      );
    }

    const reviewers = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.role, "admin"), eq(users.role, "organizer")));

    if (reviewers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No reviewers found",
          error: "Cannot seed reviews without admin/organizer users",
        },
        { status: 400 },
      );
    }

    const existingReviews = await db
      .select({
        applicationId: applicationReviews.applicationId,
        reviewerId: applicationReviews.reviewerId,
      })
      .from(applicationReviews);

    const existingPairs = new Set(
      existingReviews.map((r) => `${r.applicationId}-${r.reviewerId}`),
    );

    const reviewsToInsert: {
      applicationId: string;
      reviewerId: string;
      rating: number;
      reviewDuration: number;
      createdAt: Date;
    }[] = [];

    let attempts = 0;
    const maxAttempts = targetCount * 10;

    while (reviewsToInsert.length < targetCount && attempts < maxAttempts) {
      attempts++;

      const randomApp =
        submittedApplications[
          Math.floor(Math.random() * submittedApplications.length)
        ];
      const randomReviewer =
        reviewers[Math.floor(Math.random() * reviewers.length)];
      const pairKey = `${randomApp.id}-${randomReviewer.id}`;

      if (existingPairs.has(pairKey)) {
        continue;
      }

      existingPairs.add(pairKey);

      reviewsToInsert.push({
        applicationId: randomApp.id,
        reviewerId: randomReviewer.id,
        rating: weightedRandomRating(),
        reviewDuration: randomDuration(),
        createdAt: randomDate(14),
      });
    }

    if (reviewsToInsert.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not generate any new reviews",
          error:
            "All possible reviewer-application combinations may already exist",
        },
        { status: 400 },
      );
    }

    await db.insert(applicationReviews).values(reviewsToInsert);

    const applicationIds = [
      ...new Set(reviewsToInsert.map((r) => r.applicationId)),
    ];

    for (const appId of applicationIds) {
      const reviews = await db
        .select({ rating: applicationReviews.rating })
        .from(applicationReviews)
        .where(eq(applicationReviews.applicationId, appId));

      const reviewCount = reviews.length;
      const avgRating = Math.round(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 100,
      );

      await db
        .update(hackerApplications)
        .set({
          reviewCount,
          averageRating: avgRating,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(hackerApplications.id, appId));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${reviewsToInsert.length} reviews across ${applicationIds.length} applications`,
      data: { reviewsCreated: reviewsToInsert.length },
    });
  } catch (error) {
    console.error("[SEED_REVIEWS_POST]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed reviews",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
