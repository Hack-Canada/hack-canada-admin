import { z } from "zod";

export const audienceFilterSchema = z.object({
  preset: z.string().optional(),
  applicationStatus: z.array(z.string()).optional(),
  hasRsvp: z.enum(["yes", "no", "any"]).optional(),
  school: z.string().optional(),
  levelOfStudy: z.string().optional(),
  roles: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
});

export type AudienceFilterInput = z.infer<typeof audienceFilterSchema>;

export const campaignCreateSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  subject: z.string().min(1, "Subject is required"),
  customHtml: z.string().nullable().optional(),
  audienceFilter: audienceFilterSchema,
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

export const campaignUpdateSchema = z.object({
  templateId: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  customHtml: z.string().nullable().optional(),
  audienceFilter: audienceFilterSchema.optional(),
  status: z
    .enum([
      "draft",
      "pending_approval",
      "approved",
      "sending",
      "completed",
      "failed",
    ])
    .optional(),
});

export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

export const approvalActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;

export const recipientPreviewSchema = audienceFilterSchema;

export type RecipientPreviewInput = z.infer<typeof recipientPreviewSchema>;

export const VALID_TEMPLATES = [
  "acceptance",
  "rejection",
  "reminder",
  "onboarding",
  "hackathon-prep",
  "rsvp-reminder",
  "custom",
] as const;

export type TemplateId = (typeof VALID_TEMPLATES)[number];

export const EMAIL_TEMPLATES = [
  {
    id: "acceptance" as const,
    name: "Acceptance Email",
    description: "Congratulations email sent to accepted applicants",
    subject:
      "[ACTION REQUIRED] Congratulations, you have been accepted to Hack Canada",
    needsUserId: false,
  },
  {
    id: "rejection" as const,
    name: "Rejection Email",
    description: "Thank you email sent to rejected applicants",
    subject: "Thank You for Your Application to Hack Canada",
    needsUserId: false,
  },
  {
    id: "reminder" as const,
    name: "Application Reminder",
    description: "Reminder to complete applications",
    subject:
      "We Noticed You Haven't Applied Yet – Don't Miss Out on Hack Canada!",
    needsUserId: false,
  },
  {
    id: "onboarding" as const,
    name: "Hacker Information Email",
    description:
      "Sent to accepted hackers with important links (Schedule, Discord, Devpost, Hacker Package)",
    subject: "Important Links and Information for Hack Canada 2026",
    needsUserId: true,
  },
  {
    id: "hackathon-prep" as const,
    name: "Hackathon Prep Email",
    description: "Event details and check-in information with QR code",
    subject: "🚀 Hack Canada Event Details and Check-in Information",
    needsUserId: true,
  },
  {
    id: "rsvp-reminder" as const,
    name: "RSVP Reminder",
    description: "Urgent reminder for accepted users to RSVP",
    subject:
      "🚨 Urgent: Final RSVP Reminder - Please Respond by Tonight for Hack Canada",
    needsUserId: false,
  },
  {
    id: "custom" as const,
    name: "Custom Email",
    description: "Create a custom email with your own content",
    subject: "",
    needsUserId: false,
  },
] as const;

export const AUDIENCE_PRESETS = [
  {
    id: "accepted-not-rsvpd",
    name: "Accepted & Not RSVP'd",
    filter: {
      applicationStatus: ["accepted"],
      hasRsvp: "no" as const,
    },
  },
  {
    id: "accepted-rsvpd",
    name: "Accepted & RSVP'd",
    filter: {
      applicationStatus: ["accepted"],
      hasRsvp: "yes" as const,
    },
  },
  {
    id: "all-accepted",
    name: "All Accepted",
    filter: {
      applicationStatus: ["accepted"],
    },
  },
  {
    id: "cancelled",
    name: "Cancelled",
    filter: {
      applicationStatus: ["cancelled"],
    },
  },
  {
    id: "waitlisted",
    name: "Waitlisted",
    filter: {
      applicationStatus: ["waitlisted"],
    },
  },
  {
    id: "pending",
    name: "Pending Review",
    filter: {
      applicationStatus: ["pending"],
    },
  },
] as const;
