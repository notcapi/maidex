import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { EmailAgent } from '../../../agents/emailAgent';

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
    
    // Obtener el token de acceso de la sesión
    const accessToken = session.accessToken as string;
    
    if (!accessToken) {
      return res.status(403).json({ error: 'Token de acceso no disponible' });
    }

    // Verificar que sea una solicitud GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Obtener emails recientes
    const emailAgent = new EmailAgent();
    const emails = await emailAgent.getImportantEmails(accessToken, 20);
    
    return res.status(200).json(emails);
  } catch (error: any) {
    console.error('Error al obtener correos recientes:', error);
    
    return res.status(500).json({ 
      error: error.message || 'Error interno del servidor' 
    });
  }
} 