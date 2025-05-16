import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  NavigationMenu, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList
} from '@/components/ui/navigation-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Menu, X } from 'lucide-react';

const Navigation = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Inicio', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Chat', href: '/chat' }
  ];

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="border-b bg-background dark:bg-slate-950 border-border dark:border-slate-800 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-foreground dark:text-slate-100 text-xl font-bold">Maidex</span>
            </div>
            <div className="hidden md:block ml-6">
              <NavigationMenu>
                <NavigationMenuList className="flex space-x-2">
                  {navigationItems.map((item) => (
                    <NavigationMenuItem key={item.name}>
                      <Link href={item.href} passHref legacyBehavior>
                        <NavigationMenuLink
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            router.pathname === item.href
                              ? 'bg-primary/10 text-primary dark:text-slate-200 dark:bg-slate-800'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          {item.name}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-3">
              {session ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8 bg-primary/10 text-primary dark:bg-slate-800">
                    <AvatarImage src={session.user?.image || ''} />
                    <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground dark:text-slate-300">{session.user?.name}</span>
                  <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground dark:text-slate-300"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => router.push('/api/auth/signin')}
                  variant="outline"
                  size="sm"
                >
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background dark:bg-slate-950 py-6">
                <div className="flex flex-col space-y-2 mt-4">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.name}
                      variant={router.pathname === item.href ? "secondary" : "ghost"}
                      className={`justify-start ${router.pathname === item.href 
                        ? 'bg-primary/10 text-primary dark:bg-slate-800' 
                        : 'text-muted-foreground'}`}
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                  <Separator className="my-4" />
                  {session ? (
                    <>
                      <div className="flex items-center space-x-3 px-3 py-2">
                        <Avatar className="h-8 w-8 bg-primary/10 text-primary dark:bg-slate-800">
                          <AvatarImage src={session.user?.image || ''} />
                          <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground dark:text-slate-300">{session.user?.name}</span>
                      </div>
                      <Button
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                        variant="ghost"
                        className="justify-start text-muted-foreground dark:text-slate-300"
                      >
                        Cerrar Sesión
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        router.push('/api/auth/signin');
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="justify-start"
                    >
                      Iniciar Sesión
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 