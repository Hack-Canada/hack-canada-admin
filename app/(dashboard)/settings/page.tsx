import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import SettingsPanel from "@/components/settings/SettingsPanel";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="Settings"
        subheading="Configure operational parameters for the admin portal. Changes here affect the review process and data display."
      />
      <SettingsPanel />
    </Container>
  );
}
