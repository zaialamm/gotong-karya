
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { launchNewCampaign } from "@/lib/web3"; // Mock function
import { SOL_TO_IDR_RATE as FALLBACK_SOL_TO_IDR_RATE, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import { Rocket, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { cn, formatToIDR, parseFromIDR } from "@/lib/utils";

const formSchema = z.object({
  projectName: z.string().min(5, "Project name must be at least 5 characters.").max(100),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000),
  fundingGoalIDR: z.coerce.number({invalid_type_error: "Funding goal must be a number."})
    .positive("Funding goal in IDR must be a positive number.")
    .min(100000, `Minimum funding goal is ${formatToIDR(100000)}.`),
  tokenTicker: z.string().min(2, "Token ticker must be 2-5 characters.").max(5).regex(/^[A-Z0-9]+$/, "Ticker must be uppercase letters/numbers."),
  tokenName: z.string().min(5, "Token name must be at least 5 characters.").max(50),
});

type LaunchCampaignFormValues = z.infer<typeof formSchema>;

export function LaunchCampaignForm() {
  const { toast } = useToast();
  const [solEquivalentDisplay, setSolEquivalentDisplay] = useState<string>("Enter IDR amount to see SOL equivalent.");
  const [liveSolToIdrRate, setLiveSolToIdrRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);
  const [rateError, setRateError] = useState<string | null>(null);

  const form = useForm<LaunchCampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      description: "",
      // fundingGoalIDR: 0, // Default to undefined to allow placeholder to show properly
      tokenTicker: "",
      tokenName: "",
    },
    mode: "onChange", // Validate on change for better UX with formatted input
  });

  const fundingGoalIDRValue = form.watch("fundingGoalIDR");
  const effectiveSolToIdrRate = liveSolToIdrRate ?? FALLBACK_SOL_TO_IDR_RATE;

  useEffect(() => {
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
        console.error("Error fetching SOL/IDR rate:", error);
        setRateError((error as Error).message);
        setLiveSolToIdrRate(null); 
      } finally {
        setIsLoadingRate(false);
      }
    }
    fetchRate();
  }, []);

  useEffect(() => {
    const numericFundingGoal = typeof fundingGoalIDRValue === 'number' && !isNaN(fundingGoalIDRValue) ? fundingGoalIDRValue : 0;

    if (isLoadingRate) {
      setSolEquivalentDisplay(`Fetching live ${SOL_CURRENCY_SYMBOL}/${IDR_CURRENCY_SYMBOL} rate...`);
    } else if (rateError) {
      const calculatedSOL = numericFundingGoal / FALLBACK_SOL_TO_IDR_RATE;
      const displayRate = `(Fallback rate: 1 ${SOL_CURRENCY_SYMBOL} = ${FALLBACK_SOL_TO_IDR_RATE.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`;
      if (numericFundingGoal > 0) {
        setSolEquivalentDisplay(`Approx. ${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL}. ${displayRate}`);
      } else {
        setSolEquivalentDisplay(`Error fetching rate. ${displayRate}`);
      }
    } else if (liveSolToIdrRate) {
      if (numericFundingGoal > 0) {
        const calculatedSOL = numericFundingGoal / liveSolToIdrRate;
        setSolEquivalentDisplay(`Approx. ${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL} (Live rate: 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
      } else {
        setSolEquivalentDisplay(`Enter IDR amount. (Live rate: 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
      }
    } else { 
       const calculatedSOL = numericFundingGoal / FALLBACK_SOL_TO_IDR_RATE;
       if (numericFundingGoal > 0) {
        setSolEquivalentDisplay(`Approx. ${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL} (Using fallback rate)`);
       } else {
        setSolEquivalentDisplay("Enter IDR amount to see SOL equivalent.");
       }
    }
  }, [fundingGoalIDRValue, liveSolToIdrRate, isLoadingRate, rateError, FALLBACK_SOL_TO_IDR_RATE, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL]);


  async function onSubmit(values: LaunchCampaignFormValues) {
    if (effectiveSolToIdrRate <= 0) {
       toast({
          title: "Rate Error",
          description: "Cannot calculate SOL equivalent. Exchange rate is invalid.",
          variant: "destructive",
        });
        return;
    }

    try {
      // values.fundingGoalIDR is already a number due to zod coercion
      const fundingGoalSOL = values.fundingGoalIDR / effectiveSolToIdrRate;
      if (fundingGoalSOL <= 0) {
        toast({
          title: "Invalid Amount",
          description: "The calculated SOL amount is too small. Please increase the IDR funding goal or check the exchange rate.",
          variant: "destructive",
        });
        return;
      }

      const campaignDataForApi = {
        projectName: values.projectName,
        description: values.description,
        fundingGoalSOL: parseFloat(fundingGoalSOL.toFixed(4)),
        tokenTicker: values.tokenTicker,
        tokenName: values.tokenName,
      };
      
      console.log("Campaign form submitted (values in IDR):", values);
      console.log("Campaign data for API (goal in SOL):", campaignDataForApi, "using rate:", effectiveSolToIdrRate);
      
      const result = await launchNewCampaign(campaignDataForApi);
      
      toast({
        title: "Campaign Creation Initiated!",
        description: `${result.message} Funding goal: ${formatToIDR(values.fundingGoalIDR)} (~${campaignDataForApi.fundingGoalSOL} ${SOL_CURRENCY_SYMBOL}).`,
        variant: "default",
        duration: 7000,
      });
      form.reset(); 
    } catch (error) {
      console.error("Error launching campaign:", error);
      toast({
        title: "Error",
        description: "Failed to launch campaign. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center text-primary">
          <Rocket className="mr-2 h-6 w-6" />
          Launch Your Campaign
        </CardTitle>
        <CardDescription>
          Fill in the details below to get your project funded on GotongKarya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., My Awesome Game" {...field} />
                  </FormControl>
                  <FormDescription>The official name of your project.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us all about your project..." {...field} className="min-h-[100px]" />
                  </FormControl>
                  <FormDescription>A detailed description of your project, its goals, and impact.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fundingGoalIDR"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Goal ({IDR_CURRENCY_SYMBOL})</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={formatToIDR(100 * FALLBACK_SOL_TO_IDR_RATE)}
                        value={field.value === undefined || isNaN(field.value) ? '' : formatToIDR(field.value)}
                        onChange={(e) => {
                          const numericValue = parseFromIDR(e.target.value);
                          field.onChange(isNaN(numericValue) ? undefined : numericValue);
                        }}
                        onBlur={(e) => { // Re-format and set numeric value on blur
                           const numericValue = parseFromIDR(e.target.value);
                           field.onChange(isNaN(numericValue) ? undefined : numericValue);
                        }}
                      />
                    </FormControl>
                    <FormDescription>The amount of {IDR_CURRENCY_SYMBOL} you aim to raise.</FormDescription>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center pt-1 min-h-[1.5rem]">
                        <RefreshCw className={cn("mr-1.5 h-3 w-3 text-primary", isLoadingRate && "animate-spin")}/>
                        <span>{solEquivalentDisplay}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="tokenName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Awesome Game Token" {...field} />
                    </FormControl>
                    <FormDescription>The full name of your project's token.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="tokenTicker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Ticker</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., AWG (2-5 chars, uppercase)" {...field} />
                    </FormControl>
                    <FormDescription>A short, unique symbol for your project token (e.g., JUMBO).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting || isLoadingRate}>
              {form.formState.isSubmitting ? "Launching..." : (isLoadingRate ? "Loading Rate..." : "Launch Campaign")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
