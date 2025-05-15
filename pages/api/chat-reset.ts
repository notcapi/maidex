import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { resetConversation } from '@/lib/conversation-store';

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

    // Obtener email del usuario para identificar la conversación
    const userEmail = session.user?.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'No se pudo identificar al usuario' });
    }

    // Reiniciar la conversación del usuario
    resetConversation(userEmail);

    // Devolver éxito
    return res.status(200).json({
      success: true,
      message: 'Conversación reiniciada'
    });
  } catch (error: any) {
    console.error('Error al reiniciar conversación:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
} 