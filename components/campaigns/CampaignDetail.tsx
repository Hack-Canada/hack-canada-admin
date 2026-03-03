"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SendProgress } from "./SendProgress";
import { EMAIL_TEMPLATES } from "@/lib/validations/campaign";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Send,
  Users,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

type Recipient = {
  id: string;
  userId: string;
  email: string;
  name: string;
  status: string;
  sentAt: string | null;
  error: string | null;
};

type Campaign = {
  id: string;
  templateId: string;
  subject: string;
  customHtml: string | null;
  audienceFilter: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: string;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string } | null;
  approvedBy: { id: string; name: string; email: string } | null;
  recipients: Recipient[];
};

type Props = {
  campaignId: string;
  currentUserId: string;
  onBack: () => void;
};

export function CampaignDetail({ campaignId, currentUserId, onBack }: Props) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const fetchCampaign = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();

      if (data.success) {
        setCampaign(data.data);
      } else {
        toast.error(data.message || "Failed to load campaign");
        onBack();
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign");
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Campaign approved");
        fetchCampaign();
      } else {
        toast.error(data.message || "Failed to approve campaign");
      }
    } catch (error) {
      console.error("Error approving campaign:", error);
      toast.error("Failed to approve campaign");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Campaign rejected and returned to draft");
        setShowRejectDialog(false);
        fetchCampaign();
      } else {
        toast.error(data.message || "Failed to reject campaign");
      }
    } catch (error) {
      console.error("Error rejecting campaign:", error);
      toast.error("Failed to reject campaign");
    } finally {
      setIsApproving(false);
    }
  };

  const loadPreview = async () => {
    if (!campaign) return;

    try {
      const params = new URLSearchParams({
        template: campaign.templateId,
        name: "Preview User",
        userId: "preview-id",
      });

      if (campaign.templateId === "custom" && campaign.customHtml) {
        params.set("customHtml", campaign.customHtml);
      }

      const response = await fetch(`/api/preview-email?${params}`);
      const data = await response.json();

      if (data.success) {
        setPreviewHtml(data.data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("Failed to load preview");
    }
  };

  const getTemplateName = (templateId: string) => {
    return EMAIL_TEMPLATES.find((t) => t.id === templateId)?.name || templateId;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const canApprove =
    campaign?.status === "pending_approval" &&
    campaign?.createdById !== currentUserId;

  const canSend = campaign?.status === "approved";

  const isSendingOrComplete =
    campaign?.status === "sending" || campaign?.status === "completed";

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <XCircle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">Campaign not found</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        <Button variant="outline" onClick={loadPreview}>
          <Eye className="mr-2 h-4 w-4" />
          Preview Email
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {campaign.subject}
              </CardTitle>
              <CardDescription>
                {getTemplateName(campaign.templateId)} Template
              </CardDescription>
            </div>
            <StatusBadge status={campaign.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Created By
              </p>
              <p className="font-medium">
                {campaign.createdBy?.name || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(campaign.createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Approved By
              </p>
              <p className="font-medium">
                {campaign.approvedBy?.name || "Pending"}
              </p>
              {campaign.approvedAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(campaign.approvedAt)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Recipients
              </p>
              <p className="font-medium">{campaign.totalRecipients}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Progress
              </p>
              <p className="font-medium">
                {campaign.sentCount} sent
                {campaign.failedCount > 0 && (
                  <span className="text-red-500">
                    , {campaign.failedCount} failed
                  </span>
                )}
              </p>
            </div>
          </div>

          {canApprove && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5" />
                  Approval Required
                </CardTitle>
                <CardDescription className="text-amber-600 dark:text-amber-300">
                  Review this campaign and decide whether to approve or reject
                  it
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button onClick={handleApprove} disabled={isApproving}>
                  {isApproving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isApproving}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </CardContent>
            </Card>
          )}

          {canSend && (
            <SendProgress
              campaignId={campaign.id}
              totalRecipients={campaign.totalRecipients}
              initialSentCount={campaign.sentCount}
              initialFailedCount={campaign.failedCount}
              onComplete={fetchCampaign}
            />
          )}

          {isSendingOrComplete && (
            <SendProgress
              campaignId={campaign.id}
              totalRecipients={campaign.totalRecipients}
              initialSentCount={campaign.sentCount}
              initialFailedCount={campaign.failedCount}
              onComplete={fetchCampaign}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recipients ({campaign.recipients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.recipients.slice(0, 100).map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">
                      {recipient.name}
                    </TableCell>
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell>
                      <RecipientStatusBadge status={recipient.status} />
                    </TableCell>
                    <TableCell>
                      {recipient.sentAt
                        ? formatDate(recipient.sentAt)
                        : recipient.error || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {campaign.recipients.length > 100 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Showing first 100 of {campaign.recipients.length}{" "}
                      recipients
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Campaign</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this campaign. It will be returned
              to draft status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason (optional)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter a reason for rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Reject Campaign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Subject: {campaign.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[500px] overflow-auto rounded-lg border">
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="h-full w-full"
                title="Email Preview"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { label: string; icon: React.ElementType; className: string }
  > = {
    draft: {
      label: "Draft",
      icon: Clock,
      className: "bg-muted text-muted-foreground",
    },
    pending_approval: {
      label: "Pending Approval",
      icon: AlertCircle,
      className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    },
    sending: {
      label: "Sending",
      icon: Send,
      className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    },
    failed: {
      label: "Failed",
      icon: XCircle,
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    },
  };

  const config = configs[status] || configs.draft;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.className}`}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
}

function RecipientStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-muted text-muted-foreground",
    },
    sent: {
      label: "Sent",
      className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
