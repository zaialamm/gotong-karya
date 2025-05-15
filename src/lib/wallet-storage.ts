// Define storage keys for wallet-related data
export const WALLET_STORAGE_KEYS = {
  FUNDED_CAMPAIGNS: 'gk-funded-campaigns',
  WITHDRAWN_CAMPAIGNS: 'gk-withdrawn-campaigns'
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
