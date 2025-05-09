"use client";

import type { ReactNode } from 'react';
import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { connectPhantomWallet, checkPhantomConnection } from '@/lib/web3';
import { useToast } from '@/hooks/use-toast';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  loading: boolean;
}

const WALLET_ADDRESS_KEY = 'gotongkarya_wallet_address';

const WalletContext = createContext<WalletState | undefined>(undefined);

export const useWallet = (): WalletState => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Initialize loading to false
  const { toast } = useToast();

  const [phantomProvider, setPhantomProvider] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.phantom?.solana) {
      setPhantomProvider(window.phantom.solana);
    }
  }, []);

  useEffect(() => {
    const attemptAutoConnect = async () => {
      if (typeof window === 'undefined') {
        // setLoading(false); // Already false by default
        return;
      }
      setLoading(true); // Set to true when client-side check begins
      const storedAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
      if (storedAddress) {
        try {
          const connection = await checkPhantomConnection();
          if (connection && connection.address === storedAddress) {
            setAddress(storedAddress);
            console.log(`Restored and verified wallet session for address: ${storedAddress}`);
          } else {
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
      setLoading(false); // Set to false after check completes
    };

    attemptAutoConnect();
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setLoading(true);
    try {
      const connection = await connectPhantomWallet();
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
      setAddress(null);
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
    if (typeof window === 'undefined') return;
    setLoading(true);
    try {
      if (phantomProvider?.isPhantom && phantomProvider.publicKey) {
        // Check if disconnect is a function before calling
        if (typeof phantomProvider.disconnect === 'function') {
            await phantomProvider.disconnect();
            console.log("Phantom wallet disconnect method called.");
        } else {
            console.warn("Phantom provider does not have a disconnect method.");
        }
      }
    } catch (error) {
      console.error("Error during Phantom disconnect:", error);
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
  }, [toast, phantomProvider]);

  useEffect(() => {
    if (!phantomProvider?.on) {
      return;
    }

    const handleAccountChanged = (publicKey: { toString: () => string } | null) => {
      if (typeof window === 'undefined') return;
      setLoading(true); // Indicate change is processing
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
        // This case might occur if the user disconnects all accounts from the dapp in Phantom settings
        setAddress(null);
        localStorage.removeItem(WALLET_ADDRESS_KEY);
        console.log('Phantom account disconnected via wallet UI (accountChanged gave null).');
        toast({
          title: "Wallet Disconnected",
          description: "Disconnected from Phantom Wallet via wallet interface.",
          variant: "default",
        });
      }
      setLoading(false);
    };

    // Phantom may emit 'disconnect' when the user disconnects the dapp
    // or if the connection is lost for other reasons.
    const handleDisconnectEvent = () => {
      if (typeof window === 'undefined') return;
      setLoading(true);
      setAddress(null);
      localStorage.removeItem(WALLET_ADDRESS_KEY);
      console.log('Phantom "disconnect" event received.');
      toast({
          title: "Wallet Disconnected",
          description: "Your wallet session has ended.",
          variant: "default",
      });
      setLoading(false);
    };
    
    phantomProvider.on('accountChanged', handleAccountChanged);
    // The 'disconnect' event might be specific to EIP-1193 providers, 
    // Phantom's documentation should be checked for the correct event if this doesn't work as expected.
    // Some wallets use 'accountsChanged' with an empty array, or 'disconnect'.
    phantomProvider.on('disconnect', handleDisconnectEvent);


    return () => {
      phantomProvider.removeListener?.('accountChanged', handleAccountChanged);
      phantomProvider.removeListener?.('disconnect', handleDisconnectEvent);
    };
  }, [toast, phantomProvider]);

  const value = {
    address,
    isConnected: !!address,
    connect,
    disconnect,
    loading,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
