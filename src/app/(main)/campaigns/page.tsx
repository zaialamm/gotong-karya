
"use client";

import { useState, useMemo, useEffect } from "react";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignFilters } from "@/components/campaigns/CampaignFilters";
import { CAMPAIGNS_DATA } from "@/lib/constants";
import type { Campaign, CampaignStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getRealTimeStatus } from "@/lib/campaign-utils";

export default function CampaignsPage() {
  const [filter, setFilter] = useState<CampaignStatus | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch campaigns from localStorage and mock data
  useEffect(() => {
    const fetchCampaigns = () => {
      try {
        setLoading(true);
        // Import directly to ensure it's available
        const { getUserCampaigns } = require('@/lib/storage');
        // Get user-created campaigns from localStorage
        const userCampaigns = getUserCampaigns();
        console.log('User campaigns from localStorage:', userCampaigns);
        
        // Get mock campaigns (excluding any with same IDs as user campaigns)
        const userCampaignIds = userCampaigns.map((c: Campaign) => c.id);
        const filteredMockCampaigns = CAMPAIGNS_DATA.filter(
          (campaign: Campaign) => !userCampaignIds.includes(campaign.id)
        );
        
        // Combine user campaigns with mock campaigns
        const allCampaigns = [...userCampaigns, ...filteredMockCampaigns];
        setCampaigns(allCampaigns);
        console.log('Total campaigns:', allCampaigns.length);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        setCampaigns(CAMPAIGNS_DATA); // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      // Use real-time status for matching filters
      const realTimeStatus = getRealTimeStatus(campaign);
      const statusMatch = filter === "All" || realTimeStatus === filter;
      
      const searchMatch =
        campaign.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.nftSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return statusMatch && searchMatch;
    });
  }, [campaigns, filter, searchTerm]);

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


      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border border-border overflow-hidden">
              <Skeleton className="h-48 w-full" /> {/* Image skeleton */}
              <div className="p-5 space-y-2">
                <Skeleton className="h-6 w-3/4" /> {/* Title */}
                <Skeleton className="h-4 w-1/2" /> {/* Subtitle */}
                <div className="my-4">
                  <Skeleton className="h-16 w-full" /> {/* Description */}
                </div>
                <Skeleton className="h-8 w-full" /> {/* Button */}
              </div>
            </div>
          ))}
        </div>
      ) : filteredCampaigns.length > 0 ? (
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
