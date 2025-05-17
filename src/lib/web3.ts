import { CAMPAIGNS_DATA } from './constants';
import { storeUserCampaign, updateCampaignFunding } from './storage';
import * as web3 from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Campaign, Supporter, FundingResult, CampaignStatus } from '../types';

// Import necessary SPL token libraries
import { 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

// Define token program ID and constants
const TOKEN_PROGRAM_ID = new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Constants for token account sizes
const MINT_SIZE = 82; // Size of a mint account in bytes

// Import Metaplex Token Metadata program
import { mplTokenMetadata, fetchMasterEditionFromSeeds, findMetadataPda, findMasterEditionPda, findEditionMarkerPda, createNft, printSupply, printV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity, WalletAdapter } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { generateSigner, publicKey as umiPublicKey, percentAmount } from '@metaplex-foundation/umi';

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


// Solana cluster URL for devnet - always using Helius RPC
export const getSolanaClusterUrl = () => {
  // Next.js client-side public environment variable (browser)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL) {
    return process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL;
  }
  // Server-side environment variable (Node.js)
  if (typeof process !== 'undefined' && process.env.HELIUS_DEVNET_URL) {
    return process.env.HELIUS_DEVNET_URL;
  }
  
  // No fallback to public endpoint - we want to fail fast if Helius RPC is not configured
  throw new Error('Helius RPC URL not configured in environment variables. Please check your .env file.');
};

// Define signedTxCache at the module level to persist across calls
const signedTxCache = new Set<string>();

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
        const txId = transaction.signature?.toString();
        if (txId && signedTxCache.has(txId)) {
          console.log("Transaction already signed:", txId);
          return transaction;
        }
        console.log("Signing transaction...");
        if (!provider) {
          console.error("Wallet provider not found. Reconnecting...");
          await connectPhantomWallet();
          const updatedProvider = window.phantom?.solana;
          if (!updatedProvider) {
            throw new Error("Wallet provider not available.");
          }
          return await updatedProvider.signTransaction(transaction);
        }
        const signedTx = await provider.signTransaction(transaction);
        if (txId) signedTxCache.add(txId);
        return signedTx;

      /*
      signTransaction: async (transaction: any) => {
        console.log("Signing transaction...");
        if (!provider) {
          console.error("Wallet provider not found. Reconnecting...");
          await connectPhantomWallet(); // Try to reconnect
          const updatedProvider = window.phantom?.solana;
          if (!updatedProvider) {
            throw new Error("Wallet provider not available. Please refresh the page and try again.");
          }
          return await updatedProvider.signTransaction(transaction);
        }
        return await provider.signTransaction(transaction);
      */
      },

      signAllTransactions: async (transactions: any[]) => {
        console.log("Signing all transactions...");
        if (!provider) {
          console.error("Wallet provider not found when signing multiple transactions. Reconnecting...");
          await connectPhantomWallet(); // Try to reconnect
          const updatedProvider = window.phantom?.solana;
          if (!updatedProvider) {
            throw new Error("Wallet provider not available. Please refresh the page and try again.");
          }
          return await updatedProvider.signAllTransactions(transactions);
        }
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
    let txSignature;
    let transactionAlreadyProcessed = false;
    try {
      txSignature = await program.methods
        .fundCampaign(lamportsAmount)
        .accounts({
          campaign: campaignPubkey,
          supporter: supporterPubkey,
          supporterFunding: supporterFundingPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc({skipPreflight: true, commitment: 'confirmed'});
      
      console.log(`Campaign funded successfully! Signature: ${txSignature}`);
    } catch (error: any) {
      // Check if the error is due to the transaction already being processed
      if (error.message && error.message.includes('This transaction has already been processed')) {
        console.log('Transaction was already processed, treating as success');
        transactionAlreadyProcessed = true;
        // Extract signature from the error message if possible
        const match = error.message.match(/Signature: ([A-Za-z0-9]+)/);
        txSignature = match ? match[1] : 'TRANSACTION_ALREADY_PROCESSED';
        console.log(`Using existing transaction signature: ${txSignature}`);
      } else {
        // This is a different error, rethrow it
        console.error("Funding error:", error);
        throw new Error(`Failed to fund campaign: ${error.message}`);
      }
    } 

    // Fetch updated campaign data
    let campaignData;
    try {
      campaignData = await program.account.campaign.fetch(campaignPubkey);
    } catch (error) {
      console.error("Error fetching updated campaign data:", error);
      throw new Error("Failed to fetch campaign data after funding");
    }
    const isFundedNow = campaignData.isFunded;
    
    // Check if the campaign funding state changed
    if (isFundedNow && !wasAlreadyFunded) {
      // Campaign just became fully funded with this contribution
      console.log("Campaign just became fully funded! Supporters can now claim their NFT rewards.");
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
        automaticMinting: false,
        message: "Edition NFTs are available for supporters to claim after the campaign is fully funded."
      } : null
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
    console.log('Getting campaigns from program ID:', program.programId.toString());
    
    try {
      // Get all account types from program
      const accountTypes = Object.keys(program.account);
      console.log('Available account types:', accountTypes);
    } catch (err) {
      console.error('Error inspecting program accounts:', err);
    }
    
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

// Get Helius RPC URL from environment variables
const getHeliusRpcUrl = () => {
  // Using the same function for consistency
  return getSolanaClusterUrl();
}

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

// Function to derive Metadata account PDA
async function getMetadataPDA(mint: web3.PublicKey): Promise<web3.PublicKey> {
return (await web3.PublicKey.findProgramAddress(
  [
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ],
  METADATA_PROGRAM_ID
))[0];
}

// Function to derive Master Edition PDA
async function getMasterEditionPDA(mint: web3.PublicKey): Promise<web3.PublicKey> {
return (await web3.PublicKey.findProgramAddress(
  [
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition'),
  ],
  METADATA_PROGRAM_ID
))[0];
}

// Function to derive Edition Marker PDA
async function getEditionMarkerPDA(mint: web3.PublicKey, edition: number): Promise<web3.PublicKey> {
const editionNumber = Math.floor(edition / 248);
return (await web3.PublicKey.findProgramAddress(
  [
    Buffer.from('metadata'),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition'),
    Buffer.from(editionNumber.toString()),
  ],
  METADATA_PROGRAM_ID
))[0];
}

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
    
    const connection = getSolanaConnection();
    console.log("Connected to Solana", SOLANA_NETWORK);
    
    //  Use the provided metadata URL directly
    console.log("Using NFT metadata URL:", formData.imageUrl);
    const metadataUri = formData.imageUrl;
    
    // Create NFT with metadata using Metaplex UMI
    console.log("Step 1: Creating NFT with metadata...");
    const { mintAddress, signature } = await createMetaplexNft(
      formData.nftName,
      formData.nftSymbol,
      metadataUri
    );
    console.log("✅ NFT created successfully with mint:", mintAddress);
    
    // Convert the mint address string to a PublicKey
    const nftMintPublicKey = new web3.PublicKey(mintAddress);
    
    // Initialize the Anchor program
    const program = getGkEscrowProgram();
    
    // Define the campaign PDA
    const campaignPDA = await deriveCampaignPDA(creatorPubkey, formData.projectName);

    // Check if campaign PDA already exists
    const campaignAccount = await connection.getAccountInfo(campaignPDA);
    if (campaignAccount) {
      throw new Error(`Campaign with name "${formData.projectName}" already exists.`);
    }
    
    // Calculate funding goal in lamports
    const fundingGoalLamports = new anchor.BN(
      Math.floor(formData.fundingGoalSOL * web3.LAMPORTS_PER_SOL)
    );
    
    // Send transaction to initialize campaign
    console.log("Step 2: Initializing campaign on blockchain...");

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

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
        .rpc({skipPreflight: true, commitment: 'confirmed'});
        
      
      await connection.confirmTransaction({
        signature: txSignature,
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight
      }, 'confirmed');
      
      console.log("✅ Campaign initialized successfully!");
    
    // Create a campaign object for localStorage
    const campaignData = {
      id: campaignPDA.toString(),
      projectName: formData.projectName,
      description: formData.description,
      creator: {
        id: creatorPubkey.toString(),
        name: "Creator",
        walletAddress: creatorPubkey.toString()
      },
      fundingGoalSOL: formData.fundingGoalSOL,
      raisedSOL: 0,
      status: "Running",
      nftName: formData.nftName,
      nftSymbol: formData.nftSymbol,
      nftDescription: formData.nftDescription,
      imageUrl: 'https://raw.githubusercontent.com/zaialamm/create-nft-solana/refs/heads/main/Hiro-Hamada.jpg' + formData.projectName.replace(/\s+/g, '-').toLowerCase() + '/600/400',
      supportersCount: 0,
      tokenTicker: formData.nftSymbol,
      endDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      editionNftInfo: {
        maxEditions: 100,
        editionsMinted: 0,
        automaticMinting: true
      }
    };
    
    // Transfer NFT to escrow
    console.log("Step 3: Transferring NFT to escrow...");
    
    const escrowResult = await transferNftToEscrow(
      campaignPDA.toString(),
      nftMintPublicKey.toString()
    );
    
    console.log("✅ NFT successfully transferred to escrow!", escrowResult.signature);
    
    // Store campaign data in localStorage
    storeUserCampaign(campaignData);
    console.log("✅ Campaign data stored in localStorage");
    
    // Return success response
    return {
      campaignId: campaignPDA.toString(),
      message: "Campaign created successfully and NFT transferred to escrow!",
      transactionId: txSignature
    };
    
  } catch (error: any) {
    console.error("Error in launchNewCampaign:", error);
    
    // Handle a few critical errors with user-friendly messages
    if (error.message?.includes('already in use') || error.message?.includes('account already exists')) {
      throw new Error(`A campaign with the name "${formData.projectName}" already exists. Please choose a different name.`);
    }
    
    if (error.message?.includes("insufficient funds")) {
      throw new Error(`Insufficient SOL balance. Please request more devnet SOL from a faucet.`);
    }
    
    if (error.message?.includes("User rejected")) {
      throw new Error(`Transaction was rejected. Please try again and approve all transactions.`);
    }
    
    // For all other errors, just pass through the error message
    throw new Error(`Error creating campaign: ${error.message || 'Unknown error'}`);
  }
};


// Function for supporters to claim refunds when a campaign fails to meet its goal
export const claimRefund = async (
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
    
    // Get supporter's wallet address
    const supporterPubkey = provider.wallet.publicKey;
    
    // Find the campaign account by its public key
    const campaignPubkey = new web3.PublicKey(campaignId);
    
    // Convert provider publicKey to web3.PublicKey
    const walletPubkey = new web3.PublicKey(provider.publicKey.toString());
        
    // Calculate the PDA for the supporter's funding account
    const [supporterFundingPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('supporter-funding'), campaignPubkey.toBuffer(), walletPubkey.toBuffer()],
      program.programId
    );
    
    console.log('Claiming refund from campaign:', campaignId);
    console.log('Supporter:', supporterPubkey.toString());
    console.log('Supporter funding PDA:', supporterFundingPDA.toString());
    
    // Call the claim_refund instruction
    const tx = await program.methods
      .claimRefund()
      .accounts({
        campaign: campaignPubkey,
        supporter: supporterPubkey,
        supporterFunding: supporterFundingPDA,
      })
      .rpc();
    
    console.log('Refund transaction successful:', tx);
    
    return {
      success: true,
      signature: tx,
      amountLamports: 0 
    };
  } catch (error) {
    console.error('Error claiming refund:', error);
    throw error;
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

/**
 * Claim an NFT from escrow using the new smart contract functionality
 * @param campaignId Campaign ID to claim from
 * @returns Object containing claim status and transaction signature
 */
export const claimNftFromEscrow = async (
  campaignId: string
): Promise<{
  success: boolean;
  message: string;
  signature?: string;
  editionMint?: string;
  editionNumber?: number;
}> => {
  try {
    // Get wallet
    const provider = window.phantom?.solana;
    if (!provider?.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Convert to proper PublicKey object
    const supporterPubkey = new web3.PublicKey(provider.publicKey.toString());
    
    // Initialize connection and program
    const connection = getSolanaConnection();
    const program = getGkEscrowProgram();
    
    // Convert string ID to PublicKey
    const campaignPubkey = new web3.PublicKey(campaignId);
    
    // Get campaign data
    const campaignData = await program.account.campaign.fetch(campaignPubkey);
    const nftMint = campaignData.nftMint;
    
    // Check if NFT is in escrow
    if (!campaignData.nftInEscrow) {
      return {
        success: false,
        message: "The NFT for this campaign has not been transferred to escrow yet."
      };
    }
    
    // Find PDAs and accounts
    const [supporterFundingPDA] = await web3.PublicKey.findProgramAddress(
      [
        Buffer.from('supporter-funding'),
        campaignPubkey.toBuffer(),
        supporterPubkey.toBuffer()
      ],
      program.programId
    );
    
    // Check if NFT was already claimed by this supporter
    try {
      const supporterFundingData = await program.account.supporterFunding.fetch(supporterFundingPDA);
      
      if (supporterFundingData.nftMinted) {
        console.log('NFT already claimed by this supporter');
        return {
          success: true,
          editionMint: supporterFundingData.editionMint?.toString(),
          editionNumber: supporterFundingData.editionNumber?.toNumber() || 1,
          message: 'You have already claimed your NFT reward for this campaign.'
        };
      }
    } catch (err) {
      console.log('Supporter funding data not found or error:', err);
      // Continue with claiming process if this is just a "not found" error
    }
    
    // Find escrow PDA and accounts
    const [escrowAuthority] = await web3.PublicKey.findProgramAddress(
      [Buffer.from('escrow'), campaignPubkey.toBuffer()],
      program.programId
    );
    
    const escrowTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      escrowAuthority,
      true // allowOwnerOffCurve: true for PDA
    );
    
    const supporterTokenAccount = await getAssociatedTokenAddress(
      nftMint,
      supporterPubkey
    );
    
    console.log('Claiming NFT from escrow...');
    
    try {
      // Call the claim_nft_from_escrow instruction
      const claimTx = await program.methods
        .claimNftFromEscrow()
        .accounts({
          campaign: campaignPubkey,
          supporterFunding: supporterFundingPDA,
          supporter: supporterPubkey,
          nftMint: nftMint,
          escrowAuthority: escrowAuthority,
          escrowTokenAccount: escrowTokenAccount,
          supporterTokenAccount: supporterTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY
        })
        .rpc();
      
      console.log('NFT claimed successfully! Transaction signature:', claimTx);
      
      // Return success information
      return {
        success: true,
        editionMint: nftMint.toString(),
        signature: claimTx,
        message: 'NFT claimed successfully! Check your wallet for the NFT.'
      };
    } catch (txError: any) {
      console.error('Error claiming NFT from escrow:', txError);
      
      // Check if the error is because the NFT was already claimed
      if (txError.message?.includes('NftAlreadyMinted') || 
          txError.message?.includes('already minted') ||
          txError.message?.includes('already claimed') ||
          txError.message?.includes('0x177c')) {
        return {
          success: true,
          editionMint: nftMint.toString(),
          signature: 'already-claimed',
          message: 'You have already claimed your NFT reward for this campaign.'
        };
      }
      
      throw txError;
    }
  } catch (error: any) {
    console.error('Error claiming NFT from escrow:', error);
    return {
      success: false,
      message: `Failed to claim NFT: ${error.message}`
    };
  }
};

// Kept for backward compatibility, redirects to the new function
export const mintEditionNft = async (
  campaignId: string,
  supporterId: string,
  editionNumber: number = 0
): Promise<{ success: boolean; editionMint: string; signature: string; message?: string }> => {
  console.log('Using new claimNftFromEscrow function instead of mintEditionNft');
  const result = await claimNftFromEscrow(campaignId);
  
  return {
    success: result.success,
    editionMint: result.editionMint || '',
    signature: result.signature || 'no-signature',
    message: result.message
  };
};

/**
 * Check if a supporter is eligible to claim an NFT for a campaign
 * @param campaignId Campaign ID to check
 * @returns Object containing eligibility status and related information
 */
export const checkNftClaimEligibility = async (campaignId: string): Promise<{
  isEligible: boolean;
  message: string;
  isCampaignFunded: boolean;
  hasContributed: boolean;
  alreadyClaimed: boolean;
  campaignData?: any;
  supporterFundingData?: any;
}> => {
  try {
    const wallet = window.phantom?.solana;
    if (!wallet || !wallet.publicKey) {
      return {
        isEligible: false,
        message: "Wallet not connected. Please connect your wallet to check eligibility.",
        isCampaignFunded: false,
        hasContributed: false,
        alreadyClaimed: false
      };
    }

    // Get program instance
    const program = await getGkEscrowProgram();
    
    // Convert campaign ID to PublicKey
    const campaignPubkey = new web3.PublicKey(campaignId);
    const supporterPubkey = wallet.publicKey;
    
    // Fetch campaign data
    let campaignData;
    try {
      campaignData = await program.account.campaign.fetch(campaignPubkey);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      return {
        isEligible: false,
        message: "Error fetching campaign data. Campaign may not exist.",
        isCampaignFunded: false,
        hasContributed: false,
        alreadyClaimed: false
      };
    }
    
    // Check if campaign is funded
    const isCampaignFunded = campaignData.isFunded;
    if (!isCampaignFunded) {
      return {
        isEligible: false,
        message: "This campaign is not fully funded yet. Once fully funded, you can claim your NFT.",
        isCampaignFunded: false,
        hasContributed: true,
        alreadyClaimed: false,
        campaignData,
        supporterFundingData: null
      };
    }
    
    // Check if NFT is in escrow
    if (!campaignData.nftInEscrow) {
      return {
        isEligible: false,
        message: "The campaign creator needs to transfer the NFT to escrow before it can be claimed.",
        isCampaignFunded: true,
        hasContributed: true,
        alreadyClaimed: false,
        campaignData,
        supporterFundingData: null
      };
    }
    
    // Derive the supporter funding PDA
    const [supporterFundingPDA] = await web3.PublicKey.findProgramAddress(
      [
        Buffer.from('supporter-funding'),
        campaignPubkey.toBuffer(),
        supporterPubkey.toBuffer(),
      ],
      program.programId
    );
    
    // Fetch supporter funding data
    let supporterFundingData;
    let hasContributed = false;
    try {
      supporterFundingData = await program.account.supporterFunding.fetch(supporterFundingPDA);
      hasContributed = true;
    } catch (error) {
      console.log("Error fetching supporter funding data. User may not have contributed:", error);
      return {
        isEligible: false,
        message: "You have not contributed to this campaign.",
        isCampaignFunded: true,
        hasContributed: false,
        alreadyClaimed: false,
        campaignData
      };
    }
    
    // Check if NFT has already been claimed
    const alreadyClaimed = supporterFundingData.nftMinted;
    if (alreadyClaimed) {
      return {
        isEligible: false,
        message: "You have already claimed your NFT for this campaign.",
        isCampaignFunded: true,
        hasContributed: true,
        alreadyClaimed: true,
        campaignData,
        supporterFundingData
      };
    }
    
    // If we get here, the user is eligible to claim
    return {
      isEligible: true,
      message: "You are eligible to claim your NFT reward for supporting this campaign!",
      isCampaignFunded: true,
      hasContributed: true,
      alreadyClaimed: false,
      campaignData,
      supporterFundingData
    };
  } catch (error: any) {
    console.error("Error checking NFT claim eligibility:", error);
    return {
      isEligible: false,
      message: `Error checking eligibility: ${error.message}`,
      isCampaignFunded: false,
      hasContributed: false,
      alreadyClaimed: false
    };
  }
};

/**
 * Transfer an NFT to the escrow account for a campaign
 * @param campaignId Campaign ID to transfer the NFT to
 * @param nftMint NFT mint address to transfer
 * @returns Object containing transfer status and transaction signature
 */
export const transferNftToEscrow = async (
  campaignId: string, 
  nftMint: string
): Promise<{
  success: boolean;
  message: string;
  signature?: string;
}> => {
  try {
    console.log("Starting NFT transfer to escrow for campaign:", campaignId);
    
    // Get wallet
    const provider = window.phantom?.solana;
    if (!provider?.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Initialize connection and program
    const connection = getSolanaConnection();
    const program = getGkEscrowProgram();
    
    // Convert string IDs to PublicKeys
    const campaignPubkey = new web3.PublicKey(campaignId);
    const nftMintPubkey = new web3.PublicKey(nftMint);
    
    // Convert wallet public key string to PublicKey object
    const walletPubkey = new web3.PublicKey(provider.publicKey.toString());
    
    // Find creator's token account for the NFT
    const creatorTokenAccount = await getAssociatedTokenAddress(
      nftMintPubkey,
      walletPubkey
    );
    console.log("Creator token account:", creatorTokenAccount.toString());
    
    // Find escrow PDA and token account
    const [escrowAuthority] = await web3.PublicKey.findProgramAddress(
      [Buffer.from('escrow'), campaignPubkey.toBuffer()],
      program.programId
    );
    console.log("Escrow authority PDA:", escrowAuthority.toString());
    
    const escrowTokenAccount = await getAssociatedTokenAddress(
      nftMintPubkey,
      escrowAuthority,
      true // allowOwnerOffCurve: true for PDA
    );
    console.log("Escrow token account:", escrowTokenAccount.toString());
    
    // Call transfer_nft_to_escrow instruction
    console.log("Sending NFT transfer to escrow transaction...");

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    const transferTx = await program.methods
      .transferNftToEscrow()
      .accounts({
        campaign: campaignPubkey,
        creator: walletPubkey,
        nftMint: nftMintPubkey,
        creatorTokenAccount: creatorTokenAccount,
        escrowAuthority: escrowAuthority,
        escrowTokenAccount: escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY
      })
      .rpc({
        skipPreflight: true,
        commitment: 'confirmed',
      });
    
    console.log("Waiting for NFT transfer transaction confirmation...");
    await connection.confirmTransaction({
      signature: transferTx,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight
    }, 'confirmed');
    
    console.log("NFT transfer to escrow confirmed with signature:", transferTx);
    
    return {
      success: true,
      message: 'NFT successfully transferred to escrow!',
      signature: transferTx
    };
  } catch (error: any) {
    console.error('Error transferring NFT to escrow:', error);
    
    // If the error is "already processed", treat it as success
    if (error.message?.includes('already been processed') || 
        error.message?.includes('Transaction simulation failed: This transaction has already been processed')) {
      console.log("Transaction was already processed successfully");
      return {
        success: true,
        message: 'NFT transfer was already processed successfully!',
        signature: 'already-processed'
      };
    }
    
    // Otherwise throw the error to be handled by the caller
    throw new Error(`Failed to transfer NFT to escrow: ${error.message}`);
  }
};

/**
 * Claim an NFT reward for supporting a campaign
 * @param campaignId Campaign ID to claim from
 * @returns Object containing claim status and NFT info
 */
export const claimNftReward = async (campaignId: string): Promise<{
  success: boolean;
  message: string;
  signature?: string;
  editionMint?: string;
  editionNumber?: number;
}> => {
  try {
    // First check eligibility
    const eligibility = await checkNftClaimEligibility(campaignId);
    
    if (!eligibility.isEligible) {
      return {
        success: false,
        message: eligibility.message
      };
    }
    
    // Get wallet connection
    const wallet = window.phantom?.solana;
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected. Please connect your wallet and try again.");
    }
    
    console.log(`Attempting to claim NFT for campaign ${campaignId} with wallet ${wallet.publicKey.toString()}`);
    
    try {
      // Use our new claim_nft_from_escrow function
      const claimResult = await claimNftFromEscrow(campaignId);
      
      if (claimResult.success) {
        console.log('NFT claimed successfully!', claimResult);
        return {
          success: true,
          message: claimResult.message || "NFT claimed successfully! Check your wallet for the NFT.",
          signature: claimResult.signature,
          editionMint: claimResult.editionMint,
          editionNumber: claimResult.editionNumber
        };
      } else {
        throw new Error(claimResult.message || "Unknown error during NFT claiming");
      }
    } catch (claimError: any) {
      console.error("Error during NFT claiming:", claimError);
      
      // Check if the error is because the NFT was already claimed
      if (claimError.message?.includes('NftAlreadyMinted') || 
          claimError.message?.includes('already minted') ||
          claimError.message?.includes('already claimed') ||
          claimError.message?.includes('0x177c')) {
        // Return success with a message about already claimed
        return {
          success: true,
          message: "You've already claimed your NFT reward for this campaign.",
          editionMint: eligibility.supporterFundingData?.editionMint?.toString(),
          editionNumber: eligibility.supporterFundingData?.editionNumber?.toNumber() || 1
        };
      }
      
      throw claimError;
    }
  } catch (error: any) {
    console.error("Error claiming NFT:", error);
    return {
      success: false,
      message: `Failed to claim NFT: ${error.message || "An unexpected error occurred"}`
    };
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


