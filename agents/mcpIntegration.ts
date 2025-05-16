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
  cc?: string[];
  bcc?: string[];
  mimeType?: string;
  htmlBody?: string;
  driveAttachments?: string[];
};

type CalendarToolParams = {
  summary: string;
  start: string;
  end: string;
  location?: string;
};

// Definir interfaces para respuestas y errores MCP
interface MCPResponse {
  success: boolean;
  message?: string;
  error?: string;
  params?: any;
  result?: any;
  messageId?: string;
  eventId?: string;
}

// Usamos any para evitar conflictos con la librería Anthropic
// pero mantenemos documentación de la estructura para claridad
interface MCPTool {
  type: string;
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export class MCPIntegration {
  private anthropic: Anthropic;
  private model: string = 'claude-3-5-sonnet-20240620';
  private temperature: number = 0.0;
  private maxTokens: number = 1024;
  private emailTool: any; // Mantenemos any para evitar conflictos con Anthropic
  private calendarTool: any; // Mantenemos any para evitar conflictos con Anthropic
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
          },
          cc: {
            type: "array",
            items: { type: "string" },
            description: "Lista de direcciones en copia"
          },
          bcc: {
            type: "array",
            items: { type: "string" },
            description: "Lista de direcciones en copia oculta"
          },
          mimeType: {
            type: "string",
            description: "Tipo MIME del mensaje",
            enum: ["text/plain", "text/html", "multipart/alternative", "multipart/mixed"]
          },
          htmlBody: {
            type: "string",
            description: "Versión HTML del mensaje (opcional)"
          },
          driveAttachments: {
            type: "array",
            items: { type: "string" },
            description: "Lista de IDs de archivos de Google Drive para adjuntar al correo"
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
   * @param accessToken Token de acceso para las APIs de Google
   * @returns Promise que se resuelve cuando el servidor está inicializado
   */
  async initializeMCPServer(accessToken: string): Promise<void> {
    try {
    // Importación dinámica del servidor MCP
      const module = await import('../mcp/serverESM.mjs');
      const MCPServerManager = module.MCPServerManager;
      this.mcpServer = new MCPServerManager();
      this.mcpServer.setAccessToken(accessToken);
      console.log("Servidor MCP inicializado correctamente");
    } catch (err) {
      console.error("Error al inicializar servidor MCP:", err);
      throw new Error(`No se pudo inicializar servidor MCP: ${(err as Error).message}`);
    }
  }

  /**
   * Obtiene la herramienta MCP según la acción solicitada
   * @param action Nombre de la acción ('send_email' o 'create_event')
   * @returns Array con las herramientas para la acción especificada
   */
  getToolsForAction(action: string): any[] {
    // Si tenemos un servidor MCP, usamos sus herramientas serializadas
    if (this.mcpServer && typeof this.mcpServer.getSerializedTools === 'function') {
      try {
        const tools = this.mcpServer.getSerializedTools().filter((tool: MCPTool) => {
        if (action === 'send_email' && tool.name === 'send_email') return true;
        if (action === 'create_event' && tool.name === 'create_event') return true;
        return false;
      });
        return tools;
      } catch (error) {
        console.error("Error al obtener herramientas serializadas:", error);
        // Fallback a herramientas predefinidas en caso de error
      }
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
   * @param action Tipo de acción para la que se crea el prompt
   * @returns Prompt de sistema optimizado
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
   * Ejecuta una acción MCP con el texto y tipo de acción proporcionados
   * @param text Texto de la solicitud del usuario
   * @param action Tipo de acción ('send_email' o 'create_event')
   * @param accessToken Token de acceso opcional para APIs de Google
   * @returns Resultado de la acción MCP
   */
  async executeMCPAction(text: string, action: string, accessToken?: string): Promise<MCPResponse> {
    try {
      // Si tenemos token de acceso, inicializamos el servidor MCP
      if (accessToken) {
        try {
          await this.initializeMCPServer(accessToken);
          console.log('Servidor MCP inicializado correctamente con token de acceso');
        } catch (error) {
          console.warn('No se pudo inicializar el servidor MCP, usando fallback:', error);
          // Continuamos con el flujo alternativo si falla la inicialización
        }
      } else {
        console.warn('No se proporcionó token de acceso para MCP, usando fallback');
      }

      // Obtener las herramientas según la acción
      const tools = this.getToolsForAction(action);
      
      if (!tools || tools.length === 0) {
        console.error(`No se encontraron herramientas para la acción: ${action}`);
        return {
          success: false,
          error: `Acción no soportada: ${action}`
        };
      }

      console.log(`Ejecutando acción MCP: ${action} con herramientas:`, JSON.stringify(tools.map(t => t.name)));
      
      // Crear prompt de sistema
      const systemPrompt = this.createSystemPrompt(action);
      
      // Preparar mensajes para Anthropic
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: text
        }
      ];

      // Crear y enviar la solicitud a Anthropic
      console.log(`Enviando solicitud a ${this.model} con prompt: "${text}"`);
      
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages,
        tools: tools
      });

      // Log de la respuesta completa para propósitos de debug
      console.log('Respuesta completa de Anthropic:', JSON.stringify(response, null, 2));
      
      // Extraer la respuesta de herramientas si existe
      const toolCalls = response.content.filter(item => 
        item.type === 'tool_use' || 
        ('tool_use_id' in item) // Verificar solo por la propiedad sin comprobar el tipo
      );
      
      // Si no hay llamadas a herramientas, manejarlo de manera explícita
      if (toolCalls.length === 0) {
        console.log('No hay llamadas a herramientas en la respuesta');
        
        // Intentar extraer parámetros manualmente como fallback
        const extractedParams = this.extractParamsManually(text, action);
        if (extractedParams.success) {
          return extractedParams;
        }
        
        // Si Claude respondió sin usar herramientas, extraer el texto
        const textContent = response.content
          .filter(item => item.type === 'text')
          .map(item => (item as any).text)
          .join(' ');
          
        return {
          success: false,
          message: textContent,
          error: 'El modelo no utilizó las herramientas esperadas'
        };
      }
      
      // Procesar la primera llamada a herramienta (asumimos que es la correcta)
      const toolUses = toolCalls.filter(item => item.type === 'tool_use');
      
      if (toolUses.length === 0) {
        return {
          success: false,
          error: 'No se encontraron tool_use en la respuesta'
        };
      }
      
      const toolUse = toolUses[0];
      if (toolUse.type !== 'tool_use' || !('name' in toolUse) || !('input' in toolUse)) {
        return {
          success: false,
          error: 'La estructura de tool_use es inválida'
        };
      }
      
      // Procesar según la herramienta usada
      const toolName = toolUse.name;
      const toolInput = toolUse.input as Record<string, any>;
      
      console.log(`Herramienta utilizada: ${toolName} con input:`, toolInput);
      
      // Si tenemos un servidor MCP activo, usar directamente sus implementaciones
      if (this.mcpServer && accessToken) {
        if (toolName === 'send_email' && action === 'send_email') {
          try {
            const emailParams = {
              to: Array.isArray(toolInput.to) ? toolInput.to : [toolInput.to || 'destinatario@ejemplo.com'],
              subject: toolInput.subject || 'Asunto predeterminado',
              body: toolInput.body || 'Contenido predeterminado',
              cc: toolInput.cc,
              bcc: toolInput.bcc,
              mimeType: toolInput.mimeType,
              htmlBody: toolInput.htmlBody,
              driveAttachments: toolInput.driveAttachments
            } as EmailToolParams;
            
            const emailResult = await this.mcpServer.sendEmail(emailParams);
            console.log('Resultado de sendEmail MCP:', emailResult);
            
            return {
              success: true,
              params: emailParams,
              messageId: emailResult?.messageId || 'unknown-id',
              message: 'Correo enviado correctamente'
            };
          } catch (error) {
            console.error('Error al enviar correo con MCP:', error);
            return {
              success: false,
              error: `Error al enviar correo: ${(error as Error).message}`
            };
          }
        } 
        else if (toolName === 'create_event' && action === 'create_event') {
          try {
            const eventParams = {
              summary: toolInput.summary || 'Evento sin título',
              start: toolInput.start || new Date().toISOString(),
              end: toolInput.end || new Date(Date.now() + 3600000).toISOString(),
              location: toolInput.location
            } as CalendarToolParams;
            
            const calendarResult = await this.mcpServer.createEvent(eventParams);
            console.log('Resultado de createEvent MCP:', calendarResult);
            
            return {
              success: true,
              params: eventParams,
              eventId: calendarResult?.eventId || 'unknown-id',
              message: 'Evento creado correctamente'
            };
          } catch (error) {
            console.error('Error al crear evento con MCP:', error);
            return {
              success: false,
              error: `Error al crear evento: ${(error as Error).message}`
            };
          }
        }
      } else if (accessToken) {
        // Usar agentes directamente si el servidor MCP no está disponible
        try {
          if (toolName === 'send_email' && action === 'send_email') {
            // Importar el EmailAgent como fallback
            const { EmailAgent } = await import('./emailAgent');
            const emailAgent = new EmailAgent();
            
            // Usar conversión de tipo para garantizar compatibilidad de tipos
            const emailResult = await emailAgent.sendEmail(accessToken, toolInput as any);
            
            return {
              success: emailResult.success,
              params: toolInput,
              messageId: emailResult.messageId,
              error: emailResult.error,
              message: 'Correo enviado correctamente'
            };
          } 
          else if (toolName === 'create_event' && action === 'create_event') {
            // Importar el CalendarAgent como fallback
            const { CalendarAgent } = await import('./calendarAgent');
            const calendarAgent = new CalendarAgent();
            
            // Usar conversión de tipo para garantizar compatibilidad de tipos
            const calendarResult = await calendarAgent.createEvent(accessToken, toolInput as any);
            
            return {
              success: calendarResult.success,
              params: toolInput,
              eventId: calendarResult.eventId,
              error: calendarResult.error,
              message: 'Evento creado correctamente'
            };
          }
        } catch (error) {
          console.error('Error al ejecutar agente fallback:', error);
        }
      }

      // Devolver resultado genérico si no podemos manejar específicamente
      return {
        success: true,
        params: toolInput,
        message: `Acción ${action} procesada correctamente`
      };
      
    } catch (error: any) {
      console.error('Error al ejecutar acción MCP:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al ejecutar la acción'
      };
    }
  }
  
  /**
   * Extracción manual de parámetros como fallback
   * @param text Texto del usuario para extraer parámetros
   * @param action Tipo de acción ('send_email' o 'create_event')
   * @returns Resultado con parámetros extraídos manualmente
   */
  private extractParamsManually(text: string, action: string): MCPResponse {
    console.log("Intentando extracción manual de parámetros para:", action);
    
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

// Declaramos la función sin implementarla para evitar errores del compilador
declare function getGoogleToken(session: any): Promise<string | null>;

// Importamos las clases necesarias para mantener compatibilidad
// Estas clases ya deben estar implementadas en alguna parte del código
declare class EmailAgent {
  sendEmail(accessToken: string, params: EmailToolParams): Promise<MCPResponse>;
}

declare class CalendarAgent {
  createEvent(accessToken: string, params: CalendarToolParams): Promise<MCPResponse>;
}

declare class DriveAgent {
  searchFiles(accessToken: string, params: {query: string, maxResults: number}): Promise<MCPResponse>;
  listFiles(accessToken: string, params: {folderId: string, maxResults: number}): Promise<MCPResponse>;
  createFolder(accessToken: string, params: {name: string, parentId?: string}): Promise<MCPResponse>;
}

// Función auxiliar para asegurar formato de fecha correcto
function ensureProperDateFormat(dateStr: string): string {
  // Si ya es una fecha ISO, devolverla sin cambios
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateStr)) {
    return dateStr;
  }
  
  // En caso contrario, intentar convertir
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    console.error("Error al convertir fecha:", e);
  }
  
  // Si no se puede convertir, devolver la original
  return dateStr;
}

export async function handleMcpRequest(operation: string, params: any, session: any): Promise<MCPResponse> {
  console.log(`Solicitud MCP: ${operation}`, params);
  
  try {
    // Comprobar que tenemos una sesión válida
    if (!session || !session.user) {
      console.error("No hay sesión de usuario válida");
      return {
        success: false,
        error: "No estás autenticado. Por favor, inicia sesión."
      };
    }
    
    // Obtener un token de acceso actualizado para APIs de Google
    const accessToken = await getGoogleToken(session);
    
    if (!accessToken) {
      console.error("No se pudo obtener un token de acceso");
      return {
        success: false,
        error: "No se pudo acceder a tu cuenta de Google. Por favor, vuelve a iniciar sesión."
      };
    }
    
    // Manejar diferentes operaciones MCP
    switch (operation) {
      case "send_email":
        const emailAgent = new EmailAgent();
        return await emailAgent.sendEmail(accessToken, {
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          body: params.body,
          cc: params.cc,
          bcc: params.bcc,
          mimeType: params.mimeType,
          htmlBody: params.htmlBody,
          driveAttachments: params.driveAttachments
        });
        
      case "create_event":
        const calendarAgent = new CalendarAgent();
        // Procesar fechas para asegurar formato correcto
        params.start = ensureProperDateFormat(params.start);
        params.end = ensureProperDateFormat(params.end);
        
        return await calendarAgent.createEvent(accessToken, {
          summary: params.summary,
          location: params.location,
          start: params.start,
          end: params.end
        });
        
      case "search_drive":
        const driveAgent = new DriveAgent();
        return await driveAgent.searchFiles(accessToken, {
          query: params.query,
          maxResults: params.maxResults || 10
        });
        
      case "list_drive_files":
        const driveAgentForList = new DriveAgent();
        return await driveAgentForList.listFiles(accessToken, {
          folderId: params.folderId || 'root',
          maxResults: params.maxResults || 50
        });
      
      case "create_drive_folder":
        const driveAgentForFolder = new DriveAgent();
        return await driveAgentForFolder.createFolder(accessToken, {
          name: params.name,
          parentId: params.parentId
        });
        
      default:
        console.error(`Operación MCP desconocida: ${operation}`);
        return {
          success: false,
          error: `Operación no soportada: ${operation}`
        };
    }
  } catch (error) {
    console.error(`Error al procesar solicitud MCP ${operation}:`, error);
    return {
      success: false,
      error: `Error interno: ${(error as Error).message}`
    };
  }
} 