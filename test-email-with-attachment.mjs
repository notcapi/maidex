// Archivo de prueba para la funcionalidad de archivos adjuntos en MCP
import { MCPServerManager } from './mcp/serverESM.mjs';

async function main() {
  console.log('Inicializando prueba...');
  const mcpServer = new MCPServerManager();
  
  try {
    // 1. Probar extracción de referencias de archivos
    console.log('\n--- Prueba de extracción de referencias a archivos ---');
    const text = 'envía un correo a ejemplo@gmail.com con el archivo rutina mama xlsx de mi drive';
    const fileReferences = await mcpServer.extractFileReferences(text);
    console.log('Referencias extraídas:', fileReferences);
    
    // 2. Probar la importación del DriveAgent
    console.log('\n--- Prueba de importación de DriveAgent ---');
    const driveAgentModule = await mcpServer.importDriveAgent();
    console.log('DriveAgent importado correctamente:', !!driveAgentModule.DriveAgent);
  
    // 3. Prueba simulada de búsqueda de archivos
    console.log('\n--- Prueba simulada de búsqueda de archivos ---');
    const dummyDriveAgent = new driveAgentModule.DriveAgent();
    try {
      // No se ejecutará realmente al no tener token válido
      console.log('Intentando buscar archivo (simulación)...');
      // La búsqueda fallará pero verificaremos que el método existe
      console.log('Método de búsqueda disponible:', typeof dummyDriveAgent.findFileByName === 'function');
    } catch (err) {
      console.log('Error esperado (sin token):', err.message);
    }
  
    console.log('\nPruebas completadas');
  } catch (error) {
    console.error('Error en las pruebas:', error);
  }
}

main().catch(console.error); 