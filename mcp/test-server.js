// Script para probar el servidor MCP con el SDK oficial
require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

// Clase auxiliar para simular agentes durante pruebas
class MockAgent {
  async sendEmail(accessToken, params) {
    console.log("MockEmailAgent: Enviando correo con parámetros:", params);
    return {
      success: true,
      messageId: `mock-message-id-${Date.now()}`,
      message: `Correo simulado enviado a ${params.to.join(', ')}`
    };
  }
  
  async createEvent(accessToken, params) {
    console.log("MockCalendarAgent: Creando evento con parámetros:", params);
    return {
      success: true,
      eventId: `mock-event-id-${Date.now()}`,
      message: `Evento simulado creado correctamente`
    };
  }
}

// Importar servidor MCP
const { MCPServer } = require('../dist/mcp/server.js');

// Verificar que la clave API se cargó correctamente
console.log("¿API Key cargada?", !!process.env.ANTHROPIC_API_KEY);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Crear instancia de prueba del servidor MCP
const mockAccessToken = "mock-token-for-testing";
const mcpServer = new MCPServer(mockAccessToken);

// Reemplazar los agentes originales con nuestros mocks
mcpServer.emailAgent = new MockAgent();
mcpServer.calendarAgent = new MockAgent();

// Obtener herramientas serializadas para Claude
const tools = mcpServer.getSerializedTools();
console.log("Herramientas disponibles:", tools.map(t => t.name));

// Prompt del sistema para forzar el uso de herramientas
const systemPrompt = `Eres un asistente que SIEMPRE usa las herramientas disponibles para realizar acciones. 
NUNCA respondas con texto cuando puedas usar una herramienta. Tu trabajo es EJECUTAR acciones, no describir lo que harías.

Cuando el usuario solicite enviar un correo:
1. DEBES usar la herramienta send_email
2. Extrae destinatario, asunto y cuerpo del mensaje del usuario
3. Si falta información, usa valores predeterminados razonables
4. NO expliques lo que vas a hacer, simplemente EJECUTA la acción

Cuando el usuario solicite crear un evento:
1. DEBES usar la herramienta create_event
2. Extrae título, fecha, hora de inicio y fin del mensaje del usuario
3. Si falta información, usa valores predeterminados razonables
4. NO expliques lo que vas a hacer, simplemente EJECUTA la acción`;

// Pruebas a realizar
const testQueries = [
  {
    action: "email",
    query: "Envía un correo a ejemplo@gmail.com con asunto 'Prueba' y mensaje 'Hola, esto es una prueba'"
  },
  {
    action: "calendar",
    query: "Crea una reunión para mañana a las 10am con el título 'Reunión de equipo'"
  }
];

// Función para procesar las herramientas usadas por Claude
async function processToolUse(toolCall) {
  console.log(`Procesando llamada a herramienta: ${toolCall.name}`);
  return await mcpServer.processToolCall(toolCall.name, toolCall.input);
}

// Función principal de prueba
async function runTest() {
  console.log("Iniciando pruebas del servidor MCP...\n");
  
  for (const test of testQueries) {
    console.log(`\n==== Probando consulta: "${test.query}" (${test.action}) ====`);
    
    try {
      // Llamar a Claude con la consulta
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        temperature: 0.0,
        system: systemPrompt,
        messages: [{ role: 'user', content: test.query }],
        tools: tools
      });
      
      console.log("Respuesta recibida de Claude");
      
      // Analizar si Claude usó la herramienta
      const hasToolUse = response.content.some(item => item.type === 'tool_use');
      
      if (hasToolUse) {
        const toolUseItem = response.content.find(item => item.type === 'tool_use');
        console.log("✅ Claude usó correctamente una herramienta:", toolUseItem.name);
        console.log("Parámetros:", JSON.stringify(toolUseItem.input, null, 2));
        
        // Procesar la herramienta con el servidor MCP
        const toolResult = await processToolUse(toolUseItem);
        console.log("Resultado del servidor MCP:", toolResult);
      } else {
        console.log("❌ Claude NO usó ninguna herramienta");
        console.log("Respuesta:", response.content[0].text);
      }
    } catch (error) {
      console.error("❌ Error al ejecutar la prueba:", error.message);
      console.error(error.response ? JSON.stringify(error.response.headers, null, 2) : error);
    }
  }
  
  console.log("\nPruebas completadas.");
}

// Ejecutar las pruebas
runTest(); 