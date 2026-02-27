import { getCurrentUser } from "@/auth";
import { ApiResponse } from "@/types/api";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { hackerApplications } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
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

    // Build dynamic WHERE fragments for the inner query
    const whereParts: string[] = [`ha."submissionStatus" = 'submitted'`];

    // normalizedAvgRating is stored as 0-1000 scale (rating * 100)
    if (minRating !== undefined && minRating > 0) {
      whereParts.push(`ha."normalizedAvgRating" >= ${Math.round(minRating * 100)}`);
    }
    if (maxRating !== undefined && maxRating < 10) {
      whereParts.push(`ha."normalizedAvgRating" <= ${Math.round(maxRating * 100)}`);
    }
    if (minReviewCount !== undefined) {
      whereParts.push(`ha."reviewCount" >= ${Number(minReviewCount)}`);
    }

    const statuses = currentStatuses && currentStatuses.length > 0
      ? currentStatuses
      : ["pending", "waitlisted"];
    whereParts.push(`ha."internalResult" IN (${statuses.map((s) => `'${s}'`).join(",")})`);

    // Confidence bounds pushed into SQL via HAVING-style filter on computed column
    const confMin = minConfidence !== undefined && minConfidence > 0 ? minConfidence : null;
    const confMax = maxConfidence !== undefined && maxConfidence < 100 ? maxConfidence : null;
    if (confMin !== null) {
      whereParts.push(`COALESCE((
        SELECT ROUND((
          (LEAST(COUNT(*)::float / ${MAX_REVIEWS_FOR_CONFIDENCE}, 1.0) * ${CONFIDENCE_WEIGHTS.reviewCount}) +
          (GREATEST(1.0 - (COALESCE(STDDEV(rating), 0)::float / 5.0), 0.0) * ${CONFIDENCE_WEIGHTS.agreement}) +
          (0.7 * ${CONFIDENCE_WEIGHTS.reliability})
        ) * 100)::integer
        FROM "applicationReview" ar WHERE ar."applicationId" = ha.id
      ), 0) >= ${confMin}`);
    }
    if (confMax !== null) {
      whereParts.push(`COALESCE((
        SELECT ROUND((
          (LEAST(COUNT(*)::float / ${MAX_REVIEWS_FOR_CONFIDENCE}, 1.0) * ${CONFIDENCE_WEIGHTS.reviewCount}) +
          (GREATEST(1.0 - (COALESCE(STDDEV(rating), 0)::float / 5.0), 0.0) * ${CONFIDENCE_WEIGHTS.agreement}) +
          (0.7 * ${CONFIDENCE_WEIGHTS.reliability})
        ) * 100)::integer
        FROM "applicationReview" ar WHERE ar."applicationId" = ha.id
      ), 0) <= ${confMax}`);
    }

    const whereClause = whereParts.join(" AND ");

    // Single query: matching user IDs, count, per-status breakdown, and preview names
    const matchResult = await db.execute(sql.raw(`
      SELECT
        ha."userId",
        ha."firstName",
        ha."lastName",
        ha.email,
        ha."internalResult"
      FROM "hackerApplication" ha
      WHERE ${whereClause}
    `));

    const matchedRows = ((matchResult as unknown) as {
      rows: Array<{
        userId: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        internalResult: string | null;
      }>;
    }).rows || [];

    const matchingCount = matchedRows.length;
    const matchingUserIds = matchedRows.map((r) => r.userId);

    const preview = matchedRows.slice(0, 5).map((r) => ({
      firstName: r.firstName || "",
      lastName: r.lastName || "",
      email: r.email || "",
    }));

    // Status counts — current totals and matching breakdown in one query
    const statusCountsResult = await db
      .select({
        status: hackerApplications.internalResult,
        count: sql<number>`COUNT(*)::integer`,
      })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted"))
      .groupBy(hackerApplications.internalResult);

    const currentCounts = { pending: 0, accepted: 0, rejected: 0, waitlisted: 0 };
    for (const row of statusCountsResult) {
      const status = row.status as keyof typeof currentCounts;
      if (status in currentCounts) {
        currentCounts[status] = row.count;
      }
    }

    // Derive matching-by-status from already-fetched rows (no extra query needed)
    const matchingByStatus = { pending: 0, waitlisted: 0 };
    for (const row of matchedRows) {
      const s = row.internalResult as keyof typeof matchingByStatus;
      if (s in matchingByStatus) matchingByStatus[s]++;
    }

    const projectedCounts = { ...currentCounts };
    projectedCounts.pending -= matchingByStatus.pending;
    projectedCounts.waitlisted -= matchingByStatus.waitlisted;
    projectedCounts[targetAction] += matchingCount;

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
