"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";

const SETTINGS_INFO = [
  {
    title: "Review Limits",
    description: "Controls how many reviews each organizer can submit.",
    items: [
      {
        label: "Minimum Review Limit",
        value: "50",
        location: "app/(dashboard)/review-applications/page.tsx",
      },
      {
        label: "Maximum Review Limit",
        value: "125 (2.5x minimum)",
        location: "app/(dashboard)/review-applications/page.tsx",
      },
      {
        label: "Reviews Required per Application",
        value: "5",
        location: "app/(dashboard)/review-applications/page.tsx",
      },
    ],
  },
  {
    title: "Pagination",
    description: "Controls how many items appear per page in tables.",
    items: [
      {
        label: "Results Per Page",
        value: "25",
        location: "lib/constants.ts",
      },
    ],
  },
  {
    title: "Dashboard Cache",
    description: "Controls data freshness on the home dashboard.",
    items: [
      {
        label: "Revalidation Interval",
        value: "60 seconds",
        location: "app/(dashboard)/page.tsx",
      },
    ],
  },
  {
    title: "Rating Scale",
    description: "Application review rating configuration.",
    items: [
      {
        label: "Rating Range",
        value: "0 - 10",
        location: "hooks/useReviewInterface.ts",
      },
    ],
  },
  {
    title: "Email Configuration",
    description: "Email sending is powered by AWS SES.",
    items: [
      {
        label: "Email Provider",
        value: "AWS SES",
        location: "lib/ses/index.ts",
      },
      {
        label: "From Address",
        value: "Configured via AWS_SES_NO_REPLY_EMAIL env var",
        location: ".env.local",
      },
    ],
  },
  {
    title: "Authentication",
    description: "Auth configuration for the admin portal.",
    items: [
      {
        label: "Session Strategy",
        value: "JWT",
        location: "auth.ts",
      },
      {
        label: "Allowed Roles",
        value: "admin, organizer",
        location: "auth.ts (signIn callback)",
      },
      {
        label: "Cookie Name",
        value: "authjs.session-token-admin",
        location: "auth.ts",
      },
    ],
  },
];

const SettingsPanel = () => {
  return (
    <div className="space-y-6">
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="mt-0.5 size-5 shrink-0 text-blue-500" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              Configuration Reference
            </p>
            <p className="text-muted-foreground">
              These settings are currently defined as constants in the codebase.
              The file locations are listed for each setting so you can modify
              them directly. A dynamic settings system could be added in the
              future to store these in the database.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {SETTINGS_INFO.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.location}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SettingsPanel;
