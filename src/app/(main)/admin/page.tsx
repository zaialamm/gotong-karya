"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { withdrawTreasuryFunds } from "@/lib/treasury-utils";
import { ExternalLink } from "lucide-react";

// The admin wallet address - replace with your actual admin address
const ADMIN_PUBKEY = "ZaikXX6zRGseZdyGnpdBaTkBdetDNgZcGEqzeZgAXtM";

export default function AdminPage() {
  const { toast } = useToast();
  const { isConnected, address, connect } = useWallet();
  const [amount, setAmount] = useState<string>("0.1");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);

  // Admin wallet check
  const isAdmin = address === ADMIN_PUBKEY;

  const handleWithdraw = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Only the platform admin can access this function.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const amountSol = parseFloat(amount);
      if (isNaN(amountSol) || amountSol <= 0) {
        throw new Error("Please enter a valid positive amount.");
      }

      const result = await withdrawTreasuryFunds(amountSol);
      
      if (result.success) {
        // Get the Solana Explorer URL based on the network (devnet in this case)
        const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;
        
        toast({
          title: "Withdrawal Successful",
          description: (
            <div className="flex flex-col space-y-2">
              <p>{result.message}</p>
              <a 
                href={explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-primary hover:underline"
              >
                View on Solana Explorer <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          ),
          variant: "default",
        });
        
        if (result.signature) {
          setLastTransaction(result.signature);
        }
      } else {
        toast({
          title: "Withdrawal Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Treasury Management</CardTitle>
            <CardDescription>Withdraw platform fees from treasury</CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Please connect your wallet to access admin functions.</p>
                <Button onClick={connect} className="w-full">
                  Connect Wallet
                </Button>
              </div>
            ) : !isAdmin ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-700">
                  This page is restricted to platform administrators only.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Amount to withdraw (SOL)
                  </label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount in SOL"
                  />
                </div>
                
                <Button
                  onClick={handleWithdraw}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Withdraw from Treasury"}
                </Button>
                
                {lastTransaction && (
                  <div className="mt-4 p-3 bg-gray-50 border rounded-md">
                    <p className="text-xs text-gray-500 mb-1">Transaction:</p>
                    <a
                      href={`https://explorer.solana.com/tx/${lastTransaction}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 flex items-center hover:underline break-all"
                    >
                      {lastTransaction}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
