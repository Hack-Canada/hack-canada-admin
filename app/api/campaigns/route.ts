import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { campaignCreateSchema } from "@/lib/validations/campaign";
import {
  getAllCampaigns,
  getAllCampaignRecipientCounts,
  createCampaign,
  queryUsersWithFilter,
  bulkInsertRecipients,
} from "@/lib/db/queries/campaign";
import { createAuditLog } from "@/lib/db/queries/audit-log";
import type { EmailCampaign } from "@/lib/db/schema";

type CampaignWithCreator = EmailCampaign & {
  createdBy: { id: string; name: string; email: string } | null;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

export async function GET(): Promise<
  NextResponse<ApiResponse<CampaignWithCreator[]>>
> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const [campaigns, realCounts] = await Promise.all([
      getAllCampaigns(),
      getAllCampaignRecipientCounts(),
    ]);

    const enrichedCampaigns = campaigns.map((c) => ({
      ...c,
      sentCount: realCounts[c.id]?.sent ?? 0,
      failedCount: realCounts[c.id]?.failed ?? 0,
    }));

    return NextResponse.json({
      success: true,
      message: "Campaigns fetched successfully",
      data: enrichedCampaigns,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<EmailCampaign>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = campaignCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          error: validation.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }

    const { templateId, subject, customHtml, audienceFilter } = validation.data;

    const matchingUsers = await queryUsersWithFilter(audienceFilter);

    if (matchingUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No recipients match the selected criteria",
        },
        { status: 400 },
      );
    }

    const campaign = await createCampaign({
      templateId,
      subject,
      customHtml: customHtml ?? null,
      audienceFilter: JSON.stringify(audienceFilter),
      totalRecipients: matchingUsers.length,
      status: "draft",
      createdById: user.id,
    });

    const recipients = matchingUsers.map((u) => ({
      campaignId: campaign.id,
      userId: u.id,
      email: u.email,
      name: u.name,
      status: "pending" as const,
    }));

    await bulkInsertRecipients(recipients);

    await createAuditLog({
      userId: user.id,
      action: "create",
      entityType: "email_campaign",
      entityId: campaign.id,
      newValue: {
        templateId,
        subject,
        totalRecipients: matchingUsers.length,
        audienceFilter,
      },
      metadata: {
        description: `${user.name || user.email} created email campaign "${subject.slice(0, 50)}${subject.length > 50 ? "..." : ""}" with ${matchingUsers.length} recipients`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign created successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
