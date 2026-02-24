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
});

const templateMap: Record<
  string,
  { subject: string; render: () => string | Promise<string> }
> = {
  acceptance: {
    subject:
      "[TEST] Congratulations, you have been accepted to Hack Canada",
    render: () => render(AcceptanceEmail({ name: "Test User" })),
  },
  rejection: {
    subject: "[TEST] Thank You for Your Application to Hack Canada",
    render: () => render(RejectionEmail({ name: "Test User" })),
  },
  reminder: {
    subject:
      "[TEST] We Noticed You Haven't Applied Yet – Don't Miss Out on Hack Canada!",
    render: () => render(ReminderEmail()),
  },
  onboarding: {
    subject: "[TEST] Welcome - Important Event Information",
    render: () =>
      render(OnboardingEmail({ name: "Test User", userId: "test-id" })),
  },
  "hackathon-prep": {
    subject: "[TEST] Hack Canada Event Details and Check-in Information",
    render: () =>
      render(HackathonPrepEmail({ name: "Test User", userId: "test-id" })),
  },
  "rsvp-reminder": {
    subject: "[TEST] Final RSVP Reminder - Please Respond for Hack Canada",
    render: () => render(RSVPReminder({ name: "Test User" })),
  },
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

    const { template, recipientEmail } = validatedFields.data;
    const templateConfig = templateMap[template];

    if (!templateConfig) {
      return NextResponse.json({
        success: false,
        message: "Invalid template.",
      });
    }

    const htmlBody = await templateConfig.render();
    const result = await sendEmail(
      recipientEmail,
      templateConfig.subject,
      htmlBody,
    );

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
