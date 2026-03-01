import { getCurrentUser } from "@/auth";
import { ApiResponse } from "@/types/api";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/utils";
import { sendEmail } from "@/lib/ses";
import AcceptanceEmail from "@/components/Emails/AcceptanceEmail";
import RejectionEmail from "@/components/Emails/RejectionEmail";
import ReminderEmail from "@/components/Emails/ReminderEmail";
import OnboardingEmail from "@/components/Emails/OnboardingEmail";
import HackathonPrepEmail from "@/components/Emails/HackathonPrepEmail";
import RSVPReminder from "@/components/Emails/RSVPReminder";
import { render } from "@react-email/render";

const sendTestEmailSchema = z.object({
  template: z.enum([
    "acceptance",
    "rejection",
    "reminder",
    "onboarding",
    "hackathon-prep",
    "rsvp-reminder",
  ]),
  recipientEmail: z.string().email(),
  name: z.string().optional().default("Alex Johnson"),
  userId: z.string().optional().default("preview-id"),
});

const PROD_SUBJECTS: Record<string, string> = {
  acceptance:
    "[ACTION REQUIRED] Congratulations, you have been accepted to Hack Canada",
  rejection: "Thank You for Your Application to Hack Canada",
  reminder:
    "We Noticed You Haven't Applied Yet – Don't Miss Out on Hack Canada!",
  onboarding: "🎉 Welcome to - Important Event Information",
  "hackathon-prep": "🚀 Hack Canada Event Details and Check-in Information",
  "rsvp-reminder":
    "🚨 Urgent: Final RSVP Reminder - Please Respond by Tonight for Hack Canada",
};

const renderTemplate = (
  template: string,
  name: string,
  userId: string,
): Promise<string> => {
  switch (template) {
    case "acceptance":
      return render(AcceptanceEmail({ name }));
    case "rejection":
      return render(RejectionEmail({ name }));
    case "reminder":
      return render(ReminderEmail());
    case "onboarding":
      return render(OnboardingEmail({ name, userId }));
    case "hackathon-prep":
      return render(HackathonPrepEmail({ name, userId }));
    case "rsvp-reminder":
      return render(RSVPReminder({ name }));
    default:
      throw new Error("Invalid template");
  }
};

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id || !isAdmin(currentUser.role)) {
      return NextResponse.json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    const body = await req.json();
    const validatedFields = sendTestEmailSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid data provided.",
      });
    }

    const { template, recipientEmail, name, userId } = validatedFields.data;
    const subject = PROD_SUBJECTS[template];

    if (!subject) {
      return NextResponse.json({
        success: false,
        message: "Invalid template.",
      });
    }

    const htmlBody = await renderTemplate(template, name, userId);
    const result = await sendEmail(recipientEmail, subject, htmlBody);

    if ("error" in result) {
      return NextResponse.json({
        success: false,
        message: result.error ?? "Failed to send email.",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Test email (${template}) sent to ${recipientEmail}.`,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to send test email.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
