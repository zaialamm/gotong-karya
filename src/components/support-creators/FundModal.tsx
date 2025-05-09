
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
import { Send, Sparkles, RefreshCw, Coins } from "lucide-react";
import { cn, formatToIDR, parseFromIDR } from "@/lib/utils";
import { useSolToIdrRate } from "@/hooks/use-sol-to-idr-rate";

interface FundModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundModal({ campaign, isOpen, onOpenChange }: FundModalProps) {
  const [numericAmountIDR, setNumericAmountIDR] = useState<number>(80000); 
  const [isFunding, setIsFunding] = useState(false);
  const { toast } = useToast();
  const [solEquivalentDisplay, setSolEquivalentDisplay] = useState<string>(`Enter a valid ${IDR_CURRENCY_SYMBOL} amount`);
  const [estimatedTokens, setEstimatedTokens] = useState<number>(0);

  const {
    liveRate: liveSolToIdrRate,
    isLoading: isLoadingRate,
    error: rateError,
    effectiveRate,
    FALLBACK_SOL_TO_IDR_RATE: hookFallbackRate
  } = useSolToIdrRate();


  useEffect(() => {
    const currentNumericAmount = typeof numericAmountIDR === 'number' && !isNaN(numericAmountIDR) ? numericAmountIDR : 0;
    
    if (!isOpen) {
        setEstimatedTokens(0);
        return;
    }
    
    let currentSolEquivalent = 0;
    if (isLoadingRate) {
        setSolEquivalentDisplay(`Fetching live ${SOL_CURRENCY_SYMBOL}/${IDR_CURRENCY_SYMBOL} rate...`);
    } else if (rateError) {
        currentSolEquivalent = (currentNumericAmount > 0 && hookFallbackRate > 0) ? (currentNumericAmount / hookFallbackRate) : 0;
        const displayRate = `(Fallback: 1 ${SOL_CURRENCY_SYMBOL} = ${hookFallbackRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`;
        if (currentSolEquivalent > 0) {
            setSolEquivalentDisplay(`${currentSolEquivalent.toFixed(4)} ${SOL_CURRENCY_SYMBOL}. ${displayRate}`);
        } else {
            setSolEquivalentDisplay(`Error fetching rate. ${displayRate}`);
        }
    } else if (liveSolToIdrRate) {
        currentSolEquivalent = (currentNumericAmount > 0 && liveSolToIdrRate > 0) ? (currentNumericAmount / liveSolToIdrRate) : 0;
        if (currentSolEquivalent > 0) {
            setSolEquivalentDisplay(`${currentSolEquivalent.toFixed(4)} ${SOL_CURRENCY_SYMBOL} (Live rate: 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
        } else {
            setSolEquivalentDisplay(`Enter ${IDR_CURRENCY_SYMBOL} amount. (Live rate: 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
        }
    } else { 
        currentSolEquivalent = (currentNumericAmount > 0 && hookFallbackRate > 0) ? (currentNumericAmount / hookFallbackRate) : 0;
        if (currentSolEquivalent > 0) {
            setSolEquivalentDisplay(`${currentSolEquivalent.toFixed(4)} ${SOL_CURRENCY_SYMBOL} (Using fallback rate: ${hookFallbackRate.toLocaleString()})`);
        } else {
            setSolEquivalentDisplay(`Enter a valid ${IDR_CURRENCY_SYMBOL} amount`);
        }
    }

    // Calculate estimated tokens
    let tokens = 0;
    if (currentSolEquivalent > 0) {
        // This logic should mirror the token issuance logic in lib/web3.ts fundCampaign
        if (campaign.tokenTicker === "JUMBO") {
            tokens = currentSolEquivalent * 200;
        } else if (campaign.tokenTicker === "BALI") {
            tokens = currentSolEquivalent * 150;
        } else if (campaign.tokenTicker === "MURAL") {
            tokens = currentSolEquivalent * 100;
        } else {
            // Generic fallback for other potential campaign tokens if not specified
            // Or assume a default rate if the campaign object had a 'tokensPerSOL' field
            tokens = currentSolEquivalent * 50; 
        }
    }
    setEstimatedTokens(parseFloat(tokens.toFixed(2)));

  }, [numericAmountIDR, liveSolToIdrRate, isLoadingRate, rateError, hookFallbackRate, isOpen, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL, campaign.tokenTicker, effectiveRate]);

  const handleFund = async () => {
    if (isNaN(numericAmountIDR) || numericAmountIDR <= 0) {
      toast({ title: "Invalid Amount", description: `Please enter a valid positive ${IDR_CURRENCY_SYMBOL} amount.`, variant: "destructive" });
      return;
    }
    if (effectiveRate <= 0) {
      toast({ title: "Configuration Error", description: `${SOL_CURRENCY_SYMBOL} to ${IDR_CURRENCY_SYMBOL} rate is not configured correctly, is zero, or not loaded.`, variant: "destructive" });
      return;
    }

    const solAmountToFund = numericAmountIDR / effectiveRate;
    if (solAmountToFund <= 0) {
        toast({ title: "Invalid Amount", description: `Calculated ${SOL_CURRENCY_SYMBOL} amount is too small to fund. Please increase the ${IDR_CURRENCY_SYMBOL} amount.`, variant: "destructive" });
        return;
    }

    setIsFunding(true);
    try {
      console.log(`Funding with ${solAmountToFund.toFixed(4)} SOL (from ${numericAmountIDR} IDR at rate ${effectiveRate})`);
      const result = await fundCampaign(campaign.id, solAmountToFund, "SOL"); // fundCampaign uses SOL amount
      toast({
        title: "Funding Successful!",
        description: result.message, 
        duration: 7000, 
      });
      onOpenChange(false); 
      setNumericAmountIDR(80000); 
      setEstimatedTokens(0);
    } catch (error) {
      console.error("Funding error:", error);
      toast({ title: "Funding Failed", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsFunding(false);
    }
  };
  
  const solEquivalentForButton = !isNaN(numericAmountIDR) && numericAmountIDR > 0 && effectiveRate > 0
    ? (numericAmountIDR / effectiveRate)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) { 
        setNumericAmountIDR(80000);
        setEstimatedTokens(0);
      }
    }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center">
            <Sparkles className="mr-2 h-6 w-6" />
            Fund {campaign.projectName}
          </DialogTitle>
          <DialogDescription>
            Support {campaign.creator.name} by contributing in {IDR_CURRENCY_SYMBOL}. Your contribution will be converted to {SOL_CURRENCY_SYMBOL}.
            You'll receive {campaign.tokenTicker} tokens in return.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"> {/* Reduced gap-y-2 to gap-y-1 */}
            <Label htmlFor="amountIDR" className="text-right col-span-1">
              Amount ({IDR_CURRENCY_SYMBOL})
            </Label>
            <Input
              id="amountIDR"
              type="text"
              value={formatToIDR(numericAmountIDR)}
              onChange={(e) => {
                const val = parseFromIDR(e.target.value);
                setNumericAmountIDR(val); 
              }}
              onBlur={(e) => { 
                const val = parseFromIDR(e.target.value);
                setNumericAmountIDR(val);
              }}
              className="col-span-2"
              placeholder={formatToIDR(80000)}
              disabled={isLoadingRate || isFunding}
            />
            <div/> 
            <div className="col-span-2 text-xs text-muted-foreground flex items-center min-h-[1.5rem] pt-1"> {/* Added pt-1 */}
                <RefreshCw className={cn("mr-1.5 h-3 w-3 text-primary", isLoadingRate && "animate-spin")}/>
                <span>{solEquivalentDisplay}</span>
            </div>
            {numericAmountIDR > 0 && effectiveRate > 0 && solEquivalentForButton > 0 && estimatedTokens > 0 && !isLoadingRate && (
              <>
                <div className="col-span-1"/> {/* Spacer */}
                <div className="col-span-2 text-xs text-muted-foreground flex items-center min-h-[1.5rem] pt-1"> {/* Added pt-1 */}
                    <Coins className="mr-1.5 h-3 w-3 text-primary"/>
                    <span>You'll receive approx. {estimatedTokens.toLocaleString()} ${campaign.tokenTicker} tokens.</span>
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
            type="button" 
            onClick={handleFund} 
            disabled={isFunding || isLoadingRate || solEquivalentForButton <=0 || isNaN(numericAmountIDR)} 
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Send className="mr-2 h-4 w-4" />
            {isFunding ? "Processing..." : (isLoadingRate ? `Loading Rate...` : `Fund (~${solEquivalentForButton > 0 ? solEquivalentForButton.toFixed(4) : '0.0000'} ${SOL_CURRENCY_SYMBOL})`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
