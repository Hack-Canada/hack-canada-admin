import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import AcceptanceEmail from "@/components/Emails/AcceptanceEmail";
import RejectionEmail from "@/components/Emails/RejectionEmail";
import ReminderEmail from "@/components/Emails/ReminderEmail";
import OnboardingEmail from "@/components/Emails/OnboardingEmail";
import HackathonPrepEmail from "@/components/Emails/HackathonPrepEmail";
import RSVPReminder from "@/components/Emails/RSVPReminder";

const VALID_TEMPLATES = [
  "acceptance",
  "rejection",
  "reminder",
  "onboarding",
  "hackathon-prep",
  "rsvp-reminder",
] as const;

type TemplateId = (typeof VALID_TEMPLATES)[number];

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || !isAdmin(currentUser.role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const template = searchParams.get("template") as TemplateId | null;
  const name = searchParams.get("name") || "Alex Johnson";
  const userId = searchParams.get("userId") || "preview-id";

  if (!template || !VALID_TEMPLATES.includes(template)) {
    return new NextResponse("Invalid template", { status: 400 });
  }

  let html: string;

  switch (template) {
    case "acceptance":
      html = await render(AcceptanceEmail({ name }));
      break;
    case "rejection":
      html = await render(RejectionEmail({ name }));
      break;
    case "reminder":
      html = await render(ReminderEmail());
      break;
    case "onboarding":
      html = await render(OnboardingEmail({ name, userId }));
      break;
    case "hackathon-prep":
      html = await render(HackathonPrepEmail({ name, userId }));
      break;
    case "rsvp-reminder":
      html = await render(RSVPReminder({ name }));
      break;
    default:
      return new NextResponse("Invalid template", { status: 400 });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
