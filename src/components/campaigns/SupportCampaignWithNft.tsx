"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import { NftRewardDisplay } from "./NftRewardDisplay";
import { Campaign } from "@/types";
import { Award, Wallet, AlertTriangle } from "lucide-react";
import { mockCreateNft, transferNft } from "@/lib/nft";
import { initializeMetaplex } from "@/lib/nft";

interface SupportCampaignWithNftProps {
  campaign: Campaign;
}

export const SupportCampaignWithNft: FC<SupportCampaignWithNftProps> = ({ campaign }) => {
  const { toast } = useToast();
  const { isConnected, connect, address } = useWallet();
  const [amount, setAmount] = useState<number>(0.1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isNftMinted, setIsNftMinted] = useState<boolean>(false);
  const [mintedNftAddress, setMintedNftAddress] = useState<string | null>(null);

  const handleSupportClick = async () => {
    if (!isConnected) {
      try {
        await connect();
      } catch (error) {
        console.error("Failed to connect wallet", error);
        return;
      }
    } else if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount to support this campaign.",
        variant: "destructive",
      });
      return;
    } else {
      setIsProcessing(true);
      
      try {
        toast({
          title: "Processing Support",
          description: `Creating NFT reward and processing your support of ${amount} ${SOL_CURRENCY_SYMBOL}...`,
        });

        // In a real implementation, this would call Solana to transfer SOL and mint the NFT
        // For demo purposes, we'll use the mock function
        
        // Create metadata from campaign NFT info
        const nftMetadata = {
          name: campaign.nftName,
          description: campaign.nftDescription || "",
          attributes: campaign.nftAttributes,
          campaignId: campaign.id
        };

        // Mock creating an NFT
        // In production, we'd use a real File object from the campaign image
        // For now, we'll use a placeholder approach with mockCreateNft
        const mockImageFile = new File([""], "campaign-image.png", { type: "image/png" });
        const nftResult = await mockCreateNft(mockImageFile, nftMetadata);
        
        // In production, we'd transfer SOL from the user to the campaign
        // and transfer the NFT to the user's wallet
        
        // Set state to indicate NFT was minted
        setIsNftMinted(true);
        setMintedNftAddress(nftResult.mintAddress);
        
        toast({
          title: "Support Successful!",
          description: `Thank you for supporting with ${amount} ${SOL_CURRENCY_SYMBOL}. You have received an exclusive supporter NFT!`,
          variant: "default",
          duration: 5000,
        });
      } catch (error) {
        console.error("Error processing support:", error);
        toast({
          title: "Support Failed",
          description: "There was an error processing your support. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Support This Campaign
              </CardTitle>
              <CardDescription>
                Support this campaign to receive an exclusive NFT reward
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Wallet connection required</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Connect your wallet to support this campaign and receive an NFT reward.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Support Amount ({SOL_CURRENCY_SYMBOL})</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      min={0.01}
                      step={0.01}
                      disabled={isProcessing || isNftMinted}
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum support amount: 0.01 {SOL_CURRENCY_SYMBOL}
                    </p>
                  </div>

                  {isNftMinted && mintedNftAddress && (
                    <div className="rounded-md bg-green-50 p-4 border border-green-200">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Award className="h-5 w-5 text-green-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">NFT Received!</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>NFT has been transferred to your wallet. Mint address: {mintedNftAddress.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSupportClick} 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={isProcessing || isNftMinted}
              >
                {isNftMinted ? (
                  "Support Successful!"
                ) : isProcessing ? (
                  "Processing..."
                ) : !isConnected ? (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-4 w-4" />
                    Support & Get NFT
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* NFT Reward Preview */}
        <NftRewardDisplay campaign={campaign} isPreview={!isNftMinted} />
      </div>
    </div>
  );
};
