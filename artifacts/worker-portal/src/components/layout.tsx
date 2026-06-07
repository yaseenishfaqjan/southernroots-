import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetSubcontractor } from "@workspace/api-client-react";
import { LogOut, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  backHref?: string;
}

export function Layout({ children, title, showBack, backHref }: LayoutProps) {
  const { workerId, logout } = useAuth();
  
  const { data: sub } = useGetSubcontractor(workerId!, {
    query: { enabled: !!workerId, queryKey: ["subcontractor", workerId] }
  });

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/30">
      <header className="sticky top-0 z-10 w-full bg-primary text-primary-foreground shadow-md">
        <div className="flex h-16 items-center px-4">
          {showBack && backHref ? (
            <Link href={backHref} className="mr-3 p-2 -ml-2 rounded-full active:bg-black/10">
              <ChevronLeft className="h-6 w-6" />
            </Link>
          ) : (
            <div className="w-10"></div> /* spacer to balance logout button */
          )}
          
          <h1 className="flex-1 text-center text-lg font-bold truncate">
            {title}
          </h1>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground hover:bg-black/10 hover:text-primary-foreground active:bg-black/20 rounded-full"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        {sub && (
          <div className="bg-primary/95 px-4 py-2 text-xs font-medium text-primary-foreground/90 border-t border-black/10 flex justify-between">
            <span>{sub.name}</span>
            <span>ID: {sub.id}</span>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 pb-12 w-full max-w-md mx-auto">
        {children}
      </main>
    </div>
  );
}
