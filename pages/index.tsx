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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background dark:bg-slate-900">
      <div className="max-w-[480px] w-full mx-auto">
        {session ? (
          <Card className="border shadow-lg overflow-hidden bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 dark:bg-slate-700 text-primary dark:text-slate-200">
                  <PersonIcon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-foreground">¡Hola, {session.user?.name?.split(' ')[0] || 'usuario'}!</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground dark:text-slate-400">
                    {session.user?.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-4">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm mb-3">
                  Tu asistente inteligente para Gmail y Calendar, potenciado con Claude 3.5 Sonnet.
                  Gestiona tus correos y agenda de forma más eficiente.
                </p>
                <p className="text-muted-foreground dark:text-slate-300 text-sm mb-6">
                  <strong className="text-foreground dark:text-slate-200">Características principales:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground dark:text-slate-400">
                    <li>Resumen inteligente de correos electrónicos</li>
                    <li>Gestión de eventos y recordatorios</li>
                    <li>Asistente conversacional con contexto de tus datos</li>
                    <li>Integración segura con tus cuentas de Google</li>
                  </ul>
                </p>
                <Separator className="my-4 bg-border" />
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/chat')}
                  className="w-full py-6 text-base font-medium bg-black hover:bg-gray-800 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-black"
                  size="lg"
                >
                  Ir al Chat
                </Button>
                
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="w-full py-5 text-base border-black/20 dark:border-slate-600 text-foreground hover:bg-accent dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  Ver Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-lg bg-card text-card-foreground">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 dark:bg-slate-700 text-primary dark:text-slate-200 mb-3">
                <PersonIcon className="w-7 h-7" />
              </div>
              <CardTitle className="text-2xl text-foreground">Bienvenido a Maidex</CardTitle>
              <CardDescription className="text-base mt-2 text-muted-foreground dark:text-slate-400">
                Tu asistente inteligente para Gmail y Calendar
              </CardDescription>
            </CardHeader>
            <Separator className="bg-border" />
            <CardContent className="pt-6 pb-6">
              <div className="mb-6">
                <p className="text-muted-foreground dark:text-slate-300 text-sm text-center">
                  Maidex te ayuda a gestionar tus correos y eventos con inteligencia artificial.
                  Organiza tu día con mayor eficiencia y productividad.
                </p>
              </div>
              <Button
                onClick={() => signIn('google')}
                className="w-full py-6 text-base font-medium bg-black hover:bg-gray-800 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-black"
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