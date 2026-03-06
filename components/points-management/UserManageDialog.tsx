"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Minus, Ban, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PointsTransactionMetadata } from "@/data/points-admin";

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
}

interface UserPointsInfo {
  id: string;
  name: string;
  email: string;
  points: number;
  isBanned: boolean;
  bannedInfo: {
    bannedAt: string;
    reason: string | null;
  } | null;
  transactions: Array<{
    id: string;
    points: number;
    createdAt: string;
    metadata: PointsTransactionMetadata | null;
  }>;
}

interface UserManageDialogProps {
  user: User | null;
  open: boolean;
  onClose: (refreshData?: boolean) => void;
}

export default function UserManageDialog({
  user,
  open,
  onClose,
}: UserManageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserPointsInfo | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banning, setBanning] = useState(false);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    if (open && user) {
      fetchUserInfo();
    } else {
      setUserInfo(null);
      setAdjustPoints("");
      setReason("");
      setBanReason("");
    }
  }, [open, user]);

  const fetchUserInfo = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/points/users?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setUserInfo(data.data);
      } else {
        toast.error(data.message || "Failed to fetch user info");
      }
    } catch (error) {
      toast.error("Failed to fetch user info");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPoints = async (isPositive: boolean) => {
    const points = parseInt(adjustPoints);
    if (isNaN(points) || points <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/points/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          points: isPositive ? points : -points,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setAdjustPoints("");
        setReason("");
        fetchUserInfo();
      } else {
        toast.error(data.message || "Failed to adjust points");
      }
    } catch (error) {
      toast.error("Failed to adjust points");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBan = async () => {
    if (!userInfo) return;

    setBanning(true);
    try {
      const endpoint = userInfo.isBanned
        ? "/api/admin/points/unban"
        : "/api/admin/points/ban";

      const body = userInfo.isBanned
        ? { userId: user?.id }
        : { userId: user?.id, reason: banReason.trim() || undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBanReason("");
        fetchUserInfo();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setBanning(false);
    }
  };

  const getTransactionLabel = (metadata: PointsTransactionMetadata | null) => {
    if (!metadata?.type) return "Unknown";
    switch (metadata.type) {
      case "challenge_completion":
        return metadata.challengeName || "Challenge";
      case "shop_redemption":
        return metadata.itemName || "Shop";
      case "admin_adjustment":
        return `Admin: ${metadata.reason || "Adjustment"}`;
      case "admin_undo":
        return "Undo";
      default:
        return metadata.type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Points: {user?.name}</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : userInfo ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold">{userInfo.points} pts</p>
              </div>
              {userInfo.isBanned && (
                <div className="rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
                  Banned from earning
                </div>
              )}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Adjust Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="points">Points Amount</Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={adjustPoints}
                      onChange={(e) => setAdjustPoints(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Why are you adjusting points?"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="min-h-[38px] resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAdjustPoints(true)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Points
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAdjustPoints(false)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Minus className="mr-2 h-4 w-4" />
                    )}
                    Remove Points
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ban Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!userInfo.isBanned && (
                  <div>
                    <Label htmlFor="banReason">Ban Reason (optional)</Label>
                    <Input
                      id="banReason"
                      placeholder="Why is this user being banned?"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                  </div>
                )}
                {userInfo.isBanned && userInfo.bannedInfo && (
                  <p className="text-sm text-muted-foreground">
                    Banned on {formatDate(userInfo.bannedInfo.bannedAt)}
                    {userInfo.bannedInfo.reason &&
                      ` - Reason: ${userInfo.bannedInfo.reason}`}
                  </p>
                )}
                <Button
                  variant={userInfo.isBanned ? "default" : "destructive"}
                  onClick={handleBan}
                  disabled={banning}
                  className="w-full"
                >
                  {banning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="mr-2 h-4 w-4" />
                  )}
                  {userInfo.isBanned ? "Unban User" : "Ban from Earning Points"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userInfo.transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-4 text-center text-muted-foreground"
                        >
                          No transactions
                        </TableCell>
                      </TableRow>
                    ) : (
                      userInfo.transactions.slice(0, 10).map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(tx.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getTransactionLabel(tx.metadata)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono ${
                              tx.points > 0
                                ? "text-green-600"
                                : "text-destructive"
                            }`}
                          >
                            {tx.points > 0 ? "+" : ""}
                            {tx.points}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onClose(true)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Failed to load user information
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
