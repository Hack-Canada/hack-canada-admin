import { getCurrentUser } from "@/auth";
import { ApiResponse } from "@/types/api";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { hackerApplications } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, sql, and, gte, lte, inArray } from "drizzle-orm";
import { isAdmin } from "@/lib/utils";
import {
  CONFIDENCE_WEIGHTS,
  MAX_REVIEWS_FOR_CONFIDENCE,
} from "@/lib/normalization/config";

const criteriaSchema = z.object({
  minRating: z.number().min(0).max(10).optional(),
  maxRating: z.number().min(0).max(10).optional(),
  minConfidence: z.number().min(0).max(100).optional(),
  maxConfidence: z.number().min(0).max(100).optional(),
  minReviewCount: z.number().min(0).optional(),
  currentStatuses: z.array(z.enum(["pending", "waitlisted"])).optional(),
  targetAction: z.enum(["accepted", "rejected", "waitlisted"]),
});

export type CriteriaPreviewRequest = z.infer<typeof criteriaSchema>;

export interface CriteriaPreviewResponse {
  matchingCount: number;
  matchingUserIds: string[];
  preview: Array<{ firstName: string; lastName: string; email: string }>;
  currentCounts: {
    pending: number;
    accepted: number;
    rejected: number;
    waitlisted: number;
  };
  projectedCounts: {
    pending: number;
    accepted: number;
    rejected: number;
    waitlisted: number;
  };
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<CriteriaPreviewResponse>>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id || !isAdmin(currentUser.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to perform this action.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedFields = criteriaSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid criteria provided.",
          error: validatedFields.error.message,
        },
        { status: 400 }
      );
    }

    const {
      minRating,
      maxRating,
      minConfidence,
      maxConfidence,
      minReviewCount,
      currentStatuses,
      targetAction,
    } = validatedFields.data;

    // Build confidence subquery expression
    const confidenceExpr = sql<number>`
      COALESCE((
        SELECT 
          ROUND((
            (LEAST(COUNT(*)::float / ${MAX_REVIEWS_FOR_CONFIDENCE}, 1.0) * ${CONFIDENCE_WEIGHTS.reviewCount}) +
            (GREATEST(1.0 - (COALESCE(STDDEV(rating), 0)::float / 5.0), 0.0) * ${CONFIDENCE_WEIGHTS.agreement}) +
            (0.7 * ${CONFIDENCE_WEIGHTS.reliability})
          ) * 100)::integer
        FROM "applicationReview" ar
        WHERE ar."applicationId" = ${hackerApplications.id}
      ), 0)
    `;

    // Build WHERE conditions
    const conditions = [eq(hackerApplications.submissionStatus, "submitted")];

    // normalizedAvgRating is stored as 0-1000 scale (rating * 100)
    // Only apply rating filter if NOT at full range (0-10), to allow NULL values through
    if (minRating !== undefined && minRating > 0) {
      conditions.push(gte(hackerApplications.normalizedAvgRating, Math.round(minRating * 100)));
    }
    if (maxRating !== undefined && maxRating < 10) {
      conditions.push(lte(hackerApplications.normalizedAvgRating, Math.round(maxRating * 100)));
    }
    if (minReviewCount !== undefined) {
      conditions.push(gte(hackerApplications.reviewCount, minReviewCount));
    }
    if (currentStatuses && currentStatuses.length > 0) {
      conditions.push(inArray(hackerApplications.internalResult, currentStatuses));
    } else {
      // Default to only pending and waitlisted
      conditions.push(inArray(hackerApplications.internalResult, ["pending", "waitlisted"]));
    }

    // Get matching applications with confidence filter applied via HAVING-like approach
    // Since we need to filter by a computed column (confidence), we use a subquery
    let matchingAppsQuery = db
      .select({
        id: hackerApplications.id,
        userId: hackerApplications.userId,
        firstName: hackerApplications.firstName,
        lastName: hackerApplications.lastName,
        email: hackerApplications.email,
        confidence: confidenceExpr,
      })
      .from(hackerApplications)
      .where(and(...conditions));

    const allMatching = await matchingAppsQuery;

    // Apply confidence filter in JS since it's a computed column
    let filteredApps = allMatching;
    if (minConfidence !== undefined || maxConfidence !== undefined) {
      filteredApps = allMatching.filter((app) => {
        const conf = Number(app.confidence);
        if (minConfidence !== undefined && conf < minConfidence) return false;
        if (maxConfidence !== undefined && conf > maxConfidence) return false;
        return true;
      });
    }

    // Get current status counts
    const statusCountsResult = await db
      .select({
        status: hackerApplications.internalResult,
        count: sql<number>`COUNT(*)::integer`,
      })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted"))
      .groupBy(hackerApplications.internalResult);

    const currentCounts = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      waitlisted: 0,
    };
    for (const row of statusCountsResult) {
      const status = row.status as keyof typeof currentCounts;
      if (status in currentCounts) {
        currentCounts[status] = row.count;
      }
    }

    // Calculate projected counts
    const matchingCount = filteredApps.length;
    const matchingUserIds = filteredApps.map((app) => app.userId);

    // Figure out how many are coming from each status
    const matchingByStatus = {
      pending: 0,
      waitlisted: 0,
    };
    
    // We need to query the actual statuses of matching apps
    if (matchingUserIds.length > 0) {
      const matchingStatuses = await db
        .select({
          internalResult: hackerApplications.internalResult,
          count: sql<number>`COUNT(*)::integer`,
        })
        .from(hackerApplications)
        .where(inArray(hackerApplications.userId, matchingUserIds))
        .groupBy(hackerApplications.internalResult);

      for (const row of matchingStatuses) {
        const status = row.internalResult as keyof typeof matchingByStatus;
        if (status in matchingByStatus) {
          matchingByStatus[status] = row.count;
        }
      }
    }

    const projectedCounts = { ...currentCounts };
    // Subtract from current statuses
    projectedCounts.pending -= matchingByStatus.pending;
    projectedCounts.waitlisted -= matchingByStatus.waitlisted;
    // Add to target status
    projectedCounts[targetAction] += matchingCount;

    // Get preview (first 5)
    const preview = filteredApps.slice(0, 5).map((app) => ({
      firstName: app.firstName || "",
      lastName: app.lastName || "",
      email: app.email || "",
    }));

    return NextResponse.json({
      success: true,
      message: `Found ${matchingCount} matching applications.`,
      data: {
        matchingCount,
        matchingUserIds,
        preview,
        currentCounts,
        projectedCounts,
      },
    });
  } catch (error) {
    console.error("[CRITERIA_PREVIEW_POST]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to preview criteria.",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
