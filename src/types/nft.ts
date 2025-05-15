// NFT-related types for GotongKarya platform

export interface NftAttribute {
  trait_type: string;
  value: string | number;
}

export interface NftMetadata {
  name: string;
  description: string;
  attributes?: NftAttribute[];
  externalUrl?: string;
  campaignId?: string;
}

export interface CampaignNft {
  mintAddress: string;
  name: string;
  description: string;
  imageUri: string;
  creator: string; // Wallet address of creator
  campaignId: string;
  attributes?: NftAttribute[];
  createdAt: number; // Unix timestamp
}

export interface NftReward {
  nft: CampaignNft;
  recipientAddress: string; // Supporter wallet address
  transferredAt: number; // Unix timestamp
  transactionSignature?: string;
}

// User's NFT collection
export interface UserNftCollection {
  userId: string; // Wallet address
  nfts: CampaignNft[];
}
