"use client";

import { FC } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Campaign } from "@/types";
import { Check, Award } from "lucide-react";

interface NftRewardDisplayProps {
  campaign: Campaign;
  isPreview?: boolean;
}

export const NftRewardDisplay: FC<NftRewardDisplayProps> = ({ 
  campaign,
  isPreview = false 
}) => {
  const { nftName, nftDescription, imageUrl, nftAttributes, benefits } = campaign;

  return (
    <Card className="w-full overflow-hidden shadow-lg border-2 border-primary/20 bg-gradient-to-br from-card to-card/90">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-primary">NFT Reward</CardTitle>
          {!isPreview && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Award className="h-3.5 w-3.5 mr-1 text-primary" />
              For Supporters
            </Badge>
          )}
        </div>
        <CardDescription>
          Support this campaign to receive this exclusive NFT
        </CardDescription>
      </CardHeader>
      <div className="relative h-56 w-full">
        <Image
          src={imageUrl}
          alt={nftName || "Campaign NFT"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {isPreview && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold text-lg">
            Preview
          </div>
        )}
      </div>
      <CardContent className="pt-4 space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{nftName}</h3>
          <p className="text-sm text-muted-foreground mt-1">{nftDescription}</p>
        </div>

        {nftAttributes && nftAttributes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Attributes</h4>
            <div className="flex flex-wrap gap-2">
              {nftAttributes.map((attr, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Supporter Benefits</h4>
          <ul className="space-y-1.5">
            {benefits?.map((benefit, index) => (
              <li key={index} className="flex items-start text-sm">
                <Check className="h-4 w-4 mr-2 text-primary shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
