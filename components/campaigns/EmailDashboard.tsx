"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CampaignComposer } from "./CampaignComposer";
import { CampaignList } from "./CampaignList";
import { CampaignDetail } from "./CampaignDetail";
import EmailTemplateList from "@/components/Emails/EmailTemplateList";
import { Mail, Plus, FileText } from "lucide-react";

type Tab = "campaigns" | "new" | "templates";

type Props = {
  currentUserId: string;
};

export function EmailDashboard({ currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaignId(null);
  };

  if (selectedCampaignId) {
    return (
      <CampaignDetail
        campaignId={selectedCampaignId}
        currentUserId={currentUserId}
        onBack={handleBackToCampaigns}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b">
        <Button
          variant={activeTab === "campaigns" ? "default" : "ghost"}
          onClick={() => setActiveTab("campaigns")}
          className="rounded-b-none"
        >
          <Mail className="mr-2 h-4 w-4" />
          Campaigns
        </Button>
        <Button
          variant={activeTab === "new" ? "default" : "ghost"}
          onClick={() => setActiveTab("new")}
          className="rounded-b-none"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
        <Button
          variant={activeTab === "templates" ? "default" : "ghost"}
          onClick={() => setActiveTab("templates")}
          className="rounded-b-none"
        >
          <FileText className="mr-2 h-4 w-4" />
          Templates
        </Button>
      </div>

      {activeTab === "campaigns" && (
        <CampaignList
          currentUserId={currentUserId}
          onViewCampaign={handleViewCampaign}
        />
      )}

      {activeTab === "new" && <CampaignComposer />}

      {activeTab === "templates" && (
        <EmailTemplateList adminUserId={currentUserId} />
      )}
    </div>
  );
}
