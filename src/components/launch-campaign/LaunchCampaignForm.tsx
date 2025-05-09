
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
import { Card as ShadCNCard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { launchNewCampaign } from "@/lib/web3"; // Mock function
import { Rocket } from "lucide-react";

const formSchema = z.object({
  projectName: z.string().min(5, "Project name must be at least 5 characters.").max(100),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000),
  fundingGoalSOL: z.coerce.number().positive("Funding goal must be a positive number."),
  tokenTicker: z.string().min(2, "Token ticker must be 2-5 characters.").max(5).regex(/^[A-Z0-9]+$/, "Ticker must be uppercase letters/numbers."),
  tokenName: z.string().min(5, "Token name must be at least 5 characters.").max(50),
  // metadata field is mentioned, can be combined with description or be a separate JSON field if complex
});

type LaunchCampaignFormValues = z.infer<typeof formSchema>;

export function LaunchCampaignForm() {
  const { toast } = useToast();
  const form = useForm<LaunchCampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      description: "",
      fundingGoalSOL: 0,
      tokenTicker: "",
      tokenName: "",
    },
  });

  async function onSubmit(values: LaunchCampaignFormValues) {
    try {
      // Log to console as requested
      console.log("Campaign form submitted:", values);
      const result = await launchNewCampaign(values); // Mock API call
      
      toast({
        title: "Campaign Creation Initiated!",
        description: result.message, // `Campaign created, ticker: ${values.tokenTicker}`
        variant: "default",
      });
      form.reset(); // Reset form after successful submission
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
    <ShadCNCard className="w-full max-w-2xl mx-auto shadow-xl">
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
                name="fundingGoalSOL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Goal (SOL)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="E.g., 100" {...field} />
                    </FormControl>
                    <FormDescription>The amount of SOL you aim to raise.</FormDescription>
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
            {/* For metadata, if it's simple text, can be part of description.
                If it's structured (e.g. JSON for token standard), a Textarea for JSON input could be added.
                The request was "metadata e.g., ‘Create Jumbo Animation Film Token’", which is like a token name.
                I've added `tokenName` field above. Let's assume this covers the "metadata" for now.
            */}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Launching..." : "Launch Campaign"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </ShadCNCard>
  );
}
