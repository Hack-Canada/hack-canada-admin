import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import PaginationControls from "@/components/PaginationControls";
import CountCard from "@/components/CountCard";
import {
  getCheckIns,
  getNumCheckIns,
  getCheckInEvents,
  getCheckInStats,
} from "@/data/check-ins";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import { RESULTS_PER_PAGE } from "@/lib/constants";
import CheckInTable from "@/components/check-ins/CheckInTable";
import CheckInFilters from "@/components/check-ins/CheckInFilters";

interface CheckInPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckInPage(props: CheckInPageProps) {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams["page"] ?? "1");
  const offset = (page - 1) * RESULTS_PER_PAGE;
  const name = searchParams["name"] as string | undefined;
  const eventName = searchParams["event"] as string | undefined;

  const filters = {
    name: name || undefined,
    eventName: eventName || undefined,
  };

  const [checkInList, totalCheckIns, events, stats] = await Promise.all([
    getCheckIns(offset, filters),
    getNumCheckIns(filters),
    getCheckInEvents(),
    getCheckInStats(),
  ]);

  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (eventName) params.set("event", eventName);

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="Check-In Management"
        subheading="View and track event check-ins for all attendees."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <CountCard label="Total Check-Ins" count={stats.total} />
        {stats.events.map((e) => (
          <CountCard key={e.eventName} label={e.eventName} count={e.count} />
        ))}
      </div>

      <CheckInFilters events={events} />

      <CheckInTable checkIns={checkInList} />

      {checkInList.length > 0 && (
        <PaginationControls
          totalNumOfUsers={totalCheckIns}
          search={params.toString()}
          table="/check-ins"
          className="mx-auto mt-8 max-w-lg rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md"
        />
      )}
    </Container>
  );
}
