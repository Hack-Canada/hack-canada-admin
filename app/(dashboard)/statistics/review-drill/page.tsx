import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import { db } from "@/lib/db";
import {
  hackerApplications,
  users,
  applicationReviews,
} from "@/lib/db/schema";
import { eq, sql, lt, and, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type ViewType = "progress" | "speed" | "agreement";

interface PageProps {
  searchParams: Promise<{
    view?: string;
    filter?: string;
  }>;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "N/A";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function getViewTitle(view: ViewType, filter: string): string {
  switch (view) {
    case "progress":
      return `Applications with ${filter} Review${filter === "1" ? "" : "s"}`;
    case "speed":
      return filter === "under10"
        ? "Reviews Under 10 Seconds"
        : "All Reviews by Duration";
    case "agreement":
      if (filter === "high") return "High Agreement Applications (spread ≤2)";
      if (filter === "moderate") return "Moderate Agreement Applications (spread 3-4)";
      return "Controversial Applications (spread 5+)";
    default:
      return "Review Drill-down";
  }
}

export default async function ReviewDrillPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const view = (params.view as ViewType) || "progress";
  const filter = params.filter || "0";

  let content: React.ReactNode = null;

  if (view === "progress") {
    const reviewCount = parseInt(filter, 10);
    if (isNaN(reviewCount) || reviewCount < 0 || reviewCount > 5) {
      content = <p className="text-muted-foreground">Invalid filter value</p>;
    } else {
      const applications = await db
        .select({
          userId: hackerApplications.userId,
          firstName: hackerApplications.firstName,
          lastName: hackerApplications.lastName,
          school: hackerApplications.school,
          reviewCount: hackerApplications.reviewCount,
          averageRating: hackerApplications.averageRating,
          status: users.applicationStatus,
        })
        .from(hackerApplications)
        .innerJoin(users, eq(users.id, hackerApplications.userId))
        .where(
          and(
            eq(hackerApplications.submissionStatus, "submitted"),
            eq(hackerApplications.reviewCount, reviewCount)
          )
        )
        .orderBy(sql`${hackerApplications.averageRating} DESC NULLS LAST`);

      content = (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Applicant</th>
                <th className="px-4 py-3 text-left font-medium">School</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Reviews</th>
                <th className="px-4 py-3 text-right font-medium">Avg Rating</th>
                <th className="px-4 py-3 text-center font-medium">View</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.userId} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">
                      {app.firstName} {app.lastName}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {app.school || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {app.reviewCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {app.averageRating !== null
                        ? (app.averageRating / 100).toFixed(2)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/applications/${app.userId}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }
  } else if (view === "speed") {
    const isUnder10 = filter === "under10";

    const reviews = await db
      .select({
        reviewId: applicationReviews.id,
        applicationId: applicationReviews.applicationId,
        reviewerId: applicationReviews.reviewerId,
        rating: applicationReviews.rating,
        duration: applicationReviews.reviewDuration,
        createdAt: applicationReviews.createdAt,
        applicantFirstName: hackerApplications.firstName,
        applicantLastName: hackerApplications.lastName,
        applicantUserId: hackerApplications.userId,
        reviewerName: users.name,
      })
      .from(applicationReviews)
      .innerJoin(
        hackerApplications,
        eq(hackerApplications.id, applicationReviews.applicationId)
      )
      .innerJoin(users, eq(users.id, applicationReviews.reviewerId))
      .where(
        isUnder10
          ? lt(applicationReviews.reviewDuration, 10)
          : sql`${applicationReviews.reviewDuration} IS NOT NULL`
      )
      .orderBy(sql`${applicationReviews.reviewDuration} ASC`)
      .limit(500);

    content = (
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Applicant</th>
              <th className="px-4 py-3 text-left font-medium">Reviewer</th>
              <th className="px-4 py-3 text-right font-medium">Rating</th>
              <th className="px-4 py-3 text-right font-medium">Duration</th>
              <th className="px-4 py-3 text-left font-medium">Reviewed At</th>
              <th className="px-4 py-3 text-center font-medium">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.reviewId} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">
                    {review.applicantFirstName} {review.applicantLastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {review.reviewerName}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {review.rating}/10
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatDuration(review.duration)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/applications/${review.applicantUserId}`}
                        className="text-primary hover:underline"
                        title="View Application"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/users/${review.reviewerId}`}
                        className="text-muted-foreground hover:text-foreground"
                        title="View Reviewer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {reviews.length === 500 && (
          <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
            Showing first 500 results
          </p>
        )}
      </div>
    );
  } else if (view === "agreement") {
    let spreadMin = 0;
    let spreadMax = 10;
    if (filter === "high") {
      spreadMin = 0;
      spreadMax = 2;
    } else if (filter === "moderate") {
      spreadMin = 3;
      spreadMax = 4;
    } else if (filter === "controversial") {
      spreadMin = 5;
      spreadMax = 10;
    }

    const applicationsWithSpread = await db
      .select({
        applicationId: applicationReviews.applicationId,
        spread: sql<number>`MAX(${applicationReviews.rating}) - MIN(${applicationReviews.rating})`,
        reviewCount: sql<number>`COUNT(*)`,
        avgRating: sql<number>`ROUND(AVG(${applicationReviews.rating})::numeric, 2)`,
      })
      .from(applicationReviews)
      .groupBy(applicationReviews.applicationId)
      .having(
        and(
          sql`COUNT(*) >= 2`,
          gte(sql`MAX(${applicationReviews.rating}) - MIN(${applicationReviews.rating})`, spreadMin),
          lte(sql`MAX(${applicationReviews.rating}) - MIN(${applicationReviews.rating})`, spreadMax)
        )
      );

    const applicationIds = applicationsWithSpread.map((a) => a.applicationId);

    let applications: {
      userId: string;
      firstName: string | null;
      lastName: string | null;
      school: string | null;
      status: string;
      spread: number;
      reviewCount: number;
      avgRating: number;
    }[] = [];

    if (applicationIds.length > 0) {
      const appDetails = await db
        .select({
          applicationId: hackerApplications.id,
          userId: hackerApplications.userId,
          firstName: hackerApplications.firstName,
          lastName: hackerApplications.lastName,
          school: hackerApplications.school,
          status: users.applicationStatus,
        })
        .from(hackerApplications)
        .innerJoin(users, eq(users.id, hackerApplications.userId))
        .where(sql`${hackerApplications.id} IN ${applicationIds}`);

      const spreadMap = new Map(
        applicationsWithSpread.map((a) => [
          a.applicationId,
          { spread: a.spread, reviewCount: a.reviewCount, avgRating: a.avgRating },
        ])
      );

      applications = appDetails
        .map((app) => {
          const spreadData = spreadMap.get(app.applicationId);
          return {
            userId: app.userId,
            firstName: app.firstName,
            lastName: app.lastName,
            school: app.school,
            status: app.status,
            spread: spreadData?.spread ?? 0,
            reviewCount: spreadData?.reviewCount ?? 0,
            avgRating: spreadData?.avgRating ?? 0,
          };
        })
        .sort((a, b) => b.spread - a.spread);
    }

    content = (
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Applicant</th>
              <th className="px-4 py-3 text-left font-medium">School</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Reviews</th>
              <th className="px-4 py-3 text-right font-medium">Avg Rating</th>
              <th className="px-4 py-3 text-right font-medium">Spread</th>
              <th className="px-4 py-3 text-center font-medium">View</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No applications found
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.userId} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">
                    {app.firstName} {app.lastName}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                    {app.school || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {app.reviewCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {app.avgRating}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        app.spread >= 5
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : app.spread >= 3
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {app.spread}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/applications/${app.userId}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  } else {
    content = <p className="text-muted-foreground">Invalid view type</p>;
  }

  return (
    <Container className="space-y-6 md:space-y-8">
      <PageBanner
        heading={getViewTitle(view, filter)}
        subheading="Drill-down view of review pipeline data"
        backButton
      />
      {content}
    </Container>
  );
}
