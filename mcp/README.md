# Integración Model Context Protocol (MCP) en Asistente Personal

Este directorio contiene la implementación del Model Context Protocol (MCP) para el asistente personal. MCP es un protocolo que permite a los modelos de IA como Claude 3.5 Sonnet utilizar herramientas externas para realizar acciones como enviar correos o crear eventos en el calendario.

## Archivos principales

- `serverESM.mjs`: Implementación del servidor MCP usando el SDK oficial en formato ESM.
- `server.ts`: Implementación alternativa del servidor MCP usando TypeScript.
- `test-server.js`: Script para probar el servidor MCP de forma aislada.

## Uso

La clase `MCPServerManager` del archivo `serverESM.mjs` proporciona las siguientes funcionalidades:

1. Registro de herramientas (correos electrónicos y eventos del calendario)
2. Serialización de herramientas para enviar a Claude
3. Procesamiento de llamadas a herramientas realizadas por Claude
4. Sistema de reintento cuando Claude no utiliza las herramientas adecuadamente

### Ejemplo de uso

```javascript
// Crear una instancia del servidor MCP
const mcpServer = new MCPServerManager();

// Ejecutar una consulta y procesar automáticamente la respuesta
const result = await mcpServer.executeQuery(
  "Envía un correo a ejemplo@gmail.com con asunto 'Prueba'", 
  "send_email"
);

if (result.success) {
  console.log("Acción realizada correctamente");
  console.log("Parámetros:", result.params);
  console.log("Resultado:", result.result);
}
```

## Integración con la aplicación

El servidor MCP se integra con la aplicación principal a través de la clase `MCPIntegration` ubicada en `agents/mcpIntegration.ts`, que gestiona:

1. Inicialización del servidor MCP
2. Creación de prompts optimizados para el uso de herramientas
3. Extracción manual de parámetros como fallback
4. Sistema de reintentos para mejorar la tasa de éxito

## Endpoints de API

- `pages/api/mcp-action.ts`: Endpoint para ejecutar acciones MCP desde la interfaz web
- `pages/api/actions.ts`: Endpoint que utiliza MCP para procesar acciones complejas

## Pruebas

Para probar la implementación MCP de forma aislada:

```bash
node mcp/serverESM.mjs
```

Para probar la integración con el asistente:

```bash
node test-assistant-mcp.js
```

## Limitaciones actuales

- La implementación actual es solo para pruebas y desarrollo
- No se utiliza un token real para Gmail y Calendar
- Se necesita integrar completamente con los agentes reales de Email y Calendar 