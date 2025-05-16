use anchor_lang::prelude::*;
use std::str::FromStr;

// Import necessary SPL token libraries
use anchor_spl::token::{self, Token, MintTo, Mint, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

// Define Metaplex Token Metadata program ID
pub const METADATA_PROGRAM_ID: &str = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
pub const TOKEN_PROGRAM_ID: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

declare_id!("6saaps2jtMCng2XxkuBG3Cizvcsfy2LBm8AGicK2NamF");

// Platform fee percentage (2.5% = 25/1000)
const PLATFORM_FEE_NUMERATOR: u64 = 25;
const PLATFORM_FEE_DENOMINATOR: u64 = 1000;

// Admin public key for treasury management
pub const ADMIN_PUBKEY: &str = "ZaikXX6zRGseZdyGnpdBaTkBdetDNgZcGEqzeZgAXtM";

#[program]
pub mod gkescrow {
    use super::*;

    // Create a new campaign with NFT reward - this creates a master edition NFT
    pub fn initialize_campaign(
        ctx: Context<InitializeCampaign>,
        project_name: String,
        description: String,
        funding_goal_lamports: u64,
        nft_name: String,
        nft_symbol: String,
        nft_uri: String,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let creator = &ctx.accounts.creator;

        // Calculate end timestamp (10 minutes from now for hackathon demo)
        let current_time = Clock::get()?.unix_timestamp;
        let end_timestamp = current_time + (10 * 60); // 10 minutes in seconds

        // Initialize campaign data
        campaign.creator = creator.key();
        campaign.project_name = project_name;
        campaign.description = description;
        campaign.funding_goal_lamports = funding_goal_lamports;
        campaign.raised_lamports = 0;
        campaign.supporters_count = 0;
        campaign.is_active = true;
        campaign.is_funded = false;
        campaign.created_at = current_time;
        campaign.end_timestamp = end_timestamp;
        
        // NFT metadata
        campaign.nft_name = nft_name;
        campaign.nft_symbol = nft_symbol;
        campaign.nft_uri = nft_uri;
        campaign.nft_mint = ctx.accounts.nft_mint.key();
        
        // Edition NFT settings
        campaign.max_editions = 5; // Fixed at 5 for the hackathon demo
        campaign.editions_minted = 0; // Start with 0 minted

        msg!("Campaign initialized successfully!");
        msg!("Project: {}", campaign.project_name);
        msg!("Goal: {} lamports", campaign.funding_goal_lamports);
        msg!("NFT: {} ({})", campaign.nft_name, campaign.nft_symbol);
        msg!("End date: {} (unix timestamp)", campaign.end_timestamp);

        Ok(())
    }

    // Fund a campaign and receive NFT
    pub fn fund_campaign(
        ctx: Context<FundCampaign>,
        amount_lamports: u64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let supporter = &ctx.accounts.supporter;
        
        // Ensure campaign is still active
        if !campaign.is_active {
            return Err(ErrorCode::CampaignNotActive.into());
        }

        // Ensure campaign hasn't ended
        let current_time = Clock::get()?.unix_timestamp;
        if current_time > campaign.end_timestamp {
            return Err(ErrorCode::CampaignEnded.into());
        }

        // Transfer SOL from supporter to campaign escrow
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: supporter.to_account_info(),
                    to: campaign.to_account_info(),
                },
            ),
            amount_lamports,
        )?;

        // Create supporter record
        let supporter_funding = &mut ctx.accounts.supporter_funding;
        supporter_funding.campaign = campaign.key();
        supporter_funding.supporter = supporter.key();
        supporter_funding.amount_lamports = amount_lamports;
        supporter_funding.funded_at = current_time;
        supporter_funding.is_claimed = false;
        supporter_funding.nft_minted = false;
        supporter_funding.edition_number = 0; // Will be set when NFT is minted
        supporter_funding.edition_mint = Pubkey::default(); // Initialize to zero, will be set when minted

        // Update campaign stats
        campaign.raised_lamports = campaign.raised_lamports.checked_add(amount_lamports)
            .ok_or(ErrorCode::AmountOverflow)?;
        campaign.supporters_count = campaign.supporters_count.checked_add(1)
            .ok_or(ErrorCode::CountOverflow)?;

        // Check if campaign is now fully funded
        if campaign.raised_lamports >= campaign.funding_goal_lamports {
            campaign.is_funded = true;
        }

        // In a real implementation, this would mint an NFT to the supporter
        // For now, we'll just record the funding in the supporter_funding account

        msg!("Campaign funded successfully!");
        msg!("Supporter: {}", supporter.key());
        msg!("Amount: {} lamports", amount_lamports);
        msg!("Campaign raised: {}/{} lamports", 
            campaign.raised_lamports, 
            campaign.funding_goal_lamports);

        Ok(())
    }

    // Withdraw funds if campaign is fully funded (creator only)
    pub fn withdraw_funds(ctx: Context<WithdrawFunds>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let creator = &ctx.accounts.creator;
        let treasury = &ctx.accounts.treasury;
        
        // Ensure campaign is funded
        if !campaign.is_funded {
            return Err(ErrorCode::CampaignNotFunded.into());
        }
        
        // Ensure caller is the creator
        if campaign.creator != creator.key() {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Get campaign balance
        let campaign_balance = **campaign.to_account_info().lamports.borrow();
        
        // Calculate 2.5% platform fee
        let platform_fee = campaign_balance
            .checked_mul(PLATFORM_FEE_NUMERATOR)
            .ok_or(ErrorCode::AmountOverflow)?
            .checked_div(PLATFORM_FEE_DENOMINATOR)
            .ok_or(ErrorCode::AmountOverflow)?;
        
        // Calculate creator amount (total - platform fee)
        let creator_amount = campaign_balance.checked_sub(platform_fee)
            .ok_or(ErrorCode::AmountOverflow)?;
        
        // Transfer platform fee to treasury
        **campaign.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **treasury.to_account_info().try_borrow_mut_lamports()? += platform_fee;
        
        // Transfer remaining funds to creator
        **campaign.to_account_info().try_borrow_mut_lamports()? -= creator_amount;
        **creator.to_account_info().try_borrow_mut_lamports()? += creator_amount;

        msg!("Funds withdrawn successfully!");
        msg!("Creator: {}", creator.key());
        msg!("Creator amount: {} lamports", creator_amount);
        msg!("Platform fee: {} lamports", platform_fee);

        Ok(())
    }

    // Refund if campaign failed to meet goal after end date
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let campaign = &ctx.accounts.campaign;
        let supporter_funding = &mut ctx.accounts.supporter_funding;
        let supporter = &ctx.accounts.supporter;
        
        // Ensure campaign has ended
        let current_time = Clock::get()?.unix_timestamp;
        if current_time <= campaign.end_timestamp {
            return Err(ErrorCode::CampaignStillActive.into());
        }
        
        // Ensure campaign is not fully funded
        if campaign.is_funded {
            return Err(ErrorCode::CampaignAlreadyFunded.into());
        }
        
        // Ensure refund hasn't been claimed yet
        if supporter_funding.is_claimed {
            return Err(ErrorCode::RefundAlreadyClaimed.into());
        }
        
        // Calculate refund amount
        let refund_amount = supporter_funding.amount_lamports;
        
        // Transfer SOL from campaign account back to supporter
        **campaign.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **supporter.to_account_info().try_borrow_mut_lamports()? += refund_amount;
        
        // Mark as claimed
        supporter_funding.is_claimed = true;
        
        msg!("Refund claimed successfully!");
        msg!("Supporter: {}", supporter.key());
        msg!("Amount refunded: {} lamports", refund_amount);
        
        Ok(())
    }
    
    // Mint an edition NFT to a supporter when the campaign is fully funded
    // Admin function to withdraw funds from treasury PDA
    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        let admin = &ctx.accounts.admin;
        let treasury = &ctx.accounts.treasury;
        
        // Verify the admin is the correct authorized admin
        let admin_pubkey = Pubkey::from_str(ADMIN_PUBKEY).unwrap();
        if admin.key() != admin_pubkey {
            return Err(ErrorCode::Unauthorized.into());
        }
        
        // Check that treasury has enough funds
        let treasury_balance = **treasury.to_account_info().lamports.borrow();
        if treasury_balance < amount {
            return Err(ErrorCode::InsufficientFunds.into());
        }
        
        // Get the bump from the seeds constraints defined in the accounts struct
        let bump = ctx.bumps.treasury;
        let treasury_seeds = &[b"treasury".as_ref(), &[bump]];
        
        // Transfer funds from treasury to admin using a signed CPI
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &treasury.key(),
            &admin.key(),
            amount
        );
        
        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                treasury.to_account_info(),
                admin.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[treasury_seeds],
        )?;
        
        msg!("Treasury funds withdrawn successfully!");
        msg!("Admin: {}", admin.key());
        
        Ok(())
    }
    
    // Transfer an NFT to the escrow PDA for supporters to claim
    pub fn transfer_nft_to_escrow(ctx: Context<TransferNftToEscrow>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        
        // Ensure only the campaign creator can transfer NFT to escrow
        if campaign.creator != ctx.accounts.creator.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        
        // Check if NFT has already been transferred to escrow
        if campaign.nft_in_escrow {
            return Err(ErrorCode::NftAlreadyInEscrow.into());
        }
        
        // Transfer the NFT token from the creator to the escrow PDA
        // We're transferring 1 token (the NFT)
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.creator_token_account.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            ),
            1, // Transfer exactly 1 token (the NFT)
        )?;
        
        // Mark that the NFT is now in escrow and ready for claiming
        campaign.nft_in_escrow = true;
        
        msg!("NFT transferred to escrow successfully!");
        msg!("Campaign: {}", campaign.project_name);
        msg!("NFT Mint: {}", ctx.accounts.nft_mint.key());
        msg!("Escrow Token Account: {}", ctx.accounts.escrow_token_account.key());
        
        Ok(())
    }

// Claim an NFT from escrow as a supporter who funded the campaign
pub fn claim_nft_from_escrow(ctx: Context<ClaimNftFromEscrow>) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let supporter_funding = &mut ctx.accounts.supporter_funding;
    
    // Ensure campaign is fully funded
    if !campaign.is_funded {
        return Err(ErrorCode::CampaignNotFunded.into());
    }
    
    // Ensure the NFT is in escrow
    if !campaign.nft_in_escrow {
        return Err(ErrorCode::NftNotInEscrow.into());
    }
    
    // Ensure NFT hasn't been claimed by this supporter yet
    if supporter_funding.nft_minted {
        return Err(ErrorCode::NftAlreadyMinted.into());
    }
    
    // Check if we've reached the maximum claimable NFTs
    if campaign.editions_minted >= campaign.max_editions {
        return Err(ErrorCode::MaxEditionsReached.into());
    }
    
    // Increment the number of claimed NFTs for this campaign
    campaign.editions_minted = campaign.editions_minted.checked_add(1)
        .ok_or(ErrorCode::ArithmeticError)?;
    
    // Record the edition number for this supporter
    supporter_funding.edition_number = campaign.editions_minted;
    
    // Get the escrow PDA's bump
    let escrow_bump = ctx.bumps.escrow_authority;
    
    // Create seeds for escrow PDA signing
    let campaign_key = campaign.key();
    let seeds = &[
        b"escrow".as_ref(),
        campaign_key.as_ref(),
        &[escrow_bump]
    ];
    // Transfer the NFT from escrow to the supporter
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.supporter_token_account.to_account_info(),
                authority: ctx.accounts.escrow_authority.to_account_info(),
            },
            &[seeds],
        ),
        1, // Transfer exactly 1 token (the NFT)
    )?;
    
    // Mark that this supporter has claimed their NFT
    supporter_funding.nft_minted = true;
    supporter_funding.edition_mint = ctx.accounts.nft_mint.key();
    
    msg!("NFT claimed from escrow successfully!");
    msg!("Campaign: {}", campaign.project_name);
    msg!("Edition number: {}/{}", supporter_funding.edition_number, campaign.max_editions);
    msg!("Recipient: {}", supporter_funding.supporter);
    msg!("NFT Mint: {}", ctx.accounts.nft_mint.key());
    
    Ok(())
}

// New instruction to update the supporter's NFT mint info after frontend minting
// Create a struct for updating supporter NFT mint info
#[derive(Accounts)]
pub struct UpdateSupporterNftMint<'info> {
    // Campaign account that must be fully funded
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    // The supporter funding record to update
    #[account(
        mut,
        seeds = [
            b"supporter-funding",
            campaign.key().as_ref(),
            supporter_funding.supporter.as_ref(),
        ],
        bump,
        constraint = supporter_funding.campaign == campaign.key() @ ErrorCode::InvalidCampaign
    )]
    pub supporter_funding: Account<'info, SupporterFunding>,
    
    /// CHECK: The creator account (not required to sign)
    #[account(constraint = creator.key() == campaign.creator @ ErrorCode::InvalidCampaign)]
    pub creator: AccountInfo<'info>,
    
    // Signer for the transaction (must be the supporter who funded the campaign)
    #[account(mut, constraint = authority.key() == supporter_funding.supporter @ ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
    
    /// CHECK: The master edition NFT mint, verified by constraint to match the campaign's NFT mint
    #[account(constraint = master_edition_mint.key() == campaign.nft_mint @ ErrorCode::InvalidCampaign)]
    pub master_edition_mint: AccountInfo<'info>,
    
    /// CHECK: The new edition mint account that will be created
    #[account(mut)]
    pub edition_mint: AccountInfo<'info>,
    
    /// CHECK: Mint authority for the edition mint
    pub mint_authority: Signer<'info>,
    
    /// CHECK: Recipient's token account for the edition NFT
    #[account(mut)]
    pub recipient_token_account: AccountInfo<'info>,
    
    // Required programs
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Legacy function kept for backward compatibility during transition
// Will mark a supporter as having claimed an NFT without actual transfer
pub fn update_supporter_nft_mint(ctx: Context<UpdateSupporterNftMint>, edition_number: u64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let supporter_funding = &mut ctx.accounts.supporter_funding;
    
    // Ensure campaign is fully funded
    if !campaign.is_funded {
        return Err(ErrorCode::CampaignNotFunded.into());
    }
    
    // Ensure NFT hasn't been claimed by this supporter yet
    if supporter_funding.nft_minted {
        return Err(ErrorCode::NftAlreadyMinted.into());
    }
    
    // Update campaign edition count if needed
    if edition_number > campaign.editions_minted {
        campaign.editions_minted = edition_number;
    }
    
    // Mark the NFT as minted with the specified edition number
    // This doesn't actually transfer any NFT, just updates the record
    supporter_funding.nft_minted = true;
    supporter_funding.edition_number = edition_number;
    
    // Store the edition mint in the supporter funding record for future reference
    supporter_funding.edition_mint = ctx.accounts.edition_mint.key();
    
    msg!("NFT claim status updated successfully (legacy method)");
    msg!("Campaign: {}", campaign.project_name);
    msg!("Edition number: {}/{}", supporter_funding.edition_number, campaign.max_editions);
    msg!("Recipient: {}", ctx.accounts.supporter_funding.supporter);
    msg!("Edition mint: {}", ctx.accounts.edition_mint.key());
    
    Ok(())
}
}

#[derive(Accounts)]
#[instruction(
    project_name: String,
    description: String, 
    funding_goal_lamports: u64,
    nft_name: String,
    nft_symbol: String,
    nft_uri: String
)]
pub struct InitializeCampaign<'info> {
    #[account(
        init,
        payer = creator,
        space = Campaign::space(&project_name, &description, &nft_name, &nft_symbol, &nft_uri),
        seeds = [
            b"campaign",
            creator.key().as_ref(),
            project_name.as_bytes()
        ],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    /// CHECK: This is just a reference to the NFT mint
    pub nft_mint: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount_lamports: u64)]
pub struct FundCampaign<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    #[account(mut)]
    pub supporter: Signer<'info>,
    
    #[account(
        init,
        payer = supporter,
        space = SupporterFunding::space(),
        seeds = [
            b"supporter-funding",
            campaign.key().as_ref(),
            supporter.key().as_ref(),
        ],
        bump
    )]
    pub supporter_funding: Account<'info, SupporterFunding>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: This is the treasury PDA
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    #[account(
        mut,
        seeds = [
            b"supporter-funding",
            campaign.key().as_ref(),
            supporter.key().as_ref(),
        ],
        bump,
        constraint = supporter_funding.campaign == campaign.key() @ ErrorCode::InvalidCampaign,
        constraint = supporter_funding.supporter == supporter.key() @ ErrorCode::Unauthorized
    )]
    pub supporter_funding: Account<'info, SupporterFunding>,
    
    #[account(mut)]
    pub supporter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for treasury withdrawals
#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    // Admin account must be a signer
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: This is the treasury PDA
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for minting edition NFTs to supporters
#[derive(Accounts)]
pub struct TransferNftToEscrow<'info> {
    // Campaign account
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    // Campaign creator as signer
    #[account(
        mut,
        constraint = creator.key() == campaign.creator @ ErrorCode::Unauthorized
    )]
    pub creator: Signer<'info>,
    
    // The NFT mint account
    #[account(
        constraint = nft_mint.key() == campaign.nft_mint @ ErrorCode::InvalidNftMint
    )]
    pub nft_mint: Account<'info, Mint>,
    
    // Creator's token account holding the NFT
    #[account(
        mut,
        constraint = creator_token_account.mint == nft_mint.key() @ ErrorCode::InvalidTokenAccount,
        constraint = creator_token_account.owner == creator.key() @ ErrorCode::Unauthorized
    )]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    // PDA that acts as the escrow authority
    #[account(
        seeds = [b"escrow", campaign.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as the escrow authority
    pub escrow_authority: AccountInfo<'info>,
    
    // Token account owned by the escrow PDA to hold the NFT
    #[account(
        init,
        payer = creator,
        associated_token::mint = nft_mint,
        associated_token::authority = escrow_authority
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    // Required programs
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ClaimNftFromEscrow<'info> {
    // Campaign account
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    // The supporter funding record to update
    #[account(
        mut,
        seeds = [
            b"supporter-funding",
            campaign.key().as_ref(),
            supporter.key().as_ref(),
        ],
        bump,
        constraint = supporter_funding.campaign == campaign.key() @ ErrorCode::InvalidCampaign,
        constraint = supporter_funding.supporter == supporter.key() @ ErrorCode::Unauthorized
    )]
    pub supporter_funding: Account<'info, SupporterFunding>,
    
    // Supporter as signer
    #[account(mut)]
    pub supporter: Signer<'info>,
    
    // The NFT mint account
    #[account(
        constraint = nft_mint.key() == campaign.nft_mint @ ErrorCode::InvalidNftMint
    )]
    pub nft_mint: Account<'info, Mint>,
    
    // PDA that acts as the escrow authority
    #[account(
        seeds = [b"escrow", campaign.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as the escrow authority
    pub escrow_authority: AccountInfo<'info>,
    
    // Token account owned by the escrow PDA holding the NFT
    #[account(
        mut,
        constraint = escrow_token_account.mint == nft_mint.key() @ ErrorCode::InvalidTokenAccount,
        constraint = escrow_token_account.owner == escrow_authority.key() @ ErrorCode::InvalidTokenAccount
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    // Supporter's token account to receive the NFT
    #[account(
        init,
        payer = supporter,
        associated_token::mint = nft_mint,
        associated_token::authority = supporter
    )]
    pub supporter_token_account: Account<'info, TokenAccount>,
    
    // Required programs
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintEditionNft<'info> {
    // Campaign must be fully funded
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    
    // The supporter funding record to update
    #[account(
        mut,
        seeds = [
            b"supporter-funding",
            campaign.key().as_ref(),
            supporter_funding.supporter.as_ref(),
        ],
        bump,
        constraint = supporter_funding.campaign == campaign.key() @ ErrorCode::InvalidCampaign
    )]
    pub supporter_funding: Account<'info, SupporterFunding>,
    
    /// CHECK: The creator account (not required to sign)
    #[account(constraint = creator.key() == campaign.creator @ ErrorCode::InvalidCampaign)]
    pub creator: AccountInfo<'info>,
    
    // Signer for the transaction (must be the supporter who funded the campaign)
    #[account(constraint = authority.key() == supporter_funding.supporter @ ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
    
    /// CHECK: The master edition NFT mint, verified by constraint to match the campaign's NFT mint
    #[account(constraint = master_edition_mint.key() == campaign.nft_mint @ ErrorCode::InvalidCampaign)]
    pub master_edition_mint: AccountInfo<'info>,
    
    /// CHECK: The new edition mint account that will be created
    #[account(mut)]
    pub edition_mint: AccountInfo<'info>,
    
    /// CHECK: Mint authority for the edition mint
    pub mint_authority: Signer<'info>,
    
    /// CHECK: Recipient's token account for the edition NFT
    #[account(mut)]
    pub recipient_token_account: AccountInfo<'info>,
    
    // Required programs
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Campaign {
    pub creator: Pubkey,
    pub project_name: String,
    pub description: String,
    pub funding_goal_lamports: u64,
    pub raised_lamports: u64,
    pub supporters_count: u32,
    pub is_active: bool,
    pub is_funded: bool,
    pub created_at: i64,
    pub end_timestamp: i64,
    
    // NFT details
    pub nft_name: String,
    pub nft_symbol: String,
    pub nft_uri: String,
    pub nft_mint: Pubkey,
    pub nft_in_escrow: bool, // Flag to indicate whether NFT has been transferred to escrow
    
    // Edition NFT tracking
    pub max_editions: u64,        // Maximum number of editions that can be minted (5 for hackathon demo)
    pub editions_minted: u64,     // Number of editions already minted
}

#[account]
pub struct SupporterFunding {
    pub campaign: Pubkey,
    pub supporter: Pubkey,
    pub amount_lamports: u64,
    pub funded_at: i64,
    pub is_claimed: bool,
    pub nft_minted: bool,         // Whether an NFT has been minted for this supporter
    pub edition_number: u64,      // Which edition number was minted for this supporter
    pub edition_mint: Pubkey,     // Mint address of the edition NFT (zeroed if not minted)
}

impl Campaign {
    fn space(
        project_name: &str,
        description: &str,
        nft_name: &str,
        nft_symbol: &str,
        nft_uri: &str,
    ) -> usize {
        8 +  // discriminator
        32 + // creator pubkey
        4 + project_name.len() + // project_name string
        4 + description.len() + // description string
        8 + // funding_goal_lamports
        8 + // raised_lamports
        4 + // supporters_count
        1 + // is_active
        1 + // is_funded
        8 + // created_at
        8 + // end_timestamp
        4 + nft_name.len() + // nft_name string
        4 + nft_symbol.len() + // nft_symbol string
        4 + nft_uri.len() + // nft_uri string
        32 + // nft_mint pubkey
        1 + // nft_in_escrow
        8 +  // max_editions
        8    // editions_minted
    }
}

impl SupporterFunding {
    fn space() -> usize {
        8 +  // discriminator
        32 + // campaign pubkey
        32 + // supporter pubkey
        8 +  // amount_lamports
        8 +  // funded_at
        1 +  // is_claimed
        1 +  // nft_minted
        8 +  // edition_number
        32   // edition_mint pubkey
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Campaign is not active")]
    CampaignNotActive,
    
    #[msg("Campaign has already ended")]
    CampaignEnded,
    
    #[msg("Campaign is not fully funded")]
    CampaignNotFunded,
    
    #[msg("Campaign is already funded")]
    CampaignAlreadyFunded,
    
    #[msg("Campaign is still active")]
    CampaignStillActive,
    
    #[msg("Refund has already been claimed")]
    RefundAlreadyClaimed,
    
    #[msg("Funds not yet eligible for withdrawal")]
    NotEligibleForWithdrawal,
    
    #[msg("Unauthorized: only the creator can withdraw funds")]
    Unauthorized,
    
    #[msg("Invalid campaign")]
    InvalidCampaign,
    
    #[msg("Arithmetic error during calculation")]
    ArithmeticError,
    
    #[msg("Campaign is not past end date")]
    CampaignNotEnded,
    
    #[msg("Campaign is funded")]
    CampaignIsFunded,
    
    #[msg("Not authorized to mint edition NFT")]
    NotAuthorizedToMintNft,
    
    #[msg("NFT already minted for this supporter")]
    NftAlreadyMinted,
    
    #[msg("Maximum number of edition NFTs reached")]
    MaxEditionsReached,
    
    #[msg("NFT already in escrow")]
    NftAlreadyInEscrow,
    
    #[msg("NFT not in escrow yet")]
    NftNotInEscrow,
    
    #[msg("Invalid NFT mint address")]
    InvalidNftMint,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Amount would cause overflow")]
    AmountOverflow,
    
    #[msg("Count would cause overflow")]
    CountOverflow,
    
    #[msg("Insufficient funds for the operation")]
    InsufficientFunds,
}
