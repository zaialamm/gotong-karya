"use client";
import { useState, useEffect } from "react";
import { TradeForm } from "@/components/marketplace/TradeForm";
import { TradeHistory } from "@/components/marketplace/TradeHistory";
import { UserTokenBalances } from "@/components/marketplace/UserTokenBalances";
import { TokenCard } from "@/components/marketplace/TokenCard";
import { TOKENS_DATA, TRADE_HISTORY_DATA, USER_BALANCES_DATA, IDR_CURRENCY_SYMBOL, SOL_CURRENCY_SYMBOL, MARKETPLACE_FEE_PERCENTAGE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { RefreshCw, LineChart, Wallet } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useWallet } from "@/hooks/use-wallet";
import { WalletConnectButton } from "@/components/layout/WalletConnectButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MarketplacePage() {
  const [tradeHistoryKey, setTradeHistoryKey] = useState(Date.now());
  const [balancesKey, setBalancesKey] = useState(Date.now());
  const [selectedTokenForTrade, setSelectedTokenForTrade] = useState<string | undefined>(undefined);
  const [tradeTypeForForm, setTradeTypeForForm] = useState<"buy" | "sell">("buy");

  const { isConnected } = useWallet();

  const handleTradeSuccess = () => {
    setTradeHistoryKey(Date.now());
    setBalancesKey(Date.now());
  };
  
  const handleTokenCardTradeAction = (tokenTicker: string, tradeType: "buy" | "sell") => {
    setSelectedTokenForTrade(tokenTicker);
    setTradeTypeForForm(tradeType);
    const tradeFormElement = document.getElementById("trade-form-section");
    if (tradeFormElement) {
        tradeFormElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const ConnectWalletPrompt = () => (
    <Card className="mt-6 text-center py-8">
      <CardHeader className="items-center">
        <Wallet className="h-12 w-12 text-primary mb-4" />
        <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
        <CardDescription className="text-md text-muted-foreground">
          Please connect your wallet to view your token balances and trade history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WalletConnectButton />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Token Marketplace
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/80 sm:mt-6">
          Buy and sell project tokens. Unlock unique benefits and support creators.
        </p>
      </section>

      <Tabs defaultValue="trade" className="w-full">
        <TabsList className={cn(
            "grid w-full mb-6",
            isConnected ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"
          )}>
          <TabsTrigger value="trade">Trade Tokens</TabsTrigger>
          <TabsTrigger value="tokens">Browse Tokens</TabsTrigger>
          {isConnected && (
            <>
              <TabsTrigger value="balances">Your Balances</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="trade" id="trade-form-section">
          <TradeForm 
            key={`tradeform-${selectedTokenForTrade}-${tradeTypeForForm}`} 
            initialTokenTicker={selectedTokenForTrade} 
            initialTradeType={tradeTypeForForm}
            onTradeSuccess={handleTradeSuccess} 
          />
        </TabsContent>

        <TabsContent value="tokens">
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {TOKENS_DATA.map((token) => (
                    <TokenCard key={token.id} token={token} onTrade={handleTokenCardTradeAction} />
                ))}
            </div>
        </TabsContent>

        <TabsContent value="balances">
           {isConnected ? <UserTokenBalances key={balancesKey} /> : <ConnectWalletPrompt />}
        </TabsContent>
        
        <TabsContent value="history">
            {isConnected ? <TradeHistory key={tradeHistoryKey} /> : <ConnectWalletPrompt />}
        </TabsContent>
      </Tabs>

      <div className="text-center mt-8">
        <Button variant="outline" onClick={handleTradeSuccess} className="border-primary text-primary hover:bg-primary/10">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data (Mock)
        </Button>
      </div>
       <div className="mt-12 p-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center">
          <LineChart className="mr-2 h-6 w-6" /> Marketplace Overview
        </h2>
        <p className="text-foreground/80 mb-2">
          GotongKarya's marketplace facilitates the exchange of tokens generated from successfully funded campaigns. 
          When you support a project, you often receive tokens representing a stake, utility, or access related to that project.
        </p>
        <ul className="list-disc list-inside space-y-1 text-foreground/70 text-sm">
          <li><span className="font-semibold text-accent">Buy Tokens:</span> Acquire tokens from projects you believe in or want to access.</li>
          <li><span className="font-semibold text-accent">Sell Tokens:</span> Realize gains or liquidate your holdings.</li>
          <li><span className="font-semibold text-accent">Transaction Fee:</span> A {(MARKETPLACE_FEE_PERCENTAGE * 100).toFixed(1)}% fee applies to trades, supporting the platform's sustainability.</li>
          <li><span className="font-semibold text-accent">Price Discovery:</span> Prices are illustrative and in a real scenario would be determined by market supply and demand.</li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          All transactions are currently mocked. In a live environment, these would be on-chain Solana transactions.
        </p>
      </div>
    </div>
  );
}