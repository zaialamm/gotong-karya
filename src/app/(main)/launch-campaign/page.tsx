import { LaunchCampaignForm } from "@/components/launch-campaign/LaunchCampaignForm";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Wallet, Gift, CheckCircle2, PenLine, AlertTriangle } from "lucide-react";

export default function LaunchCampaignPage() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Bring Your Vision to Life
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/80 sm:mt-6">
          Ready to start your crowdfunding journey? Complete the form to launch your campaign.
        </p>
      </section>
      
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-2/3">
          <LaunchCampaignForm />
        </div>
        
        <div className="w-full lg:w-1/3 sticky top-4">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">1. Connect Wallet</h3>
                    <p className="text-sm text-muted-foreground">Connect your Phantom wallet to Solana devnet.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">2. Create Campaign</h3>
                    <p className="text-sm text-muted-foreground">Fill in project details and funding goal (IDR to SOL conversion is automatic).</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">3. Set NFT Rewards</h3>
                    <p className="text-sm text-muted-foreground">Define the NFT and list supporter benefits (one per line).</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <PenLine className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">4. Sign Transactions</h3>
                    <p className="text-sm text-muted-foreground">You'll need to approve 3 signatures:</p>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 mt-1 space-y-0.5">
                      <li>Create NFT</li>
                      <li>Initialize Campaign Account on Solana Blockchain</li>
                      <li>Transfer NFT to An Escrow Account owned by Smart Contract</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">5. Launch & Share</h3>
                    <p className="text-sm text-muted-foreground">Once confirmed, share your campaign with potential supporters.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Important Notes:</p>
                    <ul className="list-disc pl-4 mt-1 text-amber-700 space-y-1">
                      <li>Campaigns run on Solana devnet</li>
                      <li>2.5% platform fee on successful campaigns</li>
                      <li>SOL needed for transaction fees</li>
                      <li>Supporters receive NFT rewards</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
