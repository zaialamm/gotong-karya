import type { Campaign, Creator } from '@/types';

export const FALLBACK_SOL_TO_IDR_RATE = 800000; 
export const CAMPAIGN_DURATION_MINUTES = 10; // Default campaign duration in minutes (matches smart contract)
export const ESCROW_PROGRAM_ID = 'GKtPETiRdkiVbpFEq8r7HjQpsWQr6PV7YgwJwJGrdgPp'; // GK Escrow program ID

export const CREATORS_DATA: Creator[] = [
  { id: "creator1", name: "Jumbo Studio", walletAddress: "JumboWallet...", avatarUrl: "https://picsum.photos/seed/jumbo_avatar/40/40" },
  { id: "creator2", name: "Gamelan Groove Band", walletAddress: "GamelanWallet...", avatarUrl: "https://picsum.photos/seed/gamelan_avatar/40/40" },
  { id: "creator3", name: "Jakarta Street Art Collective", walletAddress: "JakartaArtWallet...", avatarUrl: "https://picsum.photos/seed/jakarta_avatar/40/40" },
];

// Add nftSymbol property to all campaigns to match our updated interface
export const CAMPAIGNS_DATA: Campaign[] = [
  {
    id: "campaign1",
    projectName: "Create Jumbo Animation Film",
    description: "Support the creation of 'Jumbo', an animation film that has captured hearts across Indonesia! This campaign aims to fund the final stages of production, including advanced animation, original score composition, and wider distribution. Be a part of Indonesian animation history!",
    creator: CREATORS_DATA[0],
    fundingGoalSOL: 50,
    raisedSOL: 30,
    status: "Running",
    nftName: "Jumbo Animation Supporter NFT",
    nftSymbol: "JUMBO", // Added NFT symbol
    nftDescription: "Official supporter NFT for the Jumbo Animation Film project. Holders receive exclusive access to film screenings and behind-the-scenes content.",
    nftMintAddress: "JumboNFT123456",
    nftAttributes: [
      { trait_type: "tier", value: "Founder" },
      { trait_type: "edition", value: "Limited" }
    ],
    imageUrl: "https://th.bing.com/th/id/OIP.GyRtthUeXFeKRzFLoRbWEQHaE8?rs=1&pid=ImgDetMain", // Updated image URL
    endDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now (matches smart contract duration)
    benefits: [
      "Receive exclusive Jumbo Supporter NFT.",
      "Early access to film screenings.",
      "Your name in the film credits.",
      "Digital art book."
    ],
  },
  {
    id: "campaign2",
    projectName: "Bali Harmony Music Album",
    description: "Support the creation of 'Bali Harmony,' an album blending traditional Gamelan music with contemporary sounds. Your contribution will fund studio time, musicians, and mastering.",
    creator: CREATORS_DATA[1],
    fundingGoalSOL: 30,
    raisedSOL: 18,
    status: "Running",
    nftName: "Bali Harmony Festival Supporter NFT",
    nftSymbol: "BALI", // Added NFT symbol
    nftDescription: "Official supporter NFT for the Bali Harmony Festival. NFT holders receive VIP access to all festival events and exclusive festival merchandise.",
    nftMintAddress: "BaliNFT789012",
    nftAttributes: [
      { trait_type: "tier", value: "VIP" },
      { trait_type: "access", value: "All Events" }
    ],
    imageUrl: "https://picsum.photos/seed/bali_music/600/400",
    endDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now (matches smart contract duration)
    benefits: [
      "Exclusive Gamelan Preservation Supporter NFT.",
      "Access to exclusive recordings and performances.",
      "Behind-the-scenes content.",
      "Invitation to a virtual listening party."
    ],
  },
  {
    id: "campaign3",
    projectName: "Nusantara Mural Art Series",
    description: "Help us beautify Jakarta's streets with a series of murals inspired by Nusantara's rich cultural heritage. Funds will cover materials, artist stipends, and community workshops.",
    creator: CREATORS_DATA[2],
    fundingGoalSOL: 40,
    raisedSOL: 10,
    status: "Running",
    nftName: "Jakarta Mural Project Supporter NFT",
    nftSymbol: "MURAL", // Added NFT symbol
    nftDescription: "Official supporter NFT for the Jakarta Street Art Project. NFT holders get their name featured in the final mural and invitations to exclusive art events.",
    nftMintAddress: "MuralNFT345678",
    nftAttributes: [
      { trait_type: "tier", value: "Patron" },
      { trait_type: "recognition", value: "Name in Mural" }
    ],
    imageUrl: "https://picsum.photos/seed/mural_art/600/400",
    endDate: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now (matches smart contract duration)
    benefits: [
      "Official Jakarta Mural Project Supporter NFT.",
      "High-resolution photos of the murals.",
      "Acknowledgement on the project website.",
      "Limited edition sticker pack."
    ],
  },
  {
    id: "campaign4",
    projectName: "Archipelago Board Game",
    description: "A strategy board game exploring Indonesian folklore. This campaign has successfully completed.",
    creator: CREATORS_DATA[0],
    fundingGoalSOL: 25,
    raisedSOL: 28,
    status: "Successful",
    nftName: "Gamelan Music Preservation NFT",
    nftSymbol: "ARCH", // Added NFT symbol
    nftDescription: "Official supporter NFT for the Gamelan Music Preservation Project. NFT holders receive access to exclusive performances and digital archives.",
    nftMintAddress: "GamelanNFT901234",
    nftAttributes: [
      { trait_type: "tier", value: "Preserver" },
      { trait_type: "access", value: "Archives" }
    ],
    imageUrl: "https://picsum.photos/seed/arch_game/600/400",
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago (this is a past campaign)
    benefits: [
      "Received limited edition Archipelago Game NFT.",
      "Digital copy of the rulebook.",
      "Exclusive game insights."
    ],
  },
];

// NFT price reference for each project (SOL amount to support)
export const NFT_PRICES = {
  "JUMBO": 0.5,   // 0.5 SOL to support Jumbo Animation Film
  "BALI": 0.3,    // 0.3 SOL to support Bali Harmony Music
  "MURAL": 0.2,   // 0.2 SOL to support Nusantara Mural Art Series
  "ARCH": 0.25,   // 0.25 SOL to support Archipelago Board Game
};

// Sample of supporter NFTs minted
export const SUPPORTER_NFTS = [
  { 
    campaignId: "campaign1", 
    supporterAddress: "Addr123...", 
    nftMintAddress: "NFTAddr111...", 
    amountSOL: 0.5,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Completed"
  },
  { 
    campaignId: "campaign2", 
    supporterAddress: "Addr456...", 
    nftMintAddress: "NFTAddr222...", 
    amountSOL: 0.3,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Completed"
  },
  { 
    campaignId: "campaign3", 
    supporterAddress: "Addr789...", 
    nftMintAddress: "NFTAddr333...", 
    amountSOL: 0.2,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Pending"
  },
];

export const SOL_CURRENCY_SYMBOL = "SOL";
export const IDR_CURRENCY_SYMBOL = "IDR";


