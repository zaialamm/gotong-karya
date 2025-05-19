import * as web3 from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import gkescrowIdl from '../idl/gkescrow.json';
import { ESCROW_PROGRAM_ID } from './constants';
import { getSolanaClusterUrl } from './web3';

/**
 * Withdraw funds from the platform treasury (admin only)
 * @param amountSol Amount in SOL to withdraw
 * @returns Object with transaction status and signature
 */
export const withdrawTreasuryFunds = async (amountSol: number): Promise<{
  success: boolean;
  message: string;
  signature?: string;
}> => {
  try {
    // Get wallet connection
    const phantomProvider = window.phantom?.solana;
    if (!phantomProvider) {
      throw new Error('Wallet not connected');
    }
    
    // Create connection
    const connection = new web3.Connection(getSolanaClusterUrl(), 'confirmed');
    
    // Create proper public key from wallet
    const adminPubkey = new web3.PublicKey(phantomProvider.publicKey.toString());
    
    // Get program ID
    const programId = new web3.PublicKey(ESCROW_PROGRAM_ID);
    
    // Derive treasury PDA
    const [treasuryPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('treasury')],
      programId
    );
    
    console.log('Attempting to withdraw from treasury:', treasuryPDA.toString());
    console.log('Amount to withdraw:', amountSol, 'SOL');
    
    // Convert SOL to lamports
    const amountLamports = new BN(amountSol * web3.LAMPORTS_PER_SOL);
    
    // Create a custom provider that uses Phantom for signing
    const anchorWallet = {
      connection,
      publicKey: adminPubkey,
      signTransaction: async (tx: web3.Transaction) => {
        return await phantomProvider.signTransaction(tx);
      },
      signAllTransactions: async (txs: web3.Transaction[]) => {
        return await phantomProvider.signAllTransactions(txs);
      },
      send: async (tx: web3.Transaction, signers?: web3.Signer[]) => {
        if (signers?.length) {
          tx.partialSign(...signers);
        }
        const signedTx = await phantomProvider.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction(signature, 'confirmed');
        return signature;
      }
    };
    
    // Create the Anchor provider
    const provider = new anchor.AnchorProvider(
      connection, 
      anchorWallet as any, 
      { preflightCommitment: 'confirmed' }
    );
    
    // Set the provider globally to avoid TypeScript errors
    anchor.setProvider(provider);
    
    const program = new anchor.Program(gkescrowIdl, provider);
    
    try {
      console.log('Sending treasury withdrawal transaction...');

      // Send the transaction using the rpc method
      const signature = await program.methods
        .withdrawTreasury(amountLamports)
        .accounts({
          admin: adminPubkey,
          treasury: treasuryPDA,
          systemProgram: web3.SystemProgram.programId
        })
        .rpc({ 
          skipPreflight: true, 
          commitment: 'confirmed' 
        });

      console.log('Treasury withdrawal successful!', signature);
      
      return {
        success: true,
        message: `Successfully withdrawn ${amountSol} SOL from the treasury!`,
        signature: signature
      };
    } catch (txError: any) {
      // Handle the "transaction already processed" error
      if (txError.message && txError.message.includes('already been processed')) {
        console.log('Transaction was already processed (successful)');
        
        // Try to extract the signature from the error if possible
        const signatureMatch = txError.message.match(/signature ([A-Za-z0-9]+)/);
        const extractedSignature = signatureMatch && signatureMatch[1] 
          ? signatureMatch[1]
          : `treasury_withdrawal_${Date.now().toString(16)}`;
          
        console.log('Using transaction signature:', extractedSignature);
        
        return {
          success: true,
          message: `Successfully withdrawn ${amountSol} SOL from the treasury!`,
          signature: extractedSignature
        };
      }
      
      // Rethrow any other errors
      throw txError;
    }
  } catch (error: any) {
    console.error('Error withdrawing from treasury:', error);
    return {
      success: false,
      message: `Failed to withdraw from treasury: ${error.message}`
    };
  }
};
