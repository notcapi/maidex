import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar método
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Verificar autenticación
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Obtener token de acceso
    const accessToken = session.accessToken as string;
    if (!accessToken) {
      return res.status(401).json({ error: 'Token de acceso no disponible' });
    }

    // Obtener ID del archivo de Google Drive
    const { fileId } = req.query;
    if (!fileId || typeof fileId !== 'string') {
      return res.status(400).json({ error: 'ID de archivo no proporcionado' });
    }

    // Crear cliente de Google Drive
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Establecer token de acceso
    oauth2Client.setCredentials({
      access_token: accessToken
    });

    // Obtener información del archivo
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const fileResponse = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
    });

    if (!fileResponse.data) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Establecer nombre del archivo para la descarga
    const filename = fileResponse.data.name || 'downloaded-file';

    // Descargar el contenido del archivo
    const fileStream = await drive.files.get({
      fileId,
      alt: 'media',
    }, { responseType: 'stream' });

    // Configurar headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    if (fileResponse.data.mimeType) {
      res.setHeader('Content-Type', fileResponse.data.mimeType);
    }

    // Transmitir archivo al cliente
    fileStream.data.pipe(res);
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    return res.status(500).json({ error: 'Error al descargar archivo' });
  }
} 