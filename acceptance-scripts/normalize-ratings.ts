import { normalizeRatings as runNormalization } from "@/lib/normalization/normalize";

export async function normalizeRatings(): Promise<void> {
  console.log("Starting rating normalization process...");

  const result = await runNormalization();

  console.log(`Global average rating: ${result.globalAvg}`);
  console.log(`Global standard deviation: ${result.globalStdDev}`);

  for (const reviewer of result.reviewerStats) {
    console.log(
      `Reviewer ${reviewer.reviewerId}: Avg=${reviewer.avgRating}, Reviews=${reviewer.reviewCount}, Adjustment=${reviewer.adjustment.toFixed(2)}`
    );
  }

  console.log(
    `Rating normalization completed. Processed ${result.reviewersProcessed} reviewers, updated ${result.applicationsUpdated} applications.`
  );
}
