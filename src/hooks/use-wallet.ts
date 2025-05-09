
"use client";

import { useState, useCallback, useEffect } from 'react';
import { connectPhantomWallet, checkPhantomConnection } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>; // Changed to Promise
  loading: boolean;
}

const WALLET_ADDRESS_KEY = 'gotongkarya_wallet_address';

export const useWallet = (): WalletState => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check for persisted address or silent reconnection on mount
  useEffect(() => {
    const attemptAutoConnect = async () => {
      setLoading(true);
      const storedAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
      if (storedAddress) {
        // Try to validate or re-establish connection silently
        try {
          const connection = await checkPhantomConnection();
          if (connection && connection.address === storedAddress) {
            setAddress(storedAddress);
            console.log(`Restored and verified wallet session for address: ${storedAddress}`);
          } else {
            // Stored address might be stale or Phantom disconnected
            localStorage.removeItem(WALLET_ADDRESS_KEY);
            setAddress(null);
             console.log(`Cleared stale wallet session for address: ${storedAddress}`);
          }
        } catch (error) {
          console.warn("Failed to auto-connect on mount:", error);
          localStorage.removeItem(WALLET_ADDRESS_KEY);
          setAddress(null);
        }
      }
      setLoading(false);
    };

    attemptAutoConnect();
  }, []);


  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const connection = await connectPhantomWallet(); // This will now throw specific errors
      if (connection && connection.address) {
        setAddress(connection.address);
        localStorage.setItem(WALLET_ADDRESS_KEY, connection.address);
        toast({
          title: "Wallet Connected",
          description: `Connected: ${connection.address.slice(0, 6)}...${connection.address.slice(-4)}`,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setAddress(null); // Ensure address is cleared on error
      localStorage.removeItem(WALLET_ADDRESS_KEY);

      let description = "An unknown error occurred. Please try again.";
      if (error.message === "Phantom wallet not found. Please install the extension.") {
        description = "Phantom wallet not found. Please install the extension and refresh the page.";
      } else if (error.message.includes("User rejected the request") || error.message.includes("User declined the request")) {
        description = "Connection request rejected. Please approve the connection in Phantom Wallet.";
      } else if (error.message) {
        description = error.message;
      }

      toast({
        title: "Connection Error",
        description: description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    setLoading(true);
    try {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom && provider.publicKey) { // Check if connected before trying to disconnect
        await provider.disconnect();
        console.log("Phantom wallet disconnect method called.");
      }
    } catch (error) {
      console.error("Error during Phantom disconnect:", error);
      // Toast an error if disconnect fails, though user might not expect it.
      // toast({
      //   title: "Disconnect Error",
      //   description: "Could not disconnect from Phantom properly, but local state cleared.",
      //   variant: "destructive",
      // });
    } finally {
      setAddress(null);
      localStorage.removeItem(WALLET_ADDRESS_KEY);
      console.log("Wallet disconnected locally.");
      toast({
        title: "Wallet Disconnected",
        description: "You have successfully disconnected your wallet.",
        variant: "default",
      });
      setLoading(false);
    }
  }, [toast]);

  // Listen for account changes and disconnections from Phantom UI
  useEffect(() => {
    const provider = window.phantom?.solana;
    if (provider?.on) {
      const handleAccountChanged = (publicKey: { toString: () => string } | null) => {
        if (publicKey) {
          const newAddress = publicKey.toString();
          setAddress(newAddress);
          localStorage.setItem(WALLET_ADDRESS_KEY, newAddress);
          console.log('Phantom account changed to:', newAddress);
          toast({
            title: "Account Switched",
            description: `Connected to account: ${newAddress.slice(0,6)}...${newAddress.slice(-4)}`,
            variant: "default",
          });
        } else {
          // This typically means the user disconnected the dapp from the Phantom UI
          setAddress(null);
          localStorage.removeItem(WALLET_ADDRESS_KEY);
          console.log('Phantom account disconnected via wallet UI (accountChanged gave null).');
          toast({
            title: "Wallet Disconnected",
            description: "Disconnected from Phantom Wallet via wallet interface.",
            variant: "default",
          });
        }
      };

      const handleDisconnectEvent = () => {
        setAddress(null);
        localStorage.removeItem(WALLET_ADDRESS_KEY);
        console.log('Phantom "disconnect" event received.');
        toast({
            title: "Wallet Disconnected",
            description: "Your wallet session has ended.",
            variant: "default",
        });
      };
      
      provider.on('accountChanged', handleAccountChanged);
      provider.on('disconnect', handleDisconnectEvent);

      return () => {
        provider.removeListener?.('accountChanged', handleAccountChanged);
        provider.removeListener?.('disconnect', handleDisconnectEvent);
      };
    }
  }, [toast]);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
    loading,
  };
};
