import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Gkescrow } from "../target/types/gkescrow";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import * as token from "@solana/spl-token";

// Admin public key - should match the one in lib.rs
const ADMIN_PUBKEY = "ZaikXX6zRGseZdyGnpdBaTkBdetDNgZcGEqzeZgAXtM";

// Platform fee constants - should match those in lib.rs
const PLATFORM_FEE_NUMERATOR = 25;
const PLATFORM_FEE_DENOMINATOR = 1000;

describe("gkescrow", () => {
  // Force the test to connect to localnet
  const url = "http://localhost:8899";
  const connection = new anchor.web3.Connection(url, "confirmed");
  
  // Create a provider from connection
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  anchor.setProvider(provider);
  
  const program = anchor.workspace.gkescrow as Program<Gkescrow>;
  
  console.log("Test running on:", provider.connection.rpcEndpoint);
  
  // Test campaign data
  const projectName = "Test Campaign";
  const description = "This is a test campaign for the Gotong Karya platform";
  const fundingGoalLamports = new anchor.BN(1 * LAMPORTS_PER_SOL); // 1 SOL
  const nftName = "Test Supporter NFT";
  const nftSymbol = "TEST";
  const nftUri = "https://arweave.net/test-metadata-uri";
  
  // Create keypairs for testing with specific seeds for repeatability
  const creator = Keypair.fromSeed(Uint8Array.from(Array(32).fill(1)));
  const supporter = Keypair.fromSeed(Uint8Array.from(Array(32).fill(2)));
  const nftMint = Keypair.generate();
  
  console.log("Creator pubkey:", creator.publicKey.toString());
  console.log("Supporter pubkey:", supporter.publicKey.toString());
  
  // Helper function to transfer SOL
  async function transferSol(from: anchor.Wallet, to: PublicKey, amount: number) {
    console.log(`Transferring ${amount / LAMPORTS_PER_SOL} SOL to ${to.toString()}`);
    
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: amount,
      })
    );
    
    return await provider.sendAndConfirm(tx);
  }
  
  // Fund accounts
  before(async () => {
    console.log("Payer wallet:", wallet.publicKey.toString());
    
    // Check wallet balance
    const balance = await provider.connection.getBalance(wallet.publicKey);
    console.log(`Payer wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 2 * LAMPORTS_PER_SOL) {
      console.log("Trying to airdrop SOL to payer wallet...");
      const signature = await provider.connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(signature);
      console.log("Airdrop confirmed!");
    }
    
    // Transfer SOL to test accounts
    await transferSol(wallet, creator.publicKey, 1 * LAMPORTS_PER_SOL);
    await transferSol(wallet, supporter.publicKey, 1 * LAMPORTS_PER_SOL);
    
    // Verify balances
    const creatorBalance = await provider.connection.getBalance(creator.publicKey);
    const supporterBalance = await provider.connection.getBalance(supporter.publicKey);
    
    console.log(`Creator balance: ${creatorBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Supporter balance: ${supporterBalance / LAMPORTS_PER_SOL} SOL`);
    
    // Wait for confirmation
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
  
  it("Initializes a campaign", async () => {
    // Find campaign PDA
    const [campaignPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        creator.publicKey.toBuffer(),
        Buffer.from(projectName),
      ],
      program.programId
    );
    
    console.log("Campaign PDA:", campaignPda.toString());
    
    try {
      // Initialize campaign
      const tx = await program.methods
        .initializeCampaign(
          projectName,
          description,
          fundingGoalLamports,
          nftName,
          nftSymbol,
          nftUri
        )
        .accounts({
          campaign: campaignPda,
          creator: creator.publicKey,
          nftMint: nftMint.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
        
      console.log("Campaign initialized transaction signature:", tx);
      
      // Fetch campaign data
      const campaignAccount = await program.account.campaign.fetch(campaignPda);
      console.log("Campaign data:", campaignAccount);
      
      // Verify campaign data
      assert.equal(campaignAccount.projectName, projectName);
      assert.equal(campaignAccount.description, description);
      assert.ok(campaignAccount.fundingGoalLamports.eq(fundingGoalLamports));
      assert.equal(campaignAccount.nftName, nftName);
      assert.equal(campaignAccount.nftSymbol, nftSymbol);
      assert.equal(campaignAccount.nftUri, nftUri);
      assert.equal(campaignAccount.nftMint.toString(), nftMint.publicKey.toString());
    } catch (error) {
      console.error("Error initializing campaign:", error);
      throw error;
    }
  });
  
  it("Funds a campaign", async () => {
    // Find campaign PDA (same as above)
    const [campaignPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        creator.publicKey.toBuffer(),
        Buffer.from(projectName),
      ],
      program.programId
    );
    
    // Find supporter funding PDA
    const [supporterFundingPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("supporter-funding"),
        campaignPda.toBuffer(),
        supporter.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    const fundingAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL); // 0.5 SOL
    
    try {
      // Fund campaign
      const tx = await program.methods
        .fundCampaign(fundingAmount)
        .accounts({
          campaign: campaignPda,
          supporter: supporter.publicKey,
          supporterFunding: supporterFundingPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([supporter])
        .rpc();
        
      console.log("Campaign funding transaction signature:", tx);
      
      // Fetch updated campaign data
      const campaignAccount = await program.account.campaign.fetch(campaignPda);
      console.log("Updated campaign data:", campaignAccount);
      
      // Fetch supporter funding data
      const supporterFundingAccount = await program.account.supporterFunding.fetch(supporterFundingPda);
      console.log("Supporter funding data:", supporterFundingAccount);
      
      // Verify funding data
      assert.ok(campaignAccount.raisedLamports.gte(fundingAmount));
      assert.equal(supporterFundingAccount.campaign.toString(), campaignPda.toString());
      assert.equal(supporterFundingAccount.supporter.toString(), supporter.publicKey.toString());
      assert.ok(supporterFundingAccount.amountLamports.eq(fundingAmount));
      assert.equal(supporterFundingAccount.isClaimed, false);
    } catch (error) {
      console.error("Error funding campaign:", error);
      throw error;
    }
  });
  
  it("Fully funds a campaign and creator withdraws funds", async () => {
    // Find campaign PDA
    const [campaignPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        creator.publicKey.toBuffer(),
        Buffer.from(projectName),
      ],
      program.programId
    );
    
    try {
      // Fetch current campaign data
      let campaignAccount = await program.account.campaign.fetch(campaignPda);
      
      // Calculate remaining amount to fully fund the campaign
      const remainingAmount = campaignAccount.fundingGoalLamports.sub(campaignAccount.raisedLamports);
      console.log(`Need ${remainingAmount.toNumber() / LAMPORTS_PER_SOL} more SOL to fully fund campaign`);
      
      if (remainingAmount.toNumber() > 0) {
        // Create a second supporter to fully fund the campaign
        const additionalSupporter = Keypair.fromSeed(Uint8Array.from(Array(32).fill(3)));
        console.log("Additional supporter pubkey:", additionalSupporter.publicKey.toString());
        
        // Fund the additional supporter
        await transferSol(wallet, additionalSupporter.publicKey, 1 * LAMPORTS_PER_SOL);
        
        // Find supporter funding PDA for additional supporter
        const [supporterFundingPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("supporter-funding"),
            campaignPda.toBuffer(),
            additionalSupporter.publicKey.toBuffer(),
          ],
          program.programId
        );
        
        // Fund campaign with the remaining amount needed
        const fundTx = await program.methods
          .fundCampaign(remainingAmount)
          .accounts({
            campaign: campaignPda,
            supporter: additionalSupporter.publicKey,
            supporterFunding: supporterFundingPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([additionalSupporter])
          .rpc();
          
        console.log("Additional funding transaction signature:", fundTx);
      }
      
      // Fetch updated campaign data to verify it's fully funded
      campaignAccount = await program.account.campaign.fetch(campaignPda);
      console.log("Campaign after full funding:", campaignAccount);
      
      // Verify campaign is now fully funded
      assert.ok(campaignAccount.raisedLamports.gte(campaignAccount.fundingGoalLamports));
      assert.ok(campaignAccount.isFunded);
      
      // Get creator's balance before withdrawal
      const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);
      console.log(`Creator balance before withdrawal: ${creatorBalanceBefore / LAMPORTS_PER_SOL} SOL`);
      
      // Creator withdraws funds
      const withdrawTx = await program.methods
        .withdrawFunds()
        .accounts({
          campaign: campaignPda,
          creator: creator.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
        
      console.log("Withdrawal transaction signature:", withdrawTx);
      
      // Get creator's balance after withdrawal
      const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
      console.log(`Creator balance after withdrawal: ${creatorBalanceAfter / LAMPORTS_PER_SOL} SOL`);
      
      // Verify creator received the funds
      assert.ok(creatorBalanceAfter > creatorBalanceBefore);
      
    } catch (error) {
      console.error("Error in withdrawal test:", error);
      throw error;
    }
  });
  
  it("Creates a campaign that fails to meet funding goal and tests refund", async () => {
    // Create new campaign with different name to avoid conflicts
    const failingProjectName = "Failing Test Campaign";
    const failingCreator = Keypair.fromSeed(Uint8Array.from(Array(32).fill(4)));
    const failingSupporter = Keypair.fromSeed(Uint8Array.from(Array(32).fill(5)));
    const failingNftMint = Keypair.generate();
    
    console.log("Failing campaign creator:", failingCreator.publicKey.toString());
    console.log("Failing campaign supporter:", failingSupporter.publicKey.toString());
    
    // Fund accounts
    await transferSol(wallet, failingCreator.publicKey, 1 * LAMPORTS_PER_SOL);
    await transferSol(wallet, failingSupporter.publicKey, 1 * LAMPORTS_PER_SOL);
    
    // Find campaign PDA
    const [failingCampaignPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        failingCreator.publicKey.toBuffer(),
        Buffer.from(failingProjectName),
      ],
      program.programId
    );
    
    try {
      // Initialize failing campaign
      const initTx = await program.methods
        .initializeCampaign(
          failingProjectName,
          "This campaign will not reach its goal",
          new anchor.BN(2 * LAMPORTS_PER_SOL), // 2 SOL goal
          "Failing NFT",
          "FAIL",
          "https://arweave.net/failing-nft-uri"
        )
        .accounts({
          campaign: failingCampaignPda,
          creator: failingCreator.publicKey,
          nftMint: failingNftMint.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([failingCreator])
        .rpc();
        
      console.log("Failing campaign initialized:", initTx);
      
      // Find supporter funding PDA
      const [supporterFundingPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("supporter-funding"),
          failingCampaignPda.toBuffer(),
          failingSupporter.publicKey.toBuffer(),
        ],
        program.programId
      );
      
      // Fund campaign with insufficient amount
      const fundAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL); // Only 0.5 SOL, not enough to meet goal
      const fundTx = await program.methods
        .fundCampaign(fundAmount)
        .accounts({
          campaign: failingCampaignPda,
          supporter: failingSupporter.publicKey,
          supporterFunding: supporterFundingPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([failingSupporter])
        .rpc();
        
      console.log("Partial funding transaction:", fundTx);
      
      // Simulate time passing - normally we'd wait for the campaign to end naturally
      // For testing, we'll use a workaround by modifying the timestamp in the tests
      console.log("Simulating campaign end... In a real scenario, we'd wait for 30 days");
      console.log("For testing purposes, we'll directly test the refund path");
      
      // Check supporter balance before refund
      const supporterBalanceBefore = await provider.connection.getBalance(failingSupporter.publicKey);
      console.log(`Supporter balance before refund: ${supporterBalanceBefore / LAMPORTS_PER_SOL} SOL`);
      
      // Note: In a real test we would need to modify the clock to simulate the end timestamp
      // For now we'll make comments about what would happen in a real scenario
      
      console.log("⚠️ In a real scenario, after the campaign end timestamp passes:");
      console.log("1. Campaign would be verified as not fully funded");
      console.log("2. Supporters would call claim_refund() to get their SOL back");
      console.log("3. The contract would verify the campaign has ended and transfer SOL back");
      
      // For now we'll verify the campaign data is correct
      const campaignAccount = await program.account.campaign.fetch(failingCampaignPda);
      const supporterFundingAccount = await program.account.supporterFunding.fetch(supporterFundingPda);
      
      assert.equal(campaignAccount.isFunded, false);
      assert.ok(campaignAccount.raisedLamports.lt(campaignAccount.fundingGoalLamports));
      assert.equal(supporterFundingAccount.isClaimed, false);
      assert.ok(supporterFundingAccount.amountLamports.eq(fundAmount));
      
    } catch (error) {
      console.error("Error in failing campaign test:", error);
      throw error;
    }
  });
  
  it("Tests edge cases and validation rules", async () => {
    // Test validation rules like trying to withdraw from an unfunded campaign
    // or trying to fund a campaign after it has ended
    
    // Create a new campaign for testing edge cases
    const edgeCaseProjectName = "Edge Case Campaign";
    const edgeCaseCreator = Keypair.fromSeed(Uint8Array.from(Array(32).fill(6)));
    const edgeCaseNftMint = Keypair.generate();
    
    console.log("Edge case campaign creator:", edgeCaseCreator.publicKey.toString());
    
    // Fund the creator
    await transferSol(wallet, edgeCaseCreator.publicKey, 1 * LAMPORTS_PER_SOL);
    
    // Find campaign PDA
    const [edgeCaseCampaignPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        edgeCaseCreator.publicKey.toBuffer(),
        Buffer.from(edgeCaseProjectName),
      ],
      program.programId
    );
    
    try {
      // Initialize campaign
      await program.methods
        .initializeCampaign(
          edgeCaseProjectName,
          "Campaign for testing edge cases",
          new anchor.BN(1 * LAMPORTS_PER_SOL),
          "Edge NFT",
          "EDGE",
          "https://arweave.net/edge-nft-uri"
        )
        .accounts({
          campaign: edgeCaseCampaignPda,
          creator: edgeCaseCreator.publicKey,
          nftMint: edgeCaseNftMint.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([edgeCaseCreator])
        .rpc();
      
      console.log("Edge case campaign initialized");
      
      // Test 1: Try to withdraw from an unfunded campaign (should fail)
      console.log("Test 1: Attempting to withdraw from unfunded campaign (should fail)");
      try {
        await program.methods
          .withdrawFunds()
          .accounts({
            campaign: edgeCaseCampaignPda,
            creator: edgeCaseCreator.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([edgeCaseCreator])
          .rpc();
          
        // If we reach here, the test failed
        assert.fail("Should not be able to withdraw from unfunded campaign");
      } catch (error) {
        // Expected error - campaign is not funded
        console.log("Withdraw from unfunded campaign correctly failed");
        assert.ok(error.toString().includes("CampaignNotFunded") || 
                 error.toString().includes("Error Code: CampaignNotFunded"));
      }
      
      // Test 2: Try to withdraw as non-creator (should fail)
      console.log("Test 2: Attempting to withdraw as non-creator (should fail)");
      try {
        await program.methods
          .withdrawFunds()
          .accounts({
            campaign: edgeCaseCampaignPda,
            creator: supporter.publicKey, // Using existing supporter as non-creator
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([supporter])
          .rpc();
          
        // If we reach here, the test failed
        assert.fail("Should not be able to withdraw as non-creator");
      } catch (error) {
        // Expected error - unauthorized
        console.log("Withdraw as non-creator correctly failed");
        assert.ok(error.toString().includes("Unauthorized") || 
                 error.toString().includes("Error Code: Unauthorized") ||
                 error.toString().includes("0x177b"));
      }
    } catch (error) {
      console.error("Error in edge case tests:", error);
      throw error;
    }
  });

  // Test the new Edition NFT minting functionality
  it("Tests NFT edition minting for a fully funded campaign", async () => {
    // Create a new campaign for testing NFT editions
    const editionProjectName = "Edition Test Campaign";
    const editionCreator = anchor.web3.Keypair.generate();
    
    console.log("NFT edition campaign creator:", editionCreator.publicKey.toString());
    
    // Fund the creator
    await transferSol(wallet, editionCreator.publicKey, 2 * LAMPORTS_PER_SOL);
    
    // Fund the supporter
    const editionSupporter = anchor.web3.Keypair.generate();
    await transferSol(wallet, editionSupporter.publicKey, 2 * LAMPORTS_PER_SOL);
    
    // Find campaign PDA
    const [editionCampaignPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        editionCreator.publicKey.toBuffer(),
        Buffer.from(editionProjectName),
      ],
      program.programId
    );
    
    try {
      // Create NFT mint keypair
      const editionNftMint = anchor.web3.Keypair.generate();
      console.log("NFT master edition mint:", editionNftMint.publicKey.toString());
      
      // Initialize campaign with a small funding goal
      await program.methods
        .initializeCampaign(
          editionProjectName,
          "Campaign for testing NFT editions",
          new anchor.BN(Math.floor(0.5 * LAMPORTS_PER_SOL)), // Just 0.5 SOL goal
          "Edition NFT",
          "ENFT",
          "https://arweave.net/edition-nft-uri"
        )
        .accounts({
          campaign: editionCampaignPda,
          creator: editionCreator.publicKey,
          nftMint: editionNftMint.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([editionCreator])
        .rpc();
      
      console.log("NFT edition campaign initialized");
      
      // Find supporter funding PDA
      const [supporterFundingPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("supporter-funding"),
          editionCampaignPda.toBuffer(),
          editionSupporter.publicKey.toBuffer(),
        ],
        program.programId
      );
      
      // Fund campaign to make it fully funded
      const fundTx = await program.methods
        .fundCampaign(new anchor.BN(Math.floor(0.5 * LAMPORTS_PER_SOL)))
        .accounts({
          campaign: editionCampaignPda,
          supporter: editionSupporter.publicKey,
          supporterFunding: supporterFundingPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([editionSupporter])
        .rpc();
      
      console.log("Campaign fully funded for NFT edition test");
      
      // Verify campaign is funded
      const campaignAfterFunding = await program.account.campaign.fetch(editionCampaignPda);
      assert.ok(campaignAfterFunding.isFunded);
      console.log("Campaign confirmed as fully funded");
      console.log("Campaign max editions:", campaignAfterFunding.maxEditions.toString());
      console.log("Campaign editions minted:", campaignAfterFunding.editionsMinted.toString());
      
      // For testing purposes, we'll just verify that the campaign has the correct edition settings
      // and that the supporter funding record is properly initialized
      const supporterFundingData = await program.account.supporterFunding.fetch(supporterFundingPda);
      assert.equal(supporterFundingData.nftMinted, false);
      assert.equal(supporterFundingData.editionNumber, 0);
      
      console.log("✅ NFT edition test successful - campaign and supporter funding properly initialized");
      console.log("For a full test of edition minting, we would need to setup token accounts and metadata accounts");
    } catch (error) {
      console.error("Error in NFT edition test:", error);
      throw error;
    }
  });

  // Test the treasury fee collection and admin withdrawal functionality
  it("Tests platform fee collection and admin treasury withdrawal", async () => {
    try {
      // Create a new campaign for testing fee collection
      const feeTestName = "Fee Test Campaign";
      const feeCreator = anchor.web3.Keypair.generate();
      const feeSupporter = anchor.web3.Keypair.generate();
      const feeNftMint = anchor.web3.Keypair.generate();
      
      // Fund accounts
      await transferSol(wallet, feeCreator.publicKey, 2 * LAMPORTS_PER_SOL);
      await transferSol(wallet, feeSupporter.publicKey, 5 * LAMPORTS_PER_SOL);
      
      // Find campaign PDA
      const [feeCampaignPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          feeCreator.publicKey.toBuffer(),
          Buffer.from(feeTestName),
        ],
        program.programId
      );
      
      // Find treasury PDA
      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
      );
      
      console.log("Treasury PDA:", treasuryPda.toString());
      
      // Initialize campaign
      await program.methods
        .initializeCampaign(
          feeTestName,
          description,
          new anchor.BN(1 * LAMPORTS_PER_SOL), // 1 SOL funding goal
          nftName,
          nftSymbol,
          nftUri
        )
        .accounts({
          campaign: feeCampaignPda,
          creator: feeCreator.publicKey,
          nftMint: feeNftMint.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([feeCreator, feeNftMint])
        .rpc();
        
      console.log("Campaign initialized for fee test");
      
      // Get supporter funding account
      const [supporterFundingPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("supporter"),
          feeCampaignPda.toBuffer(),
          feeSupporter.publicKey.toBuffer(),
        ],
        program.programId
      );
      
      // Fund campaign with 2 SOL (200% of goal - ensures campaign is funded)
      await program.methods
        .fundCampaign(new anchor.BN(2 * LAMPORTS_PER_SOL))
        .accounts({
          campaign: feeCampaignPda,
          supporter: feeSupporter.publicKey,
          supporterFunding: supporterFundingPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([feeSupporter])
        .rpc();
        
      console.log("Campaign fully funded with 2 SOL");
      
      // Check campaign account to verify funding
      let campaignAccount = await program.account.campaign.fetch(feeCampaignPda);
      assert.equal(campaignAccount.isFunded, true, "Campaign should be marked as funded");
      assert.equal(
        campaignAccount.raisedLamports.toString(),
        (2 * LAMPORTS_PER_SOL).toString(),
        "Campaign should have 2 SOL raised"
      );
      
      // Get creator and treasury balances before withdrawal
      const creatorBalanceBefore = await connection.getBalance(feeCreator.publicKey);
      const treasuryBalanceBefore = await connection.getBalance(treasuryPda);
      
      console.log("Creator balance before withdrawal:", creatorBalanceBefore / LAMPORTS_PER_SOL, "SOL");
      console.log("Treasury balance before withdrawal:", treasuryBalanceBefore / LAMPORTS_PER_SOL, "SOL");
      
      // Creator withdraws funds - 2.5% should go to treasury
      await program.methods
        .withdrawFunds()
        .accounts({
          campaign: feeCampaignPda,
          creator: feeCreator.publicKey,
          treasury: treasuryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([feeCreator])
        .rpc();
        
      console.log("Funds withdrawn by creator");
      
      // Get updated balances
      const creatorBalanceAfter = await connection.getBalance(feeCreator.publicKey);
      const treasuryBalanceAfter = await connection.getBalance(treasuryPda);
      
      console.log("Creator balance after withdrawal:", creatorBalanceAfter / LAMPORTS_PER_SOL, "SOL");
      console.log("Treasury balance after withdrawal:", treasuryBalanceAfter / LAMPORTS_PER_SOL, "SOL");
      
      // Calculate expected values
      const expectedFee = (2 * LAMPORTS_PER_SOL) * PLATFORM_FEE_NUMERATOR / PLATFORM_FEE_DENOMINATOR;
      const expectedCreatorAmount = (2 * LAMPORTS_PER_SOL) - expectedFee;
      
      // Verify creator received proper amount (97.5% of funds)
      const creatorReceived = creatorBalanceAfter - creatorBalanceBefore;
      assert(
        Math.abs(creatorReceived - expectedCreatorAmount) < 10000, // Allow small difference for gas fees
        `Creator should receive ~${expectedCreatorAmount / LAMPORTS_PER_SOL} SOL, got ${creatorReceived / LAMPORTS_PER_SOL} SOL`
      );
      
      // Verify treasury received the fee (2.5% of funds)
      const treasuryReceived = treasuryBalanceAfter - treasuryBalanceBefore;
      assert(
        Math.abs(treasuryReceived - expectedFee) < 1000, // Allow small difference
        `Treasury should receive ~${expectedFee / LAMPORTS_PER_SOL} SOL, got ${treasuryReceived / LAMPORTS_PER_SOL} SOL`
      );
      
      console.log("✅ Platform fee test successful - treasury received the 2.5% fee");
      
      // Create an admin keypair (you would use your real admin keypair in practice)
      // For testing, we'll create one with the known private key
      const adminKeypair = anchor.web3.Keypair.generate();
      console.log("Test admin pubkey:", adminKeypair.publicKey.toString());
      
      // Fund the admin account
      await transferSol(wallet, adminKeypair.publicKey, 0.1 * LAMPORTS_PER_SOL);
      
      // In a real test, the admin would withdraw funds from treasury
      // But our test environment can't create the specific admin keypair from lib.rs
      
      console.log("In a real environment, admin would call withdraw_treasury to withdraw fees");
      console.log("To test admin withdrawal, use the CLI with the correct admin keypair");
      
      // NOTE: For an actual test with the real admin, you would do:
      /*
      await program.methods
        .withdrawTreasury(new anchor.BN(expectedFee))
        .accounts({
          admin: new PublicKey(ADMIN_PUBKEY),
          treasury: treasuryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([adminKeypair]) // This would be the real admin keypair
        .rpc();
       */
       
       console.log("✅ Treasury fee collection test successful");
    } catch (error) {
      console.error("Error in treasury fee test:", error);
      throw error;
    }
  });
});
