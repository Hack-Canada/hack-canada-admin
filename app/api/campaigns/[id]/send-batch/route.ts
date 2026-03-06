import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import {
  getCampaignById,
  updateCampaign,
  getPendingRecipientsBatch,
  updateRecipientStatus,
  incrementCampaignCounts,
  getCampaignRecipientCounts,
} from "@/lib/db/queries/campaign";
import { createAuditLog } from "@/lib/db/queries/audit-log";
import { sendEmail } from "@/lib/ses";
import { render } from "@react-email/render";
import AcceptanceEmail from "@/components/Emails/AcceptanceEmail";
import RejectionEmail from "@/components/Emails/RejectionEmail";
import ReminderEmail from "@/components/Emails/ReminderEmail";
import OnboardingEmail from "@/components/Emails/OnboardingEmail";
import HackathonPrepEmail from "@/components/Emails/HackathonPrepEmail";
import RSVPReminder from "@/components/Emails/RSVPReminder";

export const maxDuration = 60;

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

type BatchResult = {
  sent: number;
  failed: number;
  remaining: number;
  totalSent: number;
  totalFailed: number;
  isComplete: boolean;
};

const BATCH_SIZE = 200;
const DELAY_BETWEEN_EMAILS_MS = 150;
const TIME_LIMIT_MS = 50_000;

async function renderTemplate(
  templateId: string,
  name: string,
  userId: string,
  customHtml?: string | null,
): Promise<string> {
  if (templateId === "custom" && customHtml) {
    return customHtml;
  }

  switch (templateId) {
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
      throw new Error(`Unknown template: ${templateId}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<BatchResult>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: "Campaign not found" },
        { status: 404 },
      );
    }

    const validStartStatuses = ["approved", "sending", "paused"];
    if (!validStartStatuses.includes(campaign.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Campaign must be approved to send. Current status: ${campaign.status}`,
        },
        { status: 400 },
      );
    }

    if (campaign.status === "approved" || campaign.status === "paused") {
      const previousStatus = campaign.status;
      await updateCampaign(id, {
        status: "sending",
        ...(previousStatus === "approved" && { sentAt: new Date() }),
      });

      await createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "email_campaign",
        entityId: id,
        previousValue: { status: previousStatus },
        newValue: { status: "sending" },
        metadata: {
          description:
            previousStatus === "paused"
              ? `${user.name || user.email} resumed sending email campaign "${campaign.subject.slice(0, 50)}..."`
              : `${user.name || user.email} started sending email campaign "${campaign.subject.slice(0, 50)}..."`,
          action: previousStatus === "paused" ? "send_resumed" : "send_started",
        },
      });
    }

    const pendingRecipients = await getPendingRecipientsBatch(id, BATCH_SIZE);

    if (pendingRecipients.length === 0) {
      await updateCampaign(id, {
        status: "completed",
        completedAt: new Date(),
      });

      const counts = await getCampaignRecipientCounts(id);

      await createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "email_campaign",
        entityId: id,
        newValue: { status: "completed", completedAt: new Date() },
        metadata: {
          description: `Email campaign "${campaign.subject.slice(0, 50)}..." completed`,
          action: "send_completed",
          totalSent: counts.sent,
          totalFailed: counts.failed,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Campaign sending completed",
        data: {
          sent: 0,
          failed: 0,
          remaining: 0,
          totalSent: counts.sent,
          totalFailed: counts.failed,
          isComplete: true,
        },
      });
    }

    let batchSent = 0;
    let batchFailed = 0;
    const batchStartTime = Date.now();
    let timedOut = false;

    for (const recipient of pendingRecipients) {
      if (Date.now() - batchStartTime >= TIME_LIMIT_MS) {
        timedOut = true;
        break;
      }

      try {
        const firstName = recipient.name.split(" ")[0] || recipient.name;
        const html = await renderTemplate(
          campaign.templateId,
          firstName,
          recipient.userId,
          campaign.customHtml,
        );

        const result = await sendEmail(recipient.email, campaign.subject, html);

        if ("error" in result) {
          await updateRecipientStatus(recipient.id, "failed", result.error);
          batchFailed++;
        } else {
          await updateRecipientStatus(recipient.id, "sent");
          batchSent++;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        await updateRecipientStatus(recipient.id, "failed", errorMessage);
        batchFailed++;
      }

      if (Date.now() - batchStartTime >= TIME_LIMIT_MS) {
        timedOut = true;
        break;
      }

      await delay(DELAY_BETWEEN_EMAILS_MS);
    }

    if (batchSent > 0 || batchFailed > 0) {
      await incrementCampaignCounts(id, batchSent, batchFailed);
    }

    const counts = await getCampaignRecipientCounts(id);
    const isComplete = counts.pending === 0;

    if (isComplete) {
      await updateCampaign(id, {
        status: "completed",
        completedAt: new Date(),
      });

      await createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "email_campaign",
        entityId: id,
        newValue: { status: "completed", completedAt: new Date() },
        metadata: {
          description: `Email campaign "${campaign.subject.slice(0, 50)}..." completed`,
          action: "send_completed",
          totalSent: counts.sent,
          totalFailed: counts.failed,
        },
      });
    } else if (timedOut) {
      await updateCampaign(id, { status: "paused" });

      await createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "email_campaign",
        entityId: id,
        previousValue: { status: "sending" },
        newValue: { status: "paused" },
        metadata: {
          description: `Email campaign "${campaign.subject.slice(0, 50)}..." paused due to batch timeout`,
          action: "send_paused",
          batchSent,
          batchFailed,
          remaining: counts.pending,
        },
      });
    }

    const message = isComplete
      ? "Campaign sending completed"
      : timedOut
        ? `Batch timed out after ${batchSent + batchFailed} emails (${batchSent} sent, ${batchFailed} failed). Campaign paused - click Resume to continue.`
        : `Batch sent: ${batchSent} succeeded, ${batchFailed} failed`;

    return NextResponse.json({
      success: true,
      message,
      data: {
        sent: batchSent,
        failed: batchFailed,
        remaining: counts.pending,
        totalSent: counts.sent,
        totalFailed: counts.failed,
        isComplete,
      },
    });
  } catch (error) {
    console.error("Error sending batch:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while sending batch",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
