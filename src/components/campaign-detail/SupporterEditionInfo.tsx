"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ExternalLink } from "lucide-react";
import { useState } from "react";

interface SupporterEditionInfoProps {
  campaignId: string;
  walletAddress: string;
  hasContributed: boolean;
  editionNumber: number;
  editionMint: string;
}

export function SupporterEditionInfo({ campaignId, walletAddress, hasContributed, editionNumber, editionMint }: SupporterEditionInfoProps) {
  const [loading, setLoading] = useState(false);
  
  if (loading || !hasContributed) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Your Edition NFT
        </CardTitle>
        <CardDescription>
          You own edition #{editionNumber} of this campaign's NFT
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Edition Number:</span>
            <Badge variant="secondary" className="ml-2">
              #{editionNumber}
            </Badge>
          </div>
          
          {editionMint && editionMint !== "11111111111111111111111111111111" && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Edition Mint:</span>
              <a 
                href={`https://explorer.solana.com/address/${editionMint}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on Explorer <ExternalLink className="h-3 w-3 inline" />
              </a>
            </div>
          )}
          
          <div className="bg-primary/10 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">
              This limited edition NFT is yours to keep! It represents your early support
              for this campaign and is one of only 5 editions available.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
