import type { Campaign } from '@/types';

export const LOCAL_STORAGE_KEYS = {
  USER_CAMPAIGNS: 'gk-user-campaigns',
};

/**
 * Store a user-created campaign to localStorage
 */
export const storeUserCampaign = (campaign: Campaign): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Get existing campaigns
  const existing = getUserCampaigns();
  
  // Add new campaign, avoiding duplicates
  const updated = [campaign, ...existing.filter(c => c.id !== campaign.id)];
  
  // Save to localStorage
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.USER_CAMPAIGNS, 
    JSON.stringify(updated)
  );

  console.log('Campaign stored in localStorage:', campaign.id);
};

/**
 * Update a campaign's funding data in localStorage
 */
export const updateCampaignFunding = (campaignId: string, raisedAmount: number): void => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  console.log('Attempting to update campaign funding for:', campaignId, 'with amount:', raisedAmount);
  
  // Get existing campaigns
  const campaigns = getUserCampaigns();
  
  // Try to match the campaign - first try exact match, then try with/without 'campaign-' prefix
  let index = campaigns.findIndex(c => c.id === campaignId);
  
  // If exact match fails, try alternative formats (with or without 'campaign-' prefix)
  if (index === -1) {
    if (campaignId.startsWith('campaign-')) {
      // Try without the prefix
      const cleanId = campaignId.replace('campaign-', '');
      index = campaigns.findIndex(c => c.id === cleanId);
      console.log('Trying without prefix:', cleanId);
    } else {
      // Try with the prefix
      const prefixedId = `campaign-${campaignId}`;
      index = campaigns.findIndex(c => c.id === prefixedId);
      console.log('Trying with prefix:', prefixedId);
    }
  }
  
  if (index === -1) {
    console.warn('Campaign not found in localStorage after all attempts:', campaignId);
    console.log('Available campaigns:', campaigns.map(c => c.id).join(', '));
    return;
  }
  
  console.log('Found campaign at index:', index, 'with ID:', campaigns[index].id);
  
  // Update the raised amount
  campaigns[index].raisedSOL = raisedAmount;
  
  // If supporter count exists, increment it
  if (typeof campaigns[index].supportersCount === 'number') {
    campaigns[index].supportersCount += 1;
  } else {
    campaigns[index].supportersCount = 1;
  }
  
  // Save to localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_CAMPAIGNS, JSON.stringify(campaigns));
    console.log('Updated campaign funding:', campaigns[index].id, 'New raised amount:', raisedAmount);
    
    // Force a page refresh to ensure UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch (error) {
    console.error('Error updating campaign funding in localStorage:', error);
  }
};

/**
 * Get all user-created campaigns from localStorage
 */
export const getUserCampaigns = (): Campaign[] => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_CAMPAIGNS);
    const campaigns = stored ? JSON.parse(stored) : [];
    console.log(`Retrieved ${campaigns.length} campaigns from localStorage`);
    return campaigns;
  } catch (error) {
    console.error('Error retrieving campaigns from localStorage:', error);
    return [];
  }
};
