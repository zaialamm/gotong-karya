
"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { LogIn, LogOut, WalletCards } from "lucide-react"; // Using WalletCards instead of just Wallet for more visual appeal

export function WalletConnectButton() {
  const { address, isConnected, connect, disconnect, loading } = useWallet();

  if (loading && !isConnected) {
    return (
      <Button variant="outline" disabled className="bg-primary/10 hover:bg-primary/20 text-primary-foreground/80 border-primary/30">
        <WalletCards className="mr-2 h-4 w-4 animate-pulse" />
        Checking Wallet...
      </Button>
    );
  }


  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground hidden md:inline">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button variant="outline" onClick={disconnect} className="bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground border-destructive/30">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} disabled={loading} variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
      <LogIn className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
