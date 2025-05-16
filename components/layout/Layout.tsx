import React, { ReactNode } from 'react';
import { MainNav } from './MainNav';
import { Toaster } from "@/components/ui/toaster";
import Navigation from "@/components/Navigation";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border dark:border-slate-800 py-4 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs text-muted-foreground dark:text-slate-500">
          &copy; {new Date().getFullYear()} Maidex - Asistente Personal Inteligente
        </div>
      </footer>
      <Toaster />
    </div>
  );
} 