import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { DriveAgent } from '@/agents/driveAgent';

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

    // Verificar que sea una solicitud GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Obtener el ID del archivo de la consulta
    const { fileId } = req.query;

    if (!fileId || typeof fileId !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere un ID de archivo válido' 
      });
    }

    // Obtener el token de acceso del usuario
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ 
        success: false,
        error: 'Token de acceso no disponible. Inicia sesión nuevamente.' 
      });
    }

    // Inicializar el agente de Drive y obtener el archivo
    const driveAgent = new DriveAgent();
    // Pasamos true como tercer parámetro para indicar que queremos la descarga completa
    const result = await driveAgent.getFile(accessToken, fileId, true);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'No se pudo descargar el archivo'
      });
    }

    const file = result.file;
    
    // Si no hay contenido disponible
    if (!file.content) {
      return res.status(400).json({
        success: false,
        error: 'El contenido del archivo no está disponible para descarga directa'
      });
    }

    // Configurar la respuesta para la descarga
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    
    // Enviar el contenido del archivo
    res.status(200).send(file.content);
    
  } catch (error: any) {
    console.error('Error al descargar archivo de Drive:', error);
    
    // Estructurar respuesta de error
    res.status(500).json({ 
      success: false,
      error: error.message || 'Error interno del servidor',
      errorCode: error.code || 'UNKNOWN_ERROR'
    });
  }
} 