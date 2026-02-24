import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import CountCard from "@/components/CountCard";
import {
  getAllScheduleEvents,
  getNumScheduleEvents,
} from "@/lib/db/queries/schedule";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import ScheduleFilters from "@/components/schedule/ScheduleFilters";
import ScheduleViewToggle from "@/components/schedule/ScheduleViewToggle";

export const revalidate = 30;

interface SchedulePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SchedulePage(props: SchedulePageProps) {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const day = searchParams["day"] as string | undefined;
  const type = searchParams["type"] as string | undefined;
  const search = searchParams["search"] as string | undefined;

  const [events, totalCount] = await Promise.all([
    getAllScheduleEvents(),
    getNumScheduleEvents(),
  ]);

  const typeCounts = events.reduce(
    (acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  let filtered = events;

  if (day) {
    const dayMap: Record<string, number> = {
      friday: 5,
      saturday: 6,
      sunday: 0,
    };
    const dayNum = dayMap[day.toLowerCase()];
    if (dayNum !== undefined) {
      filtered = filtered.filter(
        (e) => new Date(e.startTime).getDay() === dayNum,
      );
    }
  }

  if (type) {
    filtered = filtered.filter((e) => e.type === type);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.eventName.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q),
    );
  }

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="Schedule Management"
        subheading="Create, edit, and delete schedule events. Changes are reflected on the hacker portal in real time."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <CountCard label="Total Events" count={totalCount} />
        <CountCard label="General" count={typeCounts["general"] || 0} />
        <CountCard label="Meals" count={typeCounts["meals"] || 0} />
        <CountCard label="Ceremonies" count={typeCounts["ceremonies"] || 0} />
        <CountCard label="Workshops" count={typeCounts["workshops"] || 0} />
        <CountCard label="Fun" count={typeCounts["fun"] || 0} />
      </div>

      <ScheduleFilters />

      <ScheduleViewToggle events={filtered} allEvents={events} />
    </Container>
  );
}
