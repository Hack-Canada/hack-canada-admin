import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import { isAdmin } from "@/lib/utils";
import { approvalActionSchema } from "@/lib/validations/campaign";
import { getCampaignById, updateCampaign } from "@/lib/db/queries/campaign";
import { createAuditLog } from "@/lib/db/queries/audit-log";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

export async function POST(
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
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: "Campaign not found" },
        { status: 404 },
      );
    }

    if (campaign.status !== "pending_approval") {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign is not pending approval",
        },
        { status: 400 },
      );
    }

    if (campaign.createdById === user.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot approve your own campaign. Another admin must approve it.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = approvalActionSchema.safeParse(body);

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

    const { action, reason } = validation.data;

    if (action === "approve") {
      const updated = await updateCampaign(id, {
        status: "approved",
        approvedById: user.id,
        approvedAt: new Date(),
      });

      if (!updated) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to approve campaign",
          },
          { status: 500 },
        );
      }

      await createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "email_campaign",
        entityId: id,
        previousValue: { status: "pending_approval" },
        newValue: {
          status: "approved",
          approvedById: user.id,
          approvedAt: new Date(),
        },
        metadata: {
          description: `${user.name || user.email} approved email campaign "${campaign.subject.slice(0, 50)}..."`,
          action: "approval",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Campaign approved successfully",
        data: updated,
      });
    } else {
      const updated = await updateCampaign(id, {
        status: "draft",
      });

      if (!updated) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to reject campaign",
          },
          { status: 500 },
        );
      }

      await createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "email_campaign",
        entityId: id,
        previousValue: { status: "pending_approval" },
        newValue: { status: "draft" },
        metadata: {
          description: `${user.name || user.email} rejected email campaign "${campaign.subject.slice(0, 50)}..."`,
          action: "rejection",
          reason: reason || "No reason provided",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Campaign rejected and returned to draft",
        data: updated,
      });
    }
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
