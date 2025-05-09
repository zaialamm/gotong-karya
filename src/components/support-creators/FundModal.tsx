
"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campaign } from "@/types";
import { fundCampaign } from "@/lib/web3"; // Mock function
import { useToast } from "@/hooks/use-toast";
import { SOL_CURRENCY_SYMBOL, USDC_CURRENCY_SYMBOL, USDT_CURRENCY_SYMBOL, SOL_TO_USD_RATE, SOL_TO_IDR_RATE, IDR_CURRENCY_SYMBOL } from "@/lib/constants";
import { Send, Sparkles } from "lucide-react";

interface FundModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Currency = "SOL" | "USDC" | "USDT";

export function FundModal({ campaign, isOpen, onOpenChange }: FundModalProps) {
  const [amount, setAmount] = useState<string>("0.1");
  const [currency, setCurrency] = useState<Currency>("SOL");
  const [isFunding, setIsFunding] = useState(false);
  const { toast } = useToast();

  const handleFund = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }

    setIsFunding(true);
    try {
      // Log to console as requested (implicit in mock function)
      const result = await fundCampaign(campaign.id, numericAmount, currency);
      toast({
        title: "Funding Successful!",
        description: result.message, // Includes tokens minted, ownership, badge URL
        duration: 7000, // Longer duration to read the message
      });
      onOpenChange(false); // Close modal on success
      setAmount("0.1"); // Reset amount
    } catch (error) {
      console.error("Funding error:", error);
      toast({ title: "Funding Failed", description: (error as Error).message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsFunding(false);
    }
  };
  
  const getEquivalentValue = () => {
    const numericAmount = parseFloat(amount) || 0;
    if (currency === "SOL") {
      return `≈ ${(numericAmount * SOL_TO_IDR_RATE).toLocaleString()} ${IDR_CURRENCY_SYMBOL} / ${(numericAmount * SOL_TO_USD_RATE).toLocaleString()} USD`;
    } else if (currency === "USDC" || currency === "USDT") {
      return `≈ ${(numericAmount / SOL_TO_USD_RATE).toFixed(4)} ${SOL_CURRENCY_SYMBOL}`;
    }
    return "";
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center">
            <Sparkles className="mr-2 h-6 w-6" />
            Fund {campaign.projectName}
          </DialogTitle>
          <DialogDescription>
            Support {campaign.creator.name} by contributing to their campaign.
            You'll receive {campaign.tokenTicker} tokens in return.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="amount" className="text-right col-span-1">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-2"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="currency" className="text-right col-span-1">
              Currency
            </Label>
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOL">{SOL_CURRENCY_SYMBOL}</SelectItem>
                <SelectItem value="USDC">{USDC_CURRENCY_SYMBOL}</SelectItem>
                <SelectItem value="USDT">{USDT_CURRENCY_SYMBOL}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {parseFloat(amount) > 0 && (
            <p className="text-xs text-muted-foreground text-right pr-1">{getEquivalentValue()}</p>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleFund} disabled={isFunding} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Send className="mr-2 h-4 w-4" />
            {isFunding ? "Processing..." : `Fund Now (${amount} ${currency})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
