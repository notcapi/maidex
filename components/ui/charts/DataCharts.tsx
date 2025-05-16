import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart4, PieChart } from "lucide-react";

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
}

const DataCharts: React.FC<DataChartsProps> = ({ emails, events, type }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [chartError, setChartError] = useState<string | null>(null);
  const [isGoogleAPILoaded, setIsGoogleAPILoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
            drawChart();
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
        drawChart();
      }
    }
  }, []); // Solo cargar la API una vez

  // Efecto para redibujar el gráfico cuando cambien los datos o el tema
  useEffect(() => {
    if (isGoogleAPILoaded) {
      drawChart();
    }
  }, [emails, events, type, theme, isGoogleAPILoaded, resolvedTheme]);

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

  const drawChart = () => {
    if (!chartRef.current || !window.google || !window.google.visualization) return;

    try {
      if (type === 'emails' && emails && emails.length > 0) {
        // Visualización de correos electrónicos
        drawEmailCharts();
      } else if (type === 'events' && events && events.length > 0) {
        // Visualización de eventos del calendario
        drawEventCharts();
      }
    } catch (error) {
      console.error('Error al dibujar el gráfico:', error);
      setChartError('Error al generar la visualización');
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
        backgroundColor: { 
          fill: isDarkMode ? 'hsl(var(--card))' : 'hsl(var(--card))',
          stroke: isDarkMode ? 'hsl(var(--border))' : 'hsl(var(--border))',
          strokeWidth: 1
        },
        tooltip: { 
          textStyle: { 
            color: isDarkMode ? 'hsl(var(--popover-foreground))' : 'hsl(var(--popover-foreground))',
            fontSize: 13
          },
          showColorCode: true
        }
      };

      // Limpiar el contenedor antes de renderizar
      while (chartRef.current.firstChild) {
        chartRef.current.removeChild(chartRef.current.firstChild);
      }

      // Crear el div para el gráfico de donut
      const donutChartDiv = document.createElement('div');
      donutChartDiv.style.width = '100%';
      donutChartDiv.style.height = '300px';
      donutChartDiv.style.marginBottom = '2rem';
      chartRef.current.appendChild(donutChartDiv);
      
      const donutChart = new window.google.visualization.PieChart(donutChartDiv);
      donutChart.draw(dataTable, options);
      
      // Crear gráfico de tabla para detalles
      drawEmailTable();

    } catch (error) {
      console.error('Error en drawEmailCharts:', error);
      setChartError('No se pudo generar el gráfico de correos');
    }
  };

  const drawEventCharts = () => {
    if (!events || !chartRef.current) {
      setChartError('No hay datos para mostrar el cronograma');
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
    if (!events || !chartRef.current || !window.google || !window.google.visualization) return;
    
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
      chartRef.current.appendChild(tableDiv);
      
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
    if (!emails || !chartRef.current || !window.google || !window.google.visualization) return;
    
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
      chartRef.current.appendChild(tableDiv);
      
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

  // Renderizar
  return (
    <div className="space-y-6">
      {chartError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{chartError}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Cargando visualización...</p>
        </div>
      ) : (
        <div ref={chartRef} className="min-h-[400px] w-full" />
      )}
    </div>
  );
};

export default DataCharts; 