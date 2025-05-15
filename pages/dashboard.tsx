import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DataCharts from '../components/DataCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">Panel de Estadísticas</h1>
        <p className="text-muted-foreground">Visualiza tus correos y eventos recientes</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Correos</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
              <polyline points="15,9 10,14 8.5,12.5" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emails.length}</div>
            <p className="text-xs text-muted-foreground">
              Correos recibidos recientemente
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Próximos</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Eventos programados para hoy
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado de Conexión</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Conectado
              </Badge>
              <span className="text-sm text-muted-foreground">
                {session?.user?.email}
              </span>
            </div>
            <Progress value={100} className="mt-3" />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="emails" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="emails">Correos Electrónicos</TabsTrigger>
          <TabsTrigger value="events">Eventos del Calendario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="emails" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Correos</CardTitle>
            </CardHeader>
            <CardContent>
              {emails.length > 0 ? (
                <DataCharts emails={emails} type="emails" />
              ) : (
                <p className="text-muted-foreground">No hay datos de correos para mostrar</p>
              )}
            </CardContent>
          </Card>
          
          {emails.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Correos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Remitente</TableHead>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.slice(0, 5).map((email) => (
                      <TableRow key={email.id}>
                        <TableCell>{email.from}</TableCell>
                        <TableCell className="text-muted-foreground">{email.subject}</TableCell>
                        <TableCell className="text-muted-foreground">{email.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <DataCharts events={events} type="events" />
              ) : (
                <p className="text-muted-foreground">No hay datos de eventos para mostrar</p>
              )}
            </CardContent>
          </Card>
          
          {events.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Eventos Próximos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Fin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(0, 5).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.summary}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(event.start.dateTime).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(event.end.dateTime).toLocaleString()}
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
  );
} 