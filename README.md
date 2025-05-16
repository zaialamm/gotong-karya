# Gotong Karya: Decentralized Crowdfunding Platform

Gotong Karya is a blockchain-based crowdfunding platform built on Solana that connects creators with supporters through a transparent, secure, and rewarding experience.

## 🚀 Overview

Gotong Karya leverages blockchain technology to create a trustless crowdfunding ecosystem where:
- Creators can launch campaigns to fund their projects
- Supporters can back projects they believe in
- Successful contributions are rewarded with exclusive NFTs
- All transactions are secured and verified on the Solana blockchain

## ✨ Key Features

### For Creators
- **Campaign Creation**: Launch funding campaigns with project details, funding goals, and timeline
- **NFT Rewards**: Offer supporters exclusive NFT rewards for their contributions
- **Fund Withdrawal**: Access raised funds with transparent fee structure (2.5% platform fee)
- **Campaign Analytics**: Track campaign progress and supporter engagement

### For Supporters
- **Campaign Discovery**: Explore innovative projects across various categories
- **Secure Contributions**: Fund campaigns directly with Solana (SOL)
- **NFT Rewards**: Receive unique NFTs as proof of support and potential future value
- **Refund Protection**: Automatic refunds for campaigns that don't meet funding goals

## 💻 Technical Stack

### Frontend
- Next.js 15.2.3
- React 18.3.1
- Tailwind CSS
- Radix UI components
- React Hook Form with Zod validation

### Blockchain Integration
- Solana blockchain
- Anchor framework
- Web3.js and @project-serum/anchor
- Wallet adapter for Phantom integration

### Storage & Services
- Firebase for off-chain data
- IDR/SOL conversion rates

## 🔧 Smart Contract Architecture

The platform is powered by the `gkescrow` Solana program with key functions:
- `initialize_campaign`: Create new funding campaigns with NFT rewards
- `fund_campaign`: Process supporter contributions
- `withdraw_funds`: Allow creators to withdraw funds (with 2.5% platform fee)
- `claim_refund`: Enable refunds for failed campaigns

## 🛠️ Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gotong-karya.git
   cd gotong-karya
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:9002

## 🌐 Deployment

The application is configured for Solana devnet for development and testing purposes.



