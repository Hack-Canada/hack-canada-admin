import { db } from "@/lib/db";
import { applicationReviews, hackerApplications } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import {
  TARGET_AVG,
  MIN_REVIEWS_THRESHOLD,
  ZSCORE_THRESHOLD,
} from "./config";

export interface ReviewerStats {
  reviewerId: string;
  avgRating: number;
  stdDev: number;
  reviewCount: number;
  zScore: number;
  reliabilityWeight: number;
  adjustment: number;
}

export interface NormalizationResult {
  globalAvg: number;
  globalStdDev: number;
  reviewersProcessed: number;
  applicationsUpdated: number;
  reviewerStats: ReviewerStats[];
  normalizedAt: Date;
}

export async function getReviewerStats(): Promise<{
  reviewerStats: Array<{
    reviewerId: string;
    avgRating: number;
    stdDev: number;
    reviewCount: number;
  }>;
  globalAvg: number;
  globalStdDev: number;
}> {
  // Calculate per-reviewer statistics
  const reviewerStats = await db
    .select({
      reviewerId: applicationReviews.reviewerId,
      avgRating: sql<number>`ROUND(AVG(${applicationReviews.rating})::numeric, 2)`,
      stdDev: sql<number>`COALESCE(ROUND(STDDEV(${applicationReviews.rating})::numeric, 2), 0)`,
      reviewCount: sql<number>`COUNT(${applicationReviews.id})`,
    })
    .from(applicationReviews)
    .groupBy(applicationReviews.reviewerId)
    .having(sql`COUNT(${applicationReviews.id}) >= ${MIN_REVIEWS_THRESHOLD}`)
    .execute();

  // Calculate global statistics
  const globalStats = await db
    .select({
      avgRating: sql<number>`ROUND(AVG(${applicationReviews.rating})::numeric, 2)`,
      stdDev: sql<number>`COALESCE(ROUND(STDDEV(${applicationReviews.rating})::numeric, 2), 1)`,
    })
    .from(applicationReviews)
    .execute();

  const globalAvg = globalStats[0]?.avgRating || TARGET_AVG;
  const globalStdDev = globalStats[0]?.stdDev || 1;

  return { reviewerStats, globalAvg, globalStdDev };
}

export function calculateReviewerAdjustments(
  reviewerStats: Array<{
    reviewerId: string;
    avgRating: number;
    stdDev: number;
    reviewCount: number;
  }>,
  globalAvg: number,
  globalStdDev: number
): ReviewerStats[] {
  return reviewerStats.map((reviewer) => {
    // Calculate z-score for reviewer's average
    const zScore = (reviewer.avgRating - globalAvg) / (globalStdDev || 1);

    // Calculate reliability weight based on review count and consistency
    const reliabilityWeight = Math.min(
      1.0,
      (reviewer.reviewCount / MIN_REVIEWS_THRESHOLD) *
        (1 / (1 + Math.abs(zScore)))
    );

    // Calculate adjusted rating transformation
    const baseAdjustment = TARGET_AVG - reviewer.avgRating;
    const adjustment = baseAdjustment * reliabilityWeight;

    return {
      ...reviewer,
      zScore,
      reliabilityWeight,
      adjustment,
    };
  });
}

export async function normalizeRatings(): Promise<NormalizationResult> {
  const { reviewerStats, globalAvg, globalStdDev } = await getReviewerStats();
  const processedStats = calculateReviewerAdjustments(
    reviewerStats,
    globalAvg,
    globalStdDev
  );

  // Batch update all reviewer ratings in a single statement using VALUES + join
  if (processedStats.length > 0) {
    const valuesList = processedStats
      .map(
        (r) =>
          `('${r.reviewerId}', ${r.avgRating}::numeric, ${r.stdDev}::numeric, ${r.adjustment}::numeric)`
      )
      .join(", ");

    await db.execute(sql.raw(`
      UPDATE "applicationReview" ar
      SET adjusted_rating = ROUND(
        LEAST(10::numeric, GREATEST(0::numeric,
          CASE
            WHEN ABS((ar.rating::numeric - rv.avg_rating) / NULLIF(rv.std_dev, 0)) > ${ZSCORE_THRESHOLD}::numeric
            THEN rv.avg_rating
            ELSE ar.rating::numeric + rv.adjustment
          END
        ))::numeric, 2)
      FROM (VALUES ${valuesList}) AS rv(reviewer_id, avg_rating, std_dev, adjustment)
      WHERE ar."reviewerId" = rv.reviewer_id
    `));
  }

  // Handle reviews without normalized ratings (reviewers below threshold)
  await db.execute(sql`
    UPDATE "applicationReview"
    SET adjusted_rating = rating
    WHERE adjusted_rating IS NULL
  `);

  // Update normalizedAvgRating in hackerApplications (keep averageRating as raw)
  const updateResult = await db.execute(sql`
    UPDATE "hackerApplication" ha
    SET 
      "normalizedAvgRating" = subq.normalized_avg,
      "lastNormalizedAt" = NOW()
    FROM (
      SELECT 
        ar."applicationId",
        ROUND(AVG(ar.adjusted_rating) * 100)::integer as normalized_avg
      FROM "applicationReview" ar
      GROUP BY ar."applicationId"
    ) subq
    WHERE subq."applicationId" = ha.id
  `);

  const normalizedAt = new Date();
  const applicationsUpdated =
    typeof updateResult === "object" && "rowCount" in updateResult
      ? (updateResult.rowCount as number) || 0
      : 0;

  return {
    globalAvg,
    globalStdDev,
    reviewersProcessed: processedStats.length,
    applicationsUpdated,
    reviewerStats: processedStats,
    normalizedAt,
  };
}

export async function getReviewerAnalytics(): Promise<{
  reviewers: Array<{
    reviewerId: string;
    reviewerName: string;
    reviewCount: number;
    rawAvgRating: number;
    bias: number;
    stdDev: number;
    normalizedShift: number;
    reliabilityScore: number;
  }>;
  globalAvg: number;
  globalStdDev: number;
  harshestReviewer: { name: string; avg: number } | null;
  mostLenientReviewer: { name: string; avg: number } | null;
  avgBias: number;
  agreementRate: number;
}> {
  const { globalAvg, globalStdDev } = await getReviewerStats();

  // Get all reviewer stats with names
  const reviewerData = await db.execute(sql`
    SELECT 
      ar."reviewerId",
      u.name as "reviewerName",
      COUNT(ar.id)::integer as "reviewCount",
      ROUND(AVG(ar.rating)::numeric, 2) as "rawAvgRating",
      COALESCE(ROUND(STDDEV(ar.rating)::numeric, 2), 0) as "stdDev",
      ROUND(AVG(ar.adjusted_rating)::numeric, 2) as "adjustedAvg"
    FROM "applicationReview" ar
    INNER JOIN "user" u ON u.id = ar."reviewerId"
    GROUP BY ar."reviewerId", u.name
    HAVING COUNT(ar.id) >= ${MIN_REVIEWS_THRESHOLD}
    ORDER BY COUNT(ar.id) DESC
  `);

  const rows = ((reviewerData as unknown) as { rows: Array<{
    reviewerId: string;
    reviewerName: string;
    reviewCount: number;
    rawAvgRating: number;
    stdDev: number;
    adjustedAvg: number;
  }> }).rows || [];

  const reviewers = rows.map((row) => {
    const bias = Number(row.rawAvgRating) - globalAvg;
    const zScore = bias / (globalStdDev || 1);
    const reliabilityScore = Math.min(
      1.0,
      (row.reviewCount / MIN_REVIEWS_THRESHOLD) * (1 / (1 + Math.abs(zScore)))
    );
    const normalizedShift = row.adjustedAvg
      ? Number(row.adjustedAvg) - Number(row.rawAvgRating)
      : 0;

    return {
      reviewerId: row.reviewerId,
      reviewerName: row.reviewerName,
      reviewCount: row.reviewCount,
      rawAvgRating: Number(row.rawAvgRating),
      bias: Number(bias.toFixed(2)),
      stdDev: Number(row.stdDev),
      normalizedShift: Number(normalizedShift.toFixed(2)),
      reliabilityScore: Number(reliabilityScore.toFixed(2)),
    };
  });

  // Find harshest and most lenient
  const harshestReviewer =
    reviewers.length > 0
      ? reviewers.reduce((min, r) =>
          r.rawAvgRating < min.rawAvgRating ? r : min
        )
      : null;
  const mostLenientReviewer =
    reviewers.length > 0
      ? reviewers.reduce((max, r) =>
          r.rawAvgRating > max.rawAvgRating ? r : max
        )
      : null;

  // Calculate average bias
  const avgBias =
    reviewers.length > 0
      ? reviewers.reduce((sum, r) => sum + Math.abs(r.bias), 0) /
        reviewers.length
      : 0;

  // Calculate agreement rate (% of apps where rating spread <= 2)
  const agreementData = await db.execute(sql`
    SELECT 
      COUNT(CASE WHEN rating_spread <= 2 THEN 1 END)::float / 
      NULLIF(COUNT(*)::float, 0) * 100 as agreement_rate
    FROM (
      SELECT 
        "applicationId",
        MAX(rating) - MIN(rating) as rating_spread
      FROM "applicationReview"
      GROUP BY "applicationId"
      HAVING COUNT(*) >= 2
    ) spreads
  `);

  const agreementRate =
    (((agreementData as unknown) as { rows: Array<{ agreement_rate: number }> }).rows[0]
      ?.agreement_rate as number) || 0;

  return {
    reviewers,
    globalAvg,
    globalStdDev,
    harshestReviewer: harshestReviewer
      ? { name: harshestReviewer.reviewerName, avg: harshestReviewer.rawAvgRating }
      : null,
    mostLenientReviewer: mostLenientReviewer
      ? {
          name: mostLenientReviewer.reviewerName,
          avg: mostLenientReviewer.rawAvgRating,
        }
      : null,
    avgBias: Number(avgBias.toFixed(2)),
    agreementRate: Number(agreementRate.toFixed(1)),
  };
}
