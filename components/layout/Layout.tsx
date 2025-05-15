import React, { ReactNode } from 'react';
import { MainNav } from './MainNav';
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="py-6 px-4 max-w-7xl mx-auto">
        {children}
      </main>
      <Toaster />
    </div>
  );
} 