import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import CountCard from "@/components/CountCard";
import { getAllBanners, getBannerCounts } from "@/lib/db/queries/banner";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import BannerTable from "@/components/banners/BannerTable";

export const revalidate = 30;

export default async function BannersPage() {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  const [banners, counts] = await Promise.all([
    getAllBanners(),
    getBannerCounts(),
  ]);

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="Banner Management"
        subheading="Create and manage banners displayed to users on the hacker portal. Active banners are shown site-wide."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CountCard label="Total Banners" count={counts.total} />
        <CountCard label="Active" count={counts.active} />
        <CountCard label="Inactive" count={counts.inactive} />
        <CountCard label="Expired" count={counts.expired} />
      </div>

      <BannerTable banners={banners} />
    </Container>
  );
}
