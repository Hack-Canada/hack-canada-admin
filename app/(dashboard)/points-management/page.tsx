import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import PointsManagementTabs from "@/components/points-management/PointsManagementTabs";

export default async function PointsManagementPage() {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="Points Management"
        subheading="Manage user points, view transactions, and handle banned users."
      />
      <PointsManagementTabs />
    </Container>
  );
}
