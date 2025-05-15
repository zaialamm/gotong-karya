"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Award, Clock } from "lucide-react";
import { useState } from "react";

interface EditionNftInfoProps {
  campaignId: string;
  maxEditions: number;
  editionsMinted: number;
  isFunded: boolean;
}

export function EditionNftInfo({ campaignId, maxEditions, editionsMinted, isFunded }: EditionNftInfoProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Limited Edition NFTs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading edition information...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Limited Edition NFTs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">This campaign offers limited edition NFTs to supporters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          Limited Edition NFTs
        </CardTitle>
        <CardDescription>
          This campaign offers {maxEditions} limited edition NFTs to supporters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Editions Minted:</span>
            <Badge variant={editionsMinted === maxEditions ? "destructive" : "outline"} className="ml-2">
              {editionsMinted}/{maxEditions}
            </Badge>
          </div>
          
          {isFunded ? (
            <div className="bg-primary/10 p-3 rounded-md">
              <h4 className="text-sm font-semibold flex items-center mb-2">
                <Award className="h-4 w-4 mr-2 text-primary" />
                Automatic Edition Minting
              </h4>
              <p className="text-xs text-muted-foreground">
                Edition NFTs are automatically assigned to supporters in order of funding.
                First supporter receives edition #1, second gets #2, and so on.
              </p>
            </div>
          ) : (
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-semibold flex items-center mb-2">
                <Clock className="h-4 w-4 mr-2" />
                Waiting for Full Funding
              </h4>
              <p className="text-xs text-muted-foreground">
                Once this campaign is fully funded, edition NFTs will be automatically
                assigned to supporters in order of funding.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
