
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign } from "@/types";
import { fundCampaign } from "@/lib/web3"; // Mock function
import { useToast } from "@/hooks/use-toast";
import { SOL_CURRENCY_SYMBOL, IDR_CURRENCY_SYMBOL } from "@/lib/constants";
import { Send, Sparkles, RefreshCw, Coins, Gift, Loader2 } from "lucide-react";
import { cn, formatToIDR, parseFromIDR } from "@/lib/utils";
import { useSolToIdrRate } from "@/hooks/use-sol-to-idr-rate";
import { useWallet } from "@/hooks/use-wallet"; // Import wallet hook
import { storeFundedCampaign } from "@/lib/wallet-storage"; // Import helper function

interface FundModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundModal({ campaign, isOpen, onOpenChange }: FundModalProps) {
  const [amountSOL, setAmountSOL] = useState<number>(0.5); // Default to 0.5 SOL
  const [isFunding, setIsFunding] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useWallet(); // Get wallet info
  const [idrEquivalentDisplay, setIdrEquivalentDisplay] = useState<string>(`Enter a valid ${SOL_CURRENCY_SYMBOL} amount`);
  const [editionNumber, setEditionNumber] = useState<number | null>(null); // For NFT edition number

  const {
    liveRate: liveSolToIdrRate,
    isLoading: isLoadingRate,
    error: rateError,
    effectiveRate,
    FALLBACK_SOL_TO_IDR_RATE: hookFallbackRate
  } = useSolToIdrRate();


  useEffect(() => {
    const currentSOLAmount = typeof amountSOL === 'number' && !isNaN(amountSOL) ? amountSOL : 0;
    
    if (!isOpen) {
        setEditionNumber(null);
        return;
    }
    
    let currentIDREquivalent = 0;
    if (isLoadingRate) {
        setIdrEquivalentDisplay(`Fetching live ${SOL_CURRENCY_SYMBOL}/${IDR_CURRENCY_SYMBOL} rate...`);
    } else if (rateError) {
        currentIDREquivalent = (currentSOLAmount > 0 && hookFallbackRate > 0) ? (currentSOLAmount * hookFallbackRate) : 0;
        const displayRate = `(Fallback: 1 ${SOL_CURRENCY_SYMBOL} = ${hookFallbackRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`;
        if (currentIDREquivalent > 0) {
            setIdrEquivalentDisplay(`≈ ${formatToIDR(currentIDREquivalent)} ${displayRate}`);
        } else {
            setIdrEquivalentDisplay(`Error fetching rate. ${displayRate}`);
        }
    } else if (liveSolToIdrRate) {
        currentIDREquivalent = (currentSOLAmount > 0 && liveSolToIdrRate > 0) ? (currentSOLAmount * liveSolToIdrRate) : 0;
        if (currentIDREquivalent > 0) {
            setIdrEquivalentDisplay(`≈ ${formatToIDR(currentIDREquivalent)} (Live rate: 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
        } else {
            setIdrEquivalentDisplay(`Enter ${SOL_CURRENCY_SYMBOL} amount. (Live rate: 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
        }
    } else { 
        currentIDREquivalent = (currentSOLAmount > 0 && hookFallbackRate > 0) ? (currentSOLAmount * hookFallbackRate) : 0;
        if (currentIDREquivalent > 0) {
            setIdrEquivalentDisplay(`≈ ${formatToIDR(currentIDREquivalent)} (Using fallback rate: ${hookFallbackRate.toLocaleString()})`);
        } else {
            setIdrEquivalentDisplay(`Enter a valid ${SOL_CURRENCY_SYMBOL} amount`);
        }
    }

    // Determine if user would qualify for an NFT edition
    // The minimum SOL required for an NFT is typically defined in the campaign
    // For now, we'll use a simple threshold of 0.1 SOL
    const minimumSOLForNFT = 0.1;
    
    if (currentSOLAmount >= minimumSOLForNFT) {
        // For display purposes, we'll show a potential edition number
        // In a real implementation, this would be determined by the smart contract
        // based on funding order
        const currentEditions = campaign.editionNftInfo?.editionsMinted || 0;
        const maxEditions = campaign.editionNftInfo?.maxEditions || 10;
        
        // Only show next edition if not all are minted
        if (currentEditions < maxEditions) {
            setEditionNumber(currentEditions + 1);
        } else {
            setEditionNumber(null); // All editions minted
        }
    } else {
        setEditionNumber(null);
    }
  }, [amountSOL, liveSolToIdrRate, isLoadingRate, rateError, hookFallbackRate, isOpen, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL, campaign.editionNftInfo, effectiveRate]);

  const handleFund = async () => {
    if (!campaign) return;

    if (amountSOL < 0.1) {
      toast({
        title: "Error",
        description: `Minimum amount to support is 0.1 SOL.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if this wallet has already funded this campaign
    console.log('Checking if wallet has already supported:', address);
    console.log('Campaign supporters:', campaign.supporters);
    
    const hasAlreadySupported = campaign.supporters && 
      campaign.supporters.some(s => {
        const isMatch = s.walletAddress === address;
        console.log('Comparing:', s.walletAddress, 'with current wallet:', address, 'Match:', isMatch);
        return isMatch;
      });
    
    if (hasAlreadySupported) {
      console.log('This wallet has already supported this campaign');
      toast({
        title: "Already Supported",
        description: "You've already supported this campaign! Currently our platform only allows one contribution per wallet.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsFunding(true);
    try {
      console.log(`Funding with ${amountSOL.toFixed(4)} SOL`);
      const result = await fundCampaign(campaign.id, amountSOL, "SOL"); // fundCampaign uses SOL amount directly now
      
      // Create a nice HTML message with a clickable link to Solana Explorer
      const htmlMessage = (
        <div>
          <p>{result.message}</p>
          <p className="mt-2">
            <a 
              href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary font-medium hover:text-primary/90"
            >
              View Transaction on Explorer
            </a>
          </p>
        </div>
      );
      
      toast({
        title: "Funding Successful!",
        description: htmlMessage,
        duration: 5000, // Shortened duration since we'll refresh the page
      });
      
      // Store this campaign as funded by the current wallet
      if (address) {
        storeFundedCampaign(address, campaign.id);
        console.log('Campaign marked as funded by current wallet');
      }
      
      onOpenChange(false);
      setAmountSOL(0.5); // Reset to default
      
      // Set a longer timeout before refreshing the page to give user time to click the transaction link
      setTimeout(() => {
        window.location.reload();
      }, 10000); // Refresh after 10 seconds so user has time to click the transaction link
      setEditionNumber(null);
    } catch (error) {
      console.error("Funding error:", error);
      toast({ title: "Funding Failed", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) { 
        setAmountSOL(0.5);
        setEditionNumber(null);
      }
    }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center">
            <Sparkles className="mr-2 h-6 w-6" />
            Support {campaign.projectName}
          </DialogTitle>
          <DialogDescription>
            Support {campaign.creator.name} by contributing {SOL_CURRENCY_SYMBOL} to their campaign.
            {campaign.editionNftInfo?.maxEditions > 0 && 
              `Support with at least 0.1 ${SOL_CURRENCY_SYMBOL} to receive an exclusive NFT (${campaign.editionNftInfo.editionsMinted}/${campaign.editionNftInfo.maxEditions} minted).`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
            <Label htmlFor="amountSOL" className="text-right col-span-1">
              Amount ({SOL_CURRENCY_SYMBOL})
            </Label>
            <Input
              id="amountSOL"
              type="number"
              value={amountSOL}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setAmountSOL(isNaN(val) ? 0 : val);
              }}
              step="0.1"
              min="0.1"
              className="col-span-2"
              placeholder="0.5"
              disabled={isLoadingRate || isFunding}
            />
            <div/> 
            <div className="col-span-2 text-xs text-muted-foreground flex items-center min-h-[1.5rem] pt-1">
                <RefreshCw className={cn("mr-1.5 h-3 w-3 text-primary", isLoadingRate && "animate-spin")}/>
                <span>{idrEquivalentDisplay}</span>
            </div>
            {editionNumber && campaign.editionNftInfo?.maxEditions > 0 && (
              <>
                <div className="col-span-1"/> {/* Spacer */}
                <div className="col-span-2 text-xs text-primary flex items-center min-h-[1.5rem] pt-1 font-medium">
                    <Gift className="mr-1.5 h-3 w-3 text-primary"/>
                    <span>You'll receive NFT edition #{editionNumber} of {campaign.editionNftInfo.maxEditions}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isFunding}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleFund} 
            disabled={isFunding || isLoadingRate || amountSOL < 0.1}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isFunding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Support with {amountSOL.toFixed(2)} {SOL_CURRENCY_SYMBOL}
                {editionNumber && <span className="ml-1">🎁</span>}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
