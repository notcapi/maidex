import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BarChart4, PieChart, CalendarIcon, Table2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google: any;
    charts: {
      emailsLoaded: boolean;
      eventsLoaded: boolean;
    };
  }
}

type Email = {
  id: string;
  subject: string;
  from: string;
  date: string;
};

type Event = {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

interface DataChartsProps {
  emails?: Email[];
  events?: Event[];
  type: 'emails' | 'events';
  className?: string;
  onRefresh?: () => void;
}

const DataCharts: React.FC<DataChartsProps> = ({ 
  emails, 
  events, 
  type, 
  className,
  onRefresh
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [chartError, setChartError] = useState<string | null>(null);
  const [isGoogleAPILoaded, setIsGoogleAPILoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('chart');

  // Detectar tema actual para aplicar en los gráficos
  const isDarkMode = theme === 'dark' || resolvedTheme === 'dark';
  
  // Colores para gráficos adaptados a tokens de diseño
  const chartColors = isDarkMode 
    ? ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']
    : ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  useEffect(() => {
    // Inicializar el objeto de control
    if (typeof window !== 'undefined') {
      if (!window.charts) {
        window.charts = {
          emailsLoaded: false,
          eventsLoaded: false
        };
      }

      // Cargar la API de Google Charts
      if (!window.google) {
        setIsLoading(true);
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.async = true;
        script.onload = () => {
          window.google.charts.load('current', { 'packages': ['corechart', 'timeline', 'table'] });
          window.google.charts.setOnLoadCallback(() => {
            window.charts[type === 'emails' ? 'emailsLoaded' : 'eventsLoaded'] = true;
            setIsGoogleAPILoaded(true);
            setIsLoading(false);
            drawVisualization();
          });
        };
        script.onerror = () => {
          setChartError('No se pudo cargar la librería de gráficos');
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else if (window.google && window.google.charts) {
        // La API ya está cargada
        setIsGoogleAPILoaded(true);
        window.charts[type === 'emails' ? 'emailsLoaded' : 'eventsLoaded'] = true;
        setIsLoading(false);
        drawVisualization();
      }
    }
  }, []); // Solo cargar la API una vez

  // Efecto para redibujar el gráfico cuando cambien los datos o el tema
  useEffect(() => {
    if (isGoogleAPILoaded) {
      drawVisualization();
    }
  }, [emails, events, type, theme, isGoogleAPILoaded, resolvedTheme, activeTab]);

  // Inyectar estilos CSS para gráficos de Google en modo oscuro
  useEffect(() => {
    if (isDarkMode) {
      const style = document.createElement('style');
      style.id = 'google-charts-dark-mode';
      style.textContent = `
        /* Estilos para textos en gráficos Google Charts en modo oscuro */
        .google-visualization-tooltip {
          background-color: hsl(var(--popover)) !important;
          color: hsl(var(--popover-foreground)) !important;
          border-color: hsl(var(--border)) !important;
          border-radius: var(--radius) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          padding: 8px !important;
        }
        .google-visualization-tooltip-item-list {
          color: hsl(var(--popover-foreground)) !important;
        }
        .google-visualization-tooltip-item-list li span:first-child {
          color: hsl(var(--primary)) !important;
        }
        .google-visualization-tooltip-item-list li span:last-child {
          color: hsl(var(--popover-foreground)) !important;
        }
        .google-visualization-table-tr-head th, 
        .google-visualization-table-tr-head td {
          background-color: hsl(var(--muted)) !important;
          color: hsl(var(--muted-foreground)) !important;
          font-weight: 600 !important;
          border-color: hsl(var(--border)) !important;
        }
        .google-visualization-table-tr-odd td, 
        .google-visualization-table-tr-even td {
          background-color: hsl(var(--card)) !important;
          color: hsl(var(--card-foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }
        text.google-visualization-tooltip-item {
          fill: hsl(var(--popover-foreground)) !important;
        }
      `;
      
      if (!document.getElementById('google-charts-dark-mode')) {
        document.head.appendChild(style);
      }
      
      return () => {
        if (!isDarkMode && document.getElementById('google-charts-dark-mode')) {
          document.getElementById('google-charts-dark-mode')?.remove();
        }
      };
    }
  }, [isDarkMode]);

  // Función central para dibujar visualizaciones según el tab activo
  const drawVisualization = () => {
    if (activeTab === 'chart') {
      if (type === 'emails' && emails && emails.length > 0) {
        drawEmailCharts();
      } else if (type === 'events' && events && events.length > 0) {
        drawEventCharts();
      }
    } else if (activeTab === 'table') {
      if (type === 'emails' && emails && emails.length > 0) {
        drawEmailTable();
      } else if (type === 'events' && events && events.length > 0) {
        drawEventTable();
      }
    }
  };

  const drawEmailCharts = () => {
    if (!emails || !chartRef.current || emails.length === 0) {
      setChartError('No hay suficientes datos para mostrar el gráfico');
      return;
    }

    try {
      // Crear gráfico de distribución de correos por remitente
      const senderData = countEmailsBySender();
      const dataTable = new window.google.visualization.DataTable();
      dataTable.addColumn('string', 'Remitente');
      dataTable.addColumn('number', 'Cantidad');
      dataTable.addRows(senderData);
      
      const textColor = isDarkMode ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))';
      const options = {
        title: 'Distribución de correos por remitente',
        titleTextStyle: {
          color: textColor,
          fontSize: 16,
          bold: true
        },
        pieHole: 0.4,
        chartArea: { width: '80%', height: '80%' },
        colors: chartColors,
        legend: { 
          position: 'bottom',
          textStyle: { 
            color: textColor, 
            fontSize: 12 
          }
        },
        backgroundColor: 'transparent',
        tooltip: { 
          showColorCode: true,
          textStyle: { 
            color: isDarkMode ? '#e1e1e1' : '#333333',  
            fontSize: 13
          } 
        }
      };

      // Renderizar gráfico
      const chart = new window.google.visualization.PieChart(chartRef.current);
      chart.draw(dataTable, options);
      setChartError(null);
    } catch (error) {
      console.error('Error al dibujar el gráfico de emails:', error);
      setChartError('Error al generar la visualización de correos');
    }
  };

  const drawEventCharts = () => {
    if (!events || !chartRef.current || events.length === 0) {
      setChartError('No hay suficientes datos para mostrar el gráfico');
      return;
    }

    if (events.length === 0) {
      setChartError('No hay eventos programados para mostrar');
      return;
    }

    try {
      // Crear un cronograma de eventos
      const dataTable = new window.google.visualization.DataTable();
      dataTable.addColumn({ type: 'string', id: 'Evento' });
      dataTable.addColumn({ type: 'date', id: 'Inicio' });
      dataTable.addColumn({ type: 'date', id: 'Fin' });

      // Añadir filas de eventos
      events.forEach(event => {
        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);
        dataTable.addRow([event.summary, startTime, endTime]);
      });

      const textColor = isDarkMode ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))';
      
      const options = {
        title: 'Cronograma de Eventos',
        titleTextStyle: {
          color: textColor,
          fontSize: 16,
          bold: true
        },
        backgroundColor: { 
          fill: isDarkMode ? 'hsl(var(--card))' : 'hsl(var(--card))',
          stroke: isDarkMode ? 'hsl(var(--border))' : 'hsl(var(--border))',
          strokeWidth: 1
        },
        colors: [chartColors[0]],
        timeline: {
          showRowLabels: true,
          rowLabelStyle: {
            fontSize: 12,
            color: textColor
          },
          barLabelStyle: { 
            fontSize: 10 
          }
        },
        avoidOverlappingGridLines: false
      };

      // Limpiar el contenedor antes de renderizar
      while (chartRef.current.firstChild) {
        chartRef.current.removeChild(chartRef.current.firstChild);
      }

      // Crear el div para el cronograma
      const timelineDiv = document.createElement('div');
      timelineDiv.style.width = '100%';
      timelineDiv.style.height = '250px';
      timelineDiv.style.marginBottom = '2rem';
      chartRef.current.appendChild(timelineDiv);
      
      const timeline = new window.google.visualization.Timeline(timelineDiv);
      timeline.draw(dataTable, options);
      
      // Crear gráfico de tabla para detalles
      drawEventTable();

    } catch (error) {
      console.error('Error en drawEventCharts:', error);
      setChartError('No se pudo generar el cronograma de eventos');
    }
  };

  const drawEventTable = () => {
    if (!events || !tableRef.current || events.length === 0) return;
    
    try {
      // Crear una tabla de datos para eventos
      const dataTable = new window.google.visualization.DataTable();
      dataTable.addColumn('string', 'Título');
      dataTable.addColumn('string', 'Inicio');
      dataTable.addColumn('string', 'Fin');
      dataTable.addColumn('string', 'Duración');
      
      events.forEach(event => {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        
        // Formatear fechas
        const startStr = start.toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const endStr = end.toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Calcular duración en minutos
        const durationMs = end.getTime() - start.getTime();
        const durationMin = Math.round(durationMs / 60000);
        let durationStr = '';
        
        if (durationMin < 60) {
          durationStr = `${durationMin} minutos`;
        } else {
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;
          durationStr = `${hours} hora${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
        }
        
        dataTable.addRow([event.summary, startStr, endStr, durationStr]);
      });
      
      // Crear el div para la tabla
      const tableDiv = document.createElement('div');
      tableDiv.style.width = '100%';
      tableDiv.style.marginBottom = '1rem';
      tableRef.current.appendChild(tableDiv);
      
      // Opciones de la tabla
      const options = {
        showRowNumber: false,
        width: '100%',
        height: '100%',
        cssClassNames: {
          headerRow: 'bg-muted',
          tableRow: 'hover:bg-muted/50',
          oddTableRow: 'bg-card',
          selectedTableRow: 'bg-primary/20',
          hoverTableRow: 'bg-muted/50',
          headerCell: 'py-2 px-4 text-muted-foreground font-medium text-left border-border',
          tableCell: 'py-2 px-4 border-b border-border',
          rowNumberCell: 'py-2 px-4 border-b border-border'
        }
      };
      
      // Crear y dibujar la tabla
      const table = new window.google.visualization.Table(tableDiv);
      table.draw(dataTable, options);
      
    } catch (error) {
      console.error('Error al crear la tabla de eventos:', error);
    }
  };

  const countEmailsBySender = () => {
    if (!emails) return [];
    
    const senderCount: Record<string, number> = {};
    
    // Contar correos por remitente
    emails.forEach(email => {
      // Extraer solo el nombre del remitente (antes del <email>)
      let sender = email.from;
      const nameMatch = email.from.match(/(.*?)\s*<.*?>/);
      if (nameMatch && nameMatch[1]) {
        sender = nameMatch[1].trim();
      }
      
      senderCount[sender] = (senderCount[sender] || 0) + 1;
    });
    
    // Convertir a formato para gráfico
    return Object.entries(senderCount);
  };

  const drawEmailTable = () => {
    if (!emails || !tableRef.current || emails.length === 0) return;
    
    try {
      // Crear una tabla de datos para emails
      const dataTable = new window.google.visualization.DataTable();
      dataTable.addColumn('string', 'Remitente');
      dataTable.addColumn('string', 'Asunto');
      dataTable.addColumn('string', 'Fecha');
      
      emails.slice(0, 10).forEach(email => {
        const date = new Date(email.date);
        const dateStr = date.toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Extraer solo el nombre del remitente (antes del <email>)
        let sender = email.from;
        const nameMatch = email.from.match(/(.*?)\s*<.*?>/);
        if (nameMatch && nameMatch[1]) {
          sender = nameMatch[1].trim();
        }
        
        dataTable.addRow([sender, email.subject, dateStr]);
      });
      
      // Crear el div para la tabla
      const tableDiv = document.createElement('div');
      tableDiv.style.width = '100%';
      tableDiv.style.marginBottom = '1rem';
      tableRef.current.appendChild(tableDiv);
      
      // Opciones de la tabla
      const options = {
        showRowNumber: false,
        width: '100%',
        height: '100%',
        cssClassNames: {
          headerRow: 'bg-muted',
          tableRow: 'hover:bg-muted/50',
          oddTableRow: 'bg-card',
          selectedTableRow: 'bg-primary/20',
          hoverTableRow: 'bg-muted/50',
          headerCell: 'py-2 px-4 text-muted-foreground font-medium text-left border-border',
          tableCell: 'py-2 px-4 border-b border-border',
          rowNumberCell: 'py-2 px-4 border-b border-border'
        }
      };
      
      // Crear y dibujar la tabla
      const table = new window.google.visualization.Table(tableDiv);
      table.draw(dataTable, options);
      
    } catch (error) {
      console.error('Error al crear la tabla de emails:', error);
    }
  };

  // Mensajes de error y estados de carga
  if (chartError && (!emails?.length || !events?.length)) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {chartError}
        </AlertDescription>
      </Alert>
    );
  }

  // Datos insuficientes
  const noData = (type === 'emails' && (!emails || emails.length === 0)) || 
                 (type === 'events' && (!events || events.length === 0));
  
  if (noData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {type === 'emails' ? 'Análisis de Correos' : 'Análisis de Eventos'}
            {type === 'emails' ? <BarChart4 className="h-5 w-5 text-muted-foreground" /> : <CalendarIcon className="h-5 w-5 text-muted-foreground" />}
          </CardTitle>
          <CardDescription>
            No hay datos suficientes para mostrar estadísticas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          {type === 'emails' ? (
            <BarChart4 className="h-16 w-16 text-muted-foreground/40 mb-4" />
          ) : (
            <CalendarIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
          )}
          <p className="text-muted-foreground">No hay {type === 'emails' ? 'correos' : 'eventos'} disponibles para analizar</p>
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={onRefresh}
              className="mt-4 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> 
              Actualizar datos
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            {type === 'emails' ? 'Análisis de Correos' : 'Análisis de Eventos'}
            {type === 'emails' ? <BarChart4 className="h-5 w-5 text-muted-foreground" /> : <CalendarIcon className="h-5 w-5 text-muted-foreground" />}
          </CardTitle>
          
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onRefresh}
              className="rounded-full h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <CardDescription>
          {type === 'emails' 
            ? `Visualización de ${emails?.length || 0} correos recientes`
            : `Visualización de ${events?.length || 0} eventos próximos`
          }
        </CardDescription>
        
        <Separator className="mt-2" />
      </CardHeader>
      
      <CardContent className="pt-2">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="chart" className="flex items-center gap-1.5">
              <PieChart className="h-4 w-4" />
              <span>Gráfico</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-1.5">
              <Table2 className="h-4 w-4" />
              <span>Tabla</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="mt-0 p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full"></div>
              </div>
            ) : (
              <div 
                ref={chartRef} 
                className="w-full h-[350px] flex items-center justify-center"
                aria-label={`Gráfico de ${type === 'emails' ? 'correos' : 'eventos'}`}
              />
            )}
          </TabsContent>
          
          <TabsContent value="table" className="mt-0 p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full"></div>
              </div>
            ) : (
              <div 
                ref={tableRef} 
                className="w-full overflow-x-auto"
                aria-label={`Tabla de ${type === 'emails' ? 'correos' : 'eventos'}`}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataCharts; 