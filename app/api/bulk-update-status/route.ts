import { getCurrentUser } from "@/auth";
import { ApiResponse } from "@/types/api";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { hackerApplications, users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, inArray, and } from "drizzle-orm";
import { sendAcceptanceEmail, sendRejectionEmail } from "@/lib/ses";
import { createAuditLog } from "@/lib/db/queries/audit-log";
import { isAdmin } from "@/lib/utils";

const bulkUpdateSchema = z.object({
  userIds: z.array(z.string()).min(1).max(100),
  status: z.enum(["accepted", "rejected", "waitlisted"]),
});

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
    const validatedFields = bulkUpdateSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json({
        success: false,
        message: "Invalid data provided.",
      });
    }

    const { userIds, status } = validatedFields.data;

    const eligibleUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        applicationStatus: users.applicationStatus,
      })
      .from(users)
      .where(
        and(
          inArray(users.id, userIds),
          inArray(users.applicationStatus, ["pending", "waitlisted"]),
        ),
      );

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No eligible users found for status update.",
      });
    }

    const eligibleIds = eligibleUsers.map((u) => u.id);
    let successCount = 0;
    let failCount = 0;

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          applicationStatus: status,
          acceptedAt: status === "accepted" ? new Date() : null,
        })
        .where(inArray(users.id, eligibleIds));

      await tx
        .update(hackerApplications)
        .set({ internalResult: status })
        .where(inArray(hackerApplications.userId, eligibleIds));

      await createAuditLog(
        {
          userId: currentUser.id || "unknown",
          action: "update",
          entityType: "bulk-status-update",
          entityId: eligibleIds.join(","),
          previousValue: { count: eligibleIds.length },
          newValue: { applicationStatus: status },
          metadata: {
            description: `Bulk ${status} ${eligibleIds.length} applications`,
            updatedBy: currentUser.email,
          },
        },
        tx,
      );
    });

    if (status === "accepted" || status === "rejected") {
      const sendEmail =
        status === "accepted" ? sendAcceptanceEmail : sendRejectionEmail;

      for (const user of eligibleUsers) {
        try {
          await sendEmail(user.name.split(" ")[0], user.email);
          successCount++;
        } catch {
          failCount++;
        }
      }
    } else {
      successCount = eligibleUsers.length;
    }

    return NextResponse.json({
      success: true,
      message: `Bulk update complete. ${successCount} updated successfully${failCount > 0 ? `, ${failCount} email(s) failed` : ""}.`,
      data: { successCount, failCount, total: eligibleUsers.length },
    });
  } catch (error) {
    console.error("Error in bulk status update:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to perform bulk update.",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
