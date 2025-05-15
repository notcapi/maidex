// Script para probar la integración de MCP con nuestro asistente personal
require('dotenv').config({ path: '.env.local' });
const { MCPServerManager } = require('./dist/mcp/serverESM.js');

async function testMCPIntegration() {
  console.log("Iniciando pruebas de integración MCP con el asistente personal...\n");
  
  // Crear instancia del servidor MCP
  const mcpServer = new MCPServerManager();
  
  const testQueries = [
    {
      action: "send_email",
      query: "Envía un correo a ejemplo@gmail.com con asunto 'Prueba de integración' y mensaje 'Hola, esto es una prueba desde el asistente personal'"
    },
    {
      action: "create_event",
      query: "Crea un evento para mañana a las 15:30 llamado Revisión del proyecto"
    }
  ];
  
  // Ejecutar pruebas
  for (const test of testQueries) {
    console.log(`\n==== Probando: "${test.query}" ====\n`);
    
    try {
      const result = await mcpServer.executeQuery(test.query, test.action);
      
      console.log("Resultado:", JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log("✅ La prueba fue exitosa");
        
        if (test.action === "send_email") {
          console.log(`Correo enviado a: ${result.params.to.join(', ')}`);
          console.log(`Asunto: ${result.params.subject}`);
          console.log(`Cuerpo: ${result.params.body.substring(0, 50)}...`);
        } else if (test.action === "create_event") {
          console.log(`Evento creado: ${result.params.summary}`);
          console.log(`Inicio: ${new Date(result.params.start).toLocaleString()}`);
          console.log(`Fin: ${new Date(result.params.end).toLocaleString()}`);
        }
      } else {
        console.log("❌ La prueba falló:", result.error);
      }
    } catch (error) {
      console.error("❌ Error durante la prueba:", error.message);
    }
  }
  
  console.log("\nPruebas completadas.");
}

// Ejecutar las pruebas
testMCPIntegration().catch(console.error); 