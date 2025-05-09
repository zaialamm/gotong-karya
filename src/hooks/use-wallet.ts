
"use client";

import { useState, useCallback, useEffect } from 'react';
import { connectPhantomWallet } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  loading: boolean;
}

const WALLET_ADDRESS_KEY = 'gotongkarya_wallet_address';

export const useWallet = (): WalletState => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start true to check storage
  const { toast } = useToast();

  useEffect(() => {
    // Check localStorage for a persisted address on mount (client-side only)
    const storedAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
    if (storedAddress) {
      setAddress(storedAddress);
      console.log(`Restored wallet session for address: ${storedAddress}`);
    }
    setLoading(false); // Done checking storage
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const connection = await connectPhantomWallet();
      if (connection && connection.address) {
        setAddress(connection.address);
        localStorage.setItem(WALLET_ADDRESS_KEY, connection.address); // Persist address
        toast({
          title: "Wallet Connected",
          description: `Connected to Phantom: ${connection.address.slice(0,6)}...${connection.address.slice(-4)}`,
          variant: "default",
        });
      } else {
        // toast({
        //   title: "Connection Failed",
        //   description: "Could not connect to Phantom wallet.",
        //   variant: "destructive",
        // });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setAddress(null);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to Phantom wallet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(WALLET_ADDRESS_KEY); // Clear persisted address
    console.log("Wallet disconnected.");
    toast({
      title: "Wallet Disconnected",
      description: "You have successfully disconnected your wallet.",
      variant: "default",
    });
  }, [toast]);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
    loading,
  };
};
