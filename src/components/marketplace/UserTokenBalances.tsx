"use client";

import type { UserTokenBalance, TokenInfo } from "@/types";
import { USER_BALANCES_DATA, TOKENS_DATA, SOL_CURRENCY_SYMBOL, IDR_CURRENCY_SYMBOL } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WalletCards, Package } from "lucide-react";
import Image from "next/image";
import { useSolToIdrRate } from "@/hooks/use-sol-to-idr-rate";
import { Skeleton } from "@/components/ui/skeleton";


interface UserTokenBalancesProps {
  balances?: UserTokenBalance[]; // Optional prop
  tokens?: TokenInfo[]; // Optional prop
  maxHeight?: string;
}

export function UserTokenBalances({ 
    balances = USER_BALANCES_DATA, 
    tokens = TOKENS_DATA, 
    maxHeight = "300px" 
}: UserTokenBalancesProps) {
  const { effectiveRate, isLoading: isLoadingRate } = useSolToIdrRate();

  const enrichedBalances = balances.map(balance => {
    const tokenInfo = tokens.find(t => t.ticker === balance.tokenTicker);
    const valueSOL = tokenInfo?.currentPriceSOL ? balance.amount * tokenInfo.currentPriceSOL : 0;
    const valueIDR = valueSOL * effectiveRate;
    return {
      ...balance,
      tokenName: tokenInfo?.name || balance.tokenTicker,
      logoUrl: tokenInfo?.logoUrl,
      valueSOL,
      valueIDR
    };
  }).sort((a,b) => b.valueSOL - a.valueSOL); // Sort by value

  return (
    <Card className="shadow-md bg-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-primary">
            <WalletCards className="mr-2 h-5 w-5"/>
            Your Token Balances
        </CardTitle>
        <CardDescription>Overview of your token holdings and their current value.</CardDescription>
      </CardHeader>
      <CardContent>
        {enrichedBalances.length > 0 ? (
          <ScrollArea style={{maxHeight: maxHeight}}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Value ({SOL_CURRENCY_SYMBOL})</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Value ({IDR_CURRENCY_SYMBOL})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedBalances.map((balance) => (
                  <TableRow key={balance.tokenTicker}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {balance.logoUrl ? (
                           <Image src={balance.logoUrl} alt={balance.tokenName} width={24} height={24} className="rounded-full" data-ai-hint="token logo"/>
                        ) : (
                           <Package className="h-6 w-6 text-muted-foreground"/>
                        )}
                        <span>{balance.tokenName} ({balance.tokenTicker})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{balance.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{balance.valueSOL.toFixed(4)}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {isLoadingRate && balance.valueSOL > 0 ? <Skeleton className="h-4 w-20 inline-block" /> : balance.valueIDR.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-center py-4">You currently hold no tokens.</p>
        )}
      </CardContent>
    </Card>
  );
}