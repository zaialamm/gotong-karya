"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { hasClaimedNft, getClaimedNftMint } from "@/lib/wallet-storage";
import { checkNftClaimEligibility } from "@/lib/web3";

interface SupporterEditionInfoProps {
  campaignId: string;
  walletAddress: string;
  hasContributed: boolean;
  editionNumber: number;
  editionMint: string;
}

export function SupporterEditionInfo({ campaignId, walletAddress, hasContributed, editionNumber, editionMint }: SupporterEditionInfoProps) {
  const [loading, setLoading] = useState(true);
  const [nftInfo, setNftInfo] = useState<{
    hasClaimed: boolean;
    editionNumber: number;
    editionMint: string;
  }>({ 
    hasClaimed: false, 
    editionNumber: editionNumber, 
    editionMint: editionMint || '' 
  });
  
  useEffect(() => {
    // Only run this if the user has contributed
    if (!hasContributed || !walletAddress) {
      setLoading(false);
      return;
    }

    const fetchNftStatus = async () => {
      try {
        setLoading(true);
        
        // First check local storage
        const hasClaimed = hasClaimedNft(walletAddress, campaignId);
        let mintAddress = '';
        
        if (hasClaimed) {
          // Get the mint address from local storage
          mintAddress = getClaimedNftMint(walletAddress, campaignId);
        } else {
          // Otherwise check on-chain
          const eligibility = await checkNftClaimEligibility(campaignId);
          
          // If the user has claimed on-chain but not in local storage
          if (eligibility.alreadyClaimed && eligibility.supporterFundingData) {
            const editionMint = eligibility.supporterFundingData.editionMint.toString();
            const edition = eligibility.supporterFundingData.editionNumber.toNumber();
            
            setNftInfo({
              hasClaimed: true,
              editionNumber: edition,
              editionMint: editionMint
            });
          }
        }
        
        if (hasClaimed && mintAddress) {
          setNftInfo({
            hasClaimed: true,
            editionNumber: editionNumber || 0,
            editionMint: mintAddress
          });
        }
      } catch (error) {
        console.error('Error fetching NFT status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNftStatus();
  }, [campaignId, walletAddress, hasContributed, editionNumber, editionMint]);
  
  if (loading) {
    return null;
  }
  
  // Only show if the user has contributed and claimed their NFT
  if (!hasContributed || !nftInfo.hasClaimed) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Your Edition NFT
        </CardTitle>
        <CardDescription>
          You own edition #{editionNumber} of this campaign's NFT
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Edition Number:</span>
            <Badge variant="secondary" className="ml-2">
              #{nftInfo.editionNumber || '?'}
            </Badge>
          </div>
          
          {nftInfo.editionMint && nftInfo.editionMint !== "11111111111111111111111111111111" && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Edition Mint:</span>
              <a 
                href={`https://explorer.solana.com/address/${nftInfo.editionMint}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on Explorer <ExternalLink className="h-3 w-3 inline" />
              </a>
            </div>
          )}
          
          <div className="bg-primary/10 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">
              This limited edition NFT is yours to keep! It represents your early support
              for this campaign and is one of only 5 editions available.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
