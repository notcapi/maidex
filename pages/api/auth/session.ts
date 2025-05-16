import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import initCors from './cors';

// Este endpoint proporciona información de la sesión actual
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Inicializar CORS
  if (initCors(req, res)) {
    // Si era una solicitud OPTIONS, ya se ha manejado
    return;
  }

  try {
    // Obtener la sesión del servidor
    const session = await getServerSession(req, res, authOptions);

    // Si hay una sesión, devolverla
    if (session) {
      res.status(200).json({
        user: session.user,
        accessToken: session.accessToken || null,
        expires: session.expires || null
      });
    } else {
      // Si no hay sesión, devolver un objeto vacío
      res.status(200).json({});
    }
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
    res.status(500).json({ error: 'Error al obtener la información de la sesión' });
  }
} 