
"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { CAMPAIGNS_DATA, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import type { Campaign } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSolToIdrRate } from "@/hooks/use-sol-to-idr-rate";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarDays, CheckCircle, Users, Tag, Hourglass, XCircle, HandCoins, Gift } from "lucide-react";
import { FundModal } from "@/components/support-creators/FundModal";
import { useState, useEffect } from "react";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);

  useEffect(() => {
    if (campaignId) {
      const foundCampaign = CAMPAIGNS_DATA.find((c) => c.id === campaignId);
      setCampaign(foundCampaign);
      setIsLoadingCampaign(false);
    }
  }, [campaignId]);

  const { effectiveRate, isLoading: isLoadingRate } = useSolToIdrRate();

  if (isLoadingCampaign) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-72 w-full" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive">Campaign Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The campaign you are looking for does not exist or may have been moved.
        </p>
        <Button onClick={() => router.push("/campaigns")} variant="outline" className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
        </Button>
      </div>
    );
  }

  const { projectName, creator, fundingGoalSOL, raisedSOL, status, imageUrl, description, endDate, tokenTicker, tokenName, benefits } = campaign;
  const progressPercentage = (raisedSOL / fundingGoalSOL) * 100;
  const raisedIDR = raisedSOL * effectiveRate;
  const goalIDR = fundingGoalSOL * effectiveRate;

  const getStatusBadgeDetails = () => {
    switch (status) {
      case "Running":
        return <Badge variant="default" className="bg-green-600/80 hover:bg-green-600 text-white text-sm px-3 py-1"><Hourglass className="mr-2 h-4 w-4" />Running</Badge>;
      case "Successful":
        return <Badge variant="default" className="bg-blue-600/80 hover:bg-blue-600 text-white text-sm px-3 py-1"><CheckCircle className="mr-2 h-4 w-4" />Successful</Badge>;
      case "Failed":
        return <Badge variant="destructive" className="text-sm px-3 py-1"><XCircle className="mr-2 h-4 w-4" />Failed</Badge>;
      case "Past":
         return <Badge variant="secondary" className="text-sm px-3 py-1"><CalendarDays className="mr-2 h-4 w-4" />Past</Badge>;
      default:
        return <Badge variant="outline" className="text-sm px-3 py-1">{status}</Badge>;
    }
  };

  return (
    <>
    <div className="space-y-8">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="overflow-hidden shadow-xl bg-card">
        <div className="relative h-64 md:h-96 w-full">
          <Image
            src={imageUrl}
            alt={projectName}
            layout="fill"
            objectFit="cover"
            data-ai-hint={projectName.toLowerCase().includes("jumbo") ? "animation movie" : projectName.toLowerCase().includes("bali") ? "music album" : "street art"}
            priority
          />
        </div>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
            <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{projectName}</CardTitle>
            {getStatusBadgeDetails()}
          </div>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            {tokenName} (${tokenTicker})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">About the Project</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{description}</p>
              
              {benefits && benefits.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-primary mb-3 flex items-center">
                    <Gift className="mr-2 h-5 w-5" /> Supporter Benefits
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-foreground/80 pl-2">
                    {benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Card className="bg-background/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint="creator avatar"/>
                  <AvatarFallback>{creator.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <p className="font-semibold text-foreground">{creator.name}</p>
                </div>
              </div>
              <hr className="border-border"/>
              <div>
                <p className="text-sm text-muted-foreground">Funding Progress</p>
                <Progress value={progressPercentage} aria-label={`${progressPercentage.toFixed(0)}% funded`} className="w-full h-3 my-1.5" />
                <p className="text-xs text-foreground text-right">{progressPercentage.toFixed(0)}% Funded</p>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Raised:</span>
                  <span className="font-medium text-foreground">{raisedSOL.toLocaleString()} {SOL_CURRENCY_SYMBOL}</span>
                </div>
                 <div className="flex justify-between text-xs text-muted-foreground/80">
                    <span></span>
                    {isLoadingRate ? <Skeleton className="h-4 w-24 inline-block" /> : <span>({raisedIDR.toLocaleString()} {IDR_CURRENCY_SYMBOL})</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goal:</span>
                  <span className="font-medium text-foreground">{fundingGoalSOL.toLocaleString()} {SOL_CURRENCY_SYMBOL}</span>
                </div>
                 <div className="flex justify-between text-xs text-muted-foreground/80">
                    <span></span>
                    {isLoadingRate ? <Skeleton className="h-4 w-24 inline-block" /> : <span>({goalIDR.toLocaleString()} {IDR_CURRENCY_SYMBOL})</span>}
                </div>
              </div>
              {endDate && (
                <div className="text-sm flex items-center text-muted-foreground">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <span>{status === "Running" ? `Ends: ${new Date(endDate).toLocaleDateString()}` : `Ended: ${new Date(endDate).toLocaleDateString()}`}</span>
                </div>
              )}
            </Card>
          </div>
          
        </CardContent>
        {status === "Running" && (
            <CardFooter>
                <Button onClick={() => setIsFundModalOpen(true)} size="lg" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-base py-6">
                    <HandCoins className="mr-2 h-5 w-5" /> Support this Project
                </Button>
            </CardFooter>
        )}
      </Card>

       {/* Add sections for updates, FAQ, comments if needed in future */}
    </div>
    {campaign && status === "Running" && (
        <FundModal
          campaign={campaign}
          isOpen={isFundModalOpen}
          onOpenChange={setIsFundModalOpen}
        />
      )}
    </>
  );
}
