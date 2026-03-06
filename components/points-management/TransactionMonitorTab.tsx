"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import UndoTransactionDialog from "./UndoTransactionDialog";
import { PointsTransactionMetadata } from "@/data/points-admin";

interface Transaction {
  transaction: {
    id: string;
    userId: string;
    points: number;
    createdAt: string;
    referenceId: string | null;
    metadata: PointsTransactionMetadata | null;
  };
  userName: string;
  userEmail: string;
}

interface Stats {
  totalDistributed: number;
  totalSpent: number;
  transactionCount: number;
  bannedUsersCount: number;
}

export default function TransactionMonitorTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats | null>(null);

  const [type, setType] = useState("all");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [showAnomalies, setShowAnomalies] = useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("includeStats", "true");
      if (type !== "all") params.set("type", type);
      if (minPoints) params.set("minPoints", minPoints);
      if (maxPoints) params.set("maxPoints", maxPoints);

      const res = await fetch(`/api/admin/points/transactions?${params}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.data.transactions);
        setTotalPages(data.data.totalPages);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      } else {
        toast.error(data.message || "Failed to fetch transactions");
      }
    } catch (error) {
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [page, type, minPoints, maxPoints]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const isAnomaly = useCallback((tx: Transaction): string | null => {
    if (Math.abs(tx.transaction.points) > 200) {
      return "High value transaction (>200 pts)";
    }
    return null;
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!showAnomalies) return transactions;
    return transactions.filter((tx) => isAnomaly(tx) !== null);
  }, [transactions, showAnomalies, isAnomaly]);

  const getTransactionLabel = (metadata: PointsTransactionMetadata | null) => {
    if (!metadata?.type) return "Unknown";
    switch (metadata.type) {
      case "challenge_completion":
        return "Challenge";
      case "shop_redemption":
        return "Shop";
      case "admin_adjustment":
        return "Admin";
      case "admin_undo":
        return "Undo";
      default:
        return metadata.type;
    }
  };

  const handleUndo = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setUndoDialogOpen(true);
  };

  const handleUndoComplete = (success: boolean) => {
    setUndoDialogOpen(false);
    setSelectedTransaction(null);
    if (success) {
      fetchTransactions();
    }
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Distributed</p>
              <p className="text-2xl font-bold text-green-600">
                +{stats.totalDistributed} pts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-destructive">
                -{stats.totalSpent} pts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{stats.transactionCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Banned Users</p>
              <p className="text-2xl font-bold">{stats.bannedUsersCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="challenge_completion">
                    Challenge
                  </SelectItem>
                  <SelectItem value="shop_redemption">Shop</SelectItem>
                  <SelectItem value="admin_adjustment">
                    Admin Adjustment
                  </SelectItem>
                  <SelectItem value="admin_undo">Undo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Min Points</Label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
              />
            </div>
            <div>
              <Label>Max Points</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anomalies"
                  checked={showAnomalies}
                  onCheckedChange={(checked) =>
                    setShowAnomalies(checked === true)
                  }
                />
                <Label htmlFor="anomalies" className="cursor-pointer">
                  Show anomalies only
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-5 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => {
                  const anomalyReason = isAnomaly(tx);
                  const isUndoType =
                    tx.transaction.metadata?.type === "admin_undo";

                  return (
                    <TableRow
                      key={tx.transaction.id}
                      className={anomalyReason ? "bg-yellow-50" : ""}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(tx.transaction.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.userEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {anomalyReason && (
                            <span title={anomalyReason}>
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            </span>
                          )}
                          <span className="text-sm">
                            {getTransactionLabel(tx.transaction.metadata)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          tx.transaction.points > 0
                            ? "text-green-600"
                            : "text-destructive"
                        }`}
                      >
                        {tx.transaction.points > 0 ? "+" : ""}
                        {tx.transaction.points}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isUndoType && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUndo(tx)}
                            title="Undo transaction"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
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

      <UndoTransactionDialog
        transaction={selectedTransaction}
        open={undoDialogOpen}
        onClose={handleUndoComplete}
      />
    </div>
  );
}
