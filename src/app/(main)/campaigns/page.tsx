
"use client";

import { useState, useMemo } from "react";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignFilters } from "@/components/campaigns/CampaignFilters";
import { CAMPAIGNS_DATA } from "@/lib/constants";
import type { Campaign, CampaignStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function CampaignsPage() {
  const [filter, setFilter] = useState<CampaignStatus | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCampaigns = useMemo(() => {
    return CAMPAIGNS_DATA.filter((campaign) => {
      const statusMatch = filter === "All" || campaign.status === filter;
      const searchMatch =
        campaign.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.tokenTicker.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [filter, searchTerm]);

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Discover Campaigns
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/80 sm:mt-6">
          Explore innovative projects and support creators on GotongKarya.
        </p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search campaigns, creators, or tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
         <CampaignFilters currentFilter={filter} onFilterChange={setFilter} />
      </div>


      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No campaigns match your criteria.</p>
          <p className="text-sm text-muted-foreground/80 mt-2">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
}
