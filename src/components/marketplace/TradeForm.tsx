"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Keep for RadioGroup Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { TokenInfo, UserTokenBalance } from "@/types";
import { TOKENS_DATA, USER_BALANCES_DATA, MARKETPLACE_FEE_PERCENTAGE, SOL_CURRENCY_SYMBOL, IDR_CURRENCY_SYMBOL } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { tradeTokens } from "@/lib/web3"; // Mock function
import { ArrowRightLeft, ShoppingCart, Banknote } from "lucide-react";
import { useSolToIdrRate } from "@/hooks/use-sol-to-idr-rate";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeFormProps {
  initialTokenTicker?: string;
  initialTradeType?: "buy" | "sell";
  onTradeSuccess?: () => void; // Callback for updating parent state, e.g., balances or history
}

const formSchema = z.object({
  tradeType: z.enum(["buy", "sell"]),
  tokenTicker: z.string().min(1, "Please select a token."),
  amountTokens: z.coerce.number().positive("Amount must be positive."),
});

type TradeFormValues = z.infer<typeof formSchema>;

export function TradeForm({ initialTokenTicker, initialTradeType = "buy", onTradeSuccess }: TradeFormProps) {
  const { toast } = useToast();
  const [selectedToken, setSelectedToken] = useState<TokenInfo | undefined>(
    initialTokenTicker ? TOKENS_DATA.find(t => t.ticker === initialTokenTicker) : undefined
  );
  const [userBalances, setUserBalances] = useState<UserTokenBalance[]>(USER_BALANCES_DATA); // Mock, can be context/prop
  const { effectiveRate, isLoading: isLoadingRate } = useSolToIdrRate();


  const form = useForm<TradeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tradeType: initialTradeType,
      tokenTicker: initialTokenTicker || "",
      amountTokens: 1,
    },
  });

  const { watch, setValue, control, handleSubmit, formState: { isSubmitting } } = form;
  const tradeType = watch("tradeType");
  const tokenTicker = watch("tokenTicker");
  const amountTokens = watch("amountTokens");

  useEffect(() => {
    setSelectedToken(TOKENS_DATA.find(t => t.ticker === tokenTicker));
  }, [tokenTicker]);
  
  useEffect(() => {
    if (initialTokenTicker) setValue("tokenTicker", initialTokenTicker);
    setValue("tradeType", initialTradeType);
  }, [initialTokenTicker, initialTradeType, setValue]);


  const currentBalance = userBalances.find(b => b.tokenTicker === tokenTicker)?.amount || 0;

  const onSubmit = async (values: TradeFormValues) => {
    if (!selectedToken || !selectedToken.currentPriceSOL) {
      toast({ title: "Error", description: "Token information is missing.", variant: "destructive" });
      return;
    }
    if (values.tradeType === "sell" && values.amountTokens > currentBalance) {
      toast({ title: "Insufficient Balance", description: `You only have ${currentBalance} ${values.tokenTicker}.`, variant: "destructive" });
      return;
    }

    try {
      const result = await tradeTokens(values.tradeType, values.tokenTicker, values.amountTokens, selectedToken.currentPriceSOL);
      toast({
        title: `Trade Successful!`,
        description: result.message,
        variant: "default",
        duration: 7000,
      });
      console.log(result.details); // Log details as per requirement

      // Mock balance update
      if (values.tradeType === "sell") {
        setUserBalances(prev => prev.map(b => b.tokenTicker === values.tokenTicker ? {...b, amount: b.amount - values.amountTokens} : b));
      } else {
         setUserBalances(prev => {
            const existingBalance = prev.find(b => b.tokenTicker === values.tokenTicker);
            if (existingBalance) {
                return prev.map(b => b.tokenTicker === values.tokenTicker ? {...b, amount: b.amount + values.amountTokens} : b);
            }
            return [...prev, { tokenId: selectedToken.id, tokenTicker: values.tokenTicker, amount: values.amountTokens }];
         });
      }
      onTradeSuccess?.();
      form.reset({ tradeType: values.tradeType, tokenTicker: values.tokenTicker, amountTokens: 1});

    } catch (error) {
      toast({ title: "Trade Failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const subtotalSOL = (selectedToken?.currentPriceSOL || 0) * (amountTokens || 0);
  const feeSOL = subtotalSOL * MARKETPLACE_FEE_PERCENTAGE;
  const totalSOL = tradeType === "buy" ? subtotalSOL + feeSOL : subtotalSOL - feeSOL;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 border rounded-lg bg-card shadow-md">
        <Controller
          control={control}
          name="tradeType"
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex space-x-4"
            >
              <Label className="flex items-center space-x-2 p-3 rounded-md border data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 cursor-pointer flex-1 justify-center">
                <RadioGroupItem value="buy" id="buy" /> 
                <ShoppingCart className="h-5 w-5 mr-1 text-green-500" /> Buy
              </Label>
              <Label className="flex items-center space-x-2 p-3 rounded-md border data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 cursor-pointer flex-1 justify-center">
                <RadioGroupItem value="sell" id="sell" /> 
                <Banknote className="h-5 w-5 mr-1 text-red-500" /> Sell
              </Label>
            </RadioGroup>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
              control={control}
              name="tokenTicker"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Token</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="tokenTicker">
                          <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {TOKENS_DATA.map(token => (
                        <SelectItem key={token.ticker} value={token.ticker}>
                            {token.name} ({token.ticker})
                        </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {field.value && selectedToken && <FormDescription className="mt-1">Price: {selectedToken.currentPriceSOL?.toFixed(5)} {SOL_CURRENCY_SYMBOL}/token</FormDescription>}
                  {field.value && tradeType === "sell" && <FormDescription className="mt-1">Your balance: {currentBalance} {field.value}</FormDescription>}
                  <FormMessage />
              </FormItem>
              )}
          />

          <FormField
              control={control}
              name="amountTokens"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Amount (Tokens)</FormLabel>
                  <FormControl>
                    <Input id="amountTokens" type="number" placeholder="0.0" {...field} step="any" />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
        </div>

        {selectedToken && amountTokens > 0 && (
          <div className="space-y-2 text-sm p-4 border rounded-md bg-background/50">
            <h4 className="font-medium text-foreground mb-1">Order Summary:</h4>
            <div className="flex justify-between"><span>Subtotal:</span> <span>{subtotalSOL.toFixed(5)} {SOL_CURRENCY_SYMBOL}</span></div>
            <div className="flex justify-between"><span>Fee (0.7%):</span> <span>{feeSOL.toFixed(5)} {SOL_CURRENCY_SYMBOL}</span></div>
            <hr className="my-1 border-border" />
            <div className="flex justify-between font-semibold text-primary">
              <span>{tradeType === "buy" ? "Total Cost:" : "Net Proceeds:"}</span> 
              <span>{totalSOL.toFixed(5)} {SOL_CURRENCY_SYMBOL}</span>
            </div>
            <div className="text-xs text-muted-foreground text-right">
             {isLoadingRate ? <Skeleton className="h-3 w-24 inline-block" /> :  `(≈ ${(totalSOL * effectiveRate).toLocaleString()} ${IDR_CURRENCY_SYMBOL})`}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting || !selectedToken || amountTokens <= 0}>
          <ArrowRightLeft className="mr-2 h-4 w-4" /> {isSubmitting ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} ${tokenTicker || "Token"}`}
        </Button>
      </form>
    </Form>
  );
}