import { CAMPAIGNS_DATA } from './constants';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { BN } from '@project-serum/anchor';
import { storeUserCampaign, updateCampaignFunding } from './storage';
import type { Campaign, CampaignStatus, LaunchCampaignFormData, CampaignFundingStatus } from '@/types';
import * as web3 from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TOKEN_METADATA_PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import * as token from '@solana/spl-token';
import { Campaign, Supporter, FundingResult } from '../types';

// Import Metaplex UMI libraries for NFT metadata
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createNft, mplTokenMetadata, printSupply } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, percentAmount, publicKey } from '@metaplex-foundation/umi';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';

// Define Phantom wallet types to avoid TypeScript errors
declare global {
  interface Window {
    phantom?: {
      solana?: {
        publicKey: { toString(): string };
        signMessage(message: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>;
        signTransaction(transaction: any): Promise<any>;
        signAllTransactions(transactions: any[]): Promise<any[]>;
      };
    };
  }
}

// Constants needed for NFT creation
// TOKEN_PROGRAM_ID is already imported from @solana/spl-token
const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const MINT_DECIMALS = 0; // NFTs have 0 decimals

// For a hackathon project, we're keeping the NFT creation simple
// The creator will remain the mint authority

// Solana cluster URL for devnet
export const getSolanaClusterUrl = () => {
  return 'https://api.devnet.solana.com';
};

// The escrow program ID is used in other parts of the code
const ESCROW_PROGRAM_ID = new web3.PublicKey('DtHjEyhSHbm94vqfSBWgKxLn64GB5PkEzg3QrLJcQzQh');

// Create a proper NFT with metadata using Metaplex UMI
const createMetaplexNft = async (
  name: string,
  symbol: string,
  uri: string
): Promise<{ mintAddress: string; signature: string }> => {
  console.log("Creating NFT with metadata...");
  console.log("NFT details:", { name, symbol, uri });
  
  try {
    // Get Phantom wallet
    const provider = window.phantom?.solana;
    if (!provider?.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Create a UMI instance
    const umi = createUmi(getSolanaClusterUrl())
      .use(mplTokenMetadata());
    
    // Create a wallet adapter for Phantom that works with UMI
    console.log("Creating wallet adapter for Phantom...");
    
    // First get the wallet public key as a string
    const walletPublicKeyString = provider.publicKey.toString();
    console.log("Wallet public key:", walletPublicKeyString);
    
    // Create a custom publicKey object that has the toBase58 method
    const customPublicKey = {
      bytes: new Uint8Array(32), // This is just a placeholder
      toBase58: () => walletPublicKeyString,
      toString: () => walletPublicKeyString,
    };
    
    // Create a fully UMI-compatible wallet adapter
    const phantomWalletAdapter = {
      publicKey: customPublicKey,
      signMessage: async (message: Uint8Array) => {
        console.log("Signing message...");
        const { signature } = await provider.signMessage(message, 'utf8');
        return signature;
      },
      signTransaction: async (transaction: any) => {
        console.log("Signing transaction...");
        return await provider.signTransaction(transaction);
      },
      signAllTransactions: async (transactions: any[]) => {
        console.log("Signing all transactions...");
        return await provider.signAllTransactions(transactions);
      },
    };
    
    // Connect the wallet adapter to UMI
    umi.use(walletAdapterIdentity(phantomWalletAdapter));
    
    // Generate a new mint signer
    const mintKeypair = generateSigner(umi);
    console.log("Generated NFT mint address:", mintKeypair.publicKey);
    
    try {
      console.log("Creating NFT transaction...");
      // Create the NFT as a Master Edition with a limited print supply of 5
      const transaction = await createNft(umi, {
        mint: mintKeypair,
        name: name,
        symbol: symbol,
        uri: uri,
        printSupply: printSupply('Limited', [5]), // Limit to 5 editions for hackathon demo
        sellerFeeBasisPoints: percentAmount(0), // 0% royalties
        tokenStandard: 0, // Fungible Asset (FA) standard
        decimals: 0, // 0 decimals for NFT-like behavior
        creators: [{ 
          address: phantomWalletAdapter.publicKey, 
          share: 100, 
          verified: false 
        }]
      });
      
      console.log("NFT transaction created, sending to wallet for approval...");
      // Send and confirm the transaction
      const result = await transaction.sendAndConfirm(umi, {
        confirm: { commitment: 'confirmed' },
      });
      
      console.log("NFT creation transaction confirmed!");
      const nftTxSignature = result.signature.toString();
      
      console.log("NFT created successfully!");
      console.log("Mint address:", mintKeypair.publicKey.toString());
      console.log("Transaction signature:", nftTxSignature);
      
      // For a hackathon project, we'll keep the mint authority with the creator
      // This simplifies the implementation while still creating a proper NFT with metadata
      console.log("NFT created with creator as mint authority");
      
      // Return the NFT creation info
      return {
        mintAddress: mintKeypair.publicKey.toString(),
        signature: nftTxSignature
      };
    } catch (innerError) {
      console.error("Error in NFT creation transaction:", innerError);
      throw innerError;
    }
  } catch (error) {
    console.error("Error creating NFT with metadata:", error);
    throw error;
  }
};

// Import the deployed contract IDL
import gkescrowIdl from '../idl/gkescrow.json';

// Phantom Wallet Provider interface
interface PhantomProvider {
  isPhantom: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args?: any) => void) => void;
  removeListener?: (event: string, callback: (args?: any) => void) => void; // Optional for cleanup
  request: (method: string, params: any) => Promise<any>;
  publicKey: { toString: () => string } | null;
  // Sign transaction methods (added for blockchain interactions)
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signMessage: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }>;
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

/**
 * Fund a campaign by purchasing an NFT
 * @param campaignId Campaign ID to fund
 * @param amountSOL Amount in SOL to contribute
 * @returns Funding result with transaction details
 */
export const fundCampaign = async (
  campaignId: string,
  amountSOL: number
): Promise<FundingResult> => {
  try {
    console.log(`Funding campaign ${campaignId} with ${amountSOL} SOL`);
    
    // Get program instance
    const program = await getGkEscrowProgram();
    
    // Get wallet
    const wallet = window.phantom?.solana;
    if (!wallet || !wallet.publicKey) {
      throw new Error("Phantom wallet not connected. Please connect your wallet and try again.");
    }
    
    // Convert campaign ID to PublicKey
    const campaignPubkey = new web3.PublicKey(campaignId);
    const supporterPubkey = wallet.publicKey;
    
    const lamportsAmount = new anchor.BN(
      Math.floor(amountSOL * web3.LAMPORTS_PER_SOL)
    );
    
    // Fetch current campaign data to check if it's already funded
    let campaignDataBefore;
    try {
      campaignDataBefore = await program.account.campaign.fetch(campaignPubkey);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      campaignDataBefore = { isFunded: false };
    }
    const wasAlreadyFunded = campaignDataBefore.isFunded;
    
    // Derive the supporter funding PDA
    const [supporterFundingPDA] = await web3.PublicKey.findProgramAddress(
      [
        Buffer.from('supporter-funding'),
        campaignPubkey.toBuffer(),
        supporterPubkey.toBuffer(),
      ],
      program.programId
    );
    
    // Call the fund_campaign instruction
    const txSignature = await program.methods
      .fundCampaign(lamportsAmount)
      .accounts({
        campaign: campaignPubkey,
        supporter: supporterPubkey,
        supporterFunding: supporterFundingPDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log(`Campaign funded successfully! Signature: ${txSignature}`);
    
    // Fetch updated campaign data
    let campaignData;
    try {
      campaignData = await program.account.campaign.fetch(campaignPubkey);
    } catch (error) {
      console.error("Error fetching updated campaign data:", error);
      throw new Error("Failed to fetch campaign data after funding");
    }
    const isFundedNow = campaignData.isFunded;
    
    // Check if the campaign just became fully funded with this contribution
    let editionMintResult = null;
    
    if (isFundedNow && !wasAlreadyFunded) {
      // Campaign just became fully funded with this contribution
      console.log("Campaign just became fully funded! Edition NFTs will be minted automatically in order of funding.");
      
      // In this model, the NFTs will be minted in order of funding when the campaign becomes fully funded
      // The smart contract handles the edition numbering based on the order of funding
      console.log("The smart contract will assign edition numbers based on funding order.");
      console.log("First supporter gets edition #1, second gets #2, and so on.");
      
      try {
        editionMintResult = await mintEditionNft(
          campaignId, 
          supporterPubkey.toString(),
          0 // The edition number will be assigned by the contract
        );
        
        console.log("Edition NFT minted automatically!", editionMintResult);
      } catch (mintError) {
        // Log the error but don't fail the funding transaction
        console.error("Error auto-minting edition NFT:", mintError);
      }
    } else if (isFundedNow && wasAlreadyFunded) {
      // Campaign was already funded, so we need to check if this supporter already has an edition NFT
      try {
        // Fetch supporter funding data
        const supporterFundingData = await program.account.supporterFunding.fetch(supporterFundingPDA);
        
        // If they don't have an NFT yet, mint one for them
        if (!supporterFundingData.nftMinted) {
          editionMintResult = await mintEditionNft(
            campaignId,
            supporterPubkey.toString(),
            0 // The edition number will be assigned by the contract
          );
          console.log("Edition NFT minted for additional supporter!", editionMintResult);
        } else {
          console.log("Supporter already has an edition NFT for this campaign.");
        }
      } catch (error) {
        console.error("Error checking supporter funding data:", error);
      }
    }
    
    // Update campaign in local storage with new funding amount
    const updatedRaisedSOL = campaignData.raisedLamports.toNumber() / web3.LAMPORTS_PER_SOL;
    updateCampaignFunding(campaignId, updatedRaisedSOL);
    
    // Return the funding result
    return {
      success: true,
      signature: txSignature,
      campaignId,
      message: "Campaign funded successfully!",
      amount: amountSOL,
      isCampaignFunded: isFundedNow,
      raisedAmount: updatedRaisedSOL,
      supporterFundingId: supporterFundingPDA.toString(),
      editionInfo: isFundedNow ? {
        maxEditions: campaignData.maxEditions.toNumber(),
        editionsMinted: campaignData.editionsMinted.toNumber(),
        automaticMinting: true,
        message: "Edition NFTs are automatically minted to supporters in order of funding."
      } : null,
      editionMintResult: editionMintResult // Include edition mint result if available
    };
  } catch (error: any) {
    console.error("Error funding campaign:", error);
    throw new Error(`Failed to fund campaign: ${error.message}`);
  }
};

/**
 * Check campaign funding status
 * @param campaignId Campaign ID to check
 * @returns Campaign funding status
 */
/**
 * Get all campaigns from blockchain
 * @returns Array of campaigns combining on-chain data with mock data
 */
export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    // Get program instance
    const program = await getGkEscrowProgram();
    
    // Fetch all campaign accounts - specify "any" type to handle dynamic account structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campaignAccounts = await (program.account as any).campaign.all();
    console.log(`Found ${campaignAccounts.length} on-chain campaigns`);
    
    // Convert on-chain data to Campaign interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onChainCampaigns = campaignAccounts.map((account: any) => {
      const data = account.account;
      return {
        id: account.publicKey.toString(),
        projectName: data.projectName,
        description: data.description,
        creator: {
          id: data.creator.toString(),
          name: "Creator", // Placeholder since we don't store creator names on-chain
          walletAddress: data.creator.toString()
        },
        fundingGoalSOL: data.fundingGoalLamports.toNumber() / web3.LAMPORTS_PER_SOL,
        raisedSOL: data.raisedLamports.toNumber() / web3.LAMPORTS_PER_SOL,
        status: data.isFunded ? "Funded" : "Running",
        nftName: data.nftName,
        nftSymbol: data.nftSymbol, 
        imageUrl: data.nftUri, // Using NFT URI as image URL
        supportersCount: data.supportersCount?.toNumber() || 0,
        editionNftInfo: {
          maxEditions: data.maxEditions?.toNumber() || 5,
          editionsMinted: data.editionsMinted?.toNumber() || 0,
          automaticMinting: true
        }
      };
    });
    
    // Combine with mock data (real data takes priority)
    const onChainCampaignIds = onChainCampaigns.map((c: Campaign) => c.id);
    const mockCampaignsWithoutDuplicates = CAMPAIGNS_DATA.filter(
      campaign => !onChainCampaignIds.includes(campaign.id)
    );
    
    return [...onChainCampaigns, ...mockCampaignsWithoutDuplicates];
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    
    // Fall back to mock data if fetching fails
    return CAMPAIGNS_DATA;
  }
};

export const getCampaignStatus = async (campaignId: string) => {
  const campaign = CAMPAIGNS_DATA.find(c => c.id === campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  try {
    // In production, this would query the blockchain for the campaign account data
    const connection = getSolanaConnection();
    
    // Get the campaign PDA
    const creatorPubkey = new web3.PublicKey(campaign.creator.walletAddress || '');
    const campaignPDA = await deriveCampaignPDA(creatorPubkey, campaign.projectName);
    
    // Mock response for development
    return {
      campaignId,
      fundingGoalSOL: campaign.fundingGoalSOL,
      raisedSOL: campaign.raisedSOL,
      percentFunded: Math.round((campaign.raisedSOL / campaign.fundingGoalSOL) * 100),
      supportersCount: campaign.supportersCount || 0,
      remainingDays: calculateRemainingDays(campaign.endDate),
      status: campaign.status
    };
  } catch (error) {
    console.error("Error checking campaign status:", error);
    throw error;
  }
};

/**
 * Calculate days remaining for campaign funding
 */
const calculateRemainingDays = (endDateStr?: string): number => {
  if (!endDateStr) return 0; // Default to 0 days if no end date
  
  const endDate = new Date(endDateStr);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Constants for Solana connection and program ID
const SOLANA_NETWORK = 'devnet';
// Use the program ID from the deployed contract IDL
const GK_ESCROW_PROGRAM_ID = new web3.PublicKey(gkescrowIdl.address); // DtHjEyhSHbm94vqfSBWgKxLn64GB5PkEzg3QrLJcQzQh
const MINIMUM_LAMPORTS_FOR_NFT = 10000000; // 0.01 SOL (adjust as needed)

// Get Helius RPC URL from environment variables
const getHeliusRpcUrl = () => {
  if (typeof process !== 'undefined' && process.env.HELIUS_DEVNET_URL) {
    return process.env.HELIUS_DEVNET_URL;
  }
  // Fallback for client-side if not available through Next.js
  if (typeof window !== 'undefined' && (window as any).__env?.HELIUS_DEVNET_URL) {
    return (window as any).__env.HELIUS_DEVNET_URL;
  }
  // Default fallback
  return 'https://devnet.helius-rpc.com/?api-key=39703e7b-a2b9-4416-a329-882b8474ce2d';
}

// IDL for the gkescrow program
const gkEscrowIdl = {
  // This is a simplified version of the IDL for illustration
  // In production, import the actual IDL from a file or fetch it from chain
  version: '0.1.0',
  name: 'gk_escrow',
  instructions: [
    {
      name: 'initializeCampaign',
      accounts: [
        { name: 'campaign', isMut: true, isSigner: false },
        { name: 'creator', isMut: true, isSigner: true },
        { name: 'nftMint', isMut: false, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'projectName', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'fundingGoalLamports', type: 'u64' },
        { name: 'nftName', type: 'string' },
        { name: 'nftSymbol', type: 'string' },
        { name: 'nftUri', type: 'string' },
      ],
    },
  ],
  // Add other necessary IDL fields
};

// Setup Solana connection with Helius RPC URL
const getSolanaConnection = () => {
  return new web3.Connection(
    getHeliusRpcUrl(),
    'confirmed'
  );
};

// Get Anchor provider from Phantom wallet
const getAnchorProvider = () => {
  const provider = window.phantom?.solana;
  if (!provider?.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  const connection = getSolanaConnection();
  
  // Custom provider that uses Phantom for signing
  const anchorProvider = {
    connection,
    publicKey: new web3.PublicKey(provider.publicKey.toString()),
    signTransaction: async (tx: web3.Transaction) => {
      return await provider.signTransaction(tx);
    },
    signAllTransactions: async (txs: web3.Transaction[]) => {
      return await provider.signAllTransactions(txs);
    },
    send: async (tx: web3.Transaction, signers?: web3.Signer[]) => {
      if (signers?.length) {
        tx.partialSign(...signers);
      }
      const signedTx = await provider.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    },
  };
  
  return new anchor.AnchorProvider(
    connection, 
    anchorProvider as any, 
    { preflightCommitment: 'confirmed' }
  );
};

// Initialize the Anchor program with the deployed contract
const getGkEscrowProgram = () => {
  const provider = getAnchorProvider();
  // Program ID is included in the IDL
  // @ts-ignore - IDL type issues
  return new Program(gkescrowIdl, provider);
};

// Function to derive campaign PDA
const deriveCampaignPDA = async (creator: web3.PublicKey, projectName: string) => {
  // Program ID is now extracted from the IDL
  const programId = new web3.PublicKey(gkescrowIdl.address);
  
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('campaign'),
      creator.toBuffer(),
      Buffer.from(projectName),
    ],
    programId
  )[0];
};

// Function to derive metadata PDA for a mint
const deriveMetadataPDA = (mint: web3.PublicKey): web3.PublicKey => {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
};

// Function to create and initialize an NFT mint
const createNftMint = async (
  connection: web3.Connection,
  payer: web3.PublicKey,
  mintAuthority: web3.PublicKey
): Promise<web3.Keypair> => {
  console.log("Creating NFT Mint...");
  
  // Create a new keypair for the mint account
  const mintKeypair = web3.Keypair.generate();
  
  try {
    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Create a transaction to create a token mint
    const lamports = await token.getMinimumBalanceForRentExemptMint(connection);
    
    // Create mint account instruction
    const createAccountInstruction = web3.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintKeypair.publicKey,
      space: token.MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    });
    
    // Initialize mint instruction
    const initMintInstruction = token.createInitializeMintInstruction(
      mintKeypair.publicKey,
      MINT_DECIMALS,
      mintAuthority,
      mintAuthority,
      TOKEN_PROGRAM_ID
    );
    
    // Combine instructions into a transaction
    const transaction = new web3.Transaction().add(
      createAccountInstruction,
      initMintInstruction
    );
    
    // Set recent blockhash and fee payer
    transaction.feePayer = payer;
    transaction.recentBlockhash = blockhash;
    
    // Get the wallet provider
    const provider = window.phantom?.solana;
    if (!provider) {
      throw new Error('Wallet provider not found');
    }
    
    // Sign the transaction with the mint keypair
    transaction.partialSign(mintKeypair);
    
    // Sign and send the transaction
    const signedTransaction = await provider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);
    console.log("NFT Mint created:", mintKeypair.publicKey.toString());
    
    return mintKeypair;
  } catch (error) {
    console.error("Error creating NFT mint:", error);
    throw error;
  }
};

// Function to create metadata for an NFT
const createNftMetadata = async (
  connection: web3.Connection,
  payer: web3.PublicKey,
  mint: web3.PublicKey,
  name: string,
  symbol: string,
  uri: string
): Promise<string> => {
  console.log("Creating NFT Metadata...");
  
  try {
    // Set up the provider to get signing function
    const provider = window.phantom?.solana;
    if (!provider) {
      throw new Error('Wallet provider not found');
    }
    
    // Derive the metadata account address
    const metadataAddress = deriveMetadataPDA(mint);
    
    // Create metadata for the NFT
    const transaction = new web3.Transaction();
    
    // Create a buffer for the metadata account data
    const metadataV1 = {
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: 0, // No royalties (0%)
      creators: null,
      collection: null,
      uses: null,
    };
    
    // Simplified version of Metaplex's create metadata instruction
    const createMetadataIx = new web3.TransactionInstruction({
      keys: [
        { pubkey: metadataAddress, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: payer, isSigner: true, isWritable: false },
        { pubkey: payer, isSigner: true, isWritable: false },
        { pubkey: payer, isSigner: true, isWritable: false },
        { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: TOKEN_METADATA_PROGRAM_ID,
      data: Buffer.from([
        0, // Create metadata instruction
        ...Buffer.from(JSON.stringify(metadataV1)),
      ]),
    });
    
    transaction.add(createMetadataIx);
    
    // Set recent blockhash and fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.feePayer = payer;
    transaction.recentBlockhash = blockhash;
    
    // Sign and send the transaction
    const signedTransaction = await provider.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);
    console.log("NFT Metadata created at:", metadataAddress.toString());
    
    return signature;
  } catch (error) {
    console.error("Error creating NFT metadata:", error);
    throw error;
  }
};

export const launchNewCampaign = async (formData: {
  projectName: string;
  description: string;
  fundingGoalSOL: number;
  nftName: string;
  nftSymbol: string;
  nftDescription: string;
  nftMintAddress?: string;
  benefits: string[];
  imageUrl: string;
  nftAttributes?: any;
}): Promise<{ campaignId: string; message: string; transactionId: string }> => {
  console.log("Launching new campaign with data:", formData);
  
  try {
    // Check if wallet is connected
    const provider = window.phantom?.solana;
    if (!provider?.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const creatorPubkey = new web3.PublicKey(provider.publicKey.toString());
    
    // 1. Get a fresh connection to ensure fresh blockhash
    const connection = getSolanaConnection();
    console.log("Connected to Solana", SOLANA_NETWORK);
    
    // 2. Use the provided metadata URL directly
    console.log("Using NFT metadata URL:", formData.imageUrl);
    // Now formData.imageUrl is actually a metadata URL instead of an image URL
    const metadataUri = formData.imageUrl;
    
    // 3. Create NFT with metadata using Metaplex UMI
    console.log("Creating NFT with metadata...");
    const { mintAddress, signature } = await createMetaplexNft(
      formData.nftName,
      formData.nftSymbol,
      metadataUri // Using the metadata URL from the form
    );
    
    // Convert the mint address string to a PublicKey
    const nftMintPublicKey = new web3.PublicKey(mintAddress);
    
    // 4. Initialize the Anchor program
    const program = getGkEscrowProgram();
    
    // 5. Calculate the campaign PDA
    const campaignPDA = await deriveCampaignPDA(creatorPubkey, formData.projectName);
    
    // 6. Calculate funding goal in lamports
    const fundingGoalLamports = new anchor.BN(
      Math.floor(formData.fundingGoalSOL * web3.LAMPORTS_PER_SOL)
    );
    
    console.log("NFT created successfully with mint:", mintAddress);
    
    // 7. Send the transaction to create campaign
    console.log("Sending transaction to blockchain...");
    
    // First get the latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    
    // 4. Send transaction to blockchain
    console.log("Sending transaction to blockchain...");
    try {
      const txSignature = await program.methods.initializeCampaign(
        formData.projectName,
        formData.description,
        new anchor.BN(fundingGoalLamports),
        formData.nftName,
        formData.nftSymbol,
        metadataUri
      )
        .accounts({
          campaign: campaignPDA,
          creator: creatorPubkey,
          nftMint: new web3.PublicKey(mintAddress),
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log("Campaign created successfully!");
      console.log("Transaction signature:", txSignature);
      
      // Use the storage utility to save campaign data
      
      // Create a campaign object that matches the Campaign interface
      const campaignData = {
        id: campaignPDA.toString(),
        projectName: formData.projectName,
        description: formData.description,
        creator: {
          id: creatorPubkey.toString(),
          name: "You", // Placeholder name for the creator (yourself)
          walletAddress: creatorPubkey.toString()
        },
        fundingGoalSOL: formData.fundingGoalSOL,
        raisedSOL: 0, // New campaign starts with 0 raised
        status: "Running", // Initial status is Running
        nftName: formData.nftName,
        nftSymbol: formData.nftSymbol,
        nftDescription: formData.nftDescription,
        imageUrl: 'https://raw.githubusercontent.com/zaialamm/create-nft-solana/refs/heads/main/Hiro-Hamada.jpg' + formData.projectName.replace(/\s+/g, '-').toLowerCase() + '/600/400', // Use a deterministic placeholder based on project name
        supportersCount: 0, // Start with 0 supporters
        tokenTicker: formData.nftSymbol, // Using the NFT symbol as token ticker
        endDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now (matches smart contract duration)
        editionNftInfo: {
          maxEditions: 100, // Default max editions
          editionsMinted: 0,
          automaticMinting: true
        }
      };
      
      // Store in localStorage for immediate visibility in UI
      storeUserCampaign(campaignData);

      // Return the campaign data with transaction signature
      return {
        campaignId: campaignPDA.toString(),
        message: `Campaign '${formData.projectName}' created successfully on Solana ${SOLANA_NETWORK}!\nTransaction: ${txSignature}\nCampaign ID: ${campaignPDA.toString()}\nNFT Mint: ${mintAddress}`,
        transactionId: txSignature
      };
    } catch (error: any) {
      // Check if the error is because the transaction was already processed
      if (error.message?.includes('Transaction was already processed')) {
        // This could mean the transaction was successful but we got a duplicate response
        // Let's try to extract the signature from the error message if possible
        let extractedSignature = '';
        
        // Some errors include the signature in the message
        const signatureMatch = error.message.match(/signature ([A-Za-z0-9]+)/);
        if (signatureMatch && signatureMatch[1]) {
          extractedSignature = signatureMatch[1];
          console.log("Extracted transaction signature:", extractedSignature);
        } else {
          console.log("Transaction was already processed, but couldn't extract signature");
          extractedSignature = 'unknown-signature';
        }
        
        // Return the campaign data with the extracted signature
        return {
          campaignId: campaignPDA.toString(),
          message: `Campaign '${formData.projectName}' created successfully on Solana ${SOLANA_NETWORK}!\nTransaction: ${extractedSignature}\nCampaign ID: ${campaignPDA.toString()}\nNFT Mint: ${mintAddress}`,
          transactionId: extractedSignature
        };
      }
      
      // Handle the case where the campaign PDA already exists
      if (error.message?.includes('already in use') || 
          error.message?.includes('account already exists')) {
        console.error("Campaign with this name already exists");
        throw new Error(`A campaign with the name "${formData.projectName}" already exists. Please choose a different name.`);
      }
      
      // Re-throw any other errors with more details
      console.error("Error creating campaign:", error);
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
    // This code is unreachable because of the try/catch block above
    // Keeping it commented out for reference
    /*
    console.log(`NFT created with mint address: ${mintAddress}`);
    console.log(`You can view it at: https://explorer.solana.com/address/${mintAddress}?cluster=devnet`);
    
    return { 
      campaignId: campaignPDA.toString(),
      message: `Campaign '${formData.projectName}' created successfully on Solana ${SOLANA_NETWORK}!\nTransaction: ${txSignature}\nCampaign ID: ${campaignPDA.toString()}\nNFT Mint: ${mintAddress}`,
      transactionId: txSignature
    };
    */
  } catch (error: any) {
    console.error("Error launching campaign:", error);
    
    // Check if this is a "transaction already processed" error, which means it was actually successful
    if (error.message && error.message.includes("This transaction has already been processed")) {
      console.log("Transaction was already processed (successful)");
      
      // Since the transaction was successful, extract the transaction signature if available
      let transactionId = "";
      try {
        // Try to extract tx ID from the error logs or message
        if (error.logs?.length > 0) {
          // Extract from logs if available
          transactionId = error.logs[0].split(" ")[0];
        } else if (error.transaction?.signature) {
          // Try to get from transaction signature
          transactionId = error.transaction.signature;
        }
      } catch (extractError) {
        console.warn("Could not extract transaction ID from error", extractError);
      }
      
      // Generate a campaign ID if we can't get the real one
      const campaignId = `campaign_${Date.now().toString(16)}`;
      const message = `Campaign created successfully (transaction already processed)`;
      
      // If we couldn't extract a transaction ID, don't return an empty string
      if (!transactionId) {
        transactionId = "Unknown";
      }
      
      // Make sure we return a proper transaction URL
      return { 
        campaignId, 
        message: `Campaign created successfully (transaction already processed)\nTransaction: ${transactionId}`,
        transactionId
      };
    } 
    // Show user-friendly error messages for common NFT creation issues
    else if (error.message && error.message.includes("insufficient funds")) {
      throw new Error(`Failed to create NFT: Insufficient SOL balance. Please request more devnet SOL from a faucet.`);
    }
    else if (error.message && error.message.includes("User rejected")) {
      throw new Error(`Transaction was rejected by the wallet. Please try again and approve the transaction.`);
    }
    else if (error.message && error.message.includes("blockhash")) {
      throw new Error(`Transaction expired. Please try again with a fresh transaction.`);
    }
    // For other errors, provide some details but with a cleaner message
    else {
      throw new Error(`Failed to create NFT and launch campaign: ${error.message || 'Unknown error'}.`);
    }
  }
};

// Function for campaign creators to withdraw funds when campaign is fully funded
export const withdrawCampaignFunds = async (
  campaignId: string
): Promise<{ success: boolean; signature: string; amountLamports: number }> => {
  try {
    // Check if Phantom wallet is connected
    const provider = await getAnchorProvider();
    if (!provider) {
      throw new Error('Wallet not connected');
    }

    const connection = getSolanaConnection();
    const program = getGkEscrowProgram();
    
    // Get campaign data from the blockchain
    const campaignCreator = provider.wallet.publicKey;
    
    // Find the campaign PDA
    // Note: In a real implementation, we would need to know the project name
    // For now, we'll derive it from the campaignId which should be the address
    const campaignPubkey = new web3.PublicKey(campaignId);
    
    // Get treasury PDA
    const [treasuryPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('treasury')],
      program.programId
    );
    
    console.log('Withdrawing funds from campaign:', campaignId);
    console.log('Creator:', campaignCreator.toString());
    console.log('Treasury PDA:', treasuryPda.toString());
    
    // Call the withdraw_funds instruction
    const tx = await program.methods
      .withdrawFunds()
      .accounts({
        campaign: campaignPubkey,
        creator: campaignCreator,
        treasury: treasuryPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log('Withdrawal transaction successful:', tx);
    
    // For a real implementation, we would query the transaction to get the exact amount
    // For now, we'll return a placeholder
    return {
      success: true,
      signature: tx,
      amountLamports: 0 // This would be the actual amount in a real implementation
    };
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw error;
  }
};

// Function to check current connection status without prompting user (if already trusted)
// Mint an edition NFT from a Master Edition NFT for a campaign supporter
export const mintEditionNft = async (
  campaignId: string,
  supporterId: string,
  editionNumber: number = 0
): Promise<{ success: boolean; editionMint: string; signature: string }> => {
  console.log(`Minting edition NFT #${editionNumber} for campaign ${campaignId} to supporter ${supporterId}`);
  
  try {
    // Get Phantom wallet
    const provider = window.phantom?.solana;
    if (!provider?.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Create a UMI instance
    const umi = createUmi(getSolanaClusterUrl())
      .use(mplTokenMetadata());
    
    // Create a wallet adapter for Phantom that works with UMI
    const walletPublicKeyString = provider.publicKey.toString();
    
    // Create a custom publicKey object that has the toBase58 method
    const customPublicKey = {
      bytes: new Uint8Array(32), // This is just a placeholder
      toBase58: () => walletPublicKeyString,
      toString: () => walletPublicKeyString,
    };
    
    // Create a fully UMI-compatible wallet adapter
    const phantomWalletAdapter = {
      publicKey: customPublicKey,
      signMessage: async (message: Uint8Array) => {
        console.log("Signing message...");
        const { signature } = await provider.signMessage(message, 'utf8');
        return signature;
      },
      signTransaction: async (transaction: any) => {
        console.log("Signing transaction...");
        return await provider.signTransaction(transaction);
      },
      signAllTransactions: async (transactions: any[]) => {
        console.log("Signing all transactions...");
        return await provider.signAllTransactions(transactions);
      },
    };
    
    // Connect the wallet adapter to UMI
    umi.use(walletAdapterIdentity(phantomWalletAdapter));
    
    // Get the program instance
    const program = getGkEscrowProgram();
    
    // Convert string IDs to PublicKeys
    const campaignPubkey = new web3.PublicKey(campaignId);
    const supporterPubkey = new web3.PublicKey(supporterId);
    
    // Derive the supporter funding PDA
    const [supporterFundingPDA] = await web3.PublicKey.findProgramAddress(
      [
        Buffer.from('supporter-funding'),
        campaignPubkey.toBuffer(),
        supporterPubkey.toBuffer(),
      ],
      program.programId
    );
    
    // Get campaign data to retrieve master edition mint
    const campaignData = await program.account.campaign.fetch(campaignPubkey);
    const masterEditionMint = new web3.PublicKey(campaignData.nftMint);
    
    // Generate a new mint keypair for the edition NFT
    const editionMintKeypair = web3.Keypair.generate();
    console.log(`Generated edition mint address: ${editionMintKeypair.publicKey.toString()}`);
    
    // Initialize the edition mint account
    const connection = new web3.Connection(getSolanaClusterUrl());
    const creatorPubkey = new web3.PublicKey(provider.publicKey.toString());
    
    // Call our program to mint the edition NFT
    // This will handle creating the mint, setting up token accounts, and printing the edition
    const txSignature = await program.methods
      .mintEditionNft(editionNumber)
      .accounts({
        campaign: campaignPubkey,
        supporter: supporterPubkey,
        supporterFunding: supporterFundingPDA,
        masterEditionMint: masterEditionMint,
        editionMint: editionMintKeypair.publicKey,
        payer: creatorPubkey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METADATA_PROGRAM_ID
      })
      .signers([editionMintKeypair])
      .rpc();
    
    console.log(`Edition NFT minted successfully! Signature: ${txSignature}`);
    console.log(`Edition Mint Address: ${editionMintKeypair.publicKey.toString()}`);
    
    return {
      success: true,
      editionMint: editionMintKeypair.publicKey.toString(),
      signature: txSignature
    };
  } catch (error: any) {
    console.error("Error minting edition NFT:", error);
    throw new Error(`Failed to mint edition NFT: ${error.message}`);
  }
};

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
