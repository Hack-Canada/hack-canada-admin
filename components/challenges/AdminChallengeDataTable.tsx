"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Challenge } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ChallengeForm } from "./ChallengeForm";

// Define helper type for data with completion counts
type ChallengeWithCounts = Challenge & {
  currentCompletions: number;
};

export function AdminChallengeDataTable({
  data,
}: {
  data: ChallengeWithCounts[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [editingChallenge, setEditingChallenge] =
    React.useState<Challenge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const columns: ColumnDef<ChallengeWithCounts>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "points",
      header: "Points",
    },
    {
      accessorKey: "maxCompletions",
      header: "Max Completions",
      cell: ({ row }) => {
        const val = row.getValue("maxCompletions");
        return val === null ? "Unlimited" : val;
      },
    },
    {
      accessorKey: "currentCompletions",
      header: "Current Completions",
    },
    {
      accessorKey: "enabled",
      header: "Status",
      cell: ({ row }) => {
        const id = row.original.id;
        const enabled = row.original.enabled;
        return (
          <div className="flex items-center gap-2">
            <span className={enabled ? "text-green-600" : "text-gray-500"}>
              {enabled ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={async (checked) => {
                try {
                  const response = await fetch(`/api/challenges/${id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ enabled: checked }),
                  });

                  if (!response.ok) {
                    toast.error("Failed to update status");
                    return;
                  }

                  toast.success(
                    `Challenge ${checked ? "enabled" : "disabled"}`,
                  );
                  router.refresh();
                } catch (e) {
                  toast.error("Failed to update status");
                }
              }}
            />
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const challenge = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditingChallenge(challenge);
                setIsDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={async () => {
                if (
                  confirm("Are you sure you want to delete this challenge?")
                ) {
                  try {
                    const response = await fetch(
                      `/api/challenges/${challenge.id}`,
                      {
                        method: "DELETE",
                      },
                    );

                    if (!response.ok) {
                      toast.error("Failed to delete challenge");
                      return;
                    }

                    toast.success("Challenge deleted");
                    router.refresh();
                  } catch (e) {
                    toast.error("Failed to delete challenge");
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter challenges..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Floating Action Button for Add Challenge */}
      <div className="fixed bottom-8 right-8">
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingChallenge(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingChallenge ? "Edit Challenge" : "Create New Challenge"}
              </DialogTitle>
            </DialogHeader>
            <ChallengeForm
              challenge={editingChallenge ?? undefined}
              onSuccess={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
