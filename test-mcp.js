// Script para probar la integración MCP
require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

// Verificar que la clave API se cargó correctamente
console.log("¿API Key cargada?", !!process.env.ANTHROPIC_API_KEY);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Definición de herramientas (formato actualizado usando custom)
const emailTool = {
  type: "custom",
  name: "send_email",
  description: "Envía un correo electrónico a los destinatarios especificados. Esta herramienta debe usarse siempre que el usuario solicite enviar un email o mensaje.",
  input_schema: {
    type: "object",
    properties: {
      to: {
        type: "array",
        items: { type: "string" },
        description: "Lista de direcciones de correo electrónico de los destinatarios"
      },
      subject: {
        type: "string",
        description: "Asunto del correo electrónico"
      },
      body: {
        type: "string",
        description: "Contenido del mensaje de correo electrónico"
      }
    },
    required: ["to", "subject", "body"]
  }
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

// Función principal de prueba
async function runTest() {
  console.log("Iniciando pruebas de integración MCP...\n");
  
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