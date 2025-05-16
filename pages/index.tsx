import React from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PersonIcon } from "@radix-ui/react-icons";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-[480px] w-full mx-auto">
        {session ? (
          <Card className="border shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                {/* Avatar o icono de IA */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/10 text-black">
                  <PersonIcon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">¡Hola, {session.user?.name?.split(' ')[0] || 'usuario'}!</CardTitle>
                  <CardDescription className="text-sm opacity-80">
                    {session.user?.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-4">
              <div>
                <p className="text-muted-foreground text-sm mb-3">
                  Tu asistente inteligente para Gmail y Calendar, potenciado con Claude 3.5 Sonnet.
                  Gestiona tus correos y agenda de forma más eficiente.
                </p>
                <p className="text-muted-foreground text-sm mb-6">
                  <strong>Características principales:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Resumen inteligente de correos electrónicos</li>
                    <li>Gestión de eventos y recordatorios</li>
                    <li>Asistente conversacional con contexto de tus datos</li>
                    <li>Integración segura con tus cuentas de Google</li>
                  </ul>
                </p>
                <Separator className="my-4" />
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/chat')}
                  className="w-full py-6 text-base font-medium bg-black hover:bg-black/90 text-white"
                  size="lg"
                >
                  Ir al Chat
                </Button>
                
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="w-full py-5 text-base border-black text-black hover:bg-black/10"
                >
                  Ver Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-black/10 text-black mb-3">
                <PersonIcon className="w-7 h-7" />
              </div>
              <CardTitle className="text-2xl">Bienvenido a Maidex</CardTitle>
              <CardDescription className="text-base mt-2">
                Tu asistente inteligente para Gmail y Calendar
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 pb-6">
              <div className="mb-6">
                <p className="text-muted-foreground text-sm text-center">
                  Maidex te ayuda a gestionar tus correos y eventos con inteligencia artificial.
                  Organiza tu día con mayor eficiencia y productividad.
                </p>
              </div>
              <Button
                onClick={() => signIn('google')}
                className="w-full py-6 text-base font-medium bg-black hover:bg-black/90 text-white"
                size="lg"
              >
                Iniciar con Google
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 