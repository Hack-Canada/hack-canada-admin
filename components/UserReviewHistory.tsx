import { db } from "@/lib/db";
import { applicationReviews, hackerApplications, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type Props = {
  userId: string;
};

const UserReviewHistory = async ({ userId }: Props) => {
  const application = await db
    .select({ id: hackerApplications.id })
    .from(hackerApplications)
    .where(eq(hackerApplications.userId, userId))
    .limit(1);

  if (!application.length) {
    return null;
  }

  const reviews = await db
    .select({
      id: applicationReviews.id,
      rating: applicationReviews.rating,
      adjustedRating: applicationReviews.adjusted_rating,
      reviewDuration: applicationReviews.reviewDuration,
      createdAt: applicationReviews.createdAt,
      reviewerName: users.name,
      reviewerId: users.id,
    })
    .from(applicationReviews)
    .where(eq(applicationReviews.applicationId, application[0].id))
    .innerJoin(users, eq(users.id, applicationReviews.reviewerId))
    .orderBy(desc(applicationReviews.createdAt));

  if (!reviews.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No reviews have been submitted for this user&apos;s application.
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Application Reviews ({reviews.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Average rating: {avgRating.toFixed(1)}/10
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="space-y-1">
                <Link
                  href={`/users/${review.reviewerId}`}
                  className="flex items-center gap-1.5 font-medium transition-colors hover:text-primary"
                >
                  {review.reviewerName}
                  <ExternalLink strokeWidth={2.5} size={14} />
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDate(review.createdAt.toString())}
                  {review.reviewDuration
                    ? ` · ${review.reviewDuration}s`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                  {review.rating}/10
                </span>
                {review.adjustedRating !== null && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    adj: {review.adjustedRating}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserReviewHistory;
