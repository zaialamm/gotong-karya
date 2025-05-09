
import type { Campaign, Creator, TokenInfo, UserTokenBalance, Trade } from '@/types';

export const SOL_TO_IDR_RATE = 800000;
export const SOL_TO_USD_RATE = 200;
export const MARKETPLACE_FEE_PERCENTAGE = 0.007; // 0.7%

export const IPFS_LOGO_URL = "https://picsum.photos/seed/gotongkarya_logo/120/40"; // Placeholder
export const IPFS_BATIK_BADGE_URL_BASE = "ipfs://QmBatikBadgeMockURL"; // Placeholder

export const CREATORS_DATA: Creator[] = [
  { id: "creator1", name: "Jumbo Studio", walletAddress: "JumboWallet...", avatarUrl: "https://picsum.photos/seed/jumbo_avatar/40/40" },
  { id: "creator2", name: "Gamelan Groove Band", walletAddress: "GamelanWallet...", avatarUrl: "https://picsum.photos/seed/gamelan_avatar/40/40" },
  { id: "creator3", name: "Jakarta Street Art Collective", walletAddress: "JakartaArtWallet...", avatarUrl: "https://picsum.photos/seed/jakarta_avatar/40/40" },
];

export const CAMPAIGNS_DATA: Campaign[] = [
  {
    id: "campaign1",
    projectName: "Create Jumbo Animation Film",
    description: "Help us bring Jumbo, a heartwarming tale of a little elephant, to life through a stunning animated film. Funds will be used for animation, voice acting, and music production.",
    creator: CREATORS_DATA[0],
    fundingGoalSOL: 50,
    raisedSOL: 30,
    status: "Running",
    tokenTicker: "JUMBO",
    tokenName: "Jumbo Animation Film Token",
    imageUrl: "https://picsum.photos/seed/jumbo_film/600/400",
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Approx 30 days from now
  },
  {
    id: "campaign2",
    projectName: "Bali Harmony Music Album",
    description: "Support the creation of 'Bali Harmony,' an album blending traditional Gamelan music with contemporary sounds. Your contribution will fund studio time, musicians, and mastering.",
    creator: CREATORS_DATA[1],
    fundingGoalSOL: 30,
    raisedSOL: 18,
    status: "Running",
    tokenTicker: "BALI",
    tokenName: "Bali Harmony Music Token",
    imageUrl: "https://picsum.photos/seed/bali_music/600/400",
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Approx 45 days from now
  },
  {
    id: "campaign3",
    projectName: "Nusantara Mural Art Series",
    description: "Help us beautify Jakarta's streets with a series of murals inspired by Nusantara's rich cultural heritage. Funds will cover materials, artist stipends, and community workshops.",
    creator: CREATORS_DATA[2],
    fundingGoalSOL: 40,
    raisedSOL: 10,
    status: "Running",
    tokenTicker: "MURAL",
    tokenName: "Nusantara Mural Art Token",
    imageUrl: "https://picsum.photos/seed/mural_art/600/400",
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Approx 60 days from now
  },
  {
    id: "campaign4",
    projectName: "Archipelago Board Game",
    description: "A strategy board game exploring Indonesian folklore. This campaign has successfully completed.",
    creator: CREATORS_DATA[0],
    fundingGoalSOL: 25,
    raisedSOL: 28,
    status: "Successful",
    tokenTicker: "ARCH",
    tokenName: "Archipelago Game Token",
    imageUrl: "https://picsum.photos/seed/arch_game/600/400",
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
  },
];

export const TOKENS_DATA: TokenInfo[] = [
  { id: "token1", name: "Jumbo Animation Film Token", ticker: "JUMBO", logoUrl: "https://picsum.photos/seed/jumbo_token/32/32", currentPriceSOL: 0.006, creator: CREATORS_DATA[0] },
  { id: "token2", name: "Bali Harmony Music Token", ticker: "BALI", logoUrl: "https://picsum.photos/seed/bali_token/32/32", currentPriceSOL: 0.005, creator: CREATORS_DATA[1] },
  { id: "token3", name: "Nusantara Mural Art Token", ticker: "MURAL", logoUrl: "https://picsum.photos/seed/mural_token/32/32", currentPriceSOL: 0.006, creator: CREATORS_DATA[2] }, // Price for buy is 0.03 for 5 tokens, so 0.006 per token
  { id: "token4", name: "Archipelago Game Token", ticker: "ARCH", logoUrl: "https://picsum.photos/seed/arch_token/32/32", currentPriceSOL: 0.007, creator: CREATORS_DATA[0] },
];

export const USER_BALANCES_DATA: UserTokenBalance[] = [
  { tokenId: "token1", tokenTicker: "JUMBO", amount: 150 },
  { tokenId: "token2", tokenTicker: "BALI", amount: 200 },
  { tokenId: "token3", tokenTicker: "MURAL", amount: 50 },
];

export const TRADE_HISTORY_DATA: Trade[] = [
  { id: "trade1", type: "sell", tokenTicker: "JUMBO", amountTokens: 10, pricePerTokenSOL: 0.006, totalAmountSOL: 0.06, feeSOL: 0.00042, netAmountSOL: 0.05958, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), userAddress: "UserWallet1..." },
  { id: "trade2", type: "sell", tokenTicker: "BALI", amountTokens: 10, pricePerTokenSOL: 0.005, totalAmountSOL: 0.05, feeSOL: 0.00035, netAmountSOL: 0.04965, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), userAddress: "UserWallet2..." },
  { id: "trade3", type: "buy", tokenTicker: "MURAL", amountTokens: 5, pricePerTokenSOL: 0.006, totalAmountSOL: 0.03, feeSOL: 0.00021, totalPaidSOL: 0.03021, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), userAddress: "UserWallet3..." },
];

export const SOL_CURRENCY_SYMBOL = "SOL";
export const USDC_CURRENCY_SYMBOL = "USDC";
export const USDT_CURRENCY_SYMBOL = "USDT";
export const IDR_CURRENCY_SYMBOL = "IDR";
