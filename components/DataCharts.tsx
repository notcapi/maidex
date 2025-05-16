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
      // Verificar si los eventos tienen fechas válidas
      const hasValidDates = events.every(event => {
        try {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);
          return !isNaN(start.getTime()) && !isNaN(end.getTime());
        } catch (e) {
          return false;
        }
      });

      if (!hasValidDates) {
        console.error('Algunos eventos tienen fechas inválidas');
        setChartError('Algunos eventos tienen fechas inválidas');
        drawEventTable(); // Mostrar tabla como alternativa
        return;
      }

      // Crear línea de tiempo de eventos
      const dataTable = new window.google.visualization.DataTable();
      dataTable.addColumn({ type: 'string', id: 'Evento' });
      dataTable.addColumn({ type: 'date', id: 'Inicio' });
      dataTable.addColumn({ type: 'date', id: 'Fin' });

      const timelineData = events.map(event => {
        let start, end;
        try {
          start = new Date(event.start.dateTime);
          end = new Date(event.end.dateTime);
          
          // Si las fechas son iguales, añadir una hora al final para visualización
          if (start.getTime() === end.getTime()) {
            end = new Date(start.getTime() + 3600000); // +1 hora
          }
        } catch (e) {
          console.error('Error al convertir fechas:', e);
          start = new Date();
          end = new Date(start.getTime() + 3600000);
        }
        
        return [
          event.summary || 'Evento sin título',
          start,
          end
        ];
      });

      dataTable.addRows(timelineData);
      
      const textColor = isDarkMode ? '#ffffff' : '#333333';
      const options = {
        timeline: { 
          showRowLabels: true,
          rowLabelStyle: { 
            fontName: 'Arial', 
            fontSize: 14,
            color: textColor,
            bold: true
          },
          barLabelStyle: { 
            fontName: 'Arial', 
            fontSize: 12,
            color: textColor 
          }
        },
        backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
        alternatingRowStyle: false,
        colors: chartColors,
        avoidOverlappingGridLines: false
      };

      const chart = new window.google.visualization.Timeline(chartRef.current);
      
      window.google.visualization.events.addListener(chart, 'error', function(error: any) {
        console.error('Error en la visualización de Timeline:', error);
        setChartError('No se puede mostrar el cronograma con los datos actuales');
        
        // Como alternativa, mostrar una tabla con los eventos
        drawEventTable();
      });
      
      chart.draw(dataTable, options);
    } catch (error) {
      console.error('Error al dibujar el cronograma:', error);
      setChartError('Error al generar el cronograma');
      
      // Como plan de respaldo, mostrar una tabla simple
      drawEventTable();
    }
  };
  
  // Función para mostrar eventos en formato de tabla cuando el Timeline falla
  const drawEventTable = () => {
    if (!events || !chartRef.current || events.length === 0) return;
    
    try {
      const dataTable = new window.google.visualization.DataTable();
      dataTable.addColumn('string', 'Evento');
      dataTable.addColumn('string', 'Fecha y Hora');
      dataTable.addColumn('string', 'Duración');
      
      const tableData = events.map(event => {
        let start, end, duration;
        try {
          start = new Date(event.start.dateTime);
          end = new Date(event.end.dateTime);
          duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // duración en minutos
        } catch (e) {
          console.error('Error al procesar fechas para tabla:', e);
          start = new Date();
          end = new Date();
          duration = 0;
        }
        
        return [
          event.summary || 'Evento sin título',
          start.toLocaleString(),
          `${duration} minutos`
        ];
      });
      
      dataTable.addRows(tableData);
      
      const options = {
        showRowNumber: true,
        width: '100%',
        height: '100%',
        allowHtml: true,
        cssClassNames: {
          headerRow: isDarkMode ? 'dark-header' : 'light-header',
          tableRow: isDarkMode ? 'dark-row' : 'light-row',
          oddTableRow: isDarkMode ? 'dark-odd-row' : 'light-odd-row'
        }
      };
      
      const table = new window.google.visualization.Table(chartRef.current);
      
      // Aplicar estilos al contenedor antes de dibujar
      const styleId = 'google-charts-table-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .dark-header { background-color: #2d3748 !important; color: #ffffff !important; }
          .dark-row { background-color: #1a202c !important; color: #e2e8f0 !important; }
          .dark-odd-row { background-color: #2d3748 !important; color: #e2e8f0 !important; }
          .light-header { background-color: #f7fafc !important; color: #1a202c !important; }
          .light-row { background-color: #ffffff !important; color: #1a202c !important; }
          .light-odd-row { background-color: #edf2f7 !important; color: #1a202c !important; }
          
          .google-visualization-table-tr-head th {
            color: ${isDarkMode ? '#ffffff !important' : '#1a202c !important'};
            background-color: ${isDarkMode ? '#2d3748 !important' : '#f7fafc !important'};
          }
          .google-visualization-table-tr-odd td, 
          .google-visualization-table-tr-even td {
            color: ${isDarkMode ? '#e2e8f0 !important' : '#1a202c !important'};
            background-color: ${isDarkMode ? '#1a202c !important' : '#ffffff !important'};
          }
        `;
        document.head.appendChild(style);
      }
      
      table.draw(dataTable, options);
    } catch (error) {
      console.error('También falló la tabla de eventos:', error);
      setChartError('No se pudieron visualizar los eventos');
    }
  };

  const countEmailsBySender = () => {
    if (!emails) return [];

    const senders: Record<string, number> = {};
    
    emails.forEach(email => {
      // Extraer el dominio del remitente
      const matches = email.from.match(/@([^>]+)/);
      const domain = matches ? matches[1] : 'Otro';
      
      if (!senders[domain]) {
        senders[domain] = 0;
      }
      senders[domain]++;
    });

    // Convertir a array para Google Charts
    return Object.entries(senders);
  };

  // Implementación de la función drawEmailTable faltante
  const drawEmailTable = () => {
    if (!emails || !chartRef.current || emails.length === 0) return;

    try {
      // Crear tabla con detalles de los correos
      const dataTable = new window.google.visualization.DataTable();
      dataTable.addColumn('string', 'Remitente');
      dataTable.addColumn('string', 'Asunto');
      dataTable.addColumn('string', 'Fecha');

      const tableData = emails.map(email => [
        email.from,
        email.subject,
        new Date(email.date).toLocaleString('es', { 
          dateStyle: 'short', 
          timeStyle: 'short' 
        })
      ]);

      dataTable.addRows(tableData);

      // Crear el div para la tabla
      const tableDiv = document.createElement('div');
      tableDiv.style.width = '100%';
      tableDiv.style.marginTop = '1rem';
      tableDiv.className = 'email-table-container';
      chartRef.current.appendChild(tableDiv);

      const table = new window.google.visualization.Table(tableDiv);
      table.draw(dataTable, {
        showRowNumber: true,
        width: '100%',
        height: '100%',
        cssClassNames: {
          headerRow: 'shadcn-header-row',
          tableRow: 'shadcn-table-row',
          oddTableRow: 'shadcn-odd-row',
          selectedTableRow: 'shadcn-selected-row',
          hoverTableRow: 'shadcn-hover-row',
          headerCell: 'shadcn-header-cell',
          tableCell: 'shadcn-table-cell',
        }
      });
    } catch (error) {
      console.error('Error al crear la tabla de correos:', error);
    }
  };

  // Si no hay datos para mostrar
  if ((type === 'emails' && (!emails || emails.length === 0)) || 
      (type === 'events' && (!events || events.length === 0))) {
    return (
      <div className="data-charts">
        <div className="flex items-center justify-center h-[400px] bg-card rounded-md border">
          <p className="text-foreground font-medium">No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  // Mostrar estado de carga o error
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {type === 'emails' ? <BarChart4 className="h-5 w-5" /> : <PieChart className="h-5 w-5" />}
            {type === 'emails' ? 'Análisis de Correos' : 'Análisis de Eventos'}
          </CardTitle>
          <CardDescription>Cargando visualizaciones...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <div className="animate-pulse flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-muted h-16 w-16 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
            <div className="text-sm text-muted-foreground">Cargando gráficos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{chartError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {type === 'emails' ? <BarChart4 className="h-5 w-5" /> : <PieChart className="h-5 w-5" />}
          {type === 'emails' ? 'Análisis de Correos' : 'Análisis de Eventos'}
        </CardTitle>
        <CardDescription>
          {type === 'emails' 
            ? 'Visualización de estadísticas de correos recientes' 
            : 'Visualización de estadísticas de eventos de calendario'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full overflow-hidden rounded-md" />
      </CardContent>
    </Card>
  );
};

export default DataCharts; 