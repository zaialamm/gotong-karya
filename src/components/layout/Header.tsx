
"use client";

import Link from "next/link";
import { WalletConnectButton } from "./WalletConnectButton";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"; 
import { cn } from "@/lib/utils";
import Image from "next/image";
import { IPFS_LOGO_URL } from "@/lib/constants";

const navLinks = [
  { href: "/campaigns", label: "Campaigns" },
  { href: "/launch-campaign", label: "Launch Campaign" },
  { href: "/support-creators", label: "Support Creators" },
  { href: "/marketplace", label: "Marketplace" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) { 
      setIsMobileMenuOpen(false); 
    }
  }, [pathname, hasMounted]); 


  const NavLinksComponent = ({ isMobile }: { isMobile: boolean }) => (
    <nav className={cn(
      "flex items-center gap-4 md:gap-6",
      isMobile ? "flex-col space-y-4 py-8" : "flex-row"
    )}>
      {navLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
          isMobile ? (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "text-lg font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-foreground/80"
                )}
              >
                {link.label}
              </Link>
            </SheetClose>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive ? "text-primary" : "text-foreground/80"
              )}
            >
              {link.label}
            </Link>
          )
        );
      })}
    </nav>
  );

  const LogoComponent = () => (
     <span className="text-2xl font-bold text-primary tracking-tight">
      GotongKarya
    </span>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/campaigns" className="flex items-center gap-2 mr-4">
          <LogoComponent />
        </Link>
        
        <div className="flex-1 items-center justify-center hidden md:flex">
          {/* Removed "Decentralized Funding, Creators and Fans Win" text */}
        </div>

        <div className="hidden md:flex items-center gap-6">
          <NavLinksComponent isMobile={false} />
          <WalletConnectButton />
        </div>

        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-background p-6">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                   <Link href="/campaigns" className="flex items-center gap-2">
                     <LogoComponent />
                   </Link>
                  <SheetClose asChild>
                     <Button variant="ghost" size="icon">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
                     </Button>
                  </SheetClose>
                </div>
                <NavLinksComponent isMobile={true} />
                <div className="mt-auto pt-8">
                  <WalletConnectButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
