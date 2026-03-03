import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import { EmailDashboard } from "@/components/campaigns/EmailDashboard";

export default async function EmailsPage() {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="Email Campaign Dashboard"
        subheading="Create and manage email campaigns with dual-admin approval. Preview templates, send test emails, and track delivery progress."
      />
      <EmailDashboard currentUserId={user.id} />
    </Container>
  );
}
