import Link from 'next/link';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Sparkles, Shield, Coins, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles size={14} />
              <span>Running on Solana</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center max-w-4xl leading-tight mb-6">
              Community-powered funding for creators on Solana
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mb-10">
              Gotong Karya connects creators with supporters through blockchain-powered crowdfunding with unique NFT rewards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
              <Button 
                asChild
                size="lg" 
                className="font-medium px-8"
              >
                <Link href="/support-creators">Support Creators</Link>
              </Button>
              
              <Button 
                asChild
                variant="outline" 
                size="lg" 
                className="font-medium px-8"
              >
                <Link href="/launch-campaign">
                  <span>Start a Campaign</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Gotong Karya Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Our platform makes crowdfunding transparent, secure, and rewarding through blockchain technology.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <span className="text-lg font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create a Campaign</h3>
              <p className="text-muted-foreground">
                Launch your project with a funding goal, description, and create an exclusive NFT as a reward for supporters.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <span className="text-lg font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Receive Support</h3>
              <p className="text-muted-foreground">
                Supporters browse campaigns and fund projects they believe in using SOL cryptocurrency on Solana.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border transition-all hover:shadow-md hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <span className="text-lg font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Reward Success</h3>
              <p className="text-muted-foreground">
                Upon successful funding, supporters receive unique NFTs as rewards while creators get their funds to bring projects to life.
              </p>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Gotong Karya</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Our platform combines the best of blockchain technology with seamless user experience.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-start">
              <div className="p-3 rounded-lg bg-primary/10 text-primary mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Transparent</h3>
              <p className="text-muted-foreground">
                Built on Solana blockchain, ensuring transparent transactions and secure fund management through smart contracts.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="flex flex-col items-start">
              <div className="p-3 rounded-lg bg-primary/10 text-primary mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast & Low Cost</h3>
              <p className="text-muted-foreground">
                Leverage Solana's high-speed, low-fee infrastructure for efficient crowdfunding without excessive gas costs.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="flex flex-col items-start">
              <div className="p-3 rounded-lg bg-primary/10 text-primary mb-4">
                <Coins size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unique NFT Rewards</h3>
              <p className="text-muted-foreground">
                Supporters receive exclusive NFTs that prove their contribution and may increase in value over time.
              </p>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto bg-primary rounded-2xl overflow-hidden shadow-xl">
            <div className="px-8 py-12 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to bring your ideas to life?</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
                Join our community of creators and supporters to help fund the next generation of innovative projects.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild
                  variant="secondary" 
                  size="lg" 
                  className="font-medium"
                >
                  <Link href="/campaigns">Explore Campaigns</Link>
                </Button>
                
                <Button 
                  asChild
                  variant="outline" 
                  size="lg" 
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-medium"
                >
                  <Link href="/launch-campaign">Create Campaign</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
