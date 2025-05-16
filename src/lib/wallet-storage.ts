// Define storage keys for wallet-related data
export const WALLET_STORAGE_KEYS = {
  FUNDED_CAMPAIGNS: 'gk-funded-campaigns',
  WITHDRAWN_CAMPAIGNS: 'gk-withdrawn-campaigns',
  REFUNDED_CAMPAIGNS: 'gk-refunded-campaigns',
  CLAIMED_NFTS: 'gk-claimed-nfts'
};

/**
 * Store funded campaign in localStorage
 * @param walletAddress User's wallet address
 * @param campaignId Campaign ID that was funded
 */
export const storeFundedCampaign = (walletAddress: string, campaignId: string): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return;
  
  const storageKey = `${WALLET_STORAGE_KEYS.FUNDED_CAMPAIGNS}-${walletAddress}`;
  
  // Get existing funded campaigns for this wallet
  let fundedCampaigns: string[] = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      fundedCampaigns = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving funded campaigns from localStorage:', error);
  }
  
  // Add the campaign if it's not already there
  if (!fundedCampaigns.includes(campaignId)) {
    fundedCampaigns.push(campaignId);
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(fundedCampaigns));
      console.log(`Campaign ${campaignId} marked as funded by wallet ${walletAddress}`);
    } catch (error) {
      console.error('Error storing funded campaign in localStorage:', error);
    }
  }
};

/**
 * Check if a campaign has been funded by a specific wallet
 * @param walletAddress User's wallet address
 * @param campaignId Campaign ID to check
 * @returns boolean indicating if the wallet has funded this campaign
 */
export const hasFundedCampaign = (walletAddress: string, campaignId: string): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return false;
  
  const storageKey = `${WALLET_STORAGE_KEYS.FUNDED_CAMPAIGNS}-${walletAddress}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const fundedCampaigns: string[] = JSON.parse(stored);
      return fundedCampaigns.includes(campaignId);
    }
  } catch (error) {
    console.error('Error checking funded campaigns in localStorage:', error);
  }
  
  return false;
};

/**
 * Store withdrawn campaign in localStorage
 * @param walletAddress Creator's wallet address
 * @param campaignId Campaign ID that was withdrawn
 */
export const storeWithdrawnCampaign = (walletAddress: string, campaignId: string): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return;
  
  const storageKey = `${WALLET_STORAGE_KEYS.WITHDRAWN_CAMPAIGNS}-${walletAddress}`;
  
  // Get existing withdrawn campaigns for this wallet
  let withdrawnCampaigns: string[] = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      withdrawnCampaigns = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving withdrawn campaigns from localStorage:', error);
  }
  
  // Add the campaign if it's not already there
  if (!withdrawnCampaigns.includes(campaignId)) {
    withdrawnCampaigns.push(campaignId);
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(withdrawnCampaigns));
      console.log(`Campaign ${campaignId} marked as withdrawn by creator ${walletAddress}`);
    } catch (error) {
      console.error('Error storing withdrawn campaign in localStorage:', error);
    }
  }
};

/**
 * Check if a campaign has been withdrawn by a specific wallet
 * @param walletAddress Creator's wallet address
 * @param campaignId Campaign ID to check
 * @returns boolean indicating if the wallet has withdrawn this campaign
 */
export const hasWithdrawnCampaign = (walletAddress: string, campaignId: string): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return false;
  
  const storageKey = `${WALLET_STORAGE_KEYS.WITHDRAWN_CAMPAIGNS}-${walletAddress}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const withdrawnCampaigns: string[] = JSON.parse(stored);
      return withdrawnCampaigns.includes(campaignId);
    }
  } catch (error) {
    console.error('Error checking withdrawn campaigns in localStorage:', error);
  }
  
  return false;
};

/**
 * Store refunded campaign in localStorage
 * @param walletAddress Supporter's wallet address
 * @param campaignId Campaign ID that was refunded
 */
export const storeRefundedCampaign = (walletAddress: string, campaignId: string): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return;
  
  const storageKey = `${WALLET_STORAGE_KEYS.REFUNDED_CAMPAIGNS}-${walletAddress}`;
  
  // Get existing refunded campaigns for this wallet
  let refundedCampaigns: string[] = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      refundedCampaigns = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving refunded campaigns from localStorage:', error);
  }
  
  // Add the campaign if it's not already there
  if (!refundedCampaigns.includes(campaignId)) {
    refundedCampaigns.push(campaignId);
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(refundedCampaigns));
      console.log(`Campaign ${campaignId} marked as refunded for supporter ${walletAddress}`);
    } catch (error) {
      console.error('Error storing refunded campaign in localStorage:', error);
    }
  }
};

/**
 * Check if a campaign has been refunded to a specific wallet
 * @param walletAddress Supporter's wallet address
 * @param campaignId Campaign ID to check
 * @returns boolean indicating if the wallet has received a refund for this campaign
 */
export const hasRefundedCampaign = (walletAddress: string, campaignId: string): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return false;
  
  const storageKey = `${WALLET_STORAGE_KEYS.REFUNDED_CAMPAIGNS}-${walletAddress}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const refundedCampaigns: string[] = JSON.parse(stored);
      return refundedCampaigns.includes(campaignId);
    }
  } catch (error) {
    console.error('Error checking refunded campaigns in localStorage:', error);
  }
  
  return false;
};

/**
 * Store claimed NFT in localStorage
 * @param walletAddress Supporter's wallet address
 * @param campaignId Campaign ID for the claimed NFT
 * @param editionMint Edition mint address (optional)
 */
export const storeNftClaimed = (walletAddress: string, campaignId: string, editionMint?: string): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return;
  
  const storageKey = `${WALLET_STORAGE_KEYS.CLAIMED_NFTS}-${walletAddress}`;
  
  // Get existing claimed NFTs for this wallet
  let claimedNfts: Record<string, string> = {};
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      claimedNfts = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving claimed NFTs from localStorage:', error);
  }
  
  // Add the campaign if it's not already there
  if (!claimedNfts[campaignId]) {
    claimedNfts[campaignId] = editionMint || 'claimed';
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(claimedNfts));
      console.log(`NFT for campaign ${campaignId} marked as claimed by supporter ${walletAddress}`);
    } catch (error) {
      console.error('Error storing claimed NFT in localStorage:', error);
    }
  }
};

/**
 * Check if an NFT has been claimed by a specific wallet for a campaign
 * @param walletAddress Supporter's wallet address
 * @param campaignId Campaign ID to check
 * @returns boolean indicating if the wallet has claimed an NFT for this campaign
 */
export const hasClaimedNft = (walletAddress: string, campaignId: string): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return false;
  
  const storageKey = `${WALLET_STORAGE_KEYS.CLAIMED_NFTS}-${walletAddress}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const claimedNfts: Record<string, string> = JSON.parse(stored);
      return !!claimedNfts[campaignId];
    }
  } catch (error) {
    console.error('Error checking claimed NFTs in localStorage:', error);
  }
  
  return false;
};

/**
 * Get the claimed NFT edition mint address for a campaign
 * @param walletAddress Supporter's wallet address
 * @param campaignId Campaign ID to check
 * @returns The edition mint address if available, empty string otherwise
 */
export const getClaimedNftMint = (walletAddress: string, campaignId: string): string => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !walletAddress) return '';
  
  const storageKey = `${WALLET_STORAGE_KEYS.CLAIMED_NFTS}-${walletAddress}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const claimedNfts: Record<string, string> = JSON.parse(stored);
      return claimedNfts[campaignId] || '';
    }
  } catch (error) {
    console.error('Error getting claimed NFT mint address from localStorage:', error);
  }
  
  return '';
};
