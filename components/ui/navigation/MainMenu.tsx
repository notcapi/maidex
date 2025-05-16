import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  HomeIcon, 
  LayoutDashboardIcon, 
  MessageSquareIcon, 
  CalendarIcon, 
  FileIcon, 
  LogOutIcon,
  MenuIcon,
  User2Icon
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

export function MainMenu({ className }: { className?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  // Obtener iniciales para el avatar
  const getInitials = () => {
    if (!session?.user?.email) return "?";
    const email = session.user.email;
    return email.charAt(0).toUpperCase();
  };
  
  // Verificar si una ruta está activa
  const isActive = (href: string) => {
    if (href === "/") {
      return router.pathname === "/";
    }
    return router.pathname.startsWith(href);
  };
  
  // Enlaces de navegación
  const navItems: NavItem[] = [
    { 
      href: "/", 
      label: "Inicio", 
      icon: <HomeIcon className="h-4 w-4 mr-2" />, 
      active: isActive("/")
    },
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboardIcon className="h-4 w-4 mr-2" />, 
      active: isActive("/dashboard")
    },
    { 
      href: "/chat", 
      label: "Chat", 
      icon: <MessageSquareIcon className="h-4 w-4 mr-2" />, 
      active: isActive("/chat")
    },
    { 
      href: "/calendar", 
      label: "Calendario", 
      icon: <CalendarIcon className="h-4 w-4 mr-2" />, 
      active: isActive("/calendar")
    },
    { 
      href: "/drive", 
      label: "Archivos", 
      icon: <FileIcon className="h-4 w-4 mr-2" />, 
      active: isActive("/drive")
    }
  ];

  // Manejar el cierre de sesión
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    setIsOpen(false);
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur",
      className
    )}>
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-primary">Maidex</span>
            <span className="sr-only">Inicio</span>
          </Link>
        </div>
        
        {/* Navegación para escritorio */}
        <div className="hidden md:flex md:flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink 
                      className={cn(
                        navigationMenuTriggerStyle(),
                        item.active ? "text-foreground bg-accent font-medium" : "text-muted-foreground"
                      )}
                    >
                      <span className="flex items-center">
                        {item.icon}
                        {item.label}
                      </span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Usuario y sesión para escritorio */}
        <div className="hidden md:flex items-center ml-auto space-x-3">
          <ModeToggle />
          
          {session ? (
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                className="text-muted-foreground text-sm font-normal"
                asChild
              >
                <Link href="/perfil" className="flex items-center gap-2">
                  <User2Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{session.user?.email}</span>
                </Link>
              </Button>
              
              <Avatar className="h-8 w-8 border border-border/50">
                <AvatarImage src={session.user?.image || ""} alt={session.user?.email || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
              </Avatar>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </div>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/api/auth/signin">
                Iniciar Sesión
              </Link>
            </Button>
          )}
        </div>

        {/* Menú móvil */}
        <div className="md:hidden flex items-center ml-auto space-x-3">
          <ModeToggle />
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetHeader className="p-5 text-left border-b">
                <SheetTitle>Maidex</SheetTitle>
              </SheetHeader>
              
              {session && (
                <div className="flex items-center p-5 space-x-3 border-b">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.email || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{session.user?.name || session.user?.email}</p>
                    {session.user?.email && session.user?.name && (
                      <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="py-3 px-1">
                <nav className="flex flex-col space-y-1">
                  {navItems.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <Link 
                        href={item.href}
                        className={cn(
                          "flex items-center py-2 px-4 text-sm rounded-md",
                          item.active 
                            ? "bg-accent text-foreground font-medium" 
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </div>
              
              <SheetFooter className="absolute bottom-0 left-0 right-0 p-5 border-t">
                {session ? (
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                ) : (
                  <Button asChild variant="default" className="w-full">
                    <Link href="/api/auth/signin">
                      Iniciar Sesión
                    </Link>
                  </Button>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 