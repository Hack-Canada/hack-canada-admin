"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, UserCheck, Ban } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface BannedUser {
  banned: {
    userId: string;
    bannedAt: string;
    bannedBy: string | null;
    reason: string | null;
  };
  userName: string;
  userEmail: string;
  bannedByName: string | null;
}

export default function BannedUsersTab() {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unbanUserId, setUnbanUserId] = useState<string | null>(null);
  const [unbanUserName, setUnbanUserName] = useState<string>("");
  const [unbanning, setUnbanning] = useState(false);

  const fetchBannedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/points/banned?page=${page}`);
      const data = await res.json();

      if (data.success) {
        setBannedUsers(data.data.bannedUsers);
        setTotalPages(data.data.totalPages);
      } else {
        toast.error(data.message || "Failed to fetch banned users");
      }
    } catch (error) {
      toast.error("Failed to fetch banned users");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBannedUsers();
  }, [fetchBannedUsers]);

  const handleUnbanClick = (userId: string, userName: string) => {
    setUnbanUserId(userId);
    setUnbanUserName(userName);
  };

  const handleUnban = async () => {
    if (!unbanUserId) return;

    setUnbanning(true);
    try {
      const res = await fetch("/api/admin/points/unban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: unbanUserId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchBannedUsers();
      } else {
        toast.error(data.message || "Failed to unban user");
      }
    } catch (error) {
      toast.error("Failed to unban user");
    } finally {
      setUnbanning(false);
      setUnbanUserId(null);
      setUnbanUserName("");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ban className="h-5 w-5" />
            Banned Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Banned At</TableHead>
                <TableHead>Banned By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : bannedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No banned users
                  </TableCell>
                </TableRow>
              ) : (
                bannedUsers.map((bu) => (
                  <TableRow key={bu.banned.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{bu.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {bu.userEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(bu.banned.bannedAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {bu.bannedByName || "Unknown"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {bu.banned.reason || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUnbanClick(bu.banned.userId, bu.userName)
                        }
                      >
                        <UserCheck className="mr-1 h-4 w-4" />
                        Unban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AlertDialog
        open={!!unbanUserId}
        onOpenChange={(open) => {
          if (!open) {
            setUnbanUserId(null);
            setUnbanUserName("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban <strong>{unbanUserName}</strong>?
              They will be able to earn points again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unbanning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnban} disabled={unbanning}>
              {unbanning ? "Unbanning..." : "Unban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
