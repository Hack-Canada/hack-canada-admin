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
import type { RsvpSelect } from "@/lib/db/schema";

type RsvpRow = {
  rsvp: RsvpSelect;
  userName: string;
  userEmail: string;
  applicationStatus: string;
};

type Props = {
  rsvps: RsvpRow[];
};

const RsvpTable = ({ rsvps }: Props) => {
  if (rsvps.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No RSVPs found.
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
            <TableHead>T-Shirt</TableHead>
            <TableHead>Dietary Restrictions</TableHead>
            <TableHead>Emergency Contact</TableHead>
            <TableHead>Emergency Phone</TableHead>
            <TableHead>Media Consent</TableHead>
            <TableHead>RSVP Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rsvps.map(({ rsvp, userName, userEmail }) => (
            <TableRow key={rsvp.id}>
              <TableCell className="font-medium">{userName}</TableCell>
              <TableCell className="text-muted-foreground">
                {userEmail}
              </TableCell>
              <TableCell>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                  {rsvp.tshirtSize}
                </span>
              </TableCell>
              <TableCell>{rsvp.dietaryRestrictions || "None"}</TableCell>
              <TableCell>
                {rsvp.emergencyContactName} ({rsvp.relationshipToParticipant})
              </TableCell>
              <TableCell>{rsvp.emergencyContactPhoneNumber}</TableCell>
              <TableCell>{rsvp.mediaConsent ? "Yes" : "No"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(rsvp.createdAt.toString())}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RsvpTable;
