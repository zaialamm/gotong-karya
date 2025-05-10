
import { CAMPAIGNS_DATA, IPFS_BATIK_BADGE_URL_BASE, MARKETPLACE_FEE_PERCENTAGE, SOL_TO_USD_RATE } from './constants';
import type { Campaign } from '@/types';

// Phantom Wallet Provider interface
interface PhantomProvider {
  isPhantom: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args?: any) => void) => void;
  removeListener?: (event: string, callback: (args?: any) => void) => void; // Optional for cleanup
  request: (method: string, params: any) => Promise<any>;
  publicKey: { toString: () => string } | null;
}

// Extend the Window interface to include phantom
declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}


interface WalletConnection {
  address: string;
}

export const connectPhantomWallet = async (): Promise<WalletConnection | null> => {
  console.log("Attempting to connect to Phantom wallet...");
  const provider = window.phantom?.solana;

  if (provider?.isPhantom) {
    try {
      // onlyIfTrusted: false will prompt the user if the dapp is not already trusted.
      const resp = await provider.connect({ onlyIfTrusted: false });
      const publicKeyString = resp.publicKey.toString();
      console.log(`Connected to Phantom, address: ${publicKeyString}`);
      return { address: publicKeyString };
    } catch (err: any) {
      // Handles user rejection, or other connection errors
      console.error("Phantom Wallet connection error:", err);
      if (err.message && typeof err.message === 'string') {
        throw new Error(err.message);
      }
      throw new Error("Could not connect to Phantom Wallet. User may have rejected the request.");
    }
  } else {
    // Phantom provider not found
    console.warn("Phantom wallet not found. Please install it.");
    // This error will be caught by the calling hook to inform the user.
    // Optionally, can redirect to Phantom installation page here.
    // window.open("https://phantom.app/", "_blank");
    throw new Error("Phantom wallet not found. Please install the extension.");
  }
};

export interface FundingResult {
  transactionId: string;
  tokensMinted: number;
  ownershipPercent: number; // This is a mock value
  badgeUrl: string;
  message: string;
}

export const fundCampaign = async (
  campaignId: string,
  amount: number,
  currency: "SOL" | "USDC" | "USDT"
): Promise<FundingResult> => {
  const campaign = CAMPAIGNS_DATA.find(c => c.id === campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  console.log(`Funding campaign ${campaign.projectName} (ID: ${campaignId}) with ${amount} ${currency}`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate transaction delay

  const transactionId = `mockFundingTx_${Date.now().toString(16)}`;
  
  let solEquivalent = amount;
  if (currency === "USDC" || currency === "USDT") {
    solEquivalent = amount / SOL_TO_USD_RATE;
  }

  // Mock token minting logic (example: 1 SOL = 100 project tokens)
  // This is highly dependent on each campaign's tokenomics
  let tokensMinted = 0;
  let ownershipPercent = 0; // Highly speculative mock value

  if (campaign.tokenTicker === "JUMBO") {
    tokensMinted = solEquivalent * 200; // Example: 20 tokens per 0.1 SOL -> 200 tokens per 1 SOL
    ownershipPercent = (solEquivalent / campaign.fundingGoalSOL) * 10; // Mock ownership up to 10% for full funding
  } else if (campaign.tokenTicker === "BALI") {
    tokensMinted = solEquivalent * 150; // Example: 15 tokens per 0.1 SOL
    ownershipPercent = (solEquivalent / campaign.fundingGoalSOL) * 15;
  } else if (campaign.tokenTicker === "MURAL") {
    tokensMinted = solEquivalent * 100; // Example: 10 tokens per 0.1 SOL
    ownershipPercent = (solEquivalent / campaign.fundingGoalSOL) * 5;
  } else {
    tokensMinted = solEquivalent * 50; // Generic fallback
    ownershipPercent = (solEquivalent / campaign.fundingGoalSOL) * 2;
  }
  
  tokensMinted = parseFloat(tokensMinted.toFixed(2));
  ownershipPercent = parseFloat(ownershipPercent.toFixed(2));


  const badgeUrl = `${IPFS_BATIK_BADGE_URL_BASE}/${campaign.tokenTicker}`; // Unique badge per token
  const message = `Successfully funded ${campaign.projectName}. Received ${tokensMinted} ${campaign.tokenTicker} tokens (${ownershipPercent}% mock ownership). Batik Badge: ${badgeUrl}`;
  
  console.log(message + ` Tx ID: ${transactionId}`);

  return { transactionId, tokensMinted, ownershipPercent, badgeUrl, message };
};


export interface TradeResult {
  transactionId: string;
  details: string;
  message: string;
}

export const tradeTokens = async (
  tradeType: "buy" | "sell",
  tokenTicker: string,
  amountTokens: number,
  pricePerTokenSOL: number
): Promise<TradeResult> => {
  console.log(`${tradeType === "buy" ? "Buying" : "Selling"} ${amountTokens} ${tokenTicker} tokens at ${pricePerTokenSOL.toFixed(6)} SOL each.`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate transaction delay

  const transactionId = `mockTradeTx_${Date.now().toString(16)}`;
  const subtotalSOL = amountTokens * pricePerTokenSOL;
  const feeSOL = subtotalSOL * MARKETPLACE_FEE_PERCENTAGE;

  let details = "";
  let message = "";

  if (tradeType === "sell") {
    const netSOL = subtotalSOL - feeSOL;
    details = `Sold ${amountTokens} ${tokenTicker}. Subtotal: ${subtotalSOL.toFixed(6)} SOL. Fee: ${feeSOL.toFixed(6)} SOL. Net Received: ${netSOL.toFixed(6)} SOL.`;
    message = `Successfully sold ${amountTokens} ${tokenTicker} tokens.`;
  } else { // buy
    const totalSOL = subtotalSOL + feeSOL;
    details = `Bought ${amountTokens} ${tokenTicker}. Subtotal: ${subtotalSOL.toFixed(6)} SOL. Fee: ${feeSOL.toFixed(6)} SOL. Total Paid: ${totalSOL.toFixed(6)} SOL.`;
    message = `Successfully bought ${amountTokens} ${tokenTicker} tokens.`;
  }
  
  console.log(`Trade successful. Tx: ${transactionId}. Details: ${details}`);
  return { transactionId, details, message };
};

export const launchNewCampaign = async (formData: {
  projectName: string;
  description: string;
  fundingGoalSOL: number;
  tokenTicker: string;
  tokenName: string;
  benefits: string[];
  imageUrl: string;
}): Promise<{ campaignId: string; message: string }> => {
  console.log("Launching new campaign with data:", formData);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

  const campaignId = `campaignMock_${Date.now().toString(16)}`;
  const message = `Campaign '${formData.projectName}' created successfully! Token Ticker: ${formData.tokenTicker}. Campaign ID: ${campaignId}. Benefits: ${formData.benefits.join(', ')}. ImageURL: ${formData.imageUrl.substring(0,50)}...`;
  
  console.log(message);
  // In a real app, this would interact with a smart contract and save to a DB.
  // We can also add it to a local state or a temporary mock data array if needed for immediate reflection in UI.
  // Example: Add to CAMPAIGNS_DATA for mock purposes
  // CAMPAIGNS_DATA.push({
  //   id: campaignId,
  //   projectName: formData.projectName,
  //   description: formData.description,
  //   creator: CREATORS_DATA[0], // Mock creator
  //   fundingGoalSOL: formData.fundingGoalSOL,
  //   raisedSOL: 0,
  //   status: "Running",
  //   tokenTicker: formData.tokenTicker,
  //   tokenName: formData.tokenName,
  //   benefits: formData.benefits,
  //   imageUrl: formData.imageUrl, // Use the provided image URL
  //   endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Approx 30 days from now
  // });
  
  return { campaignId, message };
};

// Function to check current connection status without prompting user (if already trusted)
export const checkPhantomConnection = async (): Promise<WalletConnection | null> => {
  const provider = window.phantom?.solana;
  if (provider?.isPhantom && provider.publicKey) {
    // If already connected (e.g., from a previous session and dapp is trusted)
    // Or if connect({ onlyIfTrusted: true }) was successful
    try {
      // Attempt to connect silently if trusted
      const resp = await provider.connect({ onlyIfTrusted: true });
      const publicKeyString = resp.publicKey.toString();
      console.log(`Silently re-connected to Phantom, address: ${publicKeyString}`);
      return { address: publicKeyString };
    } catch (error) {
      // Not trusted or user has disconnected from Phantom UI
      console.log("Phantom: Not connected or not trusted for silent re-connection.");
      return null;
    }
  }
  return null;
};
