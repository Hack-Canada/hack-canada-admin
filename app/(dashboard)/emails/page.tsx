import { getCurrentUser } from "@/auth";
import Container from "@/components/Container";
import PageBanner from "@/components/PageBanner";
import { isAdmin } from "@/lib/utils";
import { redirect } from "next/navigation";
import EmailTemplateList from "@/components/Emails/EmailTemplateList";

export default async function EmailsPage() {
  const user = await getCurrentUser();

  if (!user?.id || !isAdmin(user.role)) {
    redirect("/");
  }

  return (
    <Container className="space-y-6 md:space-y-10">
      <PageBanner
        heading="Email Management"
        subheading="Preview email templates and send test emails. Use with caution — emails are sent via AWS SES."
      />
      <EmailTemplateList />
    </Container>
  );
}
