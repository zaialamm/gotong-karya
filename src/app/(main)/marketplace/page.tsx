"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, LineChart, ShoppingCart, ArrowRightLeft, Gift } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          NFT Marketplace
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/80 sm:mt-6">
          Coming Soon: Trade Edition NFTs from successful campaigns
        </p>
      </section>

      {/* You can replace the div below with an actual NFT image when available */}
      <div className="w-full flex justify-center my-12">
        <div className="bg-primary/5 rounded-xl p-8 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">🖼️</div>
          <h3 className="text-xl font-medium text-primary">Edition NFT Trading</h3>
          <p className="text-muted-foreground mt-2">
            Buy and sell edition NFTs from successfully funded campaigns
          </p>
        </div>
      </div>

      <Card className="max-w-3xl mx-auto bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <span>Upcoming NFT Marketplace Features</span>
          </CardTitle>
          <CardDescription>
            Our NFT marketplace will allow you to buy and sell Edition NFTs from funded campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-background/80 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium">Buy & Sell NFTs</h3>
                <p className="text-sm text-muted-foreground">Trade Edition NFTs from successful campaigns with other community members</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-background/80 rounded-lg">
              <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium">Access Benefits</h3>
                <p className="text-sm text-muted-foreground">Collect NFTs to unlock special perks and access to creator content</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-background/80 rounded-lg">
              <Wallet className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium">Wallet Integration</h3>
                <p className="text-sm text-muted-foreground">Securely connect your Solana wallet to manage your NFT collection</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-background/80 rounded-lg">
              <LineChart className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium">Market Analytics</h3>
                <p className="text-sm text-muted-foreground">Track market trends and the value of your NFT portfolio</p>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground italic">
              We're working hard to bring this feature to you soon!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}