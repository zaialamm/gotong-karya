"use client";

import Image from "next/image";
import type { TokenInfo } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SOL_CURRENCY_SYMBOL, IDR_CURRENCY_SYMBOL } from "@/lib/constants";
import { TrendingUp, Users, Tag } from "lucide-react";
import { useSolToIdrRate } from "@/hooks/use-sol-to-idr-rate";
import { Skeleton } from "@/components/ui/skeleton";

interface TokenCardProps {
  token: TokenInfo;
  onTrade: (tokenTicker: string, tradeType: "buy" | "sell") => void;
}

export function TokenCard({ token, onTrade }: TokenCardProps) {
  const { effectiveRate, isLoading: isLoadingRate } = useSolToIdrRate();
  const priceIDR = token.currentPriceSOL ? token.currentPriceSOL * effectiveRate : 0;

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          {token.logoUrl && (
            <Image 
              src={token.logoUrl} 
              alt={`${token.name} logo`} 
              width={40} 
              height={40} 
              className="rounded-full border border-primary/50"
              data-ai-hint="token logo"
            />
          )}
          <div>
            <CardTitle className="text-xl font-semibold text-primary">{token.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground flex items-center">
              <Tag className="mr-1.5 h-4 w-4" /> {token.ticker}
            </CardDescription>
          </div>
        </div>
        {token.creator && (
          <p className="text-xs text-muted-foreground flex items-center">
            <Users className="mr-1.5 h-3 w-3" /> Project by: {token.creator.name}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {token.currentPriceSOL && (
          <div className="space-y-1">
            <p className="text-lg font-medium text-foreground">
              {token.currentPriceSOL.toFixed(5)} {SOL_CURRENCY_SYMBOL}
              <span className="text-xs text-muted-foreground ml-1">/ token</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {isLoadingRate ? <Skeleton className="h-3 w-20 inline-block" /> : `(≈ ${priceIDR.toLocaleString()} ${IDR_CURRENCY_SYMBOL})`}
            </p>
          </div>
        )}
        {!token.currentPriceSOL && (
          <p className="text-sm text-muted-foreground">Price not available.</p>
        )}
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onTrade(token.ticker, "buy")} className="w-full border-green-500/50 text-green-500 hover:bg-green-500/10">
          Buy
        </Button>
        <Button variant="outline" onClick={() => onTrade(token.ticker, "sell")} className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10">
          Sell
        </Button>
      </CardFooter>
    </Card>
  );
}