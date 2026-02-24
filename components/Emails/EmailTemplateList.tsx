"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Send } from "lucide-react";

const EMAIL_TEMPLATES = [
  {
    id: "acceptance",
    name: "Acceptance Email",
    description:
      "Sent to applicants when their application is accepted. Includes RSVP instructions.",
  },
  {
    id: "rejection",
    name: "Rejection Email",
    description:
      "Sent to applicants when their application is rejected.",
  },
  {
    id: "reminder",
    name: "Application Reminder",
    description:
      "Sent to users who have accounts but haven't submitted their application.",
  },
  {
    id: "onboarding",
    name: "Onboarding Email",
    description:
      "Sent to accepted hackers with important event information and next steps.",
  },
  {
    id: "hackathon-prep",
    name: "Hackathon Prep Email",
    description:
      "Sent before the event with event details, check-in info, and logistics.",
  },
  {
    id: "rsvp-reminder",
    name: "RSVP Reminder",
    description:
      "Urgent reminder for accepted hackers who haven't RSVP'd yet.",
  },
] as const;

const EmailTemplateList = () => {
  const [testEmail, setTestEmail] = useState("");
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSendTest = (templateId: string) => {
    if (!testEmail) {
      toast.error("Please enter a recipient email address.");
      return;
    }

    setSendingTemplate(templateId);
    startTransition(async () => {
      try {
        const res = await fetch("/api/send-test-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: templateId,
            recipientEmail: testEmail,
          }),
        });

        const data = await res.json();

        if (data.success) {
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Failed to send test email.");
      } finally {
        setSendingTemplate(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Send Test Email
          </CardTitle>
          <CardDescription>
            Enter a recipient email to send a test version of any template
            below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EMAIL_TEMPLATES.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="flex-1">
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isPending || !testEmail}
                onClick={() => handleSendTest(template.id)}
              >
                {sendingTemplate === template.id && isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                Send Test
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EmailTemplateList;
