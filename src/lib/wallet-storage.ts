// Define storage keys for wallet-related data
export const WALLET_STORAGE_KEYS = {
  FUNDED_CAMPAIGNS: 'gk-funded-campaigns'
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
