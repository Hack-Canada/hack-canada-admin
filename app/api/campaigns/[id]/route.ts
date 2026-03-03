import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { campaignUpdateSchema } from "@/lib/validations/campaign";
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignRecipients,
  deleteRecipientsForCampaign,
  queryUsersWithFilter,
  bulkInsertRecipients,
} from "@/lib/db/queries/campaign";
import { createAuditLog } from "@/lib/db/queries/audit-log";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<unknown>>> {
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

    const recipients = await getCampaignRecipients(id);

    return NextResponse.json({
      success: true,
      message: "Campaign fetched successfully",
      data: {
        ...campaign,
        recipients,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const existingCampaign = await getCampaignById(id);

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, message: "Campaign not found" },
        { status: 404 },
      );
    }

    if (existingCampaign.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          message: "Only draft campaigns can be edited",
        },
        { status: 400 },
      );
    }

    const body = await req.json();
    const validation = campaignUpdateSchema.safeParse(body);

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

    const { audienceFilter, ...updateData } = validation.data;

    let totalRecipients = existingCampaign.totalRecipients;

    if (audienceFilter) {
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

      await deleteRecipientsForCampaign(id);

      const recipients = matchingUsers.map((u) => ({
        campaignId: id,
        userId: u.id,
        email: u.email,
        name: u.name,
        status: "pending" as const,
      }));

      await bulkInsertRecipients(recipients);
      totalRecipients = matchingUsers.length;
    }

    const updated = await updateCampaign(id, {
      ...updateData,
      ...(audienceFilter && {
        audienceFilter: JSON.stringify(audienceFilter),
        totalRecipients,
      }),
    });

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update campaign",
        },
        { status: 500 },
      );
    }

    await createAuditLog({
      userId: user.id,
      action: "update",
      entityType: "email_campaign",
      entityId: id,
      previousValue: {
        templateId: existingCampaign.templateId,
        subject: existingCampaign.subject,
        totalRecipients: existingCampaign.totalRecipients,
      },
      newValue: {
        templateId: updated.templateId,
        subject: updated.subject,
        totalRecipients: updated.totalRecipients,
      },
      metadata: {
        description: `${user.name || user.email} updated email campaign "${updated.subject.slice(0, 50)}..."`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const existingCampaign = await getCampaignById(id);

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, message: "Campaign not found" },
        { status: 404 },
      );
    }

    if (
      existingCampaign.status === "sending" ||
      existingCampaign.status === "completed"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete a campaign that is sending or completed",
        },
        { status: 400 },
      );
    }

    await deleteCampaign(id);

    await createAuditLog({
      userId: user.id,
      action: "delete",
      entityType: "email_campaign",
      entityId: id,
      previousValue: {
        templateId: existingCampaign.templateId,
        subject: existingCampaign.subject,
        totalRecipients: existingCampaign.totalRecipients,
        status: existingCampaign.status,
      },
      metadata: {
        description: `${user.name || user.email} deleted email campaign "${existingCampaign.subject.slice(0, 50)}..."`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
