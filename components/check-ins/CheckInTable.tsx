"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { CheckIn } from "@/lib/db/schema";

type CheckInRow = {
  checkIn: CheckIn;
  userName: string;
  userEmail: string;
  userRole: string;
};

type Props = {
  checkIns: CheckInRow[];
};

const CheckInTable = ({ checkIns }: Props) => {
  if (checkIns.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No check-ins found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Checked In At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkIns.map(({ checkIn, userName, userEmail, userRole }) => (
            <TableRow key={checkIn.id}>
              <TableCell className="font-medium">{userName}</TableCell>
              <TableCell className="text-muted-foreground">
                {userEmail}
              </TableCell>
              <TableCell>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium capitalize text-primary">
                  {userRole}
                </span>
              </TableCell>
              <TableCell>{checkIn.eventName}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(checkIn.createdAt.toString())}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CheckInTable;
