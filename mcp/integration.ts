import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import { EmailAgent } from '../agents/emailAgent';
import { CalendarAgent } from '../agents/calendarAgent';

export class MCPIntegration {
  private anthropic: Anthropic;
  private mcpBasePath: string;
  private emailAgent: EmailAgent;
  private calendarAgent: CalendarAgent;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    this.mcpBasePath = process.env.MCP_BASE_PATH || './mcp';
    this.emailAgent = new EmailAgent();
    this.calendarAgent = new CalendarAgent();
  }

  /**
   * Inicializa las capacidades de MCP para una sesión de modelo
   */
  async initializeMCP() {
    try {
      // Obtener la lista de capacidades MCP disponibles
      const capabilities = await this.getAvailableCapabilities();
      
      return capabilities;
    } catch (error) {
      console.error('Error al inicializar MCP:', error);
      throw new Error('No se pudieron inicializar las capacidades de MCP');
    }
  }

  /**
   * Obtiene las capacidades disponibles en el directorio de MCP
   */
  private async getAvailableCapabilities() {
    try {
      const capabilities: any[] = [];
      
      // Leer archivos de configuración MCP
      const schemasDir = join(this.mcpBasePath, 'schemas');
      if (fs.existsSync(schemasDir)) {
        const files = fs.readdirSync(schemasDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = join(schemasDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const config = JSON.parse(content);
            
            capabilities.push({
              name: config.name,
              config
            });
          }
        }
      }
      
      return capabilities;
    } catch (error) {
      console.error('Error al obtener capacidades MCP:', error);
      return [];
    }
  }

  /**
   * Ejecuta una consulta en el modelo con soporte MCP
   */
  async runWithMCP(prompt: string, accessToken: string, capabilities: string[] = []) {
    try {
      // Crear herramientas para el modelo
      const tools = capabilities.map(capability => {
        if (capability === 'send_email') {
          return {
            name: 'send_email',
            input_schema: this.getToolSchema('gmail_send.json', 'input_schema'),
            description: 'Envía un correo electrónico utilizando Gmail'
          };
        } else if (capability === 'create_event') {
          return {
            name: 'create_event',
            input_schema: this.getToolSchema('calendar_event.json', 'input_schema'),
            description: 'Crea un evento en Google Calendar'
          };
        }
        return null;
      }).filter(Boolean);
      
      console.log('Herramientas creadas para MCP:', tools.map(t => t?.name));
      
      // Determinar si hay herramientas disponibles
      const hasTools = tools.length > 0;
      
      // Mensaje del sistema específico para forzar el uso de herramientas
      let systemMessage = hasTools 
        ? 'Eres un asistente personal eficiente. DEBES USAR LAS HERRAMIENTAS proporcionadas en lugar de responder con texto cuando el usuario pide una acción específica. Cuando el usuario pide enviar un correo, SIEMPRE usa la herramienta send_email y NO respondas con texto. Cuando pide crear un evento, SIEMPRE usa la herramienta create_event. No expliques que vas a usar una herramienta, simplemente úsala.'
        : 'Eres un asistente personal eficiente. Responde de forma concisa y clara a las preguntas del usuario.';
      
      // Modificar el prompt para hacerlo más directo si hay una herramienta disponible
      let modifiedPrompt = prompt;
      
      if (hasTools) {
        if (capabilities.includes('send_email') && 
            (prompt.toLowerCase().includes('correo') || 
             prompt.toLowerCase().includes('email') || 
             prompt.toLowerCase().includes('envía') ||
             prompt.toLowerCase().includes('enviar'))) {
          
          // Analizar el prompt para extraer los componentes del correo
          let to = '', subject = '', body = '';
          
          // Buscar destinatario
          const toMatch = prompt.match(/(?:a|para)\s+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
          if (toMatch) to = toMatch[1];
          
          // Buscar asunto
          const subjectMatch = prompt.match(/(?:asunto|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
          if (subjectMatch) subject = subjectMatch[1].trim();
          else subject = "Mensaje automático";
          
          // El resto se considera como cuerpo si no hay indicaciones específicas
          if (!subject) subject = "Mensaje automático";
          
          // Si no se especifica un cuerpo, usar el prompt completo como base
          body = prompt.replace(/(?:envía|enviar|mandar|envia).*?correo.*?(?:a|para).*?@.*?(?:con|y)/, '')
                       .replace(/(?:asunto|subject)[:\s]+["']?([^"'\n.]*)["']?/i, '')
                       .trim();
          
          if (body.length < 5) body = "Nos vemos pronto. Mensaje enviado desde mi asistente personal.";
          
          // Construir un prompt más directo
          modifiedPrompt = `Usa la herramienta send_email para enviar un correo a ${to} con asunto "${subject}" y el siguiente contenido: "${body}"`;
        } 
        else if (capabilities.includes('create_event') && 
                (prompt.toLowerCase().includes('evento') || 
                 prompt.toLowerCase().includes('calendario') || 
                 prompt.toLowerCase().includes('reunión'))) {
          
          // Hacer lo mismo para eventos si es necesario
          modifiedPrompt = `Usa la herramienta create_event para ${prompt}`;
        }
      }
      
      console.log('Enviando prompt a Claude (modificado):', modifiedPrompt);
      
      // Ejecutar consulta en el modelo
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        system: systemMessage,
        messages: [
          {
            role: 'user',
            content: modifiedPrompt,
          },
        ],
        tools: hasTools ? tools as any : undefined,
        temperature: 0.3, // Reducir la temperatura para respuestas más deterministas
      });

      console.log('Claude respondió. Tipo de contenido:', response.content[0]?.type);
      
      // Procesar herramientas que se han llamado
      const firstContent = response.content[0];
      if (firstContent && firstContent.type === 'tool_use') {
        const toolUse = firstContent;
        const { name, input } = toolUse;
        
        console.log('Claude está usando la herramienta:', name);
        console.log('Parámetros de la herramienta:', JSON.stringify(input, null, 2));
        
        // Ejecutar la acción correspondiente
        let result;
        if (name === 'send_email') {
          // Asegurarnos de que los destinatarios estén en formato array
          const emailParams = input as any;
          if (emailParams.to && !Array.isArray(emailParams.to)) {
            console.log('Convirtiendo destinatario de string a array:', emailParams.to);
            emailParams.to = [emailParams.to];
          }
          
          result = await this.emailAgent.sendEmail(accessToken, emailParams);
          console.log('Resultado de envío de correo:', result);
        } else if (name === 'create_event') {
          result = await this.calendarAgent.createEvent(accessToken, input as any);
        }
        
        console.log('Resultado de la acción:', JSON.stringify(result, null, 2));
        
        // Generar respuesta con el resultado
        const followUpResponse = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          system: 'Eres un asistente personal eficiente. Responde de forma concisa y clara sobre el resultado de la operación que acabas de realizar.',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
            {
              role: 'assistant',
              content: [toolUse]
            },
            {
              role: 'user',
              content: `Resultado de la operación: ${JSON.stringify(result)}`,
            },
          ],
        });
        
        // Extraer y devolver el texto de la respuesta
        const responseContent = followUpResponse.content[0];
        if (responseContent && responseContent.type === 'text') {
          return responseContent.text;
        }
        
        if (result && result.success) {
          return 'El correo se ha enviado correctamente.';
        } else if (result) {
          return `Error al realizar la operación: ${result.error || 'Ocurrió un error desconocido'}`;
        }
        
        return 'La operación se completó correctamente';
      }

      // Si no se usó ninguna herramienta, pero se esperaba que se usara, intentarlo de nuevo con un prompt más directo
      if (hasTools && !(firstContent && response.content.some(item => item.type === 'tool_use'))) {
        console.log('Claude no usó la herramienta como se esperaba, intentando con prompt más directo...');
        
        // Preparar un prompt muy explícito según la capacidad
        let explicitPrompt = '';
        
        if (capabilities.includes('send_email')) {
          explicitPrompt = 'IMPORTANTE: UTILIZA LA HERRAMIENTA send_email PARA REALIZAR ESTA TAREA. NO RESPONDAS CON TEXTO. ' + modifiedPrompt;
        } else if (capabilities.includes('create_event')) {
          explicitPrompt = 'IMPORTANTE: UTILIZA LA HERRAMIENTA create_event PARA REALIZAR ESTA TAREA. NO RESPONDAS CON TEXTO. ' + modifiedPrompt;
        }
        
        if (explicitPrompt) {
          console.log('Intentando de nuevo con prompt explícito:', explicitPrompt);
          
          const retryResponse = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1000,
            system: 'Eres un asistente personal que DEBE USAR las herramientas proporcionadas. NUNCA respondas con texto cuando se te pida una acción como enviar correo o crear eventos. SIEMPRE usa las herramientas disponibles.',
            messages: [
              {
                role: 'user',
                content: explicitPrompt,
              },
            ],
            tools: tools as any,
            temperature: 0.1,
          });
          
          const retryContent = retryResponse.content[0];
          console.log('Segundo intento - Tipo de contenido:', retryContent?.type);
          
          if (retryContent && retryContent.type === 'tool_use') {
            // Seguir el mismo proceso que antes para ejecutar la herramienta
            const { name, input } = retryContent;
            console.log('Claude está usando la herramienta en segundo intento:', name);
            
            let result;
            if (name === 'send_email') {
              const emailParams = input as any;
              if (emailParams.to && !Array.isArray(emailParams.to)) {
                emailParams.to = [emailParams.to];
              }
              result = await this.emailAgent.sendEmail(accessToken, emailParams);
            } else if (name === 'create_event') {
              result = await this.calendarAgent.createEvent(accessToken, input as any);
            }
            
            if (result && result.success) {
              return 'La operación se completó correctamente.';
            } else if (result) {
              return `Error al realizar la operación: ${result.error || 'Ocurrió un error desconocido'}`;
            }
          }
        }
      }

      // Si no se usó ninguna herramienta, devolver la respuesta normal
      if (firstContent && firstContent.type === 'text') {
        return firstContent.text;
      }
      return 'No se pudo procesar la consulta';
    } catch (error) {
      console.error('Error al ejecutar consulta con MCP:', error);
      throw new Error('No se pudo ejecutar la consulta con MCP: ' + (error as Error).message);
    }
  }

  /**
   * Obtiene el esquema de una herramienta desde su archivo JSON
   */
  private getToolSchema(fileName: string, schemaType: 'input_schema' | 'output_schema') {
    try {
      const filePath = join(this.mcpBasePath, 'schemas', fileName);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const config = JSON.parse(content);
        return config[schemaType];
      }
      return {};
    } catch (error) {
      console.error(`Error al leer esquema ${schemaType} de ${fileName}:`, error);
      return {};
    }
  }
} 