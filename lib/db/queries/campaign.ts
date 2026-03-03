import {
  eq,
  desc,
  sql,
  and,
  or,
  isNull,
  isNotNull,
  ilike,
  inArray,
  count,
} from "drizzle-orm";
import { db } from "..";
import {
  emailCampaigns,
  emailCampaignRecipients,
  users,
  hackerApplications,
  type NewEmailCampaign,
  type NewEmailCampaignRecipient,
  type EmailCampaign,
} from "../schema";

export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sending"
  | "completed"
  | "failed";

export type RecipientStatus = "pending" | "sent" | "failed";

export type AudienceFilter = {
  preset?: string;
  applicationStatus?: string[];
  hasRsvp?: "yes" | "no" | "any";
  school?: string;
  levelOfStudy?: string;
  roles?: string[];
  searchQuery?: string;
};

export async function getAllCampaigns() {
  const campaigns = await db
    .select({
      campaign: emailCampaigns,
      createdBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(emailCampaigns)
    .leftJoin(users, eq(emailCampaigns.createdById, users.id))
    .orderBy(desc(emailCampaigns.createdAt));

  return campaigns.map((c) => ({
    ...c.campaign,
    createdBy: c.createdBy,
  }));
}

export async function getCampaignById(id: string) {
  const [result] = await db
    .select({
      campaign: emailCampaigns,
      createdBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(emailCampaigns)
    .leftJoin(users, eq(emailCampaigns.createdById, users.id))
    .where(eq(emailCampaigns.id, id));

  if (!result) return null;

  let approvedBy = null;
  if (result.campaign.approvedById) {
    const [approver] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, result.campaign.approvedById));
    approvedBy = approver ?? null;
  }

  return {
    ...result.campaign,
    createdBy: result.createdBy,
    approvedBy,
  };
}

export async function createCampaign(
  data: Omit<NewEmailCampaign, "id" | "createdAt" | "updatedAt">,
) {
  const [created] = await db.insert(emailCampaigns).values(data).returning();
  return created;
}

export async function updateCampaign(
  id: string,
  data: Partial<Omit<NewEmailCampaign, "id" | "createdAt">>,
) {
  const [updated] = await db
    .update(emailCampaigns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(emailCampaigns.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteCampaign(id: string) {
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  return true;
}

export async function getCampaignRecipients(campaignId: string) {
  return await db
    .select()
    .from(emailCampaignRecipients)
    .where(eq(emailCampaignRecipients.campaignId, campaignId))
    .orderBy(emailCampaignRecipients.name);
}

export async function getCampaignRecipientCounts(campaignId: string) {
  const [result] = await db
    .select({
      total: count(),
      pending: sql<number>`count(*) filter (where ${emailCampaignRecipients.status} = 'pending')`,
      sent: sql<number>`count(*) filter (where ${emailCampaignRecipients.status} = 'sent')`,
      failed: sql<number>`count(*) filter (where ${emailCampaignRecipients.status} = 'failed')`,
    })
    .from(emailCampaignRecipients)
    .where(eq(emailCampaignRecipients.campaignId, campaignId));

  return {
    total: Number(result.total),
    pending: Number(result.pending),
    sent: Number(result.sent),
    failed: Number(result.failed),
  };
}

export async function getPendingRecipientsBatch(
  campaignId: string,
  limit: number = 200,
) {
  return await db
    .select()
    .from(emailCampaignRecipients)
    .where(
      and(
        eq(emailCampaignRecipients.campaignId, campaignId),
        eq(emailCampaignRecipients.status, "pending"),
      ),
    )
    .limit(limit);
}

export async function updateRecipientStatus(
  recipientId: string,
  status: RecipientStatus,
  error?: string,
) {
  const [updated] = await db
    .update(emailCampaignRecipients)
    .set({
      status,
      sentAt: status === "sent" ? new Date() : null,
      error: error ?? null,
    })
    .where(eq(emailCampaignRecipients.id, recipientId))
    .returning();
  return updated ?? null;
}

export async function bulkInsertRecipients(
  recipients: Omit<NewEmailCampaignRecipient, "id">[],
) {
  if (recipients.length === 0) return [];
  return await db.insert(emailCampaignRecipients).values(recipients).returning();
}

export async function deleteRecipientsForCampaign(campaignId: string) {
  await db
    .delete(emailCampaignRecipients)
    .where(eq(emailCampaignRecipients.campaignId, campaignId));
}

export async function queryUsersWithFilter(filter: AudienceFilter) {
  const conditions: ReturnType<typeof eq>[] = [];

  if (filter.applicationStatus && filter.applicationStatus.length > 0) {
    conditions.push(inArray(users.applicationStatus, filter.applicationStatus));
  }

  if (filter.hasRsvp === "yes") {
    conditions.push(isNotNull(users.rsvpAt));
  } else if (filter.hasRsvp === "no") {
    conditions.push(isNull(users.rsvpAt));
  }

  if (filter.roles && filter.roles.length > 0) {
    conditions.push(inArray(users.role, filter.roles));
  }

  if (filter.searchQuery) {
    conditions.push(
      or(
        ilike(users.name, `%${filter.searchQuery}%`),
        ilike(users.email, `%${filter.searchQuery}%`),
      )!,
    );
  }

  const needsJoin = filter.school || filter.levelOfStudy;

  if (needsJoin) {
    if (filter.school) {
      conditions.push(ilike(hackerApplications.school, `%${filter.school}%`));
    }
    if (filter.levelOfStudy) {
      conditions.push(eq(hackerApplications.levelOfStudy, filter.levelOfStudy));
    }

    const query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        applicationStatus: users.applicationStatus,
        rsvpAt: users.rsvpAt,
        role: users.role,
      })
      .from(users)
      .leftJoin(hackerApplications, eq(users.id, hackerApplications.userId));

    if (conditions.length === 0) {
      return await query.orderBy(users.name);
    }

    return await query.where(and(...conditions)).orderBy(users.name);
  }

  const query = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      applicationStatus: users.applicationStatus,
      rsvpAt: users.rsvpAt,
      role: users.role,
    })
    .from(users);

  if (conditions.length === 0) {
    return await query.orderBy(users.name);
  }

  return await query.where(and(...conditions)).orderBy(users.name);
}

export async function countUsersWithFilter(filter: AudienceFilter) {
  const matchingUsers = await queryUsersWithFilter(filter);
  return matchingUsers.length;
}

export async function getCampaignsByStatus(status: CampaignStatus) {
  return await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.status, status))
    .orderBy(desc(emailCampaigns.createdAt));
}

export async function getPendingApprovalCampaigns() {
  return getCampaignsByStatus("pending_approval");
}

export async function incrementCampaignCounts(
  campaignId: string,
  sentIncrement: number,
  failedIncrement: number,
) {
  const [updated] = await db
    .update(emailCampaigns)
    .set({
      sentCount: sql`${emailCampaigns.sentCount} + ${sentIncrement}`,
      failedCount: sql`${emailCampaigns.failedCount} + ${failedIncrement}`,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaigns.id, campaignId))
    .returning();
  return updated ?? null;
}

export async function getCampaignStats() {
  const [result] = await db
    .select({
      total: count(),
      draft: sql<number>`count(*) filter (where ${emailCampaigns.status} = 'draft')`,
      pendingApproval: sql<number>`count(*) filter (where ${emailCampaigns.status} = 'pending_approval')`,
      approved: sql<number>`count(*) filter (where ${emailCampaigns.status} = 'approved')`,
      sending: sql<number>`count(*) filter (where ${emailCampaigns.status} = 'sending')`,
      completed: sql<number>`count(*) filter (where ${emailCampaigns.status} = 'completed')`,
      failed: sql<number>`count(*) filter (where ${emailCampaigns.status} = 'failed')`,
    })
    .from(emailCampaigns);

  return {
    total: Number(result.total),
    draft: Number(result.draft),
    pendingApproval: Number(result.pendingApproval),
    approved: Number(result.approved),
    sending: Number(result.sending),
    completed: Number(result.completed),
    failed: Number(result.failed),
  };
}
