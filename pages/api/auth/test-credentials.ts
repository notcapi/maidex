import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar si las variables de entorno están establecidas
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;

    // Ocultar parte de las credenciales por seguridad
    const maskedClientId = clientId ? `${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 4)}` : 'No configurado';
    const maskedClientSecret = clientSecret ? `${clientSecret.substring(0, 4)}...${clientSecret.substring(clientSecret.length - 4)}` : 'No configurado';

    res.status(200).json({
      status: 'OK',
      credenciales: {
        clientId: maskedClientId,
        clientSecret: maskedClientSecret,
        nextAuthUrl,
        nextAuthSecret: nextAuthSecret ? '✓ Configurado' : '✗ No configurado',
      },
      baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      redirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
      mensaje: 'Verifica que estos valores coincidan con lo configurado en Google Cloud Console'
    });
  } catch (error) {
    console.error('Error al verificar credenciales:', error);
    res.status(500).json({ status: 'Error', mensaje: 'Error al verificar credenciales' });
  }
} 