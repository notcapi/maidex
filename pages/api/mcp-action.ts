import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { MCPServerManager } from '../../mcp/serverESM.mjs';
import { getConversation, getLastEmailRecipient } from '@/lib/conversation-store';
import { DriveAgent } from '@/agents/driveAgent';

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

    // Si es una acción de Google Drive, manejarla directamente aquí
    if (action === 'gdrive_operations') {
      try {
        // Extraer las operaciones solicitadas del texto usando heurísticas simples
        const operation = extractDriveOperation(text);
        
        if (!operation) {
          return res.status(400).json({
            success: false,
            error: 'No se pudo determinar la operación de Google Drive a realizar'
          });
        }
        
        // Ejecutar la operación usando el agente de Drive
        const driveAgent = new DriveAgent();
        const result = await driveAgent.handleDriveOperation(accessToken, operation);
        
        return res.status(result.success ? 200 : 400).json({
          success: result.success,
          result: result,
          params: operation
        });
      } catch (driveError: any) {
        console.error('Error al procesar operación de Drive:', driveError);
        return res.status(500).json({
          success: false,
          error: driveError.message || 'Error al procesar operación de Google Drive',
          errorCode: 'DRIVE_OPERATION_FAILED'
        });
      }
    }

    // Para otras acciones, continuar con el flujo normal de MCP
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

/**
 * Extrae la operación de Google Drive solicitada a partir del texto
 */
function extractDriveOperation(text: string): any {
  const lowerText = text.toLowerCase();
  
  // Lista de archivos - patrones mejorados
  if ((lowerText.includes('lista') || 
       lowerText.includes('dime') || 
       lowerText.includes('muestra') || 
       lowerText.includes('ver') || 
       lowerText.includes('dame') || 
       lowerText.includes('mostrar') || 
       lowerText.includes('que archivos tengo') || 
       lowerText.includes('cuáles son mis archivos') || 
       lowerText.includes('mis archivos') || 
       lowerText.includes('mis documentos')) && 
      (lowerText.includes('archivos') || 
       lowerText.includes('documentos') || 
       lowerText.includes('drive') || 
       lowerText.includes('google drive'))) {
    
    // Buscar una carpeta específica
    const folderMatch = text.match(/en (?:la )?carpeta ['"]?([\w\s]+)['"]?/i);
    const folderId = folderMatch ? folderMatch[1] : undefined;
    
    // Buscar un límite
    const limitMatch = text.match(/(?:muestra|lista|ver) (\d+) (?:archivos|documentos)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
    
    return {
      operation: 'list',
      folderId: folderId,
      limit: limit
    };
  }
  
  // Búsqueda de archivos
  if (lowerText.includes('busca') || lowerText.includes('encuentra')) {
    const queryMatch = text.match(/(?:busca|encuentra|buscar) (?:archivos?|documentos?)(?:\s+que contengan|\s+con|\s+llamados?)?(?:\s+['"]?)([a-zA-Z0-9\s]+)(?:['"]?)/i);
    
    if (queryMatch) {
      return {
        operation: 'search',
        query: queryMatch[1].trim()
      };
    }
  }
  
  // Crear un archivo
  if (lowerText.includes('crea') || lowerText.includes('nuevo')) {
    const nameMatch = text.match(/(?:crear|crea|nuevo) (?:un )?(?:archivo|documento)(?: llamado| con nombre| nombrado)? ['"]?([a-zA-Z0-9\s._-]+)['"]?/i);
    const contentMatch = text.match(/con (?:el )?(?:contenido|texto|datos)?:?\s+['"]?([\s\S]+?)['"]?(?:\s*$|(?=\s+con\s+))/i);
    
    if (nameMatch) {
      return {
        operation: 'create',
        name: nameMatch[1].trim(),
        content: contentMatch ? contentMatch[1].trim() : "Contenido del nuevo archivo",
        mimeType: lowerText.includes('html') ? 'text/html' : 'text/plain'
      };
    }
  }
  
  // Obtener un archivo por ID
  const fileIdMatch = text.match(/(?:obtén|obtener|muestra|mostrar|abre|abrir) (?:el )?(?:archivo|documento) (?:con id|con identificador|id)? ['"]?([a-zA-Z0-9_-]+)['"]?/i);
  if (fileIdMatch) {
    return {
      operation: 'get',
      fileId: fileIdMatch[1].trim()
    };
  }
  
  // Actualizar un archivo
  if (lowerText.includes('actualiza') || lowerText.includes('modifica') || lowerText.includes('edita')) {
    const updateIdMatch = text.match(/(?:actualiza|actualizar|modifica|modificar|edita|editar) (?:el )?(?:archivo|documento) (?:con id|con identificador|id)? ['"]?([a-zA-Z0-9_-]+)['"]?/i);
    const updateNameMatch = text.match(/(?:cambia|cambiar) (?:el )?nombre a ['"]?([a-zA-Z0-9\s._-]+)['"]?/i);
    const updateContentMatch = text.match(/(?:con|usando) (?:el )?(?:contenido|texto|datos)?:?\s+['"]?([\s\S]+?)['"]?(?:\s*$|(?=\s+con\s+))/i);
    
    if (updateIdMatch) {
      const updateOperation: any = {
        operation: 'update',
        fileId: updateIdMatch[1].trim()
      };
      
      if (updateNameMatch) {
        updateOperation.name = updateNameMatch[1].trim();
      }
      
      if (updateContentMatch) {
        updateOperation.content = updateContentMatch[1].trim();
      }
      
      return updateOperation;
    }
  }
  
  // Eliminar un archivo
  if (lowerText.includes('elimina') || lowerText.includes('borra')) {
    const deleteIdMatch = text.match(/(?:elimina|eliminar|borra|borrar) (?:el )?(?:archivo|documento) (?:con id|con identificador|id)? ['"]?([a-zA-Z0-9_-]+)['"]?/i);
    
    if (deleteIdMatch) {
      return {
        operation: 'delete',
        fileId: deleteIdMatch[1].trim()
      };
    }
  }
  
  // Si no se puede determinar la operación, devolver null
  return null;
} 