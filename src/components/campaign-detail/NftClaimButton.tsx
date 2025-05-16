"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Award, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkNftClaimEligibility, claimNftReward } from "@/lib/web3";
import { storeNftClaimed } from "@/lib/wallet-storage";

interface NftClaimButtonProps {
  campaignId: string;
  walletAddress?: string;
  onClaimed?: () => void;
}

export function NftClaimButton({ campaignId, walletAddress, onClaimed }: NftClaimButtonProps) {
  const [isEligible, setIsEligible] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isClaimed, setIsClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const { toast } = useToast();

  // Check eligibility when component mounts or wallet/campaign changes
  useEffect(() => {
    const checkEligibility = async () => {
      if (!walletAddress) {
        setIsEligible(false);
        setMessage("Please connect your wallet to check eligibility");
        setIsCheckingEligibility(false);
        return;
      }

      try {
        setIsCheckingEligibility(true);
        const eligibility = await checkNftClaimEligibility(campaignId);
        setIsEligible(eligibility.isEligible);
        setMessage(eligibility.message);
        setIsClaimed(eligibility.alreadyClaimed);
      } catch (error) {
        console.error("Error checking NFT claim eligibility:", error);
        setIsEligible(false);
        setMessage("Error checking eligibility. Please try again later.");
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [campaignId, walletAddress]);

  const handleClaimNft = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to claim your NFT.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await claimNftReward(campaignId);

      if (result.success) {
        // Create a nice HTML message with a clickable link to Solana Explorer
        const htmlMessage = (
          <div className="space-y-2">
            <p>Your NFT has been successfully claimed and sent to your wallet.</p>
            <div className="mt-2">
              <a
                href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
              >
                <span>View Transaction on Explorer</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {result.editionMint && (
              <div className="mt-2">
                <a
                  href={`https://explorer.solana.com/address/${result.editionMint}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
                >
                  <span>View NFT on Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        );

        toast({
          title: "NFT Claimed Successfully!",
          description: htmlMessage,
          variant: "default",
          duration: 8000
        });

        // Store the claim status in localStorage
        if (walletAddress) {
          storeNftClaimed(walletAddress, campaignId, result.editionMint || "");
        }

        setIsClaimed(true);
        if (onClaimed) {
          onClaimed();
        }
      } else {
        toast({
          title: "Failed to claim NFT",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error claiming NFT:", error);
      toast({
        title: "Error claiming NFT",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingEligibility) {
    return (
      <Button disabled className="w-full md:w-auto bg-muted text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking eligibility...
      </Button>
    );
  }

  if (isClaimed) {
    return (
      <Button disabled className="w-full md:w-auto bg-green-600 text-white cursor-not-allowed">
        <CheckCircle className="mr-2 h-5 w-5" /> NFT Already Claimed
      </Button>
    );
  }

  if (!isEligible) {
    return (
      <Button 
        disabled 
        className="w-full md:w-auto bg-muted text-muted-foreground cursor-not-allowed"
        title={message}
      >
        <Award className="mr-2 h-5 w-5" /> Not Eligible for NFT
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClaimNft}
      className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white text-base py-6"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Claiming NFT...
        </>
      ) : (
        <>
          <Award className="mr-2 h-5 w-5" /> Claim NFT Reward
        </>
      )}
    </Button>
  );
}
