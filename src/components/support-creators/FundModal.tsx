
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
import { SOL_CURRENCY_SYMBOL, IDR_CURRENCY_SYMBOL, SOL_TO_IDR_RATE as FALLBACK_SOL_TO_IDR_RATE } from "@/lib/constants";
import { Send, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FundModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundModal({ campaign, isOpen, onOpenChange }: FundModalProps) {
  const [amountIDR, setAmountIDR] = useState<string>("80000");
  const [isFunding, setIsFunding] = useState(false);
  const { toast } = useToast();
  
  const [liveSolToIdrRate, setLiveSolToIdrRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);
  const [rateError, setRateError] = useState<string | null>(null);
  const [solEquivalentDisplay, setSolEquivalentDisplay] = useState<string>(`Enter a valid ${IDR_CURRENCY_SYMBOL} amount`);

  const effectiveSolToIdrRate = liveSolToIdrRate ?? FALLBACK_SOL_TO_IDR_RATE;

  useEffect(() => {
    if (!isOpen) return; // Only fetch if modal is open

    async function fetchRate() {
      setIsLoadingRate(true);
      setRateError(null);
      try {
        const response = await fetch('/api/exchange-rate');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch exchange rate details' }));
          throw new Error(errorData.error || `Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.rate && typeof data.rate === 'number') {
          setLiveSolToIdrRate(data.rate);
        } else {
          throw new Error(data.error || 'Rate not found or invalid in API response');
        }
      } catch (error) {
        console.error("Error fetching SOL/IDR rate in FundModal:", error);
        setRateError((error as Error).message);
        setLiveSolToIdrRate(null); // Ensure fallback is used
      } finally {
        setIsLoadingRate(false);
      }
    }
    fetchRate();
  }, [isOpen]);

  useEffect(() => {
    const numericAmountIDR = parseFloat(amountIDR);
    
    if (isLoadingRate) {
        setSolEquivalentDisplay(`Fetching live ${SOL_CURRENCY_SYMBOL}/${IDR_CURRENCY_SYMBOL} rate...`);
    } else if (rateError) {
        const calculatedSOL = (numericAmountIDR > 0 && FALLBACK_SOL_TO_IDR_RATE > 0) ? (numericAmountIDR / FALLBACK_SOL_TO_IDR_RATE) : 0;
        const displayRate = `(Fallback: 1 ${SOL_CURRENCY_SYMBOL} = ${FALLBACK_SOL_TO_IDR_RATE.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`;
        if (calculatedSOL > 0) {
            setSolEquivalentDisplay(`${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL}. ${displayRate}`);
        } else {
            setSolEquivalentDisplay(`Error fetching rate. ${displayRate}`);
        }
    } else if (liveSolToIdrRate) {
        if (numericAmountIDR > 0) {
            const calculatedSOL = numericAmountIDR / liveSolToIdrRate;
            setSolEquivalentDisplay(`${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL} (Live rate: 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
        } else {
            setSolEquivalentDisplay(`Enter ${IDR_CURRENCY_SYMBOL} amount. (Live rate: 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
        }
    } else {
        const calculatedSOL = (numericAmountIDR > 0 && FALLBACK_SOL_TO_IDR_RATE > 0) ? (numericAmountIDR / FALLBACK_SOL_TO_IDR_RATE) : 0;
        if (calculatedSOL > 0) {
            setSolEquivalentDisplay(`${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL} (Using fallback rate)`);
        } else {
            setSolEquivalentDisplay(`Enter a valid ${IDR_CURRENCY_SYMBOL} amount`);
        }
    }
  }, [amountIDR, liveSolToIdrRate, isLoadingRate, rateError]);

  const handleFund = async () => {
    const numericAmountIDR = parseFloat(amountIDR);
    if (isNaN(numericAmountIDR) || numericAmountIDR <= 0) {
      toast({ title: "Invalid Amount", description: `Please enter a valid positive ${IDR_CURRENCY_SYMBOL} amount.`, variant: "destructive" });
      return;
    }
    if (effectiveSolToIdrRate <= 0) {
      toast({ title: "Configuration Error", description: `${SOL_CURRENCY_SYMBOL} to ${IDR_CURRENCY_SYMBOL} rate is not configured correctly or is zero.`, variant: "destructive" });
      return;
    }

    const solAmountToFund = numericAmountIDR / effectiveSolToIdrRate;
    if (solAmountToFund <= 0) {
        toast({ title: "Invalid Amount", description: `Calculated ${SOL_CURRENCY_SYMBOL} amount is too small to fund. Please increase the ${IDR_CURRENCY_SYMBOL} amount.`, variant: "destructive" });
        return;
    }

    setIsFunding(true);
    try {
      console.log(`Funding with ${solAmountToFund.toFixed(4)} SOL (from ${numericAmountIDR} IDR at rate ${effectiveSolToIdrRate})`);
      const result = await fundCampaign(campaign.id, solAmountToFund, "SOL");
      toast({
        title: "Funding Successful!",
        description: result.message, 
        duration: 7000, 
      });
      onOpenChange(false); 
      setAmountIDR("80000"); 
    } catch (error) {
      console.error("Funding error:", error);
      toast({ title: "Funding Failed", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsFunding(false);
    }
  };
  
  const numericAmountIDRForButton = parseFloat(amountIDR);
  const solEquivalentForButton = !isNaN(numericAmountIDRForButton) && numericAmountIDRForButton > 0 && effectiveSolToIdrRate > 0
    ? (numericAmountIDRForButton / effectiveSolToIdrRate)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
            <Label htmlFor="amountIDR" className="text-right col-span-1">
              Amount ({IDR_CURRENCY_SYMBOL})
            </Label>
            <Input
              id="amountIDR"
              type="number"
              value={amountIDR}
              onChange={(e) => setAmountIDR(e.target.value)}
              className="col-span-2"
              placeholder="Enter amount in IDR"
              step="1000" 
              disabled={isLoadingRate || isFunding}
            />
            <div/> 
            <div className="col-span-2 text-xs text-muted-foreground flex items-center min-h-[1.5rem]">
                <RefreshCw className={cn("mr-1.5 h-3 w-3 text-primary", isLoadingRate && "animate-spin")}/>
                <span>{solEquivalentDisplay}</span>
            </div>
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
            disabled={isFunding || isLoadingRate || solEquivalentForButton <=0} 
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
