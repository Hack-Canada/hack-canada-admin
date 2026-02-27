import { getCurrentUser } from "@/auth";
import HackerPieChart from "@/components/Charts/HackerPieChart";
import LevelOfStudyData from "@/components/Charts/LevelOfStudy/LevelOfStudyData";
import ProgramData from "@/components/Charts/Program/ProgramData";
import RaceData from "@/components/Charts/Race/RaceData";
import ReviewPipelineStats from "@/components/Charts/ReviewPipeline/ReviewPipelineStats";
import SchoolData from "@/components/Charts/School/SchoolData";
import TShirtData from "@/components/Charts/TShirt/TShirtData";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import { db } from "@/lib/db";
import {
  hackerApplications,
  users,
  applicationReviews,
  rsvp,
} from "@/lib/db/schema";
import { count, eq, sql, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export const revalidate = 120;

const StatisticsPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("https://app.hackcanada.org");
  }

  const [
    [applications],
    [pendingApps],
    [acceptedApps],
    [rejectedApps],
    [waitlistedApps],
    [rsvpCount],
    topSchools,
    topMajors,
    ratingBySchool,
    levelVsAcceptance,
    reviewCoverage,
    rsvpRate,
    reviewProgressData,
    ratingHistogramData,
    [reviewSpeedData],
    reviewerAgreementData,
  ] = await Promise.all([
    db.select({ count: count() }).from(hackerApplications),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.applicationStatus, "pending")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.applicationStatus, "accepted")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.applicationStatus, "rejected")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.applicationStatus, "waitlisted")),
    db.select({ count: count() }).from(rsvp),
    db
      .select({
        school: hackerApplications.school,
        applicants: sql<number>`COUNT(${hackerApplications.userId})`,
      })
      .from(hackerApplications)
      .where(isNotNull(hackerApplications.school))
      .groupBy(hackerApplications.school)
      .orderBy(sql`COUNT(${hackerApplications.userId}) DESC`)
      .limit(1),
    db
      .select({
        major: hackerApplications.major,
        applicants: sql<number>`COUNT(${hackerApplications.userId})`,
      })
      .from(hackerApplications)
      .where(isNotNull(hackerApplications.major))
      .groupBy(hackerApplications.major)
      .orderBy(sql`COUNT(${hackerApplications.userId}) DESC`)
      .limit(1),
    db
      .select({
        school: hackerApplications.school,
        avgRating: sql<number>`ROUND(AVG(${hackerApplications.averageRating})::numeric / 100, 2)`,
        appCount: sql<number>`COUNT(${hackerApplications.userId})`,
      })
      .from(hackerApplications)
      .where(isNotNull(hackerApplications.averageRating))
      .groupBy(hackerApplications.school)
      .orderBy(sql`AVG(${hackerApplications.averageRating}) DESC`)
      .limit(5),
    db
      .select({
        level: hackerApplications.levelOfStudy,
        total: sql<number>`COUNT(${hackerApplications.userId})`,
        accepted: sql<number>`COUNT(CASE WHEN ${users.applicationStatus} = 'accepted' THEN 1 END)`,
      })
      .from(hackerApplications)
      .innerJoin(users, eq(hackerApplications.userId, users.id))
      .where(isNotNull(hackerApplications.levelOfStudy))
      .groupBy(hackerApplications.levelOfStudy)
      .orderBy(sql`COUNT(${hackerApplications.userId}) DESC`),
    db
      .select({
        total: sql<number>`COUNT(${hackerApplications.id})`,
        reviewed: sql<number>`COUNT(CASE WHEN ${hackerApplications.reviewCount} > 0 THEN 1 END)`,
        unreviewed: sql<number>`COUNT(CASE WHEN ${hackerApplications.reviewCount} = 0 THEN 1 END)`,
      })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted")),
    db
      .select({
        accepted: sql<number>`COUNT(DISTINCT ${users.id})`,
      })
      .from(users)
      .where(eq(users.applicationStatus, "accepted")),
    // Review progress distribution (how many apps have 0, 1, 2, ... 5 reviews)
    db
      .select({
        reviewCount: hackerApplications.reviewCount,
        count: sql<number>`COUNT(*)`,
      })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted"))
      .groupBy(hackerApplications.reviewCount)
      .orderBy(hackerApplications.reviewCount),
    // Rating histogram (distribution of individual review ratings 0-10)
    db
      .select({
        rating: applicationReviews.rating,
        count: sql<number>`COUNT(*)`,
      })
      .from(applicationReviews)
      .groupBy(applicationReviews.rating)
      .orderBy(applicationReviews.rating),
    // Review speed stats
    db
      .select({
        median: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${applicationReviews.reviewDuration})`,
        average: sql<number>`ROUND(AVG(${applicationReviews.reviewDuration})::numeric, 1)`,
        min: sql<number>`MIN(${applicationReviews.reviewDuration})`,
        max: sql<number>`MAX(${applicationReviews.reviewDuration})`,
        total: sql<number>`COUNT(*)`,
        speedClickers: sql<number>`COUNT(CASE WHEN ${applicationReviews.reviewDuration} < 10 THEN 1 END)`,
      })
      .from(applicationReviews)
      .where(isNotNull(applicationReviews.reviewDuration)),
    // Reviewer agreement (rating spread per application for apps with 2+ reviews)
    db
      .select({
        spread: sql<number>`MAX(${applicationReviews.rating}) - MIN(${applicationReviews.rating})`,
      })
      .from(applicationReviews)
      .groupBy(applicationReviews.applicationId)
      .having(sql`COUNT(*) >= 2`),
  ]);

  const applicationData = [
    {
      status: "pending",
      applicants: pendingApps.count,
      fill: "var(--color-pending)",
    },
    {
      status: "accepted",
      applicants: acceptedApps.count,
      fill: "var(--color-accepted)",
    },
    {
      status: "rejected",
      applicants: rejectedApps.count,
      fill: "var(--color-rejected)",
    },
    {
      status: "waitlisted",
      applicants: waitlistedApps.count,
      fill: "var(--color-waitlisted)",
    },
  ];

  const topSchool = topSchools[0];
  const topMajor = topMajors[0];
  const coverage = reviewCoverage[0];
  const coveragePct =
    coverage && coverage.total > 0
      ? ((coverage.reviewed / coverage.total) * 100).toFixed(1)
      : "0";
  const rsvpRateVal =
    rsvpRate[0] && rsvpRate[0].accepted > 0
      ? ((rsvpCount.count / rsvpRate[0].accepted) * 100).toFixed(1)
      : "0";

  return (
    <Container>
      <PageBanner
        heading="Statistics"
        subheading="Applicant demographics and cross-data insights."
        className="mb-6 md:mb-8"
      />

      <div className="flex flex-col gap-8">
        {/* Cross-Data Insights */}
        <section>
          <p className="mb-3 text-lg font-bold text-foreground md:text-xl">
            Insights
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Review Coverage */}
            <div className="rounded-lg border p-5">
              <p className="mb-2 text-sm font-semibold text-foreground">
                Review Coverage
              </p>
              {coverage && (
                <>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {coveragePct}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      of applications reviewed
                    </span>
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${coveragePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{coverage.reviewed} reviewed</span>
                    <span>{coverage.unreviewed} remaining</span>
                  </div>
                </>
              )}
            </div>

            {/* RSVP Conversion */}
            <div className="rounded-lg border p-5">
              <p className="mb-2 text-sm font-semibold text-foreground">
                RSVP Conversion
              </p>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {rsvpRateVal}%
                </span>
                <span className="text-xs text-muted-foreground">
                  of accepted applicants RSVP&apos;d
                </span>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${rsvpRateVal}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{rsvpCount.count} RSVPs</span>
                <span>{rsvpRate[0]?.accepted ?? 0} accepted</span>
              </div>
            </div>

            {/* Top School & Major summary */}
            <div className="rounded-lg border p-5">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Top Representations
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Top School</p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {topSchool?.school ?? "N/A"}
                  </p>
                  {topSchool && (
                    <p className="text-xs text-muted-foreground">
                      {topSchool.applicants} applicants (
                      {(
                        (topSchool.applicants / applications.count) *
                        100
                      ).toFixed(1)}
                      %)
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top Major</p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {topMajor?.major ?? "N/A"}
                  </p>
                  {topMajor && (
                    <p className="text-xs text-muted-foreground">
                      {topMajor.applicants} applicants (
                      {(
                        (topMajor.applicants / applications.count) *
                        100
                      ).toFixed(1)}
                      %)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Acceptance Rate by Level of Study */}
            <div className="rounded-lg border p-5 sm:col-span-2 lg:col-span-1">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Acceptance Rate by Study Level
              </p>
              <div className="space-y-2">
                {levelVsAcceptance.slice(0, 6).map(({ level, total, accepted }) => {
                  const rate =
                    total > 0 ? ((accepted / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="flex-1 truncate text-xs">
                        {level || "Not specified"}
                      </span>
                      <span className="text-xs font-medium tabular-nums">
                        {rate}%
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ({accepted}/{total})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Rated Schools */}
            <div className="rounded-lg border p-5 sm:col-span-2">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Highest Rated Schools (avg applicant rating)
              </p>
              <div className="space-y-2">
                {ratingBySchool.map(({ school, avgRating, appCount }, i) => (
                  <div
                    key={school}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-xs font-medium text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span className="truncate">
                        {school || "Not specified"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {appCount} apps
                      </span>
                      <span className="font-medium tabular-nums">
                        {avgRating}/10
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Review Pipeline */}
        <section>
          <p className="mb-3 text-lg font-bold text-foreground md:text-xl">
            Review Pipeline
          </p>
          <ReviewPipelineStats
            reviewProgress={reviewProgressData}
            ratingHistogram={ratingHistogramData}
            reviewSpeed={reviewSpeedData}
            reviewerAgreement={reviewerAgreementData}
          />
        </section>

        {/* Charts Grid */}
        <section>
          <p className="mb-3 text-lg font-bold text-foreground md:text-xl">
            Detailed Breakdowns
          </p>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-8 md:col-span-2">
              <SchoolData />
              <ProgramData />
              <LevelOfStudyData />
              <RaceData />
            </div>
            <div className="col-span-2 grid h-fit gap-8 md:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
              <HackerPieChart
                applicantsCount={applications.count}
                data={applicationData}
              />
              <TShirtData />
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
};

export default StatisticsPage;
