import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import PaginationControls from "@/components/PaginationControls";
import CountCard from "@/components/CountCard";
import { getRsvps, getNumRsvps, getRsvpStats } from "@/data/rsvps";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import { RESULTS_PER_PAGE } from "@/lib/constants";
import RsvpTable from "@/components/rsvp/RsvpTable";
import RsvpFilters from "@/components/rsvp/RsvpFilters";
import DietaryInsights from "@/components/rsvp/DietaryInsights";

interface RsvpPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RsvpPage(props: RsvpPageProps) {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams["page"] ?? "1");
  const offset = (page - 1) * RESULTS_PER_PAGE;
  const name = searchParams["name"] as string | undefined;
  const diet = searchParams["diet"] as string | undefined;
  const tshirt = searchParams["tshirt"] as string | undefined;

  const filters = {
    name: name || undefined,
    dietaryRestrictions: diet || undefined,
    tshirtSize: tshirt || undefined,
  };

  const [rsvps, totalRsvps, stats] = await Promise.all([
    getRsvps(offset, filters),
    getNumRsvps(filters),
    getRsvpStats(),
  ]);

  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (diet) params.set("diet", diet);
  if (tshirt) params.set("tshirt", tshirt);

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="RSVP Management"
        subheading="View and manage hackathon RSVPs, dietary restrictions, and t-shirt sizes."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <CountCard label="Total RSVPs" count={stats.total} />
        {stats.tshirtSizes.map((s) => (
          <CountCard key={s.size} label={`Size ${s.size}`} count={s.count} />
        ))}
      </div>

      <DietaryInsights
        dietaryCounts={stats.dietaryCounts}
        total={stats.total}
      />

      <RsvpFilters />

      <RsvpTable rsvps={rsvps} />

      {rsvps.length > 0 && (
        <PaginationControls
          totalNumOfUsers={totalRsvps}
          search={params.toString()}
          table="/rsvps"
          className="mx-auto mt-8 max-w-lg rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md"
        />
      )}
    </Container>
  );
}
