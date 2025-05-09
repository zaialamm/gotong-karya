
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
import { SOL_TO_IDR_RATE, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import { Rocket, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const formSchema = z.object({
  projectName: z.string().min(5, "Project name must be at least 5 characters.").max(100),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000),
  fundingGoalIDR: z.coerce.number().positive("Funding goal in IDR must be a positive number.").min(100000, `Minimum funding goal is ${IDR_CURRENCY_SYMBOL} 100,000.`),
  tokenTicker: z.string().min(2, "Token ticker must be 2-5 characters.").max(5).regex(/^[A-Z0-9]+$/, "Ticker must be uppercase letters/numbers."),
  tokenName: z.string().min(5, "Token name must be at least 5 characters.").max(50),
});

type LaunchCampaignFormValues = z.infer<typeof formSchema>;

export function LaunchCampaignForm() {
  const { toast } = useToast();
  const [solEquivalentDisplay, setSolEquivalentDisplay] = useState<string>("");

  const form = useForm<LaunchCampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      description: "",
      fundingGoalIDR: 0,
      tokenTicker: "",
      tokenName: "",
    },
  });

  const fundingGoalIDRValue = form.watch("fundingGoalIDR");

  useEffect(() => {
    if (fundingGoalIDRValue > 0 && SOL_TO_IDR_RATE > 0) {
      const calculatedSOL = fundingGoalIDRValue / SOL_TO_IDR_RATE;
      setSolEquivalentDisplay(`Approx. ${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL}`);
    } else if (fundingGoalIDRValue === 0) {
      setSolEquivalentDisplay("Enter IDR amount to see SOL equivalent.");
    } 
    else {
      setSolEquivalentDisplay("Invalid IDR amount.");
    }
  }, [fundingGoalIDRValue]);


  async function onSubmit(values: LaunchCampaignFormValues) {
    try {
      const fundingGoalSOL = values.fundingGoalIDR / SOL_TO_IDR_RATE;
      if (fundingGoalSOL <= 0) {
        toast({
          title: "Invalid Amount",
          description: "The calculated SOL amount is too small. Please increase the IDR funding goal.",
          variant: "destructive",
        });
        return;
      }

      const campaignDataForApi = {
        projectName: values.projectName,
        description: values.description,
        fundingGoalSOL: parseFloat(fundingGoalSOL.toFixed(4)), // Ensure it's a number with reasonable precision
        tokenTicker: values.tokenTicker,
        tokenName: values.tokenName,
      };
      
      console.log("Campaign form submitted (values in IDR):", values);
      console.log("Campaign data for API (goal in SOL):", campaignDataForApi);
      
      const result = await launchNewCampaign(campaignDataForApi);
      
      toast({
        title: "Campaign Creation Initiated!",
        description: `${result.message} Funding goal: ${values.fundingGoalIDR.toLocaleString()} ${IDR_CURRENCY_SYMBOL} (~${campaignDataForApi.fundingGoalSOL} ${SOL_CURRENCY_SYMBOL}).`,
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
                      <Input type="number" placeholder={`E.g., ${ (100 * SOL_TO_IDR_RATE).toLocaleString()}`} {...field} />
                    </FormControl>
                    <FormDescription>The amount of {IDR_CURRENCY_SYMBOL} you aim to raise.</FormDescription>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center pt-1">
                        <RefreshCw className="mr-1.5 h-3 w-3 text-primary"/>
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
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Launching..." : "Launch Campaign"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
