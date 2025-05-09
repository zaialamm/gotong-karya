
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
import { SOL_CURRENCY_SYMBOL, IDR_CURRENCY_SYMBOL, SOL_TO_IDR_RATE } from "@/lib/constants";
import { Send, Sparkles, RefreshCw } from "lucide-react";

interface FundModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FundModal({ campaign, isOpen, onOpenChange }: FundModalProps) {
  const [amountIDR, setAmountIDR] = useState<string>("80000"); // Default to 80,000 IDR (approx 0.1 SOL)
  const [isFunding, setIsFunding] = useState(false);
  const { toast } = useToast();
  const [solEquivalentDisplay, setSolEquivalentDisplay] = useState<string>("");

  useEffect(() => {
    const numericAmountIDR = parseFloat(amountIDR);
    if (!isNaN(numericAmountIDR) && numericAmountIDR > 0 && SOL_TO_IDR_RATE > 0) {
      const calculatedSOL = numericAmountIDR / SOL_TO_IDR_RATE;
      setSolEquivalentDisplay(`${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL}`);
    } else {
      setSolEquivalentDisplay(`Enter a valid IDR amount`);
    }
  }, [amountIDR]);

  const handleFund = async () => {
    const numericAmountIDR = parseFloat(amountIDR);
    if (isNaN(numericAmountIDR) || numericAmountIDR <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive IDR amount.", variant: "destructive" });
      return;
    }
    if (SOL_TO_IDR_RATE <= 0) {
      toast({ title: "Configuration Error", description: "SOL to IDR rate is not configured correctly.", variant: "destructive" });
      return;
    }

    const solAmountToFund = numericAmountIDR / SOL_TO_IDR_RATE;
    if (solAmountToFund <= 0) {
        toast({ title: "Invalid Amount", description: "Calculated SOL amount is too small to fund.", variant: "destructive" });
        return;
    }

    setIsFunding(true);
    try {
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
  const solEquivalentForButton = !isNaN(numericAmountIDRForButton) && numericAmountIDRForButton > 0 && SOL_TO_IDR_RATE > 0
    ? (numericAmountIDRForButton / SOL_TO_IDR_RATE)
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
              step="1000" // Common step for IDR
            />
            <div/> 
            <div className="col-span-2 text-xs text-muted-foreground flex items-center">
                <RefreshCw className="mr-1.5 h-3 w-3 text-primary"/>
                <span>{solEquivalentDisplay}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleFund} 
            disabled={isFunding || solEquivalentForButton <=0} 
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Send className="mr-2 h-4 w-4" />
            {isFunding ? "Processing..." : `Fund (~${solEquivalentForButton > 0 ? solEquivalentForButton.toFixed(4) : '0.0000'} SOL)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

