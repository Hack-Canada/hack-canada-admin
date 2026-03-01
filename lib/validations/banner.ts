import { z } from "zod";

export const bannerSchema = z.object({
  type: z.enum(["info", "warning", "success", "error"]),
  message: z.string().min(1, "Message is required"),
  linkText: z.string().nullable().optional(),
  linkUrl: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().nullable().optional(),
});

export type BannerInput = z.infer<typeof bannerSchema>;
