import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { MCPServerManager } from '../../mcp/serverESM.mjs';
import { getConversation, getLastEmailRecipient } from '@/lib/conversation-store';
import { DriveAgent } from '@/agents/driveAgent';
import { getSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

// Crear instancia global del servidor MCP para reutilizarla entre solicitudes
let mcpServer: any = null;

// Almacenar el último destinatario de correo usado por cada usuario
const lastEmailRecipients = new Map<string, string[]>();

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    const { text, action, conversationId } = req.body;
    
    if (!text || !action) {
      return res.status(400).json({ success: false, error: 'Se requieren texto y acción para procesar' });
    }
    
    // Aquí iría tu lógica existente de procesamiento de acciones MCP
    // Envío de correos, creación de eventos, operaciones de Drive, etc.
    
    // Simulamos una respuesta para este ejemplo basada en la acción
    let responseData: any;
    let responseContent: string;
    
    switch (action) {
      case 'send_email':
        responseData = {
          success: true,
          params: {
            to: ['destinatario@ejemplo.com'],
            subject: 'Asunto del correo',
            body: 'Contenido del correo'
          }
        };
        responseContent = `He enviado un correo a ${responseData.params.to.join(', ')} con el asunto "${responseData.params.subject}".`;
        break;
        
      case 'create_event':
        responseData = {
          success: true,
          params: {
            title: 'Reunión importante',
            start: new Date().toISOString(),
            end: new Date(Date.now() + 3600000).toISOString(),
            description: 'Descripción del evento'
          }
        };
        responseContent = `He creado el evento "${responseData.params.title}" para el ${new Date(responseData.params.start).toLocaleString('es', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: 'numeric',
          minute: 'numeric'
        })}.`;
        break;
        
      case 'gdrive_operations':
        responseData = {
          success: true,
          action: 'list_files',
          result: {
            files: [
              { name: 'documento1.pdf', id: '123', mimeType: 'application/pdf' },
              { name: 'imagen.jpg', id: '456', mimeType: 'image/jpeg' },
              { name: 'hoja-calculo.xlsx', id: '789', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
            ]
          }
        };
        responseContent = `He encontrado ${responseData.result.files.length} archivos en tu Drive.`;
        break;
        
      default:
        responseData = {
          success: true,
          response: `Acción "${action}" procesada correctamente.`
        };
        responseContent = responseData.response;
    }
    
    // Guardar mensaje en Supabase si se proporciona un ID de conversación
    if (conversationId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Guardar mensaje del asistente
      await supabase.from('messages').insert({
        content: responseContent,
        is_user: false,
        user_id: session.user?.email || 'anonymous',
        conversation_id: conversationId,
        created_at: new Date().toISOString(),
        action: action,
        drive_files: action === 'gdrive_operations' ? responseData.result.files : null
      });
    }
    
    return res.status(200).json({
      success: true,
      ...responseData
    });
  } catch (error: any) {
    console.error('Error en MCP Action:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error en el servidor'
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
  
  // Descargar un archivo
  if (lowerText.includes('descarga') || lowerText.includes('obtén') || 
     (lowerText.includes('descargar') && lowerText.includes('archivo'))) {
    const fileIdMatch = text.match(/(?:descarga|descargar|obtén|obtener) (?:el )?(?:archivo|documento|fichero) (?:con id|con identificador|id)? ['"]?([a-zA-Z0-9_-]+)['"]?/i);
    const fileNameMatch = text.match(/(?:descarga|descargar|obtén|obtener) (?:el )?(?:archivo|documento|fichero) (?:llamado|con nombre|nombrado) ['"]?([a-zA-Z0-9\s._-]+)['"]?/i);
    
    if (fileIdMatch) {
      return {
        operation: 'get',
        fileId: fileIdMatch[1].trim(),
        rawDownload: true
      };
    } else if (fileNameMatch) {
      return {
        operation: 'search',
        query: fileNameMatch[1].trim(),
        includeDownloadLink: true
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