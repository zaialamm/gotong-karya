
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
import { useWallet } from "@/hooks/use-wallet"; // Import wallet hook
import { launchNewCampaign } from "@/lib/web3";
import CampaignSuccessModal from "./CampaignSuccessModal"; // Import our new success modal
import { IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import { Rocket, RefreshCw, Gift, Image as ImageIcon, Sparkles, Wallet, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image"; // For preview
import { cn, formatToIDR, parseFromIDR } from "@/lib/utils";
import { useSolToIdrRate } from "@/hooks/use-sol-to-idr-rate";
import type { NftMetadata, NftAttribute } from "@/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const formSchema = z.object({
  projectName: z.string().min(5, "Project name must be at least 5 characters.").max(100),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000),
  benefitsInput: z.string().min(1, "Please list at least one benefit.").max(1000, "Benefits description is too long (max 1000 characters)."),
  featuredImage: z
    .custom<File>((val) => val instanceof File, {
      message: "Please upload a featured image for your campaign.",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, .webp, and .gif formats are accepted."
    ),
  fundingGoalIDR: z.coerce.number({invalid_type_error: "Funding goal must be a number."})
    .positive("Funding goal in IDR must be a positive number.")
    .min(100000, `Minimum funding goal is ${formatToIDR(100000)}.`),
  nftName: z.string().min(5, "NFT name must be at least 5 characters.").max(50),
  nftSymbol: z.string().min(2, "NFT symbol must be at least 2 characters.").max(10).regex(/^[A-Z0-9]+$/, "Symbol must be uppercase letters/numbers."),
  nftDescription: z.string().min(10, "NFT description must be at least 10 characters.").max(500),
  imageUrl: z.string().url("Please enter a valid image URL.").min(1, "Image URL is required."),
});

type LaunchCampaignFormValues = z.infer<typeof formSchema>;

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function LaunchCampaignForm() {
  const { toast } = useToast();
  const { isConnected, address, connect } = useWallet(); // Use wallet hook
  const [solEquivalentDisplay, setSolEquivalentDisplay] = useState<string>("Enter IDR amount to see SOL equivalent.");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [urlImagePreview, setUrlImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState("");
  const [txSignature, setTxSignature] = useState("");
  
  const {
    liveRate: liveSolToIdrRate,
    isLoading: isLoadingRate,
    error: rateError,
    effectiveRate,
    FALLBACK_SOL_TO_IDR_RATE: hookFallbackRate
  } = useSolToIdrRate();

  const form = useForm<LaunchCampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      description: "",
      benefitsInput: "",
      featuredImage: undefined,
      // fundingGoalIDR: undefined, // Default to undefined to allow placeholder to show properly
      nftName: "",
      nftSymbol: "",
      nftDescription: "",
      imageUrl: "",
    },
    mode: "onChange",
  });

  const fundingGoalIDRValue = form.watch("fundingGoalIDR");

  // Watch image URL for changes
  const imageUrlValue = form.watch("imageUrl");

  // Update image preview when URL changes
  useEffect(() => {
    if (imageUrlValue && imageUrlValue.trim() !== "") {
      setUrlImagePreview(imageUrlValue);
    } else {
      setUrlImagePreview(null);
    }
  }, [imageUrlValue]);

  useEffect(() => {
    const numericFundingGoal = typeof fundingGoalIDRValue === 'number' && !isNaN(fundingGoalIDRValue) ? fundingGoalIDRValue : 0;

    if (isLoadingRate) {
      setSolEquivalentDisplay(`Fetching live ${SOL_CURRENCY_SYMBOL}/${IDR_CURRENCY_SYMBOL} rate...`);
    } else if (rateError) {
      const calculatedSOL = numericFundingGoal > 0 && hookFallbackRate > 0 ? numericFundingGoal / hookFallbackRate : 0;
      const displayRate = `(Fallback rate: 1 ${SOL_CURRENCY_SYMBOL} = ${hookFallbackRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`;
      if (calculatedSOL > 0) {
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
       const calculatedSOL = numericFundingGoal > 0 && hookFallbackRate > 0 ? numericFundingGoal / hookFallbackRate : 0;
       if (calculatedSOL > 0) {
        setSolEquivalentDisplay(`Approx. ${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL} (Using fallback rate: ${hookFallbackRate.toLocaleString()})`);
       } else {
        setSolEquivalentDisplay("Enter IDR amount to see SOL equivalent.");
       }
    }
  }, [fundingGoalIDRValue, liveSolToIdrRate, isLoadingRate, rateError, hookFallbackRate, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL]);


  async function onSubmit(values: LaunchCampaignFormValues) {
    if (effectiveRate <= 0) {
       toast({
          title: "Rate Error",
          description: "Cannot calculate SOL equivalent. Exchange rate is invalid or not loaded.",
          variant: "destructive",
        });
        return;
    }

    // Process featured image
    if (!values.featuredImage) {
      toast({
        title: "Image Required",
        description: "Please upload an image for your campaign and NFT.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fundingGoalSOL = values.fundingGoalIDR / effectiveRate;
      if (fundingGoalSOL <= 0) {
        toast({
          title: "Invalid Amount",
          description: "The calculated SOL amount is too small. Please increase the IDR funding goal or check the exchange rate.",
          variant: "destructive",
        });
        return;
      }

      // Process benefits as an array
      const benefits = values.benefitsInput
        .split('\n')
        .map(b => b.trim())
        .filter(b => b.length > 0);

      // Create default NFT attribute for supporters
      const nftAttributes: NftAttribute[] = [
        { trait_type: "type", value: "Supporter" }
      ];

      // Create NFT metadata
      const nftMetadata: NftMetadata = {
        name: values.nftName,
        symbol: values.nftSymbol,
        description: values.nftDescription,
        attributes: nftAttributes,
        campaignId: `campaign-${Date.now()}` // Temporary ID for the campaign
      };

      // For now we'll use the mockCreateNft function
      // In production, this would call a real NFT minting function
      toast({
        title: "Creating Campaign NFT",
        description: "Processing your request and creating the NFT...",
        variant: "default",
      });

      // The image URL is now mandatory
      const imageSource = values.imageUrl;
      const campaignDataForApi = {
        projectName: values.projectName,
        description: values.description,
        fundingGoalSOL: parseFloat(fundingGoalSOL.toFixed(4)),
        nftName: values.nftName,
        nftSymbol: values.nftSymbol,
        nftDescription: values.nftDescription,
        benefits: benefits,
        imageUrl: values.imageUrl, // Pass the exact image URL to blockchain
        nftAttributes: nftAttributes,
      };
      
      console.log('Submitting campaign data to blockchain:', campaignDataForApi);
      
      try {
        // This will now use the real blockchain integration
        const result = await launchNewCampaign(campaignDataForApi);
        
        // Store campaign info for the success modal
        setCreatedCampaignId(result.campaignId);
        setTxSignature(result.transactionId);
        
        // Open the success modal
        setSuccessModalOpen(true);
        
        // Reset form
        form.reset();
        setUrlImagePreview(null);
        
      } catch (error: any) {
        console.error("Error launching campaign on blockchain:", error);
        
        // Show detailed error to user
        toast({
          title: "Blockchain Transaction Failed",
          description: error.message || "Failed to launch campaign on Solana",
          variant: "destructive",
        });
        
        // If there's a specific Solana error code, show more details
        if (error.code) {
          console.log(`Solana error code: ${error.code}`);
          toast({
            title: "Technical Details",
            description: `Error code: ${error.code}. Please try again or contact support.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error launching campaign:", error);
      toast({
        title: "Error",
        description: "Failed to launch campaign with NFT. Please try again.",
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
            <FormField
              control={form.control}
              name="benefitsInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Gift className="mr-2 h-4 w-4 text-primary" />
                    Supporter Benefits
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List the benefits supporters will receive, one per line. E.g.,&#10;- Exclusive digital badge&#10;- Early access to content&#10;- Name in credits"
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Outline what backers get for supporting your project. Each benefit on a new line. At least one benefit is required.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="featuredImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <ImageIcon className="mr-2 h-4 w-4 text-primary" />
                    Featured Image
                  </FormLabel>
                  <FormControl>
                     <Input 
                      type="file" 
                      accept="image/*"
                      className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      ref={field.ref}
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          field.onChange(undefined);
                          setImagePreview(null);
                        }
                      }}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  {imagePreview && (
                    <div className="mt-2 border border-border rounded-md p-2 inline-block">
                      <Image src={imagePreview} alt="Featured image preview" width={200} height={150} className="rounded-md object-contain max-h-[200px]" data-ai-hint="campaign preview"/>
                    </div>
                  )}
                  <FormDescription>
                    Upload a compelling image for your campaign (JPG, PNG, WEBP, GIF, max 5MB).
                  </FormDescription>
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
                        placeholder={hookFallbackRate > 0 ? formatToIDR(100000) : "Enter amount"}
                        value={field.value === undefined || isNaN(field.value) ? '' : formatToIDR(field.value)}
                        onChange={(e) => {
                          const numericValue = parseFromIDR(e.target.value);
                          field.onChange(isNaN(numericValue) ? undefined : numericValue);
                        }}
                        onBlur={(e) => { 
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
                name="nftName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NFT Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Bali Harmony Festival Supporter" {...field} />
                    </FormControl>
                    <FormDescription>The name that will appear on the NFT for supporters.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nftDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NFT Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this NFT represents for supporters" 
                      className="resize-none min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>A clear description of what this NFT represents and its significance.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nftSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NFT Symbol</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.g., BALI (uppercase, 2-10 chars)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A short unique symbol for your NFT (like stock ticker).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NFT Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/image.jpg" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Alternatively, paste an image URL to use for your NFT instead of uploading a file.
                  </FormDescription>
                  {urlImagePreview && (
                    <div className="mt-2 border border-border rounded-md p-2 inline-block">
                      <Image src={urlImagePreview} alt="URL image preview" width={200} height={150} className="rounded-md object-contain max-h-[200px]" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isConnected && (
              <div className="rounded-md bg-yellow-50 p-4 mb-4 border border-yellow-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Wallet connection required</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You need to connect your wallet before you can launch a campaign.</p>
                    </div>
                    <div className="mt-4">
                      <Button
                        type="button"
                        size="sm"
                        onClick={connect}
                        className="bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
              disabled={form.formState.isSubmitting || isLoadingRate || !isConnected}
            >
              {form.formState.isSubmitting ? "Creating NFT & Launching..." : 
               isLoadingRate ? "Loading Rate..." : 
               !isConnected ? "Connect Wallet to Launch" : 
               "Create NFT & Launch Campaign"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>

    {/* Success Modal - Shows in the center of the screen when a campaign is created */}
    <CampaignSuccessModal
      isOpen={successModalOpen}
      onOpenChange={setSuccessModalOpen}
      campaignId={createdCampaignId}
      txSignature={txSignature}
    />
  );
}
