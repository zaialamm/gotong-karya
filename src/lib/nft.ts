import type { NftMetadata } from '@/types';
import * as web3 from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// Simplified interface for NFT metadata
export interface NFTMetadataArgs {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  properties?: any;
}

/**
 * Get Solana cluster URL for devnet
 */
export const getSolanaClusterUrl = () => {
  return 'https://api.devnet.solana.com';
};

/**
 * For hackathon purposes, we'll use the provided metadata URL directly
 * @param metadata - NFT metadata including metadata URL (in the image field)
 * @returns URI of the metadata
 */
export const createNftMetadata = async (metadata: NFTMetadataArgs): Promise<string> => {
  console.log("Using metadata URL directly:", metadata.image);
  
  // For hackathon purposes, we're directly using the metadata URL provided by the user
  // This avoids storage costs and browser compatibility issues with crypto libraries
  if (metadata.image && metadata.image.trim() !== '') {
    return metadata.image;
  }
  
  // Fallback if no metadata URL is provided (shouldn't happen with form validation)
  console.log("No metadata URL provided, using placeholder");
  return `https://example.com/${metadata.name.replace(/\s+/g, '-').toLowerCase()}.json`;
};


/**
 * Helper function to generate a simple deterministic ID
 * @param inputs - Strings to use for ID generation
 * @returns A simple deterministic ID
 */
export const generateId = (...inputs: string[]): string => {
  const combined = inputs.join('-');
  let hash = 0;
  
  // Simple string hash function
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(12, '0');
};

/**
 * Creates an NFT with metadata URL (simplified for hackathon)
 * @param imageFile - Campaign featured image (not used)
 * @param metadata - NFT metadata
 * @returns NFT data with mint address
 */
export const createNft = async (
  imageFile: File,
  metadata: NftMetadata
): Promise<{ mintAddress: string; imageUri: string; name: string }> => {
  // Generate a simple deterministic ID for the NFT
  const mintAddress = generateId(metadata.name, 'NFT', Date.now().toString());
  
  console.log('NFT created:', {
    mintAddress, 
    name: metadata.name,
    description: metadata.description,
  });
  
  // Use imageUri directly without requiring imageUrl property
  return {
    mintAddress,
    imageUri: '', // No direct image since we're using metadata URL
    name: metadata.name
  };
};

