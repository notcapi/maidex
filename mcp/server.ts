import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { EmailAgent } from '../agents/emailAgent';
import { CalendarAgent } from '../agents/calendarAgent';

/**
 * Servidor MCP que expone herramientas para envío de correos y creación de eventos
 */
export class MCPServer {
  private server: McpServer;
  private emailTool: any;
  private calendarTool: any;
  private emailAgent: EmailAgent;
  private calendarAgent: CalendarAgent;
  private accessToken: string;

  /**
   * Construye un nuevo servidor MCP
   * @param accessToken Token de acceso para Gmail y Calendar
   */
  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.emailAgent = new EmailAgent();
    this.calendarAgent = new CalendarAgent();

    this.server = new McpServer({
      name: "asistente-personal-mcp",
      version: "1.0.0"
    });

    // Configurar herramientas MCP
    this.setupTools();
  }

  /**
   * Configura las herramientas disponibles en el servidor MCP
   */
  private setupTools() {
    // Herramienta para enviar correos electrónicos
    this.emailTool = this.server.tool(
      "send_email",
      "Envía un correo electrónico a los destinatarios especificados",
      async (extra) => {
        // Parsear los parámetros correctamente
        // @ts-ignore - Ignoramos el error de tipo ya que la API de MCP puede variar
        const params = typeof extra === 'object' ? (extra.params || extra) : extra;
        const to = params.to;
        const subject = params.subject;
        const body = params.body;
        
        console.log("MCP: Ejecutando send_email con:", { to, subject, body });
        
        try {
          // Convertir a formato esperado por emailAgent
          const emailParams = {
            to: Array.isArray(to) ? to : [to as string],
            subject: subject as string,
            body: body as string
          };
          
          const result = await this.emailAgent.sendEmail(this.accessToken, emailParams);
          
          if (result.success) {
            return {
              content: [{
                type: "text",
                text: `Correo enviado correctamente a ${emailParams.to.join(', ')}`
              }]
            };
          } else {
            console.error("Error al enviar correo:", result.error);
            return {
              content: [{
                type: "text",
                text: `Error al enviar el correo: ${result.error}`
              }],
              isError: true
            };
          }
        } catch (error) {
          console.error("Error MCP en send_email:", error);
          return {
            content: [{
              type: "text",
              text: `Error al enviar el correo: ${(error as Error).message || "Error desconocido"}`
            }],
            isError: true
          };
        }
      }
    );
    
    // Parámetros para la herramienta de email
    this.emailTool.paramSchema = {
      type: "object",
      properties: {
        to: {
          type: "array",
          items: { type: "string" },
          description: "Lista de destinatarios"
        },
        subject: {
          type: "string",
          description: "Asunto del correo"
        },
        body: {
          type: "string",
          description: "Cuerpo del mensaje"
        }
      },
      required: ["to", "subject", "body"]
    };
    
    // Herramienta para crear eventos en el calendario
    this.calendarTool = this.server.tool(
      "create_event",
      "Crea un evento en el calendario del usuario",
      async (extra) => {
        // Parsear los parámetros correctamente
        // @ts-ignore - Ignoramos el error de tipo ya que la API de MCP puede variar
        const params = typeof extra === 'object' ? (extra.params || extra) : extra;
        const summary = params.summary;
        const start = params.start;
        const end = params.end;
        const location = params.location;
        
        console.log("MCP: Ejecutando create_event con:", { summary, start, end, location });
        
        try {
          const result = await this.calendarAgent.createEvent(this.accessToken, {
            summary: summary as string,
            start: start as string,
            end: end as string,
            location: (location as string) || ""
          });
          
          if (result.success) {
            return {
              content: [{
                type: "text",
                text: `Evento "${summary}" creado correctamente para el ${new Date(start as string).toLocaleString()}`
              }]
            };
          } else {
            console.error("Error al crear evento:", result.error);
            return {
              content: [{
                type: "text",
                text: `Error al crear el evento: ${result.error}`
              }],
              isError: true
            };
          }
        } catch (error) {
          console.error("Error MCP en create_event:", error);
          return {
            content: [{
              type: "text",
              text: `Error al crear el evento: ${(error as Error).message || "Error desconocido"}`
            }],
            isError: true
          };
        }
      }
    );
    
    // Parámetros para la herramienta de calendario
    this.calendarTool.paramSchema = {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Título del evento"
        },
        start: {
          type: "string",
          description: "Fecha y hora de inicio (formato ISO)"
        },
        end: {
          type: "string",
          description: "Fecha y hora de fin (formato ISO)"
        },
        location: {
          type: "string",
          description: "Ubicación del evento (opcional)"
        }
      },
      required: ["summary", "start", "end"]
    };
  }
  
  /**
   * Obtiene una versión serializada del servidor para pasar a la API de Anthropic
   */
  getSerializedTools() {
    // Obtenemos las herramientas que hemos creado manualmente
    const tools = [this.emailTool, this.calendarTool].filter(Boolean);
    
    return tools.map(tool => ({
      type: "custom",
      name: tool.name,
      description: "Herramienta para " + (
        tool.name === "send_email" ? 
        "enviar correos electrónicos" : 
        "crear eventos en el calendario"
      ),
      input_schema: tool.paramSchema
    }));
  }
  
  /**
   * Procesa una llamada a herramienta desde Claude
   */
  async processToolCall(toolName: string, params: any) {
    console.log(`Procesando llamada a herramienta: ${toolName} con parámetros:`, params);
    
    // Buscar la herramienta correspondiente
    let tool;
    if (toolName === "send_email") {
      tool = this.emailTool;
    } else if (toolName === "create_event") {
      tool = this.calendarTool;
    }
    
    if (!tool) {
      console.error(`Herramienta no encontrada: ${toolName}`);
      return {
        success: false,
        error: `Herramienta no disponible: ${toolName}`
      };
    }
    
    try {
      // Ejecutar la herramienta directamente
      if (toolName === "send_email") {
        return await this.emailAgent.sendEmail(this.accessToken, params);
      } else if (toolName === "create_event") {
        return await this.calendarAgent.createEvent(this.accessToken, params);
      }
      
      return {
        success: false,
        error: `Implementación de herramienta no disponible: ${toolName}`
      };
    } catch (error) {
      console.error(`Error al procesar llamada a ${toolName}:`, error);
      return {
        success: false,
        error: `Error al ejecutar la herramienta: ${(error as Error).message}`
      };
    }
  }
} 