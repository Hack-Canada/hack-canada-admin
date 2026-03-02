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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, Loader2, Mail, Send, Settings } from "lucide-react";

const EMAIL_TEMPLATES = [
  {
    id: "acceptance",
    name: "Acceptance Email",
    description:
      "Sent to applicants when their application is accepted. Includes RSVP instructions.",
    subject:
      "[ACTION REQUIRED] Congratulations, you have been accepted to Hack Canada",
  },
  {
    id: "rejection",
    name: "Rejection Email",
    description: "Sent to applicants when their application is rejected.",
    subject: "Thank You for Your Application to Hack Canada",
  },
  {
    id: "reminder",
    name: "Application Reminder",
    description:
      "Sent to users who have accounts but haven't submitted their application.",
    subject:
      "We Noticed You Haven't Applied Yet – Don't Miss Out on Hack Canada!",
  },
  {
    id: "onboarding",
    name: "Hacker Information Email",
    description:
      "Sent to accepted hackers with important links (Schedule, Discord, Devpost, Hacker Package).",
    subject: "Important Links and Information for Hack Canada 2026",
    needsUserId: true,
  },
  {
    id: "hackathon-prep",
    name: "Hackathon Prep Email",
    description:
      "Sent before the event with event details, check-in info, and logistics.",
    subject: "🚀 Hack Canada Event Details and Check-in Information",
    needsUserId: true,
  },
  {
    id: "rsvp-reminder",
    name: "RSVP Reminder",
    description: "Urgent reminder for accepted hackers who haven't RSVP'd yet.",
    subject:
      "🚨 Urgent: Final RSVP Reminder - Please Respond by Tonight for Hack Canada",
  },
] as const;

type EmailTemplateListProps = {
  adminUserId: string;
};

const EmailTemplateList = ({ adminUserId }: EmailTemplateListProps) => {
  const [previewName, setPreviewName] = useState("Alex Johnson");
  const [previewUserId, setPreviewUserId] = useState(adminUserId);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handlePreview = async (templateId: string) => {
    setIsPreviewLoading(true);
    setPreviewTemplate(templateId);

    try {
      const params = new URLSearchParams({
        template: templateId,
        name: previewName,
        userId: previewUserId,
      });

      const res = await fetch(`/api/preview-email?${params}`);

      if (!res.ok) {
        toast.error("Failed to load preview");
        setPreviewTemplate(null);
        return;
      }

      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      toast.error("Failed to load preview");
      setPreviewTemplate(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    setPreviewHtml(null);
  };

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
            name: previewName,
            userId: previewUserId,
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

  const currentPreviewData = EMAIL_TEMPLATES.find(
    (t) => t.id === previewTemplate,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Preview Settings
          </CardTitle>
          <CardDescription>
            Configure the name and user ID used in email previews and test
            sends. The user ID is used for QR code generation in onboarding
            emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="preview-name">Recipient Name</Label>
            <Input
              id="preview-name"
              type="text"
              placeholder="Alex Johnson"
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preview-user-id">User ID (for QR codes)</Label>
            <Input
              id="preview-user-id"
              type="text"
              placeholder="user-id"
              value={previewUserId}
              onChange={(e) => setPreviewUserId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-email">Send To Email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Preview templates in-browser or send them to a test email. Emails
            are sent with exact production subjects and content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {EMAIL_TEMPLATES.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="flex-1 pb-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    <span className="font-medium">Subject:</span>{" "}
                    {template.subject}
                  </p>
                </CardHeader>
                <CardContent className="flex gap-2 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(template.id)}
                  >
                    <Eye className="mr-2 size-4" />
                    Preview
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={isPending || !testEmail}
                    onClick={() => handleSendTest(template.id)}
                  >
                    {sendingTemplate === template.id && isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 size-4" />
                    )}
                    Send
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!previewTemplate} onOpenChange={() => closePreview()}>
        <DialogContent className="flex h-[90vh] max-w-5xl flex-col">
          <DialogHeader>
            <DialogTitle>
              {currentPreviewData?.name || "Email Preview"}
            </DialogTitle>
            {currentPreviewData && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Subject:</span>{" "}
                {currentPreviewData.subject}
              </p>
            )}
          </DialogHeader>
          <div className="relative flex-1 overflow-hidden rounded-md border bg-white">
            {isPreviewLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="h-full w-full"
                sandbox="allow-same-origin"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplateList;
