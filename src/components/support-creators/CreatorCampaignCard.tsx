
"use client";

import { useState } from "react";
import Image from "next/image";
import type { Campaign } from "@/types";
import { SOL_TO_IDR_RATE, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FundModal } from "./FundModal";
import { Badge } from "@/components/ui/badge";
import { HandCoins, Users, Tag, CalendarDays } from "lucide-react";

interface CreatorCampaignCardProps {
  campaign: Campaign;
}

export function CreatorCampaignCard({ campaign }: CreatorCampaignCardProps) {
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);

  const { projectName, fundingGoalSOL, raisedSOL, status, imageUrl, description, tokenTicker, endDate } = campaign;
  const progressPercentage = (raisedSOL / fundingGoalSOL) * 100;
  const raisedIDR = raisedSOL * SOL_TO_IDR_RATE;

  return (
    <>
      <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
        <div className="relative h-40 w-full">
          <Image 
            src={imageUrl} 
            alt={projectName} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint={projectName.toLowerCase().includes("jumbo") ? "animation movie" : projectName.toLowerCase().includes("bali") ? "music album" : "street art"}
          />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-primary">{projectName}</CardTitle>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <Badge variant="outline" className="text-xs"><Tag className="mr-1 h-3 w-3" />Token: ${tokenTicker}</Badge>
            {status === "Running" && endDate && (
                <span className="flex items-center"><CalendarDays className="mr-1 h-3 w-3" /> Ends: {new Date(endDate).toLocaleDateString()}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow text-sm text-foreground/80 pb-3">
          <p className="line-clamp-3 mb-3">{description}</p>
          <div className="space-y-1 text-xs mb-2">
            <div className="flex justify-between">
              <span>Raised: {raisedSOL.toLocaleString()} {SOL_CURRENCY_SYMBOL} ({raisedIDR.toLocaleString()} {IDR_CURRENCY_SYMBOL})</span>
            </div>
            <div className="flex justify-between">
              <span>Goal: {fundingGoalSOL.toLocaleString()} {SOL_CURRENCY_SYMBOL}</span>
            </div>
          </div>
          <Progress value={progressPercentage} aria-label={`${progressPercentage.toFixed(0)}% funded`} className="w-full h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">{progressPercentage.toFixed(0)}% Funded</p>
        </CardContent>
        <CardFooter>
          {status === "Running" ? (
            <Button onClick={() => setIsFundModalOpen(true)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <HandCoins className="mr-2 h-4 w-4" /> Fund Now
            </Button>
          ) : (
            <Button disabled className="w-full">
              Campaign {status}
            </Button>
          )}
        </CardFooter>
      </Card>
      {status === "Running" && (
        <FundModal
          campaign={campaign}
          isOpen={isFundModalOpen}
          onOpenChange={setIsFundModalOpen}
        />
      )}
    </>
  );
}
