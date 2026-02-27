import { getCurrentUser } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils";
import {
  hackerApplications,
  users,
  applicationReviews,
} from "@/lib/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import AdminApplicationList from "@/components/review/AdminApplicationList";
import PaginationControls from "@/components/PaginationControls";
import { RESULTS_PER_PAGE } from "@/lib/constants";
import {
  CONFIDENCE_WEIGHTS,
  MAX_REVIEWS_FOR_CONFIDENCE,
} from "@/lib/normalization/config";

interface AdminApplicationsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminApplicationsPage(
  props: AdminApplicationsPageProps
) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  const page = Number(searchParams["page"] ?? "1");
  const perPage = Number(searchParams["perPage"] ?? RESULTS_PER_PAGE);
  const start = (page - 1) * perPage;
  const sortField =
    (searchParams["sort"] as
      | "reviewCount"
      | "averageRating"
      | "normalizedAvgRating"
      | "confidence"
      | "internalResult") ?? "reviewCount";
  const sortOrder = (searchParams["order"] as "asc" | "desc") ?? "desc";

  const params = new URLSearchParams();
  params.set("sort", sortField);
  params.set("order", sortOrder);

  // Get last normalized timestamp
  const lastNormalizedResult = await db
    .select({
      lastNormalizedAt: sql<Date | null>`MAX(${hackerApplications.lastNormalizedAt})`,
    })
    .from(hackerApplications)
    .execute();
  const lastNormalizedAt = lastNormalizedResult[0]?.lastNormalizedAt || null;

  const [totalApplications, applications, statusCounts] = await Promise.all([
    db
      .select({ count: count() })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted"))
      .then((result) => result[0].count),
    db
      .select({
        id: hackerApplications.id,
        firstName: hackerApplications.firstName,
        lastName: hackerApplications.lastName,
        email: hackerApplications.email,
        reviewCount: hackerApplications.reviewCount,
        averageRating: hackerApplications.averageRating,
        normalizedAvgRating: hackerApplications.normalizedAvgRating,
        internalResult: hackerApplications.internalResult,
        userId: hackerApplications.userId,
        lastNormalizedAt: hackerApplications.lastNormalizedAt,
        // Calculate confidence score via subquery
        confidence: sql<number>`
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
        `,
      })
      .from(hackerApplications)
      .innerJoin(users, eq(users.id, hackerApplications.userId))
      .where(eq(hackerApplications.submissionStatus, "submitted"))
      .orderBy(
        (() => {
          switch (sortField) {
            case "reviewCount":
              return sortOrder === "asc"
                ? hackerApplications.reviewCount
                : desc(hackerApplications.reviewCount);
            case "averageRating":
              return sortOrder === "asc"
                ? hackerApplications.averageRating
                : desc(hackerApplications.averageRating);
            case "normalizedAvgRating":
              return sortOrder === "asc"
                ? hackerApplications.normalizedAvgRating
                : desc(hackerApplications.normalizedAvgRating);
            case "confidence": {
              const confidenceExpr = sql`COALESCE((
                SELECT ROUND((
                  (LEAST(COUNT(*)::float / ${MAX_REVIEWS_FOR_CONFIDENCE}, 1.0) * ${CONFIDENCE_WEIGHTS.reviewCount}) +
                  (GREATEST(1.0 - (COALESCE(STDDEV(rating), 0)::float / 5.0), 0.0) * ${CONFIDENCE_WEIGHTS.agreement}) +
                  (0.7 * ${CONFIDENCE_WEIGHTS.reliability})
                ) * 100)::integer
                FROM "applicationReview" ar
                WHERE ar."applicationId" = ${hackerApplications.id}
              ), 0)`;
              return sortOrder === "asc"
                ? sql`${confidenceExpr} ASC`
                : sql`${confidenceExpr} DESC`;
            }
            case "internalResult":
              return sortOrder === "asc"
                ? hackerApplications.internalResult
                : desc(hackerApplications.internalResult);
            default:
              return desc(hackerApplications.createdAt);
          }
        })()
      )
      .limit(perPage)
      .offset(start),
    // Fetch status counts for the summary bar
    db
      .select({
        status: hackerApplications.internalResult,
        count: count(),
      })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted"))
      .groupBy(hackerApplications.internalResult)
      .then((results) => {
        const counts = {
          pending: 0,
          accepted: 0,
          rejected: 0,
          waitlisted: 0,
        };
        for (const row of results) {
          const status = row.status as keyof typeof counts;
          if (status in counts) {
            counts[status] = row.count;
          }
        }
        return counts;
      }),
  ]);

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        backButton
        heading="Review Applications"
        subheading="Review and manage submitted hacker applications. View internal results and update application statuses."
      />

      <div className="space-y-4 md:space-y-6">
        {applications.length > 0 && (
          <p className="text-sm font-medium text-muted-foreground max-md:text-center">
            Displaying users {start + 1} - {start + applications.length} from{" "}
            <span className="text-foreground">{totalApplications}</span> users
          </p>
        )}

        <div className="space-y-6">
          {applications.length > 0 ? (
            <>
              <AdminApplicationList
                applications={applications}
                lastNormalizedAt={lastNormalizedAt}
                statusCounts={statusCounts}
              />
              <PaginationControls
                totalNumOfUsers={totalApplications}
                table="decisions"
                search={params.toString()}
                className="mx-auto mt-8 max-w-lg rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md"
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No applications have been submitted yet.
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}
