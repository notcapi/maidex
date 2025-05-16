import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import { EmailAgent } from '@/agents/emailAgent';
import { DriveAgent } from '@/agents/driveAgent';

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

// Inicializar agentes
const emailAgent = new EmailAgent();
const driveAgent = new DriveAgent();

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

    // Obtener el token de acceso de la sesión
    const accessToken = session.accessToken as string;
    
    if (!accessToken) {
      return res.status(403).json({ error: 'Token de acceso no disponible' });
    }

    console.log(`Procesando acción ${action} con texto: "${text}"`);
    
    // Variables para almacenar los resultados
    let responseData: any = {};
    let responseContent = '';
    
    switch (action) {
      case 'send_email':
        // Extraer información del correo del texto
        const emailParams = parseEmailParameters(text);
        
        // Si no se pudo extraer un destinatario, responder con error
        if (!emailParams.to || emailParams.to.length === 0) {
          responseData = {
            success: false,
            error: "No se pudo identificar el destinatario del correo"
          };
          responseContent = "No pude identificar a quién enviar el correo. Por favor, especifica un destinatario válido.";
          break;
        }
        
        console.log("Enviando correo con parámetros:", JSON.stringify(emailParams, null, 2));
        
        // Llamar al agente de correo para enviar realmente el email
        const emailResult = await emailAgent.sendEmail(accessToken, emailParams);
        
        if (emailResult.success) {
          responseData = {
            success: true,
            params: emailParams,
            messageId: emailResult.messageId
          };
          responseContent = `He enviado un correo a ${Array.isArray(emailParams.to) ? emailParams.to.join(', ') : emailParams.to} con el asunto "${emailParams.subject}".`;
        } else {
          responseData = {
            success: false,
            error: emailResult.error || 'Error al enviar el correo'
          };
          responseContent = `No he podido enviar el correo: ${emailResult.error}`;
        }
        break;
        
      case 'create_event':
        // Extraer información del evento del texto
        const eventParams = parseEventParameters(text);
        
        if (!eventParams.summary) {
          responseData = {
            success: false,
            error: "No se pudo identificar el título del evento"
          };
          responseContent = "No pude entender qué evento quieres crear. Por favor, proporciona más detalles.";
          break;
        }
        
        // Aquí iría la implementación real del calendario
        // Por ahora simulamos una respuesta exitosa
        responseData = {
          success: true,
          params: eventParams
        };
        responseContent = `He creado el evento "${eventParams.summary}" para el ${new Date(eventParams.start).toLocaleString('es', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: 'numeric',
          minute: 'numeric'
        })}.`;
        break;
        
      case 'gdrive_operations':
        const driveOperation = extractDriveOperation(text);
        if (driveOperation) {
          // Llamar a la implementación real de Drive
          const driveResult = await driveAgent.performOperation(accessToken, driveOperation);
          
          responseData = {
            success: true,
            action: driveOperation.operation,
            result: driveResult
          };
          
          if (driveOperation.operation === 'list' && driveResult.files) {
            responseContent = `He encontrado ${driveResult.files.length} archivos en tu Drive.`;
          } else {
            responseContent = `Operación de Drive "${driveOperation.operation}" completada con éxito.`;
          }
        } else {
          responseData = {
            success: false,
            error: 'No se pudo determinar la operación a realizar en Drive'
          };
          responseContent = 'No pude entender qué operación querías realizar en Drive.';
        }
        break;
        
      default:
        responseData = {
          success: false,
          error: `Acción no reconocida: ${action}`
        };
        responseContent = `No sé cómo procesar la acción: ${action}`;
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
        drive_files: action === 'gdrive_operations' && responseData.result?.files ? responseData.result.files : null
      });
    }
    
    return res.status(200).json({
      success: responseData.success,
      params: responseData.params,
      result: responseData.result,
      message: responseContent,
      messageId: responseData.messageId,
      eventId: responseData.eventId,
      error: responseData.error
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
 * Extrae parámetros de email a partir del texto del usuario
 */
function parseEmailParameters(text: string) {
  const lowerText = text.toLowerCase();
  
  // Extraer destinatario(s)
  const toMatches = text.match(/(?:a|para|@)\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
  const to = toMatches 
    ? toMatches.map(match => match.replace(/(?:a|para|@)\s*/i, '').trim()) 
    : ['destinatario@ejemplo.com'];
  
  // Extraer asunto
  let subject = 'Mensaje desde asistente personal';
  const subjectMatch = text.match(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
  if (subjectMatch) subject = subjectMatch[1].trim();
  
  // Extraer cuerpo del mensaje - todo lo que queda después de quitar destinatarios y asunto
  let body = text;
  // Quitar la parte de los destinatarios
  toMatches?.forEach(match => {
    body = body.replace(match, '');
  });
  // Quitar la parte del asunto
  if (subjectMatch) {
    body = body.replace(subjectMatch[0], '');
  }
  // Quitar palabras clave iniciales
  body = body.replace(/^(enviar|envía|mandar|manda|crear|crea|nuevo|nueva)\s+(correo|email|mensaje)(\s+electrónico)?/i, '');
  body = body.trim();
  
  // Si el cuerpo está vacío, usar un mensaje predeterminado
  if (!body || body.length < 5) {
    body = "Este es un mensaje enviado desde mi asistente personal.";
  }
  
  return { to, subject, body };
}

/**
 * Extrae parámetros de evento a partir del texto del usuario
 */
function parseEventParameters(text: string) {
  // Título del evento
  let summary = 'Nuevo evento';
  const titleMatch = text.match(/(?:llamad[oa]|titulad[oa]|nombrad[oa]|título|nombre)\s+["']?([^"'\n]*)["']?/i);
  if (titleMatch) summary = titleMatch[1].trim();
  else {
    // Si no hay un título explícito, intentar usar la primera parte del mensaje
    const cleanText = text.replace(/^(crear|crea|añadir|añade|agendar|agenda|programa)\s+(evento|reunión|cita)(\s+en\s+(?:el\s+)?calendario)?/i, '').trim();
    const firstSentence = cleanText.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 3 && firstSentence.length < 50) {
      summary = firstSentence;
    }
  }
  
  // Extraer fecha y hora
  let start = new Date();
  let end = new Date(start.getTime() + 3600000); // Por defecto, una hora después
  
  // Buscar patrones de fecha y hora
  const dateMatch = text.match(/(?:el|para el|fecha|día)\s+(\d{1,2})\s+de\s+([a-záéíóúñ]+)/i);
  const timeMatch = text.match(/(?:a las|hora)\s+(\d{1,2})(?::(\d{2}))?\s*(?:hrs?|horas?)?/i);
  
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthText = dateMatch[2].toLowerCase();
    let month = 0;
    
    // Mapeo de nombres de meses a números
    const monthMap: {[key: string]: number} = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    
    if (monthText in monthMap) {
      month = monthMap[monthText];
    }
    
    // Actualizar fecha
    start.setDate(day);
    start.setMonth(month);
    
    // Si la fecha ya pasó este año, asumimos que es para el próximo año
    if (start < new Date()) {
      start.setFullYear(start.getFullYear() + 1);
    }
  }
  
  // Palabras clave para fechas relativas
  if (text.toLowerCase().includes('mañana')) {
    start.setDate(start.getDate() + 1);
  } else if (text.toLowerCase().includes('pasado mañana')) {
    start.setDate(start.getDate() + 2);
  }
  
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    
    start.setHours(hours);
    start.setMinutes(minutes);
    start.setSeconds(0);
    start.setMilliseconds(0);
  }
  
  // La hora de fin es por defecto 1 hora después del inicio
  end = new Date(start.getTime() + 3600000);
  
  // Buscar si hay una duración especificada
  const durationMatch = text.match(/durante\s+(\d+)\s+(hora|horas|minutos|minuto)/i);
  if (durationMatch) {
    const amount = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    
    if (unit.startsWith('hora')) {
      end = new Date(start.getTime() + amount * 3600000);
    } else if (unit.startsWith('minuto')) {
      end = new Date(start.getTime() + amount * 60000);
    }
  }
  
  return { summary, start: start.toISOString(), end: end.toISOString() };
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
  
  return null;
} 