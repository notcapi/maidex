import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages';
// Usar any para el tipo del servidor MCP para evitar problemas de importación circular
// en un entorno con importaciones ESM y CommonJS mezcladas
// import { MCPServerManager } from '../mcp/serverESM.mjs';

// Definición de tipos para las herramientas MCP
type EmailToolParams = {
  to: string[];
  subject: string;
  body: string;
};

type CalendarToolParams = {
  summary: string;
  start: string;
  end: string;
  location?: string;
};

export class MCPIntegration {
  private anthropic: Anthropic;
  private model: string = 'claude-3-5-sonnet-20240620';
  private temperature: number = 0.0;
  private maxTokens: number = 1024;
  private emailTool: any;
  private calendarTool: any;
  private mcpServer: any = null;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    // Definición de herramientas mantenida para compatibilidad
    // Estas se usarán solo si mcpServer no está disponible
    this.emailTool = {
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

    this.calendarTool = {
      type: "custom",
      name: "create_event",
      description: "Crea un evento en el calendario del usuario. Esta herramienta debe usarse siempre que el usuario solicite crear una cita, reunión o evento.",
      input_schema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Título o descripción breve del evento"
          },
          start: {
            type: "string",
            description: "Fecha y hora de inicio del evento en formato ISO 8601 (YYYY-MM-DDTHH:MM:SS)"
          },
          end: {
            type: "string",
            description: "Fecha y hora de fin del evento en formato ISO 8601 (YYYY-MM-DDTHH:MM:SS)"
          },
          location: {
            type: "string",
            description: "Ubicación física o virtual del evento (opcional)"
          }
        },
        required: ["summary", "start", "end"]
      }
    };
  }

  /**
   * Inicializa el servidor MCP con un token de acceso
   */
  initializeMCPServer(accessToken: string) {
    // Importación dinámica del servidor MCP
    // @ts-ignore - Ignorar errores de tipo en importación dinámica
    import('../mcp/serverESM.mjs').then(module => {
      const MCPServerManager = module.MCPServerManager;
      this.mcpServer = new MCPServerManager();
      this.mcpServer.setAccessToken(accessToken);
      console.log("Servidor MCP inicializado correctamente");
    }).catch(err => {
      console.error("Error al inicializar servidor MCP:", err);
    });
  }

  /**
   * Obtiene la herramienta MCP según la acción solicitada
   */
  getToolsForAction(action: string): any[] {
    // Si tenemos un servidor MCP, usamos sus herramientas serializadas
    if (this.mcpServer) {
      // @ts-ignore: Ignorar error de parámetro implícito
      return this.mcpServer.getSerializedTools().filter(tool => {
        if (action === 'send_email' && tool.name === 'send_email') return true;
        if (action === 'create_event' && tool.name === 'create_event') return true;
        return false;
      });
    }

    // Fallback a las herramientas predefinidas
    switch (action) {
      case 'send_email':
        return [this.emailTool];
      case 'create_event':
        return [this.calendarTool];
      default:
        return [];
    }
  }

  /**
   * Crea el sistema prompt optimizado para uso de herramientas
   */
  createSystemPrompt(action: string): string {
    const basePrompt = "Eres un asistente que SIEMPRE usa las herramientas disponibles para realizar acciones. NUNCA respondas con texto cuando puedas usar una herramienta. Tu trabajo es EJECUTAR acciones, no describir lo que harías.";
    
    let actionSpecificPrompt = "";
    
    if (action === 'send_email') {
      actionSpecificPrompt = `
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
    } else if (action === 'create_event') {
      actionSpecificPrompt = `
Cuando el usuario solicite crear un evento o reunión:
1. DEBES usar la herramienta create_event
2. Extrae título, fecha, hora de inicio y fin del mensaje del usuario
3. Si falta información, usa valores predeterminados razonables
4. NO expliques lo que vas a hacer, simplemente EJECUTA la acción

Ejemplos:
Usuario: "Crea una reunión para mañana a las 10"
Asistente: [LLAMADA A create_event]

Usuario: "Agenda una cita con el doctor el viernes a las 3pm"
Asistente: [LLAMADA A create_event]`;
    }
    
    return `${basePrompt}\n\n${actionSpecificPrompt}`;
  }

  /**
   * Ejecuta la acción MCP
   */
  async executeMCPAction(text: string, action: string, accessToken?: string): Promise<{ success: boolean; message: string; params?: any }> {
    try {
      // Inicializar servidor MCP si tenemos accessToken y no está inicializado
      if (accessToken && !this.mcpServer) {
        this.initializeMCPServer(accessToken);
      }

      // Si tenemos un servidor MCP, usar su método executeQuery
      if (this.mcpServer) {
        console.log(`Ejecutando acción MCP: ${action} con texto: ${text}`);
        const result = await this.mcpServer.executeQuery(text, action);
        
        // Verificar que result no sea undefined antes de acceder a sus propiedades
        if (result && result.success) {
          return {
            success: true,
            message: result.result?.message || `Acción MCP ejecutada correctamente: ${action}`,
            params: result.params
          };
        } else {
          return {
            success: false,
            message: result?.error || "Error desconocido al ejecutar acción MCP",
            params: result?.params
          };
        }
      }

      // Método anterior para compatibilidad
      const tools = this.getToolsForAction(action);
      console.log(`Ejecutando con capacidades: ${JSON.stringify(tools.map(t => t.name))}`);
      
      // Modificar el prompt para enfatizar el uso de herramientas
      let modifiedPrompt = text;
      
      // Configurar mensajes con prompts optimizados
      const messages: MessageParam[] = [
        { role: 'user', content: text }
      ];
      
      console.log(`Enviando prompt a Claude: ${text}`);
      
      // Hacer la llamada a Claude con configuración optimizada para uso de herramientas
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: this.createSystemPrompt(action),
        messages: messages,
        tools: tools
      });
      
      // Para depuración
      if (response.content[0].type === 'text') {
        console.log("Claude respondió. Tipo de contenido: text");
      }
      
      // Verificar si Claude utilizó la herramienta
      if (response.content.some(item => item.type === 'tool_use')) {
        // Encontrar el tool_use en el contenido
        const toolUseItem = response.content.find(item => item.type === 'tool_use');
        if (toolUseItem && toolUseItem.type === 'tool_use') {
          console.log(`Claude usó la herramienta correctamente: ${toolUseItem.name}`);
          
          // Extraer los parámetros de la llamada a la herramienta
          const params = toolUseItem.input;
          
          // Si tenemos un servidor MCP, procesar la llamada
          if (this.mcpServer && accessToken) {
            const result = await this.mcpServer.processToolCall(toolUseItem.name, params);
            if (result.success) {
              let message = `Acción MCP ejecutada correctamente: ${action}`;
              // Comprueba las propiedades de manera segura con in
              if ('messageId' in result) {
                message = `Correo enviado correctamente`;
              } else if ('eventId' in result) {
                message = `Evento creado correctamente`;
              }
              
              return {
                success: true,
                message,
                params
              };
            } else {
              return {
                success: false,
                message: `Error al ejecutar acción MCP: ${result.error || "Error desconocido"}`,
                params
              };
            }
          }
          
          // Si no tenemos servidor MCP, simplemente devolver los parámetros
          return {
            success: true,
            message: `Acción MCP ejecutada correctamente: ${action}`,
            params
          };
        }
      }
      
      // Si Claude sólo respondió con texto, intentar una vez más con un prompt más directo
      if (response.content[0].type === 'text') {
        console.log("Claude no usó la herramienta como se esperaba, intentando con prompt más directo...");
        
        // Crear un prompt más directo que enfatice el uso de herramientas
        let directPrompt = "";
        
        if (action === 'send_email') {
          // Extraer información básica para crear un prompt más directo
          const toMatch = text.match(/(?:a|para|@)\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
          const to = toMatch ? toMatch[1] : 'destinatario@example.com';
          
          // Extraer asunto si está presente
          let subject = 'Mensaje automático';
          const subjectMatch = text.match(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
          if (subjectMatch) subject = subjectMatch[1].trim();
          
          directPrompt = `IMPORTANTE: UTILIZA LA HERRAMIENTA send_email PARA REALIZAR ESTA TAREA. NO RESPONDAS CON TEXTO. Usa la herramienta send_email para enviar un correo a ${to} con asunto "${subject}" y el siguiente contenido: "${text}"`;
        } else if (action === 'create_event') {
          directPrompt = `IMPORTANTE: UTILIZA LA HERRAMIENTA create_event PARA REALIZAR ESTA TAREA. NO RESPONDAS CON TEXTO. Usa la herramienta create_event para crear un evento en el calendario con la siguiente información: "${text}"`;
        }
        
        console.log(`Intentando de nuevo con prompt explícito: ${directPrompt}`);
        
        // Segundo intento con prompt más directo
        const secondResponse = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          system: this.createSystemPrompt(action),
          messages: [{ role: 'user', content: directPrompt }],
          tools: tools
        });
        
        console.log(`Segundo intento - Tipo de contenido: ${secondResponse.content[0].type}`);
        
        // Verificar si ahora Claude utilizó la herramienta
        if (secondResponse.content.some(item => item.type === 'tool_use')) {
          const toolUseItem = secondResponse.content.find(item => item.type === 'tool_use');
          if (toolUseItem && toolUseItem.type === 'tool_use') {
            console.log(`Claude usó la herramienta correctamente en el segundo intento: ${toolUseItem.name}`);
            
            // Extraer los parámetros de la llamada a la herramienta
            const params = toolUseItem.input;
            
            // Si tenemos un servidor MCP, procesar la llamada
            if (this.mcpServer && accessToken) {
              const result = await this.mcpServer.processToolCall(toolUseItem.name, params);
              if (result.success) {
                let message = `Acción MCP ejecutada correctamente en segundo intento: ${action}`;
                // Comprueba las propiedades de manera segura con in
                if ('messageId' in result) {
                  message = `Correo enviado correctamente`;
                } else if ('eventId' in result) {
                  message = `Evento creado correctamente`;
                }
                
                return {
                  success: true,
                  message,
                  params
                };
              } else {
                return {
                  success: false,
                  message: `Error al ejecutar acción MCP: ${result.error || "Error desconocido"}`,
                  params
                };
              }
            }
            
            // Si no tenemos servidor MCP, simplemente devolver los parámetros
            return {
              success: true,
              message: `Acción MCP ejecutada correctamente en segundo intento: ${action}`,
              params
            };
          }
        }
      }
      
      console.log("Claude no usó la herramienta como se esperaba, implementando fallback...");
      
      // Implementar extracción manual como fallback
      return this.extractParamsManually(text, action);
    } catch (error) {
      console.error("Error al ejecutar acción MCP:", error);
      return {
        success: false,
        message: `Error al procesar la solicitud: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Extracción manual de parámetros como fallback
   */
  private extractParamsManually(text: string, action: string): { success: boolean; message: string; params?: any } {
    console.log("Intentando extracción manual de parámetros para:", action);
    
    const lowerText = text.toLowerCase();
    
    if (action === 'send_email') {
      // Extraer destinatario
      const toMatch = text.match(/(?:a|para|@)\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const to = toMatch ? [toMatch[1]] : ['destinatario@example.com'];
      
      // Extraer asunto
      let subject = 'Mensaje desde tu asistente personal';
      const subjectMatch = text.match(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
      if (subjectMatch) subject = subjectMatch[1].trim();
      
      // El resto se considera el cuerpo
      let body = text
        .replace(/(?:envía|enviar|mandar|envia).*?(?:correo|email|mensaje|mail).*?(?:a|para).*?@.*?(?:con|y|diciendo)/, '')
        .replace(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i, '')
        .trim();
      
      if (body.length < 5) body = "Hola, este es un mensaje enviado desde mi asistente personal.";
      
      return {
        success: true,
        message: "Parámetros extraídos manualmente",
        params: { to, subject, body }
      };
    } 
    else if (action === 'create_event') {
      // Extraer fecha y hora
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(endTime.getHours() + 1);
      
      // Extraer título
      let summary = 'Reunión';
      const titleMatch = text.match(/(?:titulado|llamado|título|title|sobre)[:\s]+["']?([^"'\n.]*)["']?/i);
      if (titleMatch) summary = titleMatch[1].trim();
      
      return {
        success: true,
        message: "Parámetros extraídos manualmente para evento",
        params: { 
          summary, 
          start: tomorrow.toISOString(), 
          end: endTime.toISOString(), 
          location: ""
        }
      };
    }
    
    return {
      success: false,
      message: "No se pudo extraer parámetros manualmente"
    };
  }
} 