import React from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  
  return (
    <div className="container mx-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">Asistente Personal</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Tu asistente inteligente para Gmail y Calendar con Claude 3.5 Sonnet
          </p>
        </div>
        
        {session ? (
          <div className="space-y-6">
            <Card className="border shadow-md">
              <CardHeader>
                <CardTitle>¡Bienvenido {session.user?.name || 'de nuevo'}!</CardTitle>
                <CardDescription>Estás conectado como {session.user?.email}</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => router.push('/chat')}
                    className="w-full"
                    size="lg"
                  >
                    Ir al Chat
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    variant="secondary"
                    className="w-full"
                    size="lg"
                  >
                    Ver Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-muted/40">
              <CardHeader>
                <CardTitle className="text-lg">¿Tienes problemas con la autenticación?</CardTitle>
                <CardDescription>
                  Accede a la página de diagnóstico para solucionar problemas
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <Link href="/auth-status">
                    Verificar Estado de Autenticación
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card className="border shadow-md max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>
                Conecta tu cuenta de Google para empezar a usar el asistente
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <Button
                onClick={() => signIn('google')}
                className="w-full"
                size="lg"
              >
                Iniciar con Google
              </Button>
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col text-center pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Si tienes problemas para iniciar sesión:
              </p>
              <Button
                variant="outline"
                asChild
                size="sm"
              >
                <Link href="/auth-status">
                  Diagnosticar Problemas de Autenticación
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
} 