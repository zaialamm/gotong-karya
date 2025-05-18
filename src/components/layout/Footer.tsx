
export function Footer() {
  return (
    <footer className="py-6 md:py-0 border-t border-border/40">
      <div className="w-full flex flex-col items-center justify-center gap-4 md:h-20 md:flex-row px-4 sm:px-6 lg:px-8">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} GotongKarya. Decentralized Crowdfunding Platform for Creators.
        </p>
      </div>
    </footer>
  );
}
