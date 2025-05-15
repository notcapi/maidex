import * as React from "react";
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
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";

export function MainNav() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Obtener iniciales para el avatar
  const getInitials = () => {
    if (!session?.user?.email) return "?";
    const email = session.user.email;
    // Tomar la primera letra del email
    return email.charAt(0).toUpperCase();
  };
  
  // Enlaces de navegación
  const navItems = [
    { href: "/", label: "Inicio" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/chat", label: "Chat" },
  ];

  // Manejar el cierre de sesión
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <div className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl text-foreground">Maidex</span>
        </div>
        
        {/* Navegación para escritorio */}
        <div className="hidden md:flex md:flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      active={router.pathname === item.href}
                    >
                      {item.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Usuario y sesión para escritorio */}
        <div className="hidden md:flex items-center ml-auto space-x-4">
          <ModeToggle />
          
          {session ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-foreground">
                {session.user?.email}
              </span>
              <Avatar className="h-9 w-9">
                <AvatarImage src={session.user?.image || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                onClick={handleSignOut}
                size="sm"
                className="text-foreground border-border hover:bg-muted"
              >
                Cerrar Sesión
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
        <div className="md:hidden flex ml-auto space-x-2">
          <ModeToggle />
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 text-foreground border-border hover:bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-border">
              <div className="grid gap-6 py-6">
                <div className="flex flex-col space-y-2">
                  {session && (
                    <div className="flex flex-col items-center mb-6 space-y-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={session.user?.image || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-center text-foreground">
                        {session.user?.email}
                      </span>
                    </div>
                  )}
                  
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link 
                        href={item.href}
                        className={`px-4 py-2 rounded-md text-foreground ${
                          router.pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
                {session ? (
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="w-full text-foreground border-border hover:bg-muted"
                  >
                    Cerrar Sesión
                  </Button>
                ) : (
                  <Button asChild variant="default" className="w-full">
                    <Link href="/api/auth/signin">
                      Iniciar Sesión
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
} 