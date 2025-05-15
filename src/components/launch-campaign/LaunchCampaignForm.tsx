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
import { SuccessDialog } from "@/components/success-dialog"; // Import the success dialog component
import { IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import { Rocket, RefreshCw, Gift, Image as ImageIcon, Sparkles, Wallet, AlertTriangle, ExternalLink } from "lucide-react";
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
  imageUrl: z.string().url("Please enter a valid metadata URL.").min(1, "Metadata URL is required."),
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
  
  // Success dialog state
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  
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
      fundingGoalIDR: undefined,
      nftName: "",
      nftSymbol: "",
      nftDescription: "",
      imageUrl: "",
    },
    mode: "onChange",
  });

  const fundingGoalIDRValue = form.watch("fundingGoalIDR");

  // Watch metadata URL for reference only
  const imageUrlValue = form.watch("imageUrl");
  
  // No preview for metadata URLs - they're JSON files
  useEffect(() => {
    // Always keep preview null for metadata URLs
    setUrlImagePreview(null);
  }, [imageUrlValue]);

  useEffect(() => {
    const numericFundingGoal = typeof fundingGoalIDRValue === 'number' && !isNaN(fundingGoalIDRValue) ? fundingGoalIDRValue : 0;

    if (isLoadingRate) {
      setSolEquivalentDisplay("Loading current SOL to IDR rate...");
    } else if (rateError) {
      setSolEquivalentDisplay(`Error loading rate: ${rateError}. Using fallback rate.`);
    } else if (liveSolToIdrRate > 0) {
      if (numericFundingGoal > 0) {
        const calculatedSOL = numericFundingGoal / liveSolToIdrRate;
        setSolEquivalentDisplay(`Approx. ${calculatedSOL.toFixed(4)} ${SOL_CURRENCY_SYMBOL} (at 1 ${SOL_CURRENCY_SYMBOL} = ${liveSolToIdrRate.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`);
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
          description: "Failed to calculate SOL amount. Please check the IDR value and try again.",
          variant: "destructive",
        });
        return;
      }

      // Parse benefits into array and remove empty items
      const benefits = values.benefitsInput
        .split("\n")
        .map(item => item.trim())
        .filter(item => item.length > 0);

      if (benefits.length === 0) {
        toast({
          title: "Benefits Required",
          description: "Please add at least one benefit for supporters.",
          variant: "destructive",
        });
        return;
      }

      // Convert benefits to NFT attributes for metadata
      const nftAttributes: NftAttribute[] = benefits.map((benefit, index) => ({
        trait_type: `Benefit ${index + 1}`,
        value: benefit
      }));

      toast({
        title: "Creating Campaign NFT",
        description: "Processing your request and creating the NFT...",
        variant: "default",
      });

      // The metadata URL is now mandatory
      const metadataUrl = values.imageUrl;

      const campaignDataForApi = {
        projectName: values.projectName,
        description: values.description,
        fundingGoalSOL: parseFloat(fundingGoalSOL.toFixed(4)),
        nftName: values.nftName,
        nftSymbol: values.nftSymbol,
        nftDescription: values.nftDescription,
        benefits: benefits,
        imageUrl: values.imageUrl, // Pass the exact metadata URL to blockchain
        nftAttributes: nftAttributes,
      };
      
      console.log('Submitting campaign data to blockchain:', campaignDataForApi);
      
      try {
        // This will now use the real blockchain integration
        const result = await launchNewCampaign(campaignDataForApi);
        
        // Store campaign info for the success dialog
        setCampaignId(result.campaignId);
        setTransactionId(result.transactionId);
        
        // Show success notification with transaction link
        toast({
          title: "Campaign Created Successfully",
          description: (
            <div className="flex flex-col gap-2">
              <span>Your campaign has been successfully launched!</span>
              <a 
                href={`https://explorer.solana.com/tx/${result.transactionId}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                View transaction <ExternalLink className="h-3 w-3 inline" />
              </a>
            </div>
          ),
          variant: "success",
        });
        
        // Show the success dialog
        setSuccessDialogOpen(true);
        
        // Reset form
        form.reset();
        setUrlImagePreview(null);
        
      } catch (error: any) {
        console.error("Error launching campaign on blockchain:", error);
        
        // Show detailed error to user
        toast({
          title: "Blockchain Transaction Failed",
          description: `There was an error launching your campaign. ${error.message || ''}`,
          variant: "destructive",
        });
        
        // If there's an error code, show more technical details
        if (error.code) {
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
                    <Input
                      placeholder="E.g., Bali Cultural Center"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This name will be displayed prominently on your campaign page.
                  </FormDescription>
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
                    <Textarea
                      placeholder="Describe your project, its goals, and why it matters..."
                      className="bg-background min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of your project, its goals, timeline, and impact.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="benefitsInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Backer Benefits</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Each benefit on a new line, e.g.&#10;Early access to the platform&#10;Digital thank you certificate&#10;Name in credits"
                      className="bg-background min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List the benefits backers will receive (one per line). These will be attached to the NFT.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col space-y-4">
              <FormField
                control={form.control}
                name="fundingGoalIDR"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Goal (IDR)</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="text"
                          placeholder="5.000.000"
                          className="bg-background"
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            // Remove all non-numeric characters before processing
                            const numericOnly = rawValue.replace(/\D/g, '');
                            const numericValue = parseFloat(numericOnly);
                            
                            if (!isNaN(numericValue)) {
                              field.onChange(numericValue);
                            } else {
                              field.onChange(undefined);
                            }
                          }}
                          // Format the number with thousand separators (using dots)
                          value={field.value 
                            ? field.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') 
                            : ''}
                          onFocus={(e) => {
                            // Optional: Move cursor to end when focused
                            const val = e.target.value;
                            e.target.value = '';
                            e.target.value = val;
                          }}
                        />
                        <span className="ml-2 font-semibold">{IDR_CURRENCY_SYMBOL}</span>
                      </div>
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormDescription className="inline-block">
                        Minimum: {formatToIDR(100000)}
                      </FormDescription>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <RefreshCw className={cn("h-3 w-3 mr-1", isLoadingRate && "animate-spin")} />
                        {solEquivalentDisplay}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Campaign Featured Image</FormLabel>
                      <FormControl>
                        <div>
                          <Input
                            type="file"
                            className="hidden"
                            id="campaign-image-upload"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setImageFile(file);
                                onChange(file);
                                fileToDataUri(file).then(dataUri => {
                                  setImagePreview(dataUri);
                                });
                              }
                            }}
                            {...fieldProps}
                          />
                          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md border-primary/20 bg-background hover:border-primary/50 transition cursor-pointer" onClick={() => document.getElementById('campaign-image-upload')?.click()}>
                            {imagePreview ? (
                              <div className="flex flex-col items-center">
                                <Image src={imagePreview} alt="Campaign image preview" width={200} height={150} className="rounded-md object-contain max-h-[200px]" />
                                <span className="mt-2 text-sm text-muted-foreground">Click to change image</span>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 mb-2 text-primary/50" />
                                <span className="text-sm text-muted-foreground">Click to select a featured image for your campaign</span>
                                <span className="text-xs text-muted-foreground mt-1">(Max 5MB, JPG, PNG, WebP, or GIF)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        This image will represent your campaign visually. It will be stored off-chain and used for display purposes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Gift className="mr-2 h-5 w-5 text-primary" />
                NFT Reward Details
              </h3>
              <div className="space-y-4">

                <FormField
                  control={form.control}
                  name="nftName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NFT Collection Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g., Bali Cultural Center Supporter" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This will be the official name of your NFT collection.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nftDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NFT Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="E.g., This NFT represents your support for the Bali Cultural Center project..." 
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
                      <FormLabel>NFT Metadata URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/metadata.json" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Paste a URL to a JSON file that follows the Metaplex NFT metadata standard.
                        The JSON should only include name, symbol, description, and image URL.
                      </FormDescription>
                      {imageUrlValue && imageUrlValue.trim() !== "" && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">Metadata URL detected. Make sure it points to a valid JSON file.</p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
            </div>
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
  );
}

// Add the SuccessDialog to the component render tree
export function LaunchCampaignFormWithDialog() {
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [transactionId, setTransactionId] = useState("");

  return (
    <>
      <LaunchCampaignForm />
      <SuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        campaignId={campaignId}
        transactionId={transactionId}
      />
    </>
  );
}
