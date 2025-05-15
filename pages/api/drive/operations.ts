import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { DriveAgent } from '@/agents/driveAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener la sesión del usuario para verificar autenticación
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const accessToken = session.accessToken as string;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Token de acceso no disponible' });
    }
    
    // Extraer parámetros de la solicitud
    const params = req.body;
    
    if (!params || !params.operation) {
      return res.status(400).json({ error: 'Parámetros incompletos. Se requiere al menos una operación.' });
    }
    
    // Validar parámetros según la operación
    const { operation } = params;
    
    // Validaciones específicas por tipo de operación
    if (['get', 'update', 'delete'].includes(operation) && !params.fileId) {
      return res.status(400).json({ error: 'Se requiere fileId para esta operación' });
    }
    
    if (operation === 'search' && !params.query) {
      return res.status(400).json({ error: 'Se requiere query para la búsqueda' });
    }
    
    if (['create', 'update'].includes(operation)) {
      if (!params.name) {
        return res.status(400).json({ error: 'Se requiere name para esta operación' });
      }
      
      if (operation === 'create' && !params.content) {
        return res.status(400).json({ error: 'Se requiere content para crear un archivo' });
      }
    }
    
    // Ejecutar la operación solicitada
    const driveAgent = new DriveAgent();
    const result = await driveAgent.handleDriveOperation(accessToken, params);
    
    // Devolver el resultado
    return res.status(result.success ? 200 : 400).json(result);
    
  } catch (error: any) {
    console.error('Error en operaciones de Drive:', error);
    return res.status(500).json({ 
      error: 'Error al procesar la operación de Drive',
      message: error.message
    });
  }
} 