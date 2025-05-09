
"use client";

import Image from "next/image";
import type { Campaign } from "@/types";
import { SOL_TO_IDR_RATE, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tag, Users, TrendingUp, CalendarDays, CheckCircle, AlertTriangle, XCircle, Hourglass } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { projectName, creator, fundingGoalSOL, raisedSOL, status, imageUrl, description, endDate, tokenTicker } = campaign;
  const progressPercentage = (raisedSOL / fundingGoalSOL) * 100;
  const raisedIDR = raisedSOL * SOL_TO_IDR_RATE;
  const goalIDR = fundingGoalSOL * SOL_TO_IDR_RATE;

  const getStatusBadge = () => {
    switch (status) {
      case "Running":
        return <Badge variant="default" className="bg-green-600/80 hover:bg-green-600 text-white"><Hourglass className="mr-1 h-3 w-3" />Running</Badge>;
      case "Successful":
        return <Badge variant="default" className="bg-blue-600/80 hover:bg-blue-600 text-white"><CheckCircle className="mr-1 h-3 w-3" />Successful</Badge>;
      case "Failed":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      case "Past":
         return <Badge variant="secondary"><CalendarDays className="mr-1 h-3 w-3" />Past</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
      <div className="relative h-48 w-full">
        <Image 
          src={imageUrl} 
          alt={projectName} 
          layout="fill" 
          objectFit="cover" 
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={projectName.toLowerCase().includes("jumbo") ? "animation movie" : projectName.toLowerCase().includes("bali") ? "music album" : "street art"}
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold mb-1 text-primary">{projectName}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-sm text-muted-foreground flex items-center">
          <Users className="mr-2 h-4 w-4" /> By {creator.name}
        </CardDescription>
         <Badge variant="outline" className="mt-1 w-fit text-xs">Token: ${tokenTicker}</Badge>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{description}</p>
        
        <div className="space-y-1 text-sm mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Raised:</span>
            <span className="font-medium text-foreground">{raisedSOL.toLocaleString()} {SOL_CURRENCY_SYMBOL}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground/80">
            <span></span>
            <span>({raisedIDR.toLocaleString()} {IDR_CURRENCY_SYMBOL})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Goal:</span>
            <span className="font-medium text-foreground">{fundingGoalSOL.toLocaleString()} {SOL_CURRENCY_SYMBOL}</span>
          </div>
           <div className="flex justify-between text-xs text-muted-foreground/80">
            <span></span>
            <span>({goalIDR.toLocaleString()} {IDR_CURRENCY_SYMBOL})</span>
          </div>
        </div>
        <Progress value={progressPercentage} aria-label={`${progressPercentage.toFixed(0)}% funded`} className="w-full h-2.5" />
        <p className="text-xs text-muted-foreground mt-1 text-right">{progressPercentage.toFixed(0)}% Funded</p>
        {endDate && status === "Running" && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center">
            <CalendarDays className="mr-1 h-3 w-3" /> Ends: {new Date(endDate).toLocaleDateString()}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
          <TrendingUp className="mr-2 h-4 w-4" /> View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
