import { google } from 'googleapis';
import { EmailAgent } from './emailAgent';
import { CalendarAgent } from './calendarAgent';
import { MCPIntegration } from './mcpIntegration';
import Anthropic from '@anthropic-ai/sdk';

export class ActionAgent {
  private emailAgent: EmailAgent;
  private calendarAgent: CalendarAgent;
  private anthropic: Anthropic;
  private mcpIntegration: MCPIntegration;

  constructor() {
    this.emailAgent = new EmailAgent();
    this.calendarAgent = new CalendarAgent();
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    this.mcpIntegration = new MCPIntegration();
  }

  /**
   * Determina qué acción realizar basada en el texto del usuario
   */
  async determineAction(text: string): Promise<{ action: string; params: any }> {
    try {
      // Usar Claude para entender la intención del usuario
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 500,
        system: 'Eres un asistente que analiza el texto para determinar si el usuario quiere enviar un correo electrónico o crear un evento en el calendario. Responde SOLO con un objeto JSON que incluya "action" (send_email, create_event, o none) y los parámetros necesarios.',
        messages: [
          {
            role: 'user',
            content: `Analiza el siguiente mensaje y determina si el usuario quiere enviar un correo o crear un evento. Extrae los parámetros relevantes.
            
            Mensaje: "${text}"
            
            Si es un correo, extrae: destinatario, asunto y cuerpo.
            Si es un evento, extrae: título, fecha, hora inicio, hora fin, ubicación (opcional).
            
            Responde SOLO con un objeto JSON como este:
            Para correos: { "action": "send_email", "to": "email@example.com", "subject": "Asunto del correo", "body": "Cuerpo del correo" }
            Para eventos: { "action": "create_event", "summary": "Título del evento", "start": "2025-05-15T16:30:00", "end": "2025-05-15T17:30:00", "location": "Ubicación opcional" }
            Si no es ninguna acción concreta: { "action": "none" }`,
          },
        ],
        temperature: 0.1,
      });

      // Extraer el JSON de la respuesta
      const content = response.content[0];
      if (content.type === 'text') {
        // Intentar encontrar un objeto JSON en la respuesta
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          try {
            const result = JSON.parse(jsonStr);
            console.log('Acción detectada:', result);
            return result;
          } catch (e) {
            console.error('Error al parsear JSON:', e);
          }
        }
      }

      // Si no se pudo extraer un JSON válido, intentar extraer manualmente los parámetros
      return this.extractParamsManually(text);
    } catch (error) {
      console.error('Error al determinar la acción:', error);
      return { action: 'none', params: {} };
    }
  }

  /**
   * Extrae parámetros manualmente usando expresiones regulares como fallback
   */
  private extractParamsManually(text: string): { action: string; params: any } {
    const lowerText = text.toLowerCase();
    
    // Detectar si es un correo
    if (lowerText.includes('correo') || 
        lowerText.includes('email') || 
        lowerText.includes('envía') || 
        lowerText.includes('enviar') ||
        lowerText.includes('mandar')) {
      
      // Extraer destinatario
      const toMatch = text.match(/(?:a|para)\s+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const to = toMatch ? toMatch[1] : '';
      
      // Extraer asunto
      let subject = 'Mensaje desde tu asistente personal';
      const subjectMatch = text.match(/(?:asunto|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
      if (subjectMatch) subject = subjectMatch[1].trim();
      
      // El resto se considera el cuerpo
      let body = text
        .replace(/(?:envía|enviar|mandar|envia).*?correo.*?(?:a|para).*?@.*?(?:con|y)/, '')
        .replace(/(?:asunto|subject)[:\s]+["']?([^"'\n.]*)["']?/i, '')
        .trim();
      
      if (body.length < 5) body = "Nos vemos pronto. Mensaje enviado desde mi asistente personal.";
      
      return {
        action: 'send_email',
        params: { to: [to], subject, body }
      };
    } 
    // Detectar si es un evento
    else if (lowerText.includes('evento') || 
             lowerText.includes('reunión') || 
             lowerText.includes('cita') || 
             lowerText.includes('calendario')) {
      
      // Extraer título
      let summary = 'Evento';
      const titleMatch = text.match(/(?:titulado|llamado|título|title)[:\s]+["']?([^"'\n.]*)["']?/i);
      if (titleMatch) summary = titleMatch[1].trim();
      
      // Extraer fecha y hora
      const dateMatch = text.match(/(?:el día|fecha|el|para el)\s+(\d{1,2}(?:\s+)?(?:de)?\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de|del))?\s+(?:20\d{2})?)/i);
      const timeMatch = text.match(/(?:a las|hora)\s+(\d{1,2}(?::\d{2})?(?:\s*[apm]{2})?)/i);
      
      // Crear fechas predeterminadas
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(startTime.getHours() + 1);
      startTime.setMinutes(0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);
      
      // Aplicar fecha y hora si se encontraron
      if (dateMatch || timeMatch) {
        // Procesamiento adicional de fecha y hora
        // ...
      }
      
      return {
        action: 'create_event',
        params: {
          summary,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          location: ''
        }
      };
    }
    
    return { action: 'none', params: {} };
  }

  /**
   * Ejecuta una acción basada en texto del usuario
   */
  async executeAction(text: string, accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      // Determinar qué acción realizar
      const { action, params } = await this.determineAction(text);
      
      console.log(`Acción determinada: ${action}`);
      
      // Intentar primero con MCP directo
      if (action === 'send_email' || action === 'create_event') {
        try {
          console.log(`Intentando ejecutar acción con MCP: ${action}`);
          const mcpResult = await this.mcpIntegration.executeMCPAction(text, action);
          
          if (mcpResult.success && mcpResult.params) {
            // Si MCP tuvo éxito, ejecutamos la acción con los parámetros extraídos
            if (action === 'send_email') {
              // Verificar que hay un destinatario válido
              if (!mcpResult.params.to || !mcpResult.params.to.length) {
                return {
                  success: false,
                  message: 'No se pudo determinar el destinatario del correo. Por favor, especifica a quién quieres enviar el correo.'
                };
              }
              
              // Enviar el correo
              const result = await this.emailAgent.sendEmail(accessToken, mcpResult.params);
              
              if (result.success) {
                return {
                  success: true,
                  message: `Correo enviado correctamente a ${mcpResult.params.to.join(', ')}`
                };
              } else {
                return {
                  success: false,
                  message: `Error al enviar el correo: ${result.error}`
                };
              }
            } 
            else if (action === 'create_event') {
              // Verificar que hay un título
              if (!mcpResult.params.summary) {
                return {
                  success: false,
                  message: 'No se pudo determinar el título del evento. Por favor, especifica un título para el evento.'
                };
              }
              
              // Crear el evento
              const result = await this.calendarAgent.createEvent(accessToken, mcpResult.params);
              
              if (result.success) {
                return {
                  success: true,
                  message: `Evento "${mcpResult.params.summary}" creado correctamente para el ${new Date(mcpResult.params.start).toLocaleString()}`
                };
              } else {
                return {
                  success: false,
                  message: `Error al crear el evento: ${result.error}`
                };
              }
            }
          }
        } catch (mcpError) {
          console.error('Error en la integración MCP, continuando con método tradicional:', mcpError);
          // Si falla MCP, continuamos con el método tradicional
        }
      }
      
      // Si no se pudo usar MCP o falló, continuamos con el enfoque tradicional
      console.log(`Ejecutando acción tradicional: ${action}`);
      console.log('Parámetros:', JSON.stringify(params, null, 2));
      
      // Ejecutar la acción correspondiente
      if (action === 'send_email') {
        // Verificar que hay un destinatario válido
        if (!params.to || !params.to.length) {
          return {
            success: false,
            message: 'No se pudo determinar el destinatario del correo. Por favor, especifica a quién quieres enviar el correo.'
          };
        }
        
        // Convertir destinatario a array si no lo es
        const emailParams = {
          ...params,
          to: Array.isArray(params.to) ? params.to : [params.to]
        };
        
        // Enviar el correo
        const result = await this.emailAgent.sendEmail(accessToken, emailParams);
        
        if (result.success) {
          return {
            success: true,
            message: `Correo enviado correctamente a ${params.to.join(', ')}`
          };
        } else {
          return {
            success: false,
            message: `Error al enviar el correo: ${result.error}`
          };
        }
      } 
      else if (action === 'create_event') {
        // Verificar que hay un título
        if (!params.summary) {
          return {
            success: false,
            message: 'No se pudo determinar el título del evento. Por favor, especifica un título para el evento.'
          };
        }
        
        // Crear el evento
        const result = await this.calendarAgent.createEvent(accessToken, params);
        
        if (result.success) {
          return {
            success: true,
            message: `Evento "${params.summary}" creado correctamente para el ${new Date(params.start).toLocaleString()}`
          };
        } else {
          return {
            success: false,
            message: `Error al crear el evento: ${result.error}`
          };
        }
      }
      
      return {
        success: false,
        message: 'No se pudo determinar qué acción realizar. Por favor, intenta ser más específico.'
      };
    } catch (error) {
      console.error('Error al ejecutar la acción:', error);
      return {
        success: false,
        message: `Ocurrió un error al procesar tu solicitud: ${(error as Error).message}`
      };
    }
  }
} 