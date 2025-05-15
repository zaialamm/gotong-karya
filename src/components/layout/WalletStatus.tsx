"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { Award, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export const WalletStatus: FC = () => {
  const { isConnected, connect, disconnect, address, loading } = useWallet();

  // Shorten wallet address for display
  const shortenAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <>
      {!isConnected ? (
        <Button
          variant="outline"
          size="sm"
          onClick={connect}
          disabled={loading}
          className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {loading ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {shortenAddress(address)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Wallet</DropdownMenuLabel>
            <DropdownMenuItem className="flex justify-between">
              <span>Address:</span>
              <span className="font-mono text-xs">{shortenAddress(address)}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/my-nfts" className="flex items-center cursor-pointer">
                <Award className="mr-2 h-4 w-4" />
                <span>My NFT Collection</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={disconnect}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};
