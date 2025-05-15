"use client";

import { FC } from "react";
import Image from "next/image";
import { useWallet } from "@/hooks/use-wallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Award } from "lucide-react";
import type { CampaignNft } from "@/types";

interface SupporterNftCollectionProps {
  userNfts?: CampaignNft[];
  isLoading?: boolean;
}

export const SupporterNftCollection: FC<SupporterNftCollectionProps> = ({ 
  userNfts = [],
  isLoading = false 
}) => {
  const { isConnected, address } = useWallet();

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your NFT Collection</CardTitle>
          <CardDescription>
            Connect your wallet to view your NFT collection
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your NFT Collection</CardTitle>
          <CardDescription>
            Loading your NFTs...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (userNfts.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your NFT Collection</CardTitle>
          <CardDescription>
            You haven't received any campaign NFTs yet. Support a campaign to receive an exclusive NFT!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Your NFT Collection
        </CardTitle>
        <CardDescription>
          Exclusive NFTs you've received for supporting campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userNfts.map((nft) => (
            <Card key={nft.mintAddress} className="overflow-hidden border border-primary/10 bg-card/50">
              <div className="relative h-40 w-full">
                <Image
                  src={nft.imageUri}
                  alt={nft.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-base">{nft.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{nft.description}</p>
                
                {nft.attributes && nft.attributes.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {nft.attributes.map((attr, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                          <Sparkles className="h-3 w-3 mr-1 text-primary/70" />
                          {attr.trait_type}: {attr.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
