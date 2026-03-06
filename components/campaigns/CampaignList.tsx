"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMAIL_TEMPLATES } from "@/lib/validations/campaign";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Eye,
  Trash2,
  AlertCircle,
  MailCheck,
  RefreshCw,
} from "lucide-react";

type Campaign = {
  id: string;
  templateId: string;
  subject: string;
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
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  draft: {
    label: "Draft",
    icon: Clock,
    color: "text-muted-foreground bg-muted",
  },
  pending_approval: {
    label: "Pending Approval",
    icon: AlertCircle,
    color: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    color: "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
  },
  paused: {
    label: "Paused",
    icon: Clock,
    color: "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-950",
  },
  sending: {
    label: "Sending",
    icon: Send,
    color: "text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-950",
  },
  completed: {
    label: "Completed",
    icon: MailCheck,
    color: "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950",
  },
};

type Props = {
  currentUserId: string;
  onViewCampaign: (campaignId: string) => void;
};

export function CampaignList({ currentUserId, onViewCampaign }: Props) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/campaigns");
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      } else {
        toast.error("Failed to load campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${deleteId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Campaign deleted");
        setCampaigns((prev) => prev.filter((c) => c.id !== deleteId));
      } else {
        toast.error(data.message || "Failed to delete campaign");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getTemplateName = (templateId: string) => {
    return EMAIL_TEMPLATES.find((t) => t.id === templateId)?.name || templateId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const pendingApprovalCampaigns = campaigns.filter(
    (c) => c.status === "pending_approval" && c.createdById !== currentUserId,
  );

  const otherCampaigns = campaigns.filter(
    (c) => !(c.status === "pending_approval" && c.createdById !== currentUserId),
  );

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MailCheck className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No campaigns yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first email campaign to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={fetchCampaigns}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {pendingApprovalCampaigns.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Pending Your Approval
            </CardTitle>
            <CardDescription>
              These campaigns need your review before they can be sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovalCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {campaign.subject}
                    </TableCell>
                    <TableCell>{getTemplateName(campaign.templateId)}</TableCell>
                    <TableCell>{campaign.totalRecipients}</TableCell>
                    <TableCell>
                      {campaign.createdBy?.name || "Unknown"}
                    </TableCell>
                    <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onViewCampaign(campaign.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            View and manage all email campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherCampaigns.map((campaign) => {
                const statusConfig = STATUS_CONFIG[campaign.status] || {
                  label: campaign.status,
                  icon: Clock,
                  color: "text-muted-foreground bg-muted",
                };
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {campaign.subject}
                    </TableCell>
                    <TableCell>{getTemplateName(campaign.templateId)}</TableCell>
                    <TableCell>
                      {campaign.status === "completed" ||
                      campaign.status === "sending" ||
                      campaign.status === "paused" ? (
                        <span className="text-sm">
                          {campaign.sentCount}/{campaign.totalRecipients}
                          {campaign.failedCount > 0 && (
                            <span className="ml-1 text-red-500">
                              ({campaign.failedCount} failed)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {campaign.totalRecipients} recipients
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewCampaign(campaign.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(campaign.status === "draft" ||
                          campaign.status === "pending_approval") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
