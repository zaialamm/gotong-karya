
export interface Creator {
  id: string;
  name: string;
  walletAddress?: string; // Mock
  avatarUrl?: string; // Placeholder for creator avatar
}

export type CampaignStatus = "Running" | "Past" | "Successful" | "Failed";

export interface Campaign {
  id: string;
  projectName: string;
  description: string;
  creator: Creator;
  fundingGoalSOL: number;
  raisedSOL: number;
  status: CampaignStatus;
  tokenTicker: string;
  tokenName: string; // e.g., "Jumbo Animation Film Token"
  tokenMetadata?: string; // e.g., "Create Jumbo Animation Film Token"
  imageUrl: string;
  endDate?: string; // Optional end date for campaign
  benefits?: string[]; // List of benefits for supporters
}

export interface TokenInfo {
  id: string;
  name: string; 
  ticker: string; 
  logoUrl?: string; 
  currentPriceSOL?: number; // For marketplace
  creator?: Creator; // Creator of the token/project
}

export interface UserTokenBalance {
  tokenId: string;
  tokenTicker: string;
  amount: number;
}

export interface Trade {
  id: string;
  type: "buy" | "sell";
  tokenTicker: string;
  amountTokens: number;
  pricePerTokenSOL: number;
  totalAmountSOL: number; 
  feeSOL: number;
  netAmountSOL?: number; 
  totalPaidSOL?: number; 
  timestamp: string; // ISO string date
  userAddress?: string; // Mock user address
}
