import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

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

  // Detectar tema actual para aplicar en los gráficos
  const isDarkMode = theme === 'dark' || resolvedTheme === 'dark';
  // Colores para gráficos adaptados a modo oscuro/claro
  const chartColors = isDarkMode 
    ? ['#90caf9', '#f48fb1', '#ffcc80', '#a5d6a7', '#ce93d8', '#81d4fa']
    : ['#1565c0', '#c2185b', '#ef6c00', '#2e7d32', '#6a1b9a', '#0277bd'];

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
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.async = true;
        script.onload = () => {
          window.google.charts.load('current', { 'packages': ['corechart', 'timeline', 'table'] });
          window.google.charts.setOnLoadCallback(() => {
            window.charts[type === 'emails' ? 'emailsLoaded' : 'eventsLoaded'] = true;
            setIsGoogleAPILoaded(true);
            drawChart();
          });
        };
        script.onerror = () => {
          setChartError('No se pudo cargar la librería de gráficos');
        };
        document.head.appendChild(script);
      } else if (window.google && window.google.charts) {
        // La API ya está cargada
        setIsGoogleAPILoaded(true);
        window.charts[type === 'emails' ? 'emailsLoaded' : 'eventsLoaded'] = true;
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
          background-color: #2d3748 !important;
          color: #e2e8f0 !important;
          border-color: #4a5568 !important;
        }
        .google-visualization-tooltip-item-list {
          color: #e2e8f0 !important;
        }
        .google-visualization-tooltip-item-list li span:first-child {
          color: #90caf9 !important;
        }
        .google-visualization-tooltip-item-list li span:last-child {
          color: #ffffff !important;
        }
        .google-visualization-table-tr-head th, 
        .google-visualization-table-tr-head td {
          background-color: #2d3748 !important;
          color: #ffffff !important;
          font-weight: bold !important;
          border-color: #4a5568 !important;
        }
        .google-visualization-table-tr-odd td, 
        .google-visualization-table-tr-even td {
          background-color: #1a202c !important;
          color: #e2e8f0 !important;
          border-color: #2d3748 !important;
        }
        text.google-visualization-tooltip-item {
          fill: #ffffff !important;
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
      
      const textColor = isDarkMode ? '#ffffff' : '#000000';
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
          fill: isDarkMode ? '#1f1f1f' : '#ffffff',
          stroke: isDarkMode ? '#4a5568' : '#e2e8f0',
          strokeWidth: 1
        },
        tooltip: { 
          textStyle: { 
            color: isDarkMode ? '#ffffff' : '#000000',
            fontSize: 13
          },
          showColorCode: true
        }
      };

      const chart = new window.google.visualization.PieChart(chartRef.current);
      chart.draw(dataTable, options);
    } catch (error) {
      console.error('Error al dibujar el gráfico de correos:', error);
      setChartError('Error al generar el gráfico de correos');
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

  // Si hay un error específico en la generación del gráfico
  if (chartError) {
    return (
      <div className="data-charts">
        <div className="flex flex-col items-center justify-center h-[400px] bg-card rounded-md border p-4">
          <p className="text-foreground mb-4">{chartError}</p>
          {type === 'events' && events && events.length > 0 && (
            <div className="w-full max-w-lg px-4">
              <p className="font-medium mb-2 text-center text-foreground">Eventos programados:</p>
              <ul className="space-y-2">
                {events.slice(0, 5).map((event, index) => (
                  <li key={event.id || index} className="p-3 rounded bg-muted/20 border border-muted">
                    <strong className="text-foreground">{event.summary}</strong>
                    <div className="text-sm text-foreground">
                      {new Date(event.start.dateTime).toLocaleString()} - {new Date(event.end.dateTime).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="data-charts">
      <div 
        ref={chartRef} 
        style={{ width: '100%', height: '400px', marginBottom: '20px' }}
        className="chart-container bg-card p-2 rounded-md border border-border"
      />
    </div>
  );
};

export default DataCharts; 