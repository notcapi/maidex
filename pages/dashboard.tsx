import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { DataCharts } from '@/components/ui/charts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Calendar, Shield, ArrowUpRight } from 'lucide-react';

// Definir tipos para los datos
interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  // Otros campos que pueda tener
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  // Otros campos que pueda tener
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.accessToken) {
      // Cargar datos de correos y eventos
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Cargar correos recientes
      const emailsResponse = await fetch('/api/emails/recent', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Cargar eventos próximos
      const eventsResponse = await fetch('/api/calendar/upcoming', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        setEmails(emailsData);
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para mostrarla más legiblemente
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative h-16 w-16">
            <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-t-primary border-opacity-20 animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground dark:text-slate-400">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex flex-col space-y-1.5">
          <h1 className="text-3xl font-bold text-foreground dark:text-slate-100">Panel de Estadísticas</h1>
          <p className="text-muted-foreground dark:text-slate-400">Visualiza tus correos y eventos recientes</p>
          <Separator className="my-4" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="overflow-hidden border border-border dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-card dark:bg-slate-900">
            <CardTitle className="text-sm font-medium">Total Correos</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
          </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-foreground dark:text-slate-100">{emails.length}</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">
              Correos recibidos recientemente
                <span className="inline-flex items-center ml-2 text-primary">
                  <ArrowUpRight className="h-3 w-3" />
                </span>
            </p>
          </CardContent>
        </Card>
        
          <Card className="overflow-hidden border border-border dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-card dark:bg-slate-900">
            <CardTitle className="text-sm font-medium">Eventos Próximos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
          </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-foreground dark:text-slate-100">{events.length}</div>
              <p className="text-xs text-muted-foreground dark:text-slate-400">
              Eventos programados para hoy
            </p>
          </CardContent>
        </Card>
        
          <Card className="overflow-hidden border border-border dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-card dark:bg-slate-900">
            <CardTitle className="text-sm font-medium">Estado de Conexión</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
          </CardHeader>
            <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20">
                Conectado
              </Badge>
                <span className="text-sm text-muted-foreground dark:text-slate-400">
                {session?.user?.email}
              </span>
            </div>
            <Progress value={100} className="mt-3" />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="emails" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="emails">Correos Electrónicos</TabsTrigger>
          <TabsTrigger value="events">Eventos del Calendario</TabsTrigger>
        </TabsList>
        
          <TabsContent value="emails">
            <Card className="border border-border dark:border-slate-700">
              <CardHeader className="bg-card dark:bg-slate-900 border-b border-border dark:border-slate-700">
                <CardTitle className="text-lg flex items-center">
                  <Mail className="mr-2 h-5 w-5 text-primary dark:text-primary/90" />
                  Análisis de Correos
                </CardTitle>
                <CardDescription className="text-muted-foreground dark:text-slate-400">
                  Datos y estadísticas de tus correos recientes
                </CardDescription>
            </CardHeader>
              <CardContent className="p-6">
              {emails.length > 0 ? (
                <DataCharts emails={emails} type="emails" />
              ) : (
                  <p className="text-muted-foreground dark:text-slate-400 text-center py-8">
                    No hay datos de correos para mostrar
                  </p>
              )}
            </CardContent>
          </Card>
          
          {emails.length > 0 && (
              <Card className="mt-6 border border-border dark:border-slate-700">
                <CardHeader className="bg-card dark:bg-slate-900 border-b border-border dark:border-slate-700">
                  <CardTitle className="text-lg">Correos Recientes</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-slate-400">
                    Los últimos {Math.min(emails.length, 5)} correos recibidos
                  </CardDescription>
              </CardHeader>
                <CardContent className="p-0">
                <Table>
                  <TableHeader>
                      <TableRow className="hover:bg-muted/50 dark:hover:bg-slate-800/50">
                        <TableHead className="w-[200px]">Remitente</TableHead>
                      <TableHead>Asunto</TableHead>
                        <TableHead className="text-right w-[140px]">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.slice(0, 5).map((email) => (
                        <TableRow key={email.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/50">
                          <TableCell className="font-medium">{email.from}</TableCell>
                          <TableCell className="text-muted-foreground dark:text-slate-400">{email.subject}</TableCell>
                          <TableCell className="text-muted-foreground dark:text-slate-400 text-right">{formatDate(email.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
          <TabsContent value="events">
            <Card className="border border-border dark:border-slate-700">
              <CardHeader className="bg-card dark:bg-slate-900 border-b border-border dark:border-slate-700">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary dark:text-primary/90" />
                  Análisis de Eventos
                </CardTitle>
                <CardDescription className="text-muted-foreground dark:text-slate-400">
                  Datos y estadísticas de tus próximos eventos
                </CardDescription>
            </CardHeader>
              <CardContent className="p-6">
              {events.length > 0 ? (
                <DataCharts events={events} type="events" />
              ) : (
                  <p className="text-muted-foreground dark:text-slate-400 text-center py-8">
                    No hay eventos programados para mostrar
                  </p>
              )}
            </CardContent>
          </Card>
          
          {events.length > 0 && (
              <Card className="mt-6 border border-border dark:border-slate-700">
                <CardHeader className="bg-card dark:bg-slate-900 border-b border-border dark:border-slate-700">
                  <CardTitle className="text-lg">Eventos Próximos</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-slate-400">
                    Tus próximos {Math.min(events.length, 5)} eventos programados
                  </CardDescription>
              </CardHeader>
                <CardContent className="p-0">
                <Table>
                  <TableHeader>
                      <TableRow className="hover:bg-muted/50 dark:hover:bg-slate-800/50">
                      <TableHead>Título</TableHead>
                        <TableHead className="text-right w-[220px]">Horario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(0, 5).map((event) => (
                        <TableRow key={event.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/50">
                          <TableCell className="font-medium">{event.summary}</TableCell>
                          <TableCell className="text-muted-foreground dark:text-slate-400 text-right">
                            {formatDate(event.start.dateTime)} - {formatDate(event.end.dateTime)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 