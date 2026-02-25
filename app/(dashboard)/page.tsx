import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import { db } from "@/lib/db";
import {
  hackerApplications,
  applicationReviews,
  users,
  checkIns,
  rsvp,
} from "@/lib/db/schema";
import DashboardCharts from "@/components/DashboardCharts";
import { isReviewer } from "@/lib/utils";
import { count, eq, sql, gte, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";

export const revalidate = 60;

const Home = async () => {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/");
  }

  if (!isReviewer(user.role)) redirect("https://app.hackcanada.org");

  const [
    [dbUsers],
    [applicants],
    [hackers],
    [checkedIns],
    [accepted],
    [rejected],
    [pendingApplications],
    [waitlisted],
    [cancelled],
    [admins],
    [organizers],
    [mentorsCount],
    [volunteersCount],
    [totalReviews],
    [avgRating],
    [avgReviewCount],
    [avgReviewDuration],
    [rsvpCount],
    [uniqueSchools],
    [uniqueCountries],
    topSchoolResult,
    genderBreakdown,
    countryBreakdown,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db
      .select({ count: count() })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted")),
    db.select({ count: count() }).from(users).where(eq(users.role, "hacker")),
    db
      .select({ count: count() })
      .from(checkIns)
      .where(eq(checkIns.eventName, "hackathon-check-in")),
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
      .where(eq(users.applicationStatus, "pending")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.applicationStatus, "waitlisted")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.applicationStatus, "cancelled")),
    db.select({ count: count() }).from(users).where(eq(users.role, "admin")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "organizer")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "mentor")),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "volunteer")),
    db.select({ count: count() }).from(applicationReviews),
    db
      .select({
        avg: sql<number>`ROUND(AVG(${applicationReviews.rating})::numeric, 2)`,
      })
      .from(applicationReviews)
      .where(isNotNull(applicationReviews.rating)),
    db
      .select({
        avg: sql<number>`ROUND(AVG(${hackerApplications.reviewCount})::numeric, 2)`,
      })
      .from(hackerApplications)
      .where(eq(hackerApplications.submissionStatus, "submitted")),
    db
      .select({
        avg: sql<number>`ROUND(AVG(${applicationReviews.reviewDuration})::numeric, 2)`,
      })
      .from(applicationReviews)
      .where(isNotNull(applicationReviews.reviewDuration)),
    db.select({ count: count() }).from(rsvp),
    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${hackerApplications.school})`,
      })
      .from(hackerApplications)
      .where(isNotNull(hackerApplications.school)),
    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${hackerApplications.country})`,
      })
      .from(hackerApplications)
      .where(isNotNull(hackerApplications.country)),
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
        gender: hackerApplications.gender,
        applicants: sql<number>`COUNT(${hackerApplications.userId})`,
      })
      .from(hackerApplications)
      .where(isNotNull(hackerApplications.gender))
      .groupBy(hackerApplications.gender)
      .orderBy(sql`COUNT(${hackerApplications.userId}) DESC`),
    db
      .select({
        country: hackerApplications.country,
        applicants: sql<number>`COUNT(${hackerApplications.userId})`,
      })
      .from(hackerApplications)
      .where(isNotNull(hackerApplications.country))
      .groupBy(hackerApplications.country)
      .orderBy(sql`COUNT(${hackerApplications.userId}) DESC`)
      .limit(5),
  ]);

  const volunteers = volunteersCount.count;
  const mentors = mentorsCount.count;
  const topSchool = topSchoolResult[0];

  const acceptanceRate =
    applicants.count > 0
      ? ((accepted.count / applicants.count) * 100).toFixed(1)
      : "0";

  const statusData = [
    { status: "pending", count: pendingApplications.count },
    { status: "accepted", count: accepted.count },
    { status: "rejected", count: rejected.count },
    { status: "waitlisted", count: waitlisted.count },
    { status: "cancelled", count: cancelled.count },
  ];

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const reviewTrendRaw = await db
    .select({
      date: sql<string>`TO_CHAR(${applicationReviews.createdAt}, 'MM/DD')`,
      count: count(),
    })
    .from(applicationReviews)
    .where(gte(applicationReviews.createdAt, fourteenDaysAgo))
    .groupBy(
      sql`TO_CHAR(${applicationReviews.createdAt}, 'MM/DD')`,
      sql`DATE(${applicationReviews.createdAt})`,
    )
    .orderBy(sql`DATE(${applicationReviews.createdAt})`);

  const reviewTrend = reviewTrendRaw.map((r) => ({
    date: r.date,
    count: r.count,
  }));

  return (
    <Container>
      <PageBanner
        heading="Overview"
        className="mb-6 md:mb-8"
        subheading="Welcome to the official dashboard of Hack Canada. Below is a quick overview of our hackathon's statistics so far."
      />

      <div className="flex flex-col gap-8">
        {/* Users & Roles */}
        <section>
          <p className="mb-3 text-lg font-bold text-foreground md:text-xl">
            Users
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <InsightCard label="Total Users" value={dbUsers.count} />
            <InsightCard label="Hackers" value={hackers.count} />
            <InsightCard label="Admins" value={admins.count} />
            <InsightCard label="Organizers" value={organizers.count} />
            <InsightCard label="Mentors" value={mentors} />
            <InsightCard label="Volunteers" value={volunteers} />
            <InsightCard label="Checked In" value={checkedIns.count} />
            <InsightCard label="RSVPs" value={rsvpCount.count} />
          </div>
        </section>

        {/* Applications */}
        <section>
          <p className="mb-3 text-lg font-bold text-foreground md:text-xl">
            Applications
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <InsightCard label="Submitted" value={applicants.count} />
            <InsightCard label="Accepted" value={accepted.count} />
            <InsightCard label="Rejected" value={rejected.count} />
            <InsightCard label="Pending" value={pendingApplications.count} />
            <InsightCard label="Waitlisted" value={waitlisted.count} />
            <InsightCard label="Cancelled" value={cancelled.count} />
            <InsightCard label="Acceptance Rate" value={`${acceptanceRate}%`} />
            <InsightCard label="Unique Schools" value={uniqueSchools.count} />
            <InsightCard label="Countries" value={uniqueCountries.count} />
            <InsightCard
              label="Top School"
              value={topSchool?.school ?? "N/A"}
              subtitle={
                topSchool ? `${topSchool.applicants} applicants` : undefined
              }
              isText
            />
          </div>
        </section>

        {/* Review Statistics */}
        <section>
          <p className="mb-3 text-lg font-bold text-foreground md:text-xl">
            Reviews
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <InsightCard label="Total Reviews" value={totalReviews.count} />
            <InsightCard label="Avg Rating" value={avgRating.avg ?? "N/A"} />
            <InsightCard
              label="Avg Reviews / App"
              value={avgReviewCount.avg ?? "N/A"}
            />
            <InsightCard
              label="Avg Time / Review (s)"
              value={avgReviewDuration.avg ?? "N/A"}
            />
          </div>
        </section>

        {/* Demographics at a Glance */}
        <section>
          <p className="mb-3 text-lg font-bold text-foreground md:text-xl">
            Demographics
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-5">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Gender Breakdown
              </p>
              <div className="space-y-2">
                {genderBreakdown.map(({ gender, applicants: gCount }) => {
                  const pct =
                    applicants.count > 0
                      ? ((gCount / applicants.count) * 100).toFixed(1)
                      : "0";
                  return (
                    <div key={gender} className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-24 truncate text-xs">
                        {gender || "Not specified"}
                      </span>
                      <span className="w-16 text-right text-xs font-medium tabular-nums">
                        {gCount} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border p-5">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Top Countries
              </p>
              <div className="space-y-2">
                {countryBreakdown.map(
                  ({ country, applicants: cCount }, i) => (
                    <div
                      key={country}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {i + 1}.
                        </span>
                        <span className="truncate">
                          {country || "Not specified"}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {cCount}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section>
          <p className="mb-3 text-lg font-bold text-foreground md:text-xl">
            Charts
          </p>
          <DashboardCharts statusData={statusData} reviewTrend={reviewTrend} />
        </section>
      </div>
    </Container>
  );
};

function InsightCard({
  label,
  value,
  subtitle,
  isText,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-lg border py-5 text-center">
      <p className="text-xs font-semibold text-muted-foreground md:text-sm">
        {label}
      </p>
      <p
        className={
          isText
            ? "mt-1 truncate px-3 text-sm font-bold text-foreground md:text-base"
            : "mt-1 text-xl font-bold text-foreground md:text-2xl xl:text-3xl"
        }
        title={String(value)}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export default Home;
