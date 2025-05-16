# Estructura del Proyecto Maidex

Este documento describe la estructura de carpetas del proyecto Maidex, un asistente personal inteligente.

## Estructura de Carpetas

```
asistente_personal/
├── agents/                 # Agentes para diferentes servicios (email, calendar, drive, etc.)
├── components/             # Componentes de React
│   ├── drive/              # Componentes específicos para Google Drive
│   ├── layout/             # Componentes de layout (Layout principal, MainNav)
│   └── ui/                 # Componentes de UI reutilizables
│       ├── charts/         # Componentes de visualización de datos
│       ├── chat/           # Componentes para la interfaz de chat
│       └── navigation/     # Componentes de navegación
├── data/                   # Datos estáticos y conversaciones guardadas
├── hooks/                  # Hooks personalizados de React
├── lib/                    # Utilidades y funciones auxiliares
├── mcp/                    # Integración con Model Context Protocol
│   └── schemas/            # Esquemas JSON para MCP
├── pages/                  # Rutas y páginas de Next.js
│   └── api/                # Endpoints de API
├── public/                 # Archivos estáticos
├── styles/                 # Estilos globales
└── types/                  # Definiciones de tipos TypeScript
```

## Componentes Principales

### Componentes UI

Los componentes UI están organizados en subcarpetas según su función:

- **ui/charts**: Componentes para visualización de datos y estadísticas
  - `DataCharts.tsx`: Gráficos para emails y eventos del calendario

- **ui/chat**: Componentes para la interfaz de chat
  - `ChatBubble.tsx`: Burbujas de chat para mensajes
  - `ChatInput.tsx`: Campo de entrada para mensajes
  - `ChatWindow.tsx`: Ventana de chat con scroll y agrupación de mensajes

- **ui/navigation**: Componentes de navegación
  - `Navigation.tsx`: Barra de navegación principal

### Agentes

Los agentes manejan la lógica de negocio para diferentes servicios:

- `emailAgent.ts`: Gestión de correos electrónicos
- `calendarAgent.ts`: Gestión de eventos del calendario
- `driveAgent.ts`: Gestión de archivos en Google Drive
- `mcpIntegration.ts`: Integración con Model Context Protocol

## Convenciones de Código

- Los componentes presentacionales puros están en `/components/ui/`
- La lógica de negocio está separada en `/agents/` y `/hooks/`
- Las rutas y API endpoints están en `/pages/`
- Las utilidades y funciones auxiliares están en `/lib/` 