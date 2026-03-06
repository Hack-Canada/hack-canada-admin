"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, History, Ban } from "lucide-react";
import UserAdjustmentsTab from "./UserAdjustmentsTab";
import TransactionMonitorTab from "./TransactionMonitorTab";
import BannedUsersTab from "./BannedUsersTab";

export default function PointsManagementTabs() {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">User Adjustments</span>
          <span className="sm:hidden">Users</span>
        </TabsTrigger>
        <TabsTrigger value="transactions" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Transaction Monitor</span>
          <span className="sm:hidden">Transactions</span>
        </TabsTrigger>
        <TabsTrigger value="banned" className="flex items-center gap-2">
          <Ban className="h-4 w-4" />
          <span className="hidden sm:inline">Banned Users</span>
          <span className="sm:hidden">Banned</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-6">
        <UserAdjustmentsTab />
      </TabsContent>

      <TabsContent value="transactions" className="mt-6">
        <TransactionMonitorTab />
      </TabsContent>

      <TabsContent value="banned" className="mt-6">
        <BannedUsersTab />
      </TabsContent>
    </Tabs>
  );
}
