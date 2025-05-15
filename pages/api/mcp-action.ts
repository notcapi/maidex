import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { MCPServerManager } from '../../mcp/serverESM.mjs';
import { getConversation, getLastEmailRecipient } from '@/lib/conversation-store';

// Crear instancia global del servidor MCP para reutilizarla entre solicitudes
let mcpServer: any = null;

// Almacenar el último destinatario de correo usado por cada usuario
const lastEmailRecipients = new Map<string, string[]>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verificar si el usuario está autenticado
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar que sea una solicitud POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Obtener parámetros de la solicitud
    const { text, action } = req.body;

    if (!text || !action) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requieren los campos "text" y "action"' 
      });
    }

    // Obtener el token de acceso del usuario
    const accessToken = session.accessToken;
    const userEmail = session.user?.email || '';
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false,
        error: 'Token de acceso no disponible. Inicia sesión nuevamente.' 
      });
    }

    // Inicializar el servidor MCP si aún no existe
    if (!mcpServer) {
      console.log("Inicializando servidor MCP...");
      mcpServer = new MCPServerManager();
    }
    
    // Configurar el token de acceso en el servidor MCP
    mcpServer.setAccessToken(accessToken);

    try {
      // Ejecutar la consulta MCP con un tiempo límite para evitar esperas muy largas
      console.log(`Ejecutando acción MCP: ${action} con texto: ${text}`);
      const result = await mcpServer.executeQuery(text, action);
      
      // Si el resultado es exitoso y es un email, guardar el destinatario para referencia futura
      if (result.success && action === 'send_email' && result.params?.to) {
        lastEmailRecipients.set(userEmail, Array.isArray(result.params.to) ? result.params.to : [result.params.to]);
        console.log(`Guardando destinatario para futuras referencias: ${JSON.stringify(lastEmailRecipients.get(userEmail))}`);
      }
      
      // Devolver resultado
      return res.status(200).json(result);
    } catch (mcpError: any) {
      console.error('Error al procesar acción MCP:', mcpError);
      
      // Comprobar si es un error de sobrecarga
      const isOverloaded = mcpError.status === 529 || 
                           (mcpError.error && mcpError.error.error && mcpError.error.error.type === 'overloaded_error');
      
      if (isOverloaded) {
        console.log('Claude está sobrecargado, intentando fallback manual...');
        
        // Implementar un mecanismo de fallback sencillo solo para email
        if (action === 'send_email') {
          // Extraer destinatario del mensaje actual
          const toMatch = text.match(/(?:a|para|@)\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
          let to: string[] = [];
          
          // Si no hay un destinatario explícito, buscar referencias a destinatarios anteriores
          if (!toMatch) {
            const hasPreviousRecipientReference = /(?:mism[oa]|anterior|antes|igual|vuelve|otra vez|como antes|de nuevo|repetir|si|enviar)/i.test(text.toLowerCase());
            
            console.log('Buscando destinatario anterior. Referencia detectada:', hasPreviousRecipientReference);
            
            // Primera opción: Intentar usar el destinatario guardado en memoria
            if (lastEmailRecipients.has(userEmail) && lastEmailRecipients.get(userEmail)?.length) {
              to = lastEmailRecipients.get(userEmail) || [];
              console.log(`Usando destinatario de memoria para ${userEmail}:`, to);
            } 
            // Segunda opción: Buscar en el historial de conversación
            else {
              const lastRecipient = getLastEmailRecipient(userEmail);
              
              if (lastRecipient) {
                to = [lastRecipient];
                console.log(`Usando destinatario del historial para ${userEmail}:`, to);
              }
              // Si aún no hay destinatario, buscar en la conversación cualquier correo
              else {
                console.log('Buscando destinatario en historial de conversación...');
                const conversation = getConversation(userEmail);
                
                // Primero buscar en las respuestas del asistente que incluyan "He enviado"
                let foundEmail = false;
                for (let i = conversation.length - 1; i >= 0; i--) {
                  const msg = conversation[i];
                  
                  if (msg.role === 'assistant') {
                    const sentEmailMatch = msg.content.match(/(?:He|he) enviado (?:un|el) correo (?:a|al?) ([\w.-]+@[\w.-]+\.\w+)/i);
                    if (sentEmailMatch) {
                      to = [sentEmailMatch[1]];
                      console.log('Destinatario encontrado en mensajes del asistente:', to);
                      foundEmail = true;
                      break;
                    }
                  }
                }
                
                // Si no encontramos en las respuestas, buscar en cualquier mensaje
                if (!foundEmail) {
                  const emailPattern = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
                  
                  for (let i = conversation.length - 1; i >= 0; i--) {
                    const emailMatch = conversation[i].content.match(emailPattern);
                    if (emailMatch) {
                      to = [emailMatch[0]];
                      console.log('Destinatario encontrado en historial general:', to);
                      foundEmail = true;
                      break;
                    }
                  }
                }
              }
              
              // Si aún no encontramos un destinatario
              if (to.length === 0) {
                return res.status(422).json({
                  success: false,
                  error: 'No se pudo extraer el destinatario del correo. Por favor, especifica a quién quieres enviar el mensaje.'
                });
              }
            }
          } else {
            to = [toMatch[1]];
          }
          
          // Guardar el destinatario para futuras referencias
          lastEmailRecipients.set(userEmail, to);
          console.log(`Guardando destinatario en fallback: ${JSON.stringify(to)}`);
          
          // Intentar extraer asunto
          let subject = 'Mensaje desde tu asistente personal';
          const subjectMatch = text.match(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
          if (subjectMatch) subject = subjectMatch[1].trim();
          
          // Si no hay asunto específico pero es un mensaje de "adiós", usar ese asunto
          if (subject === 'Mensaje desde tu asistente personal' && 
              /adios|adiós|despedida|despedirse/i.test(text)) {
            subject = 'Adiós';
          }
          
          // Extraer cuerpo o usar un texto genérico
          let body = text
            .replace(/(?:envía|enviar|mandar|envia).*?(?:correo|email|mensaje|mail).*?(?:a|para).*?@.*?(?:con|y|diciendo)/, '')
            .replace(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i, '')
            .trim();
          
          // Si el cuerpo está vacío o es muy corto, usar texto genérico
          if (body.length < 10) {
            if (/adios|adiós|despedida|despedirse/i.test(text)) {
              body = "Adiós.";
            } else {
              body = `Mensaje enviado desde tu asistente personal.\n\nSolicitud original: ${text}`;
            }
          }
          
          try {
            // Llamar directamente a la función del servidor MCP
            console.log(`Enviando email en fallback a: ${to}, asunto: ${subject}`);
            const emailResult = await mcpServer.sendEmail({ to, subject, body });
            
            if (emailResult.success) {
              return res.status(200).json({
                success: true,
                result: {
                  message: 'Correo enviado mediante sistema de emergencia (Claude sobrecargado)'
                },
                params: { to, subject, body }
              });
            } else {
              throw new Error(emailResult.error || "Error al enviar correo");
            }
          } catch (fallbackError) {
            console.error('Error en fallback de email:', fallbackError);
            return res.status(503).json({
              success: false,
              error: 'Servicio temporalmente no disponible. Claude está sobrecargado y el fallback también falló.',
              originalError: mcpError.message || 'Error desconocido'
            });
          }
        }
        
        // Para otros tipos de acciones, devolver error de servicio no disponible
        return res.status(503).json({
          success: false,
          error: 'Claude está temporalmente sobrecargado. Por favor, inténtalo de nuevo en unos minutos.',
          originalError: mcpError.message || 'Error desconocido'
        });
      }
      
      // Para otros tipos de errores, devolver el error original
      return res.status(500).json({ 
        success: false,
        error: mcpError.message || 'Error interno del servidor',
        errorCode: mcpError.code || mcpError.status || 'UNKNOWN_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error al procesar la acción MCP:', error);
    
    // Estructurar respuesta de error
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Error interno del servidor',
      errorCode: error.code || 'UNKNOWN_ERROR'
    });
  }
} 