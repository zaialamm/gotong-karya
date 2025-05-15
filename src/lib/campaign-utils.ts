import type { Campaign } from '@/types';

/**
 * Check if a campaign is a mock campaign (from the CAMPAIGNS_DATA constant)
 * @param campaign The campaign to check
 * @returns True if the campaign is from mock data
 */
export const isMockCampaign = (campaign: Campaign): boolean => {
  // Mock campaigns have IDs in the format 'campaign1', 'campaign2', etc.
  return /^campaign\d+$/.test(campaign.id);
};

/**
 * Check if a campaign has expired based on its end timestamp
 * @param campaign The campaign to check
 * @returns True if the campaign has expired, false otherwise
 */
export const hasCampaignExpired = (campaign: Campaign): boolean => {
  // Mock campaigns shouldn't expire - keep them in their original status
  if (isMockCampaign(campaign)) return false;
  
  if (!campaign.endDate) return false;
  
  const endTime = new Date(campaign.endDate).getTime();
  const currentTime = Date.now();
  
  return currentTime > endTime;
};

/**
 * Get the real-time status of a campaign based on its current status, funding level, and end date
 * @param campaign The campaign to check
 * @returns The current status of the campaign
 */
export const getRealTimeStatus = (campaign: Campaign): string => {
  // First check if the campaign is fully funded (100% or more)
  const percentFunded = (campaign.raisedSOL / campaign.fundingGoalSOL) * 100;
  const isFullyFunded = percentFunded >= 100;
  
  // If campaign is fully funded, mark as Successful regardless of other status
  if (isFullyFunded) {
    return 'Successful';
  }
  
  // If campaign is already marked as Failed, keep that status
  if (campaign.status === 'Failed') {
    return campaign.status;
  }
  
  // If campaign is Running but has expired, mark as Failed
  if (campaign.status === 'Running' && hasCampaignExpired(campaign)) {
    return 'Failed';
  }
  
  // Otherwise, return the current status
  return campaign.status;
};

/**
 * Format the remaining time for a campaign
 * @param campaign The campaign to format time for
 * @returns Formatted time string (e.g., "5 minutes left" or "Expired")
 */
export const formatCampaignTimeRemaining = (campaign: Campaign): string => {
  // For mock campaigns, show a fake "time remaining" that's appropriate for their status
  if (isMockCampaign(campaign)) {
    // If it's a mock campaign with 'Running' status, show some time remaining
    if (campaign.status === 'Running') {
      return '5 days left';
    }
    // For non-running mock campaigns, don't show time
    return '';
  }
  
  if (!campaign.endDate) return 'No end date';
  
  const endTime = new Date(campaign.endDate).getTime();
  const currentTime = Date.now();
  const timeLeftMs = endTime - currentTime;
  
  if (timeLeftMs <= 0) return 'Expired';
  
  // Format the time remaining
  const minutes = Math.floor(timeLeftMs / (1000 * 60));
  const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes} min${minutes === 1 ? '' : 's'} left`;
  }
  
  return `${seconds} sec${seconds === 1 ? '' : 's'} left`;
};

/**
 * Get percentage of campaign funding completed
 * @param campaign The campaign to check
 * @returns Percentage of funding goal achieved (0-100)
 */
export const getCampaignFundingPercentage = (campaign: Campaign): number => {
  if (!campaign.fundingGoalSOL || campaign.fundingGoalSOL <= 0) return 0;
  return Math.min(100, (campaign.raisedSOL / campaign.fundingGoalSOL) * 100);
};
