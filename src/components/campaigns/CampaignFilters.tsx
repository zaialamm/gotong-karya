
"use client";

import { Button } from "@/components/ui/button";
import type { CampaignStatus } from "@/types";
import { ListFilter } from "lucide-react";

interface CampaignFiltersProps {
  currentFilter: CampaignStatus | "All";
  onFilterChange: (filter: CampaignStatus | "All") => void;
}

const filterOptions: (CampaignStatus | "All")[] = ["All", "Running", "Successful", "Past", "Failed"];

export function CampaignFilters({ currentFilter, onFilterChange }: CampaignFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 p-4 bg-card rounded-lg shadow">
      <ListFilter className="h-5 w-5 text-primary mr-2 hidden sm:block" />
      <span className="text-sm font-medium text-foreground mr-2 hidden sm:block">Filter by status:</span>
      {filterOptions.map((filter) => (
        <Button
          key={filter}
          variant={currentFilter === filter ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter)}
          className={currentFilter === filter ? "bg-primary text-primary-foreground" : "border-primary/50 text-primary hover:bg-primary/10"}
        >
          {filter}
        </Button>
      ))}
    </div>
  );
}
