
"use client";

import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react"; // Renamed to avoid conflict

interface CreatorSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function CreatorSearch({ searchTerm, onSearchChange }: CreatorSearchProps) {
  return (
    <div className="relative w-full max-w-xl mx-auto mb-8">
      <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search creators by name or ID..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-lg bg-card py-3 pl-10 pr-4 text-lg shadow-sm focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
