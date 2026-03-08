import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import ShopManagement from "@/components/shop/ShopManagement";

export default async function ShopPage() {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="Shop Management"
        subheading="Manage shop items, stock levels, and pricing for the points shop."
      />
      <ShopManagement />
    </Container>
  );
}
