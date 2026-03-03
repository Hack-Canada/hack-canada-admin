"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AudienceBuilder } from "./AudienceBuilder";
import {
  EMAIL_TEMPLATES,
  AUDIENCE_PRESETS,
  type AudienceFilterInput,
} from "@/lib/validations/campaign";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Users,
  Eye,
  Send,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";

type WizardStep = "template" | "compose" | "audience" | "preview" | "review";

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: "template", label: "Select Template", icon: FileText },
  { id: "compose", label: "Compose", icon: Mail },
  { id: "audience", label: "Audience", icon: Users },
  { id: "preview", label: "Preview & Test", icon: Eye },
  { id: "review", label: "Review & Submit", icon: Send },
];

type RecipientCount = {
  count: number;
  recipients: Array<{ id: string; name: string; email: string }>;
  hasMore: boolean;
};

export function CampaignComposer() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("template");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilterInput>({});
  const [testEmails, setTestEmails] = useState("");
  const [previewName, setPreviewName] = useState("Alex Johnson");

  const [recipientPreview, setRecipientPreview] =
    useState<RecipientCount | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const selectedTemplateData = EMAIL_TEMPLATES.find(
    (t) => t.id === selectedTemplate,
  );

  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== "custom") {
      const template = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);
      if (template) {
        setSubject(template.subject);
      }
    }
  }, [selectedTemplate]);

  useEffect(() => {
    const hasAnyFilter =
      (audienceFilter.applicationStatus &&
        audienceFilter.applicationStatus.length > 0) ||
      audienceFilter.hasRsvp ||
      audienceFilter.school ||
      audienceFilter.levelOfStudy ||
      (audienceFilter.roles && audienceFilter.roles.length > 0) ||
      audienceFilter.searchQuery;

    if (hasAnyFilter) {
      fetch("/api/campaigns/recipients-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(audienceFilter),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setRecipientPreview(data.data);
          }
        })
        .catch(console.error);
    } else {
      setRecipientPreview(null);
    }
  }, [audienceFilter]);

  const loadEmailPreview = async () => {
    if (!selectedTemplate || !subject) return;

    setIsLoadingPreview(true);
    try {
      const params = new URLSearchParams({
        template: selectedTemplate,
        name: previewName.split(" ")[0] || "Alex",
        userId: "preview-id",
      });

      if (selectedTemplate === "custom" && customContent) {
        params.set("customHtml", customContent);
      }

      const response = await fetch(`/api/preview-email?${params}`);
      const data = await response.json();

      if (data.success) {
        setPreviewHtml(data.data);
      } else {
        toast.error("Failed to load preview");
      }
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("Failed to load preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (currentStep === "preview" && selectedTemplate) {
      loadEmailPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedTemplate, previewName, customContent]);

  const handleSendTest = async () => {
    if (!testEmails.trim()) {
      toast.error("Please enter at least one test email address");
      return;
    }

    const emails = testEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      toast.error("Please enter valid email addresses");
      return;
    }

    setIsSendingTest(true);
    try {
      for (const email of emails) {
        const payload: Record<string, string> = {
          template: selectedTemplate!,
          recipientEmail: email,
          name: previewName,
          userId: "test-preview-id",
        };

        if (selectedTemplate === "custom") {
          payload.customHtml = customContent;
          payload.subject = subject;
        }

        const response = await fetch("/api/send-test-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
          toast.success(`Test email sent to ${email}`);
        } else {
          toast.error(`Failed to send to ${email}: ${data.message}`);
        }
      }
    } catch (error) {
      console.error("Error sending test:", error);
      toast.error("Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          subject,
          customHtml: selectedTemplate === "custom" ? customContent : null,
          audienceFilter,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to create campaign");
        return;
      }

      const updateResponse = await fetch(`/api/campaigns/${data.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_approval" }),
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        toast.success("Campaign submitted for approval");
        router.push("/emails");
        router.refresh();
      } else {
        toast.error(updateData.message || "Failed to submit for approval");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case "template":
        return !!selectedTemplate;
      case "compose":
        return (
          !!subject &&
          (selectedTemplate !== "custom" || customContent.trim().length > 0)
        );
      case "audience":
        return recipientPreview && recipientPreview.count > 0;
      case "preview":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  };

  const goBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id);
    }
  };

  const getPresetName = () => {
    if (audienceFilter.preset) {
      const preset = AUDIENCE_PRESETS.find((p) => p.id === audienceFilter.preset);
      return preset?.name;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = idx < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                {idx > 0 && (
                  <div
                    className={`mx-2 h-px w-8 ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
                <button
                  onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
                  disabled={idx > currentStepIndex}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-[400px]">
        {currentStep === "template" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {EMAIL_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedTemplate === template.id
                    ? "border-2 border-primary"
                    : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {template.name}
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                {template.subject && (
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Subject: {template.subject}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {currentStep === "compose" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTemplate === "custom" ? "Compose Email" : "Email Details"}
              </CardTitle>
              <CardDescription>
                {selectedTemplate === "custom"
                  ? "Write your custom email content"
                  : "Review and customize the subject line"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>

              {selectedTemplate === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="content">
                    Email Content (HTML or plain text)
                  </Label>
                  <Textarea
                    id="content"
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Enter your email content..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can use HTML for formatting. Use {"{name}"} to insert the
                    recipient&apos;s first name.
                  </p>
                </div>
              )}

              {selectedTemplate !== "custom" && selectedTemplateData && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">Template Preview</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This email template is pre-designed. You can preview the full
                    email in the next steps.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === "audience" && (
          <AudienceBuilder value={audienceFilter} onChange={setAudienceFilter} />
        )}

        {currentStep === "preview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>
                  Preview how the email will appear to recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <Label>Preview Name</Label>
                  <Input
                    value={previewName}
                    onChange={(e) => setPreviewName(e.target.value)}
                    placeholder="Recipient name for preview"
                  />
                </div>

                {isLoadingPreview ? (
                  <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : previewHtml ? (
                  <div className="h-[400px] overflow-auto rounded-lg border">
                    <iframe
                      srcDoc={previewHtml}
                      className="h-full w-full"
                      title="Email Preview"
                    />
                  </div>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                )}

                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={loadEmailPreview}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Refresh Preview
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Test Email</CardTitle>
                <CardDescription>
                  Send a test email to verify everything looks correct
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Email Address(es)</Label>
                  <Input
                    value={testEmails}
                    onChange={(e) => setTestEmails(e.target.value)}
                    placeholder="email@example.com, another@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple emails with commas
                  </p>
                </div>

                <Button
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testEmails.trim()}
                  className="w-full"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === "review" && (
          <Card>
            <CardHeader>
              <CardTitle>Review Campaign</CardTitle>
              <CardDescription>
                Review all details before submitting for approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Template
                  </p>
                  <p className="font-medium">
                    {selectedTemplateData?.name || "Unknown"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Subject
                  </p>
                  <p className="font-medium">{subject}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Audience
                  </p>
                  <p className="font-medium">
                    {getPresetName() || "Custom Filter"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Recipients
                  </p>
                  <p className="font-medium">
                    {recipientPreview?.count || 0} people
                  </p>
                </div>
              </div>

              {recipientPreview && recipientPreview.count > 0 && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium">Sample Recipients</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {recipientPreview.recipients.slice(0, 5).map((r) => (
                      <p key={r.id}>
                        {r.name} ({r.email})
                      </p>
                    ))}
                    {recipientPreview.count > 5 && (
                      <p className="italic">
                        and {recipientPreview.count - 5} more...
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Dual-Admin Approval Required
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  After submission, another admin must review and approve this
                  campaign before it can be sent.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep === "review" ? (
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit for Approval
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>
              You are about to submit a campaign to send{" "}
              <strong>{selectedTemplateData?.name}</strong> to{" "}
              <strong>{recipientPreview?.count || 0} recipients</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This campaign will require approval from another admin before it can
              be sent. Make sure you have:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              <li>Reviewed the email content</li>
              <li>Verified the recipient list</li>
              <li>Sent a test email to yourself</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitForApproval} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Approval"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
