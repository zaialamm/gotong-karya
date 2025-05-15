
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
import { ArrowLeft, CalendarDays, CheckCircle, Users, Tag, Hourglass, XCircle, HandCoins, Gift, Sparkles, Loader2, Coins } from "lucide-react";
import { FundModal } from "@/components/support-creators/FundModal";
import { useState, useEffect, useCallback } from "react";
import { EditionNftInfo } from "@/components/campaign-detail/EditionNftInfo";
import { SupporterEditionInfo } from "@/components/campaign-detail/SupporterEditionInfo";
import { useWallet } from "@/hooks/use-wallet";
import { getRealTimeStatus, formatCampaignTimeRemaining, isMockCampaign } from "@/lib/campaign-utils";
import { hasFundedCampaign } from "@/lib/wallet-storage";
import { withdrawCampaignFunds } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);
  const [realTimeStatus, setRealTimeStatus] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [hasWithdrawn, setHasWithdrawn] = useState(false);

  useEffect(() => {
    if (campaignId) {
      // First check if campaign exists in mock data
      let foundCampaign = CAMPAIGNS_DATA.find((c) => c.id === campaignId);
      
      // If not found in mock data, check localStorage for user-created campaigns
      if (!foundCampaign && typeof window !== 'undefined') {
        try {
          // Import the storage utility
          const { getUserCampaigns } = require('@/lib/storage');
          const userCampaigns = getUserCampaigns();
          foundCampaign = userCampaigns.find((c) => c.id === campaignId);
          console.log('Checking localStorage for campaign:', campaignId, foundCampaign ? 'Found' : 'Not found');
        } catch (error) {
          console.error('Error fetching campaign from localStorage:', error);
        }
      }
      
      setCampaign(foundCampaign);
      
      if (foundCampaign) {
        // Set initial real-time status and time remaining
        setRealTimeStatus(getRealTimeStatus(foundCampaign));
        setTimeRemaining(formatCampaignTimeRemaining(foundCampaign));
      }
      
      setIsLoadingCampaign(false);
    }
  }, [campaignId]);
  
  // Check if the current user is the creator of this campaign
  // Access the walletAddress property of the creator object
  const isCreator = address && campaign?.creator?.walletAddress === address;
  
  // Debug logs to diagnose creator address comparison
  console.log("Creator check:", {
    connectedAddress: address,
    campaignCreator: campaign?.creator?.walletAddress,
    isMatch: campaign?.creator?.walletAddress === address,
    raisedSOL: campaign?.raisedSOL,
    fundingGoalSOL: campaign?.fundingGoalSOL,
    isFunded: campaign?.raisedSOL >= campaign?.fundingGoalSOL,
    realTimeStatus,
    showWithdrawButton: isCreator && (realTimeStatus === "Successful" || (campaign && campaign.raisedSOL >= campaign.fundingGoalSOL))
  });
  
  // Handle fund withdrawal for campaign creator
  const handleWithdrawFunds = async () => {
    if (!isConnected || !address || !isCreator) {
      toast({
        title: "Cannot withdraw funds",
        description: "You must be the campaign creator and the campaign must be fully funded.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsWithdrawing(true);
      
      const result = await withdrawCampaignFunds(campaignId);
      
      if (result.success) {
        toast({
          title: "Funds withdrawn successfully!",
          description: "The funds have been transferred to your wallet (minus the 2.5% platform fee).",
          variant: "success"
        });
        setHasWithdrawn(true);
      }
    } catch (error: any) {
      console.error("Error withdrawing funds:", error);
      toast({
        title: "Withdrawal failed",
        description: error.message || "There was an error withdrawing funds. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsWithdrawing(false);
    }
  };
  
  useEffect(() => {
    if (campaign) {
      // Set initial values
      setIsLoadingCampaign(false);
      setRealTimeStatus(getRealTimeStatus(campaign));
      setTimeRemaining(formatCampaignTimeRemaining(campaign));
      
      // Update the real-time status and time remaining every second
      const interval = setInterval(() => {
        if (campaign) {
          const status = getRealTimeStatus(campaign);
          setRealTimeStatus(status);
          setTimeRemaining(formatCampaignTimeRemaining(campaign));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [campaign]);

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
    switch (realTimeStatus || status) {
      case "Running":
        return (
          <div className="flex flex-col gap-2">
            <Badge variant="default" className="bg-green-600/80 hover:bg-green-600 text-white text-sm px-3 py-1">
              <Hourglass className="mr-2 h-4 w-4" />Running
            </Badge>
            {timeRemaining !== 'No end date' && timeRemaining !== 'Expired' && (
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="mr-2 h-4 w-4 text-primary/70" />
                {timeRemaining}
              </div>
            )}
          </div>
        );
      case "Successful":
        return <Badge variant="default" className="bg-blue-600/80 hover:bg-blue-600 text-white text-sm px-3 py-1"><CheckCircle className="mr-2 h-4 w-4" />Successful</Badge>;
      case "Failed":
        return (
          <div className="flex flex-col gap-2">
            <Badge variant="destructive" className="text-sm px-3 py-1"><XCircle className="mr-2 h-4 w-4" />Failed</Badge>
            {timeRemaining === 'Expired' && (
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="mr-2 h-4 w-4 text-destructive/70" />
                Campaign expired
              </div>
            )}
          </div>
        );

      default:
        return <Badge variant="outline" className="text-sm px-3 py-1">{realTimeStatus || status}</Badge>;
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
                  <span>
                    {campaign && isMockCampaign(campaign) ? 
                      // For mock campaigns, show different dates based on their ID
                      (realTimeStatus === "Running" ? 
                        `Ends: ${(parseInt(campaign.id.replace('campaign', '')) * 5 + 20)}/01/2026` : 
                        `Ended: ${(parseInt(campaign.id.replace('campaign', '')) * 3 + 15)}/12/2025`
                      ) : 
                      // For real campaigns, show actual dates
                      (realTimeStatus === "Running" ? 
                        `Ends: ${new Date(endDate).toLocaleDateString()}` : 
                        `Ended: ${new Date(endDate).toLocaleDateString()}`
                      )
                    }
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* Edition NFT Information Section */}
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" /> Edition NFT Rewards
            </h2>
            
            {/* Display information about the edition NFTs */}
            <EditionNftInfo 
              campaignId={campaignId}
              maxEditions={5} // This would come from the campaign data in a real implementation
              editionsMinted={campaign?.supporters?.length || 0} // This would come from the campaign data
              isFunded={status === "Successful" || status === "Completed"}
            />

            {/* Display the supporter's edition NFT if they have contributed */}
            {isConnected && address && (
              <SupporterEditionInfo
                campaignId={campaignId}
                walletAddress={address}
                hasContributed={campaign?.supporters?.some(s => s.walletAddress === address) || false}
                editionNumber={campaign?.supporters?.findIndex(s => s.walletAddress === address) + 1 || 0}
                editionMint="" // This would come from the blockchain in a real implementation
              />
            )}
          </div>
          
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
            {/* Show withdraw button for creator when campaign is fully funded */}
            {isCreator && (realTimeStatus === "Successful" || (campaign && campaign.raisedSOL >= campaign.fundingGoalSOL)) && !hasWithdrawn && (
              <Button 
                onClick={handleWithdrawFunds} 
                size="lg" 
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white text-base py-6"
                disabled={isWithdrawing}
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-5 w-5" /> Withdraw Funds
                  </>
                )}
              </Button>
            )}

            {/* Show already withdrawn message for creator */}
            {isCreator && (realTimeStatus === "Successful" || (campaign && campaign.raisedSOL >= campaign.fundingGoalSOL)) && hasWithdrawn && (
              <Button 
                size="lg" 
                className="w-full md:w-auto bg-muted text-muted-foreground text-base py-6 cursor-not-allowed"
                disabled
              >
                <CheckCircle className="mr-2 h-5 w-5" /> Funds Withdrawn
              </Button>
            )}
            
            {/* Support button - only show during active campaign */}
            {realTimeStatus === "Running" && (
              <>
                {address && hasFundedCampaign(address, campaignId) ? (
                  // Already supported button - disabled
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto bg-muted text-muted-foreground text-base py-6 cursor-not-allowed"
                    disabled
                  >
                    <CheckCircle className="mr-2 h-5 w-5" /> Already Supported
                  </Button>
                ) : (
                  // Standard support button
                  <Button 
                    onClick={() => setIsFundModalOpen(true)} 
                    size="lg" 
                    className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-base py-6"
                  >
                    <HandCoins className="mr-2 h-5 w-5" /> Support this Project
                    {timeRemaining !== 'No end date' && timeRemaining !== 'Expired' && (
                      <span className="ml-2 text-xs bg-accent-foreground/20 px-2 py-1 rounded-full">{timeRemaining}</span>
                    )}
                  </Button>
                )}
              </>
            )}
        </CardFooter>
      </Card>

       {/* Add sections for updates, FAQ, comments if needed in future */}
    </div>
    {campaign && realTimeStatus === "Running" && (
        <FundModal
          campaign={campaign}
          isOpen={isFundModalOpen}
          onOpenChange={setIsFundModalOpen}
        />
      )}
    </>
  );
}

