import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { count, eq, getTableColumns } from "drizzle-orm";

import { db } from "@/lib/db";
import { challenges, challengesSubmitted } from "@/lib/db/schema";
import { AdminChallengeDataTable } from "@/components/challenges/AdminChallengeDataTable";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  const challengesData = await db
    .select({
      ...getTableColumns(challenges),
      currentCompletions: count(challengesSubmitted.id),
    })
    .from(challenges)
    .leftJoin(
      challengesSubmitted,
      eq(challenges.id, challengesSubmitted.challengeId),
    )
    .groupBy(challenges.id);

  // Drizzle count returns number, but sometimes it might be returned as string or parsed differently depending on driver.
  // Neon usually returns number. But let's map to make sure type matches.
  const formattedData = challengesData.map((c) => ({
    ...c,
    currentCompletions: Number(c.currentCompletions),
  }));

  return (
    <main className="container space-y-8 py-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage challenges and view stats.
        </p>
      </section>

      <section className="space-y-4">
        <AdminChallengeDataTable data={formattedData} />
      </section>
    </main>
  );
}
