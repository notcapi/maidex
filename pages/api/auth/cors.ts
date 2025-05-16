import type { NextApiRequest, NextApiResponse } from 'next';

// Middleware para manejar CORS en la API
export default function initCors(req: NextApiRequest, res: NextApiResponse) {
  // Obtener el origen de la solicitud o usar una URL segura
  const origin = req.headers.origin || 'https://maidex.vercel.app';

  // Configurar encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Manejar solicitudes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    res.status(200).end();
    return true;
  }
  
  return false;
} 