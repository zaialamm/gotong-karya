// Re-export NFT types
export * from './nft';

export interface Creator {
  id: string;
  name: string;
  walletAddress?: string; // Mock
  avatarUrl?: string; // Placeholder for creator avatar
}

export type CampaignStatus = "Running" | "Successful" | "Failed" | "Completed";

export interface Supporter {
  walletAddress: string;
  contributionAmount: number;
  nftMinted: boolean;
  editionNumber?: number;
  editionMint?: string;
  contributionDate: string;
}

export interface Campaign {
  id: string;
  projectName: string;
  description: string;
  creator: Creator;
  fundingGoalSOL: number;
  raisedSOL: number;
  status: CampaignStatus;
  nftName: string; 
  nftSymbol: string; 
  nftDescription?: string; 
  nftMintAddress?: string; 
  imageUrl: string;
  startDate?: string;
  endDate?: string;
  benefits?: string[];
  supporters?: Supporter[];
  editionNftInfo?: {
    maxEditions: number;
    editionsMinted: number;
    automaticMinting: boolean;
  };
  supportersCount?: number; 
  nftAttributes?: Array<{trait_type: string, value: string | number}>; // NFT attributes
}

// NFT transaction interfaces for supporter funding
export interface NftPurchase {
  id: string;
  campaignId: string;
  supporterAddress: string;
  amountSOL: number;
  nftMintAddress: string;
  timestamp: string; // ISO string date
  status: "Pending" | "Completed" | "Refunded";
  txSignature: string; // Solana transaction signature
}

// Campaign funding result
export interface FundingResult {
  success: boolean;
  signature: string; // Transaction signature
  campaignId: string;
  message: string;
  amount: number; // Amount of SOL contributed
  isCampaignFunded: boolean;
  raisedAmount: number; // Total raised in SOL
  supporterFundingId: string; // PDA of the supporter funding account
  editionInfo?: {
    maxEditions: number;
    editionsMinted: number;
    automaticMinting: boolean;
    message: string;
  } | null;
  editionMintResult?: {
    success: boolean;
    editionMint: string;
    signature: string;
  } | null;
}
