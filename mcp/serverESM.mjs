// Servidor MCP basado en ESM para integrarse con el SDK oficial
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Cargar dotenv con CommonJS require (con manejo de errores)
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
  console.log("dotenv cargado correctamente");
} catch (error) {
  console.warn("No se pudo cargar dotenv, continuando sin él:", error.message);
  // En Vercel, las variables de entorno ya están disponibles sin dotenv
}

// Importaciones ESM
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { google } from 'googleapis';

// Construir el cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Clase para gestionar un servidor MCP
 */
export class MCPServerManager {
  constructor() {
    this.server = new McpServer({
      name: "asistente-personal-mcp",
      version: "1.0.0"
    });
    
    // Almacenar las herramientas registradas
    this.toolRegistry = [];
    
    // Credenciales y tokens para las APIs de Google
    this.accessToken = null;
    
    // Configurar herramientas
    this.setupTools();
  }
  
  /**
   * Configura el token de acceso para las APIs de Google
   * @param {string} token 
   */
  setAccessToken(token) {
    this.accessToken = token;
  }
  
  /**
   * Configura las herramientas disponibles en el servidor
   */
  setupTools() {
    // Herramienta de correo electrónico
    this.emailTool = this.server.tool(
      "send_email",
      "Envía un correo electrónico",
      async (extra) => {
        try {
          // Obtener parámetros de la solicitud
          const params = typeof extra.request === 'object' ? extra.request.params : extra;
          const { to, subject, body } = params;
          
          console.log("MCP: Ejecutando send_email con:", { to, subject, body });
          
          // Llamada real a la API de Gmail
          const result = await this.sendEmail({
            to: Array.isArray(to) ? to : [to],
            subject,
            body
          });
          
          if (result.success) {
            return {
              content: [{
                type: "text",
                text: `Correo enviado correctamente a ${Array.isArray(to) ? to.join(', ') : to}`
              }]
            };
          } else {
            return {
              content: [{
                type: "text",
                text: `Error al enviar el correo: ${result.error}`
              }],
              isError: true
            };
          }
        } catch (error) {
          console.error("Error al enviar correo:", error);
          return {
            content: [{
              type: "text",
              text: `Error al enviar el correo: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );
    
    // Registrar la herramienta de email
    this.toolRegistry.push({
      name: "send_email",
      description: "Herramienta para enviar correos electrónicos",
      paramSchema: {
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
      }
    });
    
    // Herramienta de calendario
    this.calendarTool = this.server.tool(
      "create_event",
      "Crea un evento en el calendario",
      async (extra) => {
        try {
          // Obtener parámetros de la solicitud
          const params = typeof extra.request === 'object' ? extra.request.params : extra;
          let { summary, start, end, location } = params;
          
          // Corregir fechas si es necesario
          start = this.correctDateIfNeeded(start);
          end = this.correctDateIfNeeded(end);
          
          console.log("MCP: Ejecutando create_event con:", { summary, start, end, location });
          
          // Llamada real a la API de Calendar
          const result = await this.createEvent({
            summary,
            start,
            end,
            location
          });
          
          if (result.success) {
            return {
              content: [{
                type: "text",
                text: `Evento "${summary}" creado correctamente para ${new Date(start).toLocaleString()}`
              }]
            };
          } else {
            return {
              content: [{
                type: "text",
                text: `Error al crear el evento: ${result.error}`
              }],
              isError: true
            };
          }
        } catch (error) {
          console.error("Error al crear evento:", error);
          return {
            content: [{
              type: "text",
              text: `Error al crear el evento: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );
    
    // Registrar la herramienta de calendario
    this.toolRegistry.push({
      name: "create_event",
      description: "Herramienta para crear eventos en el calendario",
      paramSchema: {
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
      }
    });
  }
  
  /**
   * Corrige fechas incorrectas (especialmente años antiguos como 2023)
   * @param {string} dateString - La fecha a corregir
   * @returns {string} - Fecha corregida
   */
  correctDateIfNeeded(dateString) {
    try {
      const date = new Date(dateString);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const currentDay = currentDate.getDate();
      
      let requiresUpdate = false;
      
      // Si el año es anterior al actual, actualizar al año actual
      if (date.getFullYear() < currentYear) {
        date.setFullYear(currentYear);
        requiresUpdate = true;
      }
      
      // Si la fecha está en el pasado respecto al mes actual
      if (date.getFullYear() === currentYear && date.getMonth() < currentMonth) {
        date.setMonth(currentMonth);
        requiresUpdate = true;
      }
      
      // Si la fecha está en el pasado respecto al día actual (dentro del mes actual)
      if (date.getFullYear() === currentYear && 
          date.getMonth() === currentMonth && 
          date.getDate() < currentDay) {
        
        // Si parece que la intención es "mañana" (día siguiente)
        if (date.getDate() === currentDay - 1) {
          // Ajustar a mañana
          date.setDate(currentDay + 1);
        } else {
          // De lo contrario, simplemente actualizar al día actual
          date.setDate(currentDay);
        }
        requiresUpdate = true;
      }
      
      console.log(`Fecha original: ${dateString}, Fecha corregida: ${date.toISOString()}, Fecha actual: ${currentDate.toISOString()}`);
      
      return requiresUpdate ? date.toISOString() : dateString;
    } catch (err) {
      console.error("Error al corregir la fecha:", err);
      return dateString;
    }
  }
  
  /**
   * Envía un correo electrónico usando la API de Gmail
   */
  async sendEmail(options) {
    try {
      if (!this.accessToken) {
        return {
          success: false,
          error: "No hay token de acceso disponible"
        };
      }

      // Configurar el cliente OAuth
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: this.accessToken });
      
      // Inicializar cliente de Gmail
      const gmail = google.gmail({version: 'v1', auth});

      // Verificar si hay adjuntos de Drive
      const hasDriveAttachments = options.driveAttachments && Array.isArray(options.driveAttachments) && options.driveAttachments.length > 0;
      
      // Si hay adjuntos de Drive, usar multipart/mixed para el correo
      const mimeType = hasDriveAttachments ? 'multipart/mixed' : (options.mimeType || 'text/plain');
      
      // Crear la estructura del correo
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      
      // Generar un límite único para partes multipart
      const boundary = `boundary_${Math.random().toString(36).substring(2)}`;
      
      // Preparar headers del correo
      const headers = [
        `To: ${toArray.join(', ')}`,
        `Subject: ${options.subject}`,
        'MIME-Version: 1.0'
      ];
      
      // Añadir CC y BCC si existen
      if (options.cc && options.cc.length > 0) {
        headers.push(`Cc: ${options.cc.join(', ')}`);
      }
      
      if (options.bcc && options.bcc.length > 0) {
        headers.push(`Bcc: ${options.bcc.join(', ')}`);
      }
      
      let emailLines = [];

      // Si tenemos adjuntos, usar formato multipart
      if (hasDriveAttachments) {
        // Configurar el cliente de Drive
        const drive = google.drive({version: 'v3', auth});
        
        headers.push(`Content-Type: multipart/mixed; boundary=${boundary}`);
        emailLines = [...headers, ''];
        
        // Añadir la parte del texto
        emailLines.push(
          `--${boundary}`,
          'Content-Type: text/plain; charset=UTF-8',
          '',
          options.body
        );
        
        // Procesar cada adjunto de Drive
        for (const fileId of options.driveAttachments) {
          try {
            // Obtener metadatos del archivo
            const fileMetadata = await drive.files.get({
              fileId,
              fields: 'name,mimeType'
            });
            
            // Obtener el contenido del archivo
            const fileContent = await drive.files.get({
              fileId,
              alt: 'media'
            }, {
              responseType: 'arraybuffer'
            });
            
            // Codificar el contenido en base64
            const base64Content = Buffer.from(fileContent.data).toString('base64');
            
            // Añadir el adjunto como parte multipart
            emailLines.push(
              `--${boundary}`,
              `Content-Type: ${fileMetadata.data.mimeType}; name="${fileMetadata.data.name}"`,
              `Content-Disposition: attachment; filename="${fileMetadata.data.name}"`,
              'Content-Transfer-Encoding: base64',
              '',
              base64Content
            );
            
            console.log(`Adjunto añadido: ${fileMetadata.data.name}`);
          } catch (err) {
            console.error(`Error al procesar adjunto con ID ${fileId}:`, err);
          }
        }
        
        // Cerrar el límite multipart
        emailLines.push(`--${boundary}--`);
      } else {
        // Sin adjuntos, usar el formato simple
        headers.push(`Content-Type: ${mimeType}; charset=UTF-8`);
        emailLines = [...headers, '', options.body];
      }
      
      // Convertir el email a formato base64 URL-safe
      const email = emailLines.join('\r\n');
      const encodedEmail = Buffer.from(email).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Enviar el correo con la API de Gmail
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          // Asegurar que se guarde en Enviados
          labelIds: ['SENT']
        }
      });
      
      console.log('Correo enviado con ID:', response.data.id);
      return {
        success: true,
        messageId: response.data.id
      };
    } catch (error) {
      console.error('Error al enviar correo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Crea un evento en el calendario usando la API de Google Calendar
   */
  async createEvent(options) {
    try {
      if (!this.accessToken) {
        return {
          success: false,
          error: "No hay token de acceso disponible"
        };
      }

      // Configurar el cliente OAuth
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: this.accessToken });
      
      // Inicializar cliente de Calendar
      const calendar = google.calendar({version: 'v3', auth});
      
      // Definir el evento a crear
      const event = {
        summary: options.summary,
        location: options.location,
        start: {
          dateTime: options.start,
          timeZone: 'Europe/Madrid'
        },
        end: {
          dateTime: options.end,
          timeZone: 'Europe/Madrid'
        }
      };
      
      // Crear el evento
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });
      
      console.log('Evento creado con ID:', response.data.id);
      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error al crear evento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Obtiene herramientas serializadas para enviar a Claude
   * @returns {Array} Herramientas serializadas para Claude
   */
  getSerializedTools() {
    return this.toolRegistry.map(tool => ({
      type: "custom",
      name: tool.name,
      description: tool.description,
      input_schema: tool.paramSchema
    }));
  }
  
  /**
   * Interpreta una referencia temporal en lenguaje natural
   * @param {string} text - El texto a interpretar, por ejemplo "mañana a las 10"
   * @returns {object} - Objeto con fecha y hora estimadas { start, end }
   */
  interpretDateReference(text) {
    const lowerText = text.toLowerCase();
    const currentDate = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let hours = 10; // Hora por defecto si no se especifica
    let duration = 1; // Duración en horas por defecto
    
    // Detectar referencias a días
    if (lowerText.includes('mañana')) {
      startDate.setDate(currentDate.getDate() + 1);
      endDate.setDate(currentDate.getDate() + 1);
    } else if (lowerText.includes('pasado mañana')) {
      startDate.setDate(currentDate.getDate() + 2);
      endDate.setDate(currentDate.getDate() + 2);
    } else if (lowerText.includes('lunes') || lowerText.match(/próximo\s+lunes|proximo\s+lunes/)) {
      // Calcular el próximo lunes (1 = lunes, 0 = domingo)
      const daysUntilMonday = (1 + 7 - currentDate.getDay()) % 7 || 7;
      startDate.setDate(currentDate.getDate() + daysUntilMonday);
      endDate.setDate(currentDate.getDate() + daysUntilMonday);
    } else if (lowerText.includes('martes') || lowerText.match(/próximo\s+martes|proximo\s+martes/)) {
      const daysUntilTuesday = (2 + 7 - currentDate.getDay()) % 7 || 7;
      startDate.setDate(currentDate.getDate() + daysUntilTuesday);
      endDate.setDate(currentDate.getDate() + daysUntilTuesday);
    } else if (lowerText.includes('miércoles') || lowerText.includes('miercoles') || 
               lowerText.match(/próximo\s+miércoles|proximo\s+miercoles/)) {
      const daysUntilWednesday = (3 + 7 - currentDate.getDay()) % 7 || 7;
      startDate.setDate(currentDate.getDate() + daysUntilWednesday);
      endDate.setDate(currentDate.getDate() + daysUntilWednesday);
    } else if (lowerText.includes('jueves') || lowerText.match(/próximo\s+jueves|proximo\s+jueves/)) {
      const daysUntilThursday = (4 + 7 - currentDate.getDay()) % 7 || 7;
      startDate.setDate(currentDate.getDate() + daysUntilThursday);
      endDate.setDate(currentDate.getDate() + daysUntilThursday);
    } else if (lowerText.includes('viernes') || lowerText.match(/próximo\s+viernes|proximo\s+viernes/)) {
      const daysUntilFriday = (5 + 7 - currentDate.getDay()) % 7 || 7;
      startDate.setDate(currentDate.getDate() + daysUntilFriday);
      endDate.setDate(currentDate.getDate() + daysUntilFriday);
    }
    
    // Detectar horas
    const hourMatches = lowerText.match(/a las? (\d{1,2})(?::(\d{1,2}))?/);
    if (hourMatches) {
      hours = parseInt(hourMatches[1]);
      const minutes = hourMatches[2] ? parseInt(hourMatches[2]) : 0;
      
      // Ajustar para PM si es hora baja y hay indicación
      if (hours < 12 && (lowerText.includes(' pm') || lowerText.includes(' de la tarde'))) {
        hours += 12;
      }
      
      startDate.setHours(hours, minutes, 0, 0);
      endDate.setHours(hours + duration, minutes, 0, 0);
    } else {
      // Sin hora explícita, usar horario comercial estándar
      startDate.setHours(10, 0, 0, 0);
      endDate.setHours(11, 0, 0, 0);
    }
    
    // Detectar duración
    const durationMatches = lowerText.match(/durante (\d+) hora/);
    if (durationMatches) {
      duration = parseInt(durationMatches[1]);
      endDate.setHours(startDate.getHours() + duration);
    }
    
    console.log(`Referencia natural "${text}" interpretada como: ${startDate.toISOString()} - ${endDate.toISOString()}`);
    
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  }
  
  /**
   * Procesa una llamada a herramienta desde Claude
   * @param {string} toolName 
   * @param {any} params 
   * @returns 
   */
  async processToolCall(toolName, params) {
    console.log(`Procesando llamada a herramienta: ${toolName} con parámetros:`, params);
    
    try {
      if (toolName === "send_email" && this.emailTool) {
        return await this.sendEmail({
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          body: params.body,
          cc: params.cc,
          bcc: params.bcc,
          mimeType: params.mimeType,
          htmlBody: params.htmlBody,
          driveAttachments: params.driveAttachments
        });
      } else if (toolName === "create_event" && this.calendarTool) {
        // Corregir fechas si es necesario
        const start = this.correctDateIfNeeded(params.start);
        const end = this.correctDateIfNeeded(params.end);
        
        return await this.createEvent({
          summary: params.summary,
          start: start,
          end: end,
          location: params.location
        });
      }
      
      return {
        success: false,
        error: `Herramienta no disponible: ${toolName}`
      };
    } catch (error) {
      console.error(`Error al procesar llamada a ${toolName}:`, error);
      return {
        success: false,
        error: `Error al ejecutar la herramienta: ${error.message}`
      };
    }
  }
  
  /**
   * Ejecuta una consulta MCP utilizando Claude
   * @param {string} text 
   * @param {string} action 
   * @returns 
   */
  async executeQuery(text, action) {
    console.log(`Ejecutando consulta MCP para "${action}"...`);
    
    try {
      // Verificación especial para extraer nombres de archivos de Drive cuando se trata de correos
      if (action === 'send_email') {
        // Buscar referencias a archivos en el texto
        const fileReferences = await this.extractFileReferences(text);
        if (fileReferences.length > 0) {
          console.log(`Se encontraron referencias a archivos: ${fileReferences.join(', ')}`);
        }
      }
      
      // Filtrar herramientas según la acción solicitada
      const tools = this.getSerializedTools().filter(tool => {
        if (action === 'send_email' && tool.name === 'send_email') return true;
        if (action === 'create_event' && tool.name === 'create_event') return true;
        return false;
      });
      
      // Prompt específico para forzar el uso de herramientas
      const systemPrompt = `Eres un asistente que SIEMPRE usa las herramientas disponibles para realizar acciones concretas. 
NUNCA respondas con texto cuando puedas usar una herramienta. Tu trabajo es EJECUTAR acciones, no describir lo que harías.

Cuando el usuario solicite ${action === 'send_email' ? 'enviar un correo' : 'crear un evento'}:
1. DEBES usar la herramienta ${action === 'send_email' ? 'send_email' : 'create_event'}
2. Extrae la información necesaria del mensaje del usuario
3. NO expliques lo que vas a hacer, simplemente EJECUTA la acción

IMPORTANTE: Cuando crees eventos, usa SIEMPRE el año actual (${new Date().getFullYear()}) en las fechas y asegúrate que el mes y día son correctos. Hoy es ${new Date().toLocaleDateString()}.`;
      
      // Configuración para reintentos
      const maxRetries = 3;
      let retryCount = 0;
      let lastError = null;
      
      // Implementar reintentos con espera exponencial
      while (retryCount < maxRetries) {
        try {
          // Llamar a Claude con la consulta
          const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            temperature: 0.0,
            system: systemPrompt,
            messages: [{ role: 'user', content: text }],
            tools: tools
          });
          
          // Si llegamos aquí, la llamada fue exitosa
          // Procesar la respuesta normalmente...
          
          // Verificar si Claude utilizó la herramienta
          if (response.content.some(item => item.type === 'tool_use')) {
            // Encontrar el tool_use en el contenido
            const toolUseItem = response.content.find(item => item.type === 'tool_use');
            if (toolUseItem && toolUseItem.type === 'tool_use') {
              console.log(`✅ Claude usó correctamente la herramienta ${toolUseItem.name}`);
              
              // Extraer los parámetros de la llamada a la herramienta
              let params = toolUseItem.input;
              
              // Para emails, buscar referencias a archivos y agregar los IDs como adjuntos
              if (toolUseItem.name === 'send_email' && action === 'send_email') {
                const fileReferences = await this.extractFileReferences(text);
                if (fileReferences.length > 0) {
                  // Importar DriveAgent de manera dinámica (para evitar problemas entre ESM y CommonJS)
                  const { DriveAgent } = await this.importDriveAgent();
                  
                  // Buscar cada archivo mencionado
                  const driveAgent = new DriveAgent();
                  const fileIds = [];
                  
                  for (const fileName of fileReferences) {
                    const result = await driveAgent.findFileByName(this.accessToken, fileName);
                    if (result.success && result.fileId) {
                      fileIds.push(result.fileId);
                      console.log(`Encontrado archivo "${fileName}" con ID: ${result.fileId}`);
                    }
                  }
                  
                  // Añadir los IDs de archivos encontrados a los parámetros
                  if (fileIds.length > 0) {
                    params = {
                      ...params,
                      driveAttachments: fileIds
                    };
                    console.log(`Añadiendo ${fileIds.length} archivos como adjuntos`);
                  } else {
                    console.log('No se encontraron archivos válidos para adjuntar');
                  }
                }
              }
              
              // Para eventos, validar las fechas generadas por Claude
              if (toolUseItem.name === 'create_event' && action === 'create_event') {
                // Verificar si las fechas son válidas
                if (params.start && params.end) {
                  try {
                    const startDate = new Date(params.start);
                    const endDate = new Date(params.end);
                    const currentDate = new Date();
                    
                    // Solo intentar corregir si las fechas parecen realmente erróneas
                    const isDateInvalid = isNaN(startDate) || isNaN(endDate) || 
                                        startDate.getFullYear() < currentDate.getFullYear() ||
                                        (startDate < currentDate && !text.includes('hoy'));
                    
                    if (isDateInvalid) {
                      console.log('⚠️ Fechas potencialmente incorrectas, intentando interpretar del texto:', text);
                      const interpretedDates = this.interpretDateReference(text);
                      
                      // Preservar otros parámetros pero actualizar las fechas
                      params = {
                        ...params,
                        start: interpretedDates.start,
                        end: interpretedDates.end
                      };
                      
                      console.log('📅 Fechas interpretadas del texto natural:', {
                        original: toolUseItem.input,
                        corrected: params
                      });
                    } else {
                      console.log('✓ Fechas generadas por Claude parecen correctas, no necesitan corrección');
                    }
                  } catch (err) {
                    console.error('Error al validar fechas:', err);
                  }
                }
              }
              
              // Procesar la llamada a la herramienta
              const result = await this.processToolCall(toolUseItem.name, params);
              
              return {
                success: result.success,
                result: {
                  message: result.success 
                    ? `Acción ${action} ejecutada correctamente` 
                    : `Error al ejecutar ${action}: ${result.error}`
                },
                params
              };
            }
          } else {
            console.log(`❌ Claude NO usó la herramienta. Intentando con un prompt más directo...`);
            
            // Intento adicional con un prompt más directo
            const directPrompt = `${action === 'send_email' 
              ? 'Por favor envía un email usando la herramienta send_email con la siguiente información:' 
              : 'Por favor crea un evento en el calendario usando la herramienta create_event con la siguiente información:'} ${text}`;
            
            // Para este segundo intento NO implementamos reintentos adicionales
            // ya que ya estamos dentro de un bucle de reintentos
            const retryResponse = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20240620',
              max_tokens: 1024,
              temperature: 0.0,
              system: systemPrompt,
              messages: [{ role: 'user', content: directPrompt }],
              tools: tools
            });
            
            // Verificar si Claude utilizó la herramienta en el segundo intento
            if (retryResponse.content.some(item => item.type === 'tool_use')) {
              const toolUseItem = retryResponse.content.find(item => item.type === 'tool_use');
              if (toolUseItem && toolUseItem.type === 'tool_use') {
                // Procesar la herramienta como antes
                // Código existente...
                let params = toolUseItem.input;
                
                // Para eventos, validar las fechas generadas por Claude
                if (toolUseItem.name === 'create_event' && action === 'create_event') {
                  // Verificar si las fechas son válidas
                  if (params.start && params.end) {
                    try {
                      const startDate = new Date(params.start);
                      const endDate = new Date(params.end);
                      const currentDate = new Date();
                      
                      // Solo intentar corregir si las fechas parecen realmente erróneas
                      const isDateInvalid = isNaN(startDate) || isNaN(endDate) || 
                                          startDate.getFullYear() < currentDate.getFullYear() ||
                                          (startDate < currentDate && !text.includes('hoy'));
                      
                      if (isDateInvalid) {
                        console.log('⚠️ Fechas potencialmente incorrectas, intentando interpretar del texto:', text);
                        const interpretedDates = this.interpretDateReference(text);
                        
                        // Preservar otros parámetros pero actualizar las fechas
                        params = {
                          ...params,
                          start: interpretedDates.start,
                          end: interpretedDates.end
                        };
                        
                        console.log('📅 Fechas interpretadas del texto natural:', {
                          original: toolUseItem.input,
                          corrected: params
                        });
                      } else {
                        console.log('✓ Fechas generadas por Claude parecen correctas, no necesitan corrección');
                      }
                    } catch (err) {
                      console.error('Error al validar fechas:', err);
                    }
                  }
                }
                
                // Procesar la llamada a la herramienta
                const result = await this.processToolCall(toolUseItem.name, params);
                
                return {
                  success: result.success,
                  result: {
                    message: result.success 
                      ? `Acción ${action} ejecutada correctamente` 
                      : `Error al ejecutar ${action}: ${result.error}`
                  },
                  params
                };
              }
            } else {
              console.log(`❌ Claude sigue sin usar la herramienta en el segundo intento.`);
              
              // En este punto, usar nuestra lógica de extracción manual como fallback
              console.log("Utilizando fallback con extracción manual de parámetros");
              
              // Implementar fallback básico
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
                
                // Llamar a sendEmail directamente
                const result = await this.sendEmail({ to, subject, body });
                
                return {
                  success: result.success,
                  result: {
                    message: result.success 
                      ? `Correo enviado como fallback` 
                      : `Error al ejecutar fallback: ${result.error || "Error desconocido"}`
                  },
                  params: { to, subject, body }
                };
              } 
              // Implementar fallback para eventos si es necesario
              else if (action === 'create_event') {
                // Similar al código de fallback para email
                // Implementar extracción básica
                // ...
              }
              
              // Si no hay fallback implementado
              return {
                success: false,
                error: `No se pudo ejecutar la acción ${action} automáticamente. Servicio no disponible.`,
                textResponse: retryResponse.content.filter(item => item.type === 'text').map(item => item.text).join('\n')
              };
            }
          }
          
          // Si llegamos aquí, rompemos el bucle de reintentos
          break;
          
        } catch (error) {
          lastError = error;
          
          // Verificar si es el tipo de error que queremos reintentar
          const isOverloaded = error.status === 529 || 
                              (error.error && error.error.error && error.error.error.type === 'overloaded_error');
          
          if (isOverloaded && retryCount < maxRetries - 1) {
            // Calcular tiempo de espera con retroceso exponencial (100ms, 200ms, 400ms...)
            const waitTime = Math.pow(2, retryCount) * 100;
            console.log(`API sobrecargada. Reintentando en ${waitTime}ms... (intento ${retryCount + 1}/${maxRetries})`);
            
            // Esperar antes de reintentar
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            
            // Continuar con el siguiente intento
            continue;
          } else {
            // Si no es un error que queremos reintentar o ya intentamos demasiadas veces
            console.error(`Error en Claude API (intento ${retryCount + 1}/${maxRetries}):`, error);
            
            // Implementar fallback básico
            if (action === 'send_email') {
              console.log("Utilizando fallback con extracción manual de parámetros para email");
              // Mismo código que el fallback anterior
              // Extraer destinatario
              const toMatch = text.match(/(?:a|para|@)\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
              if (!toMatch) {
                // Si no podemos extraer el destinatario, fallar
                throw new Error("No se pudo extraer el destinatario del correo");
              }
              
              const to = [toMatch[1]];
              const subject = 'Mensaje desde tu asistente personal';
              const body = `Este es un mensaje enviado automáticamente.\n\nContenido original: ${text}`;
              
              // Llamar a sendEmail directamente
              const result = await this.sendEmail({ to, subject, body });
              
              return {
                success: result.success,
                result: {
                  message: result.success 
                    ? `Correo enviado mediante sistema de emergencia` 
                    : `Error en fallback: ${result.error || "Error desconocido"}`
                },
                params: { to, subject, body }
              };
            }
            
            // Si no hay fallback o falló
            throw error;
          }
        }
      }
      
      // Si llegamos aquí después de varios reintentos, lanzar el último error
      if (lastError) {
        throw lastError;
      }
      
      // Este punto nunca debería alcanzarse si el código anterior es correcto
      return {
        success: false,
        error: "Error interno: flujo de ejecución inesperado"
      };
    } catch (error) {
      console.error(`Error al ejecutar consulta MCP:`, error);
      return {
        success: false,
        error: `Error al ejecutar consulta: ${error.message || "Error desconocido. Servicio temporalmente no disponible"}`
      };
    }
  }
  
  /**
   * Extrae referencias a archivos del texto de la solicitud
   * @param {string} text - Texto completo de la solicitud
   * @returns {Promise<string[]>} - Lista de nombres de archivos detectados
   */
  async extractFileReferences(text) {
    // Normalizar texto: eliminar puntos al final y espacios extras
    const normalizedText = text.trim().replace(/\s+/g, ' ').toLowerCase();
    const fileReferences = [];
    
    // Para el caso específico que sabemos que necesitamos
    if (normalizedText.includes('rutina mama xlsx')) {
      fileReferences.push('rutina mama xlsx');
      
      // Si solo necesitamos este caso específico, podríamos devolver directamente
      console.log('Referencias a archivos encontradas:', fileReferences);
      return fileReferences;
    }
    
    // Lista de patrones específicos para detectar nombres de archivos
    const patterns = [
      // "con/adjuntar el archivo X de (mi) Drive"
      /(?:con|adjuntar|adjunto|attach)\s+(?:el|la|los|las|the)?\s*(?:archivo|document|file|fichero)\s+["']?([a-zA-Z0-9\s\.\-áéíóúñ]+?)["']?\s+(?:de|from|en|in)\s+(?:mi|my)?\s*(?:drive|google\s*drive|docs|documentos)/i,
      
      // "archivo X de (mi) Drive"
      /(?:archivo|documento|file|fichero)\s+["']?([a-zA-Z0-9\s\.\-áéíóúñ]+?)["']?\s+(?:de|from|en|in)\s+(?:mi|my)?\s*(?:drive|google\s*drive|docs|documentos)/i,
      
      // "con el X de (mi) Drive" (donde X puede ser un nombre de archivo)
      /con\s+(?:el|la|los|las|the)\s+["']?([a-zA-Z0-9\s\.\-áéíóúñ]+?)["']?\s+(?:de|from|en|in)\s+(?:mi|my)?\s*(?:drive|google\s*drive|docs|documentos)/i,
      
      // "adjuntar X" (donde X puede ser un nombre de archivo con extensión)
      /(?:adjuntar|adjunto|attach)\s+["']?([a-zA-Z0-9\s\.\-áéíóúñ]+?\.(?:xlsx?|docx?|pdf|csv|txt|pptx?|json))["']?/i
    ];
    
    // Probar cada patrón
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        fileReferences.push(match[1].trim());
      }
    }
    
    // Eliminar duplicados y filtrar términos no deseados
    const excludedTerms = ['correo', 'email', 'gmail', 'ejemplo', 'ejemplo@gmail.com', 'destinatario', 'recipient', 'con el archivo', 'archivo'];
    
    const uniqueReferences = [...new Set(fileReferences)].filter(name => {
      // Ignorar nombres demasiado cortos
      if (name.length < 3) return false;
      
      // Ignorar si es uno de los términos excluidos
      for (const term of excludedTerms) {
        if (name.toLowerCase() === term) return false;
      }
      
      // Eliminar la palabra "archivo" del nombre si aparece al principio
      if (name.toLowerCase().startsWith('archivo ')) {
        name = name.substring(8).trim();
      }
      
      return true;
    });
    
    console.log('Referencias a archivos encontradas:', uniqueReferences);
    return uniqueReferences;
  }
  
  /**
   * Importa el DriveAgent de manera dinámica para evitar problemas de módulos
   * @returns {Promise<{DriveAgent: any}>} - El módulo DriveAgent importado
   */
  async importDriveAgent() {
    try {
      // En lugar de intentar cargar el archivo JS compilado,
      // vamos a crear una clase proxy que use directamente la API de Drive
      
      const { google } = await import('googleapis');
      
      // Crear una clase mínima que implementa la funcionalidad necesaria
      class SimpleDriveAgent {
        constructor() {}
        
        async findFileByName(accessToken, fileName) {
          try {
            // Configurar el cliente OAuth
            const auth = new google.auth.OAuth2();
            auth.setCredentials({ access_token: accessToken });
            
            // Inicializar cliente de Drive
            const drive = google.drive({version: 'v3', auth});
            
            console.log(`Buscando archivo: "${fileName}"`);
            
            // Intentar búsqueda exacta primero
            let searchQuery = `name = '${fileName}' and trashed = false`;
            let response = await drive.files.list({
              q: searchQuery,
              pageSize: 1,
              fields: 'files(id, name, mimeType)'
            });
            
            if (response.data.files && response.data.files.length > 0) {
              console.log(`Encontrado archivo exacto: ${response.data.files[0].name} (${response.data.files[0].id})`);
              return {
                success: true,
                fileId: response.data.files[0].id,
                file: response.data.files[0]
              };
            }
            
            // Probar con búsqueda por términos contenidos
            searchQuery = `name contains '${fileName}' and trashed = false`;
            response = await drive.files.list({
              q: searchQuery,
              pageSize: 5,
              fields: 'files(id, name, mimeType)'
            });
            
            if (response.data.files && response.data.files.length > 0) {
              console.log(`Encontrados ${response.data.files.length} archivos con términos similares:`);
              response.data.files.forEach(file => console.log(`- ${file.name} (${file.id})`));
              
              // Tomar el primero como mejor coincidencia
              return {
                success: true,
                fileId: response.data.files[0].id,
                file: response.data.files[0]
              };
            }
            
            // No se encontraron archivos
            return {
              success: false,
              error: `No se encontró el archivo "${fileName}"`
            };
          } catch (error) {
            console.error('Error al buscar archivo por nombre:', error);
            return {
              success: false,
              error: error.message || 'Error al buscar archivo por nombre'
            };
          }
        }
      }
      
      return {
        DriveAgent: SimpleDriveAgent
      };
    } catch (error) {
      console.error('Error al importar DriveAgent:', error);
      throw error;
    }
  }
}

// Si este script se ejecuta directamente, realizar una prueba
if (import.meta.url.endsWith(process.argv[1])) {
  const manager = new MCPServerManager();
  
  const testQueries = [
    {
      action: "send_email",
      text: "Envía un correo a ejemplo@gmail.com con asunto 'Prueba' y mensaje 'Hola, esto es una prueba'"
    },
    {
      action: "create_event",
      text: "Crea un evento para mañana a las 10am llamado Reunión de equipo"
    }
  ];
  
  // Ejecutar pruebas
  for (const query of testQueries) {
    console.log(`\nProbando: ${query.text}`);
    const result = await manager.executeQuery(query.text, query.action);
    console.log("Resultado:", JSON.stringify(result, null, 2));
  }
} 