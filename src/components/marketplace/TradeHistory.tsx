
"use client";

import type { Trade } from "@/types";
import { TRADE_HISTORY_DATA, SOL_CURRENCY_SYMBOL } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown } from "lucide-react";

interface TradeHistoryProps {
  trades?: Trade[]; // Optional prop to pass trades, defaults to mock data
  maxHeight?: string; // e.g., "400px"
}

export function TradeHistory({ trades = TRADE_HISTORY_DATA, maxHeight = "300px" }: TradeHistoryProps) {
  const sortedTrades = [...trades].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card className="shadow-md bg-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-primary">
            <History className="mr-2 h-5 w-5"/>
            Trade History
        </CardTitle>
        <CardDescription>Recent buy and sell orders on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedTrades.length > 0 ? (
          <ScrollArea style={{maxHeight: maxHeight}}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Price ({SOL_CURRENCY_SYMBOL})</TableHead>
                  <TableHead className="text-right">Total ({SOL_CURRENCY_SYMBOL})</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <Badge variant={trade.type === "buy" ? "default" : "destructive"} className={trade.type === 'buy' ? 'bg-green-600/80 hover:bg-green-600' : 'bg-red-600/80 hover:bg-red-600'}>
                        {trade.type === "buy" ? <TrendingUp className="mr-1 h-3 w-3"/> : <TrendingDown className="mr-1 h-3 w-3"/>}
                        {trade.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{trade.tokenTicker}</TableCell>
                    <TableCell className="text-right">{trade.amountTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{trade.pricePerTokenSOL.toFixed(5)}</TableCell>
                    <TableCell className="text-right">{(trade.totalPaidSOL ?? trade.netAmountSOL ?? trade.totalAmountSOL).toFixed(5)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(trade.timestamp).toLocaleDateString()} {new Date(trade.timestamp).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-center py-4">No trades recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
