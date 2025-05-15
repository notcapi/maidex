// Script para probar la integración MCP con el SDK oficial
require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

// Importar SDK MCP con rutas compatibles con CommonJS
const { McpServer } = require('@modelcontextprotocol/sdk');
const zod = require('zod'); // Usar directamente zod en lugar de la dependencia del SDK

// Verificar que la clave API se cargó correctamente
console.log("¿API Key cargada?", !!process.env.ANTHROPIC_API_KEY);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Crear un servidor MCP de prueba
const server = new McpServer({
  name: "test-mcp-server",
  version: "1.0.0"
});

// Definir la herramienta de correo electrónico
const sendEmailTool = server.tool(
  "send_email",
  {
    to: zod.array(zod.string().email("Debe ser una dirección de correo válida")),
    subject: zod.string().min(1, "El asunto no puede estar vacío"),
    body: zod.string().min(1, "El cuerpo del mensaje no puede estar vacío"),
  },
  async ({ to, subject, body }) => {
    console.log("MCP: Simulando envío de correo con:", { to, subject, body });
    
    // Simular envío de correo (en una implementación real, aquí llamaríamos a la API de Gmail)
    return {
      success: true,
      message: `Correo enviado correctamente a ${to.join(', ')}`,
      messageId: "test-message-id-" + Math.random().toString(36).substr(2, 9)
    };
  }
);

// Preparar herramientas para Claude
const emailTool = {
  type: "custom",
  name: "send_email",
  description: "Envía un correo electrónico a los destinatarios especificados. Esta herramienta debe usarse siempre que el usuario solicite enviar un email o mensaje.",
  input_schema: sendEmailTool.paramSchema
};

// Prompt del sistema para forzar el uso de herramientas
const systemPrompt = `Eres un asistente que SIEMPRE usa las herramientas disponibles para realizar acciones. 
NUNCA respondas con texto cuando puedas usar una herramienta. Tu trabajo es EJECUTAR acciones, no describir lo que harías.

Cuando el usuario solicite enviar un correo:
1. DEBES usar la herramienta send_email
2. Extrae destinatario, asunto y cuerpo del mensaje del usuario
3. Si falta información, usa valores predeterminados razonables
4. NO expliques lo que vas a hacer, simplemente EJECUTA la acción

Ejemplos:
Usuario: "Envía un correo a juan@example.com"
Asistente: [LLAMADA A send_email]

Usuario: "Mándale un email a ana@gmail.com diciendo que llegaré tarde"
Asistente: [LLAMADA A send_email]`;

// Pruebas a realizar
const testQueries = [
  "Envía un correo a ejemplo@gmail.com con asunto 'Prueba' y mensaje 'Hola, esto es una prueba'",
  "Manda un email a ejemplo@gmail.com diciéndole que llegaré tarde",
  "Envía un correo a ejemplo@gmail.com"
];

// Función para procesar las herramientas usadas por Claude
async function processToolUse(toolCall) {
  if (toolCall.name === 'send_email') {
    // Ejecutar la herramienta en el servidor MCP
    const result = await sendEmailTool.execute(toolCall.input);
    console.log("Resultado de la herramienta:", result);
    return result;
  }
  
  return { success: false, error: "Herramienta no implementada" };
}

// Función principal de prueba
async function runTest() {
  console.log("Iniciando pruebas de integración MCP SDK...\n");
  
  for (const query of testQueries) {
    console.log(`\n==== Probando consulta: "${query}" ====`);
    
    try {
      // Llamar a Claude con la consulta
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        temperature: 0.0,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }],
        tools: [emailTool]
      });
      
      console.log("Respuesta completa:", JSON.stringify(response.content, null, 2));
      
      // Analizar si Claude usó la herramienta
      const hasToolUse = response.content.some(item => item.type === 'tool_use');
      
      if (hasToolUse) {
        const toolUseItem = response.content.find(item => item.type === 'tool_use');
        console.log("✅ Claude usó correctamente la herramienta send_email");
        console.log("Parámetros:", JSON.stringify(toolUseItem.input, null, 2));
        
        // Procesar la herramienta con el servidor MCP
        const toolResult = await processToolUse(toolUseItem);
        console.log("Resultado del servidor MCP:", toolResult);
        
        // Enviar el resultado de vuelta a Claude para obtener una respuesta final
        const followUpResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          temperature: 0.0,
          system: "Eres un asistente personal eficiente. Informa al usuario sobre el resultado de la acción que acabas de realizar.",
          messages: [
            { role: 'user', content: query },
            { role: 'assistant', content: [toolUseItem] },
            { role: 'user', content: `Resultado de la operación: ${JSON.stringify(toolResult)}` }
          ]
        });
        
        console.log("Respuesta final de Claude:", followUpResponse.content[0].text);
      } else {
        console.log("❌ Claude NO usó la herramienta send_email");
        console.log("Respuesta:", response.content[0].text);
      }
    } catch (error) {
      console.error("❌ Error al ejecutar la prueba:", error.message);
      console.error(JSON.stringify(error.response || error, null, 2));
    }
  }
  
  console.log("\nPruebas completadas.");
}

// Ejecutar las pruebas
runTest(); 