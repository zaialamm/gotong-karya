
"use client";

import { useState, useMemo } from "react";
import { CREATORS_DATA, CAMPAIGNS_DATA } from "@/lib/constants";
import type { Creator, Campaign } from "@/types";
import { CreatorSearch } from "@/components/support-creators/CreatorSearch";
import { CreatorCampaignCard } from "@/components/support-creators/CreatorCampaignCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSearch } from "lucide-react";

export default function SupportCreatorsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCreators = useMemo(() => {
    if (!searchTerm) {
      return CREATORS_DATA; // Show all creators if no search term
    }
    return CREATORS_DATA.filter(
      (creator) =>
        creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const getCampaignsByCreator = (creatorId: string): Campaign[] => {
    return CAMPAIGNS_DATA.filter((campaign) => campaign.creator.id === creatorId && campaign.status === "Running");
  };

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Support Your Favorite Creators
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/80 sm:mt-6">
          Find creators and fund their innovative projects.
        </p>
      </section>

      <CreatorSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {filteredCreators.length > 0 ? (
        <div className="space-y-10">
          {filteredCreators.map((creator) => {
            const activeCampaigns = getCampaignsByCreator(creator.id);
            return (
              <Card key={creator.id} className="shadow-lg bg-card">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint="creator avatar" />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                      {creator.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl text-primary">{creator.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">Creator ID: {creator.id}</CardDescription>
                  </div>
                </CardHeader>
                {activeCampaigns.length > 0 && (
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Active Campaigns:</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {activeCampaigns.map((campaign) => (
                        <CreatorCampaignCard key={campaign.id} campaign={campaign} />
                      ))}
                    </div>
                  </CardContent>
                )}
                {activeCampaigns.length === 0 && (
                   <CardContent>
                     <p className="text-muted-foreground">This creator has no active campaigns at the moment.</p>
                   </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
         <div className="text-center py-12">
          <UserSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No creators found matching "{searchTerm}".</p>
          <p className="text-sm text-muted-foreground/80 mt-2">Try a different name or ID.</p>
        </div>
      )}
    </div>
  );
}
