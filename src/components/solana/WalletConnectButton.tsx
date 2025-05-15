"use client";

import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export const WalletConnectButton: FC = () => {
  const { wallet, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnectClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  // Shorten wallet address for display
  const shortenAddress = (address: string, chars = 4): string => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  return (
    <Button 
      onClick={handleConnectClick}
      variant={connected ? "outline" : "default"}
      className="flex items-center gap-2"
      disabled={connecting}
    >
      <Wallet className="h-4 w-4" />
      {connecting ? (
        "Connecting..."
      ) : connected ? (
        <span>
          {wallet?.adapter.publicKey ? shortenAddress(wallet.adapter.publicKey.toString()) : "Connected"}
        </span>
      ) : (
        "Connect Wallet"
      )}
    </Button>
  );
};
