import { Link } from "wouter";
import React from "react";
import { brand } from "@workspace/brand";
import { AppSwitcher } from "@/components/AppSwitcher";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background font-sans">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt={brand.logoAlt} className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Lookup Service
            </Link>
            <Link href="/request" className="text-primary hover:text-primary/90 transition-colors">
              Request New Service
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <AppSwitcher />
      <footer className="border-t bg-card py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt={brand.logoAlt} className="h-12 w-auto object-contain" />
            <span>© {new Date().getFullYear()} {brand.copyrightHolder}. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/request" className="hover:text-foreground transition-colors">Request Service</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Check Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
