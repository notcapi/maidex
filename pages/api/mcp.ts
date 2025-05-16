import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''; // Usar clave de servicio para API routes

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
    const { text, conversationId } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'Se requiere texto para procesar' });
    }
    
    // Aquí iría tu lógica existente de procesamiento MCP
    // Procesar el mensaje con Claude, OpenAI, etc.
    
    // Simulamos una respuesta para este ejemplo
    const response = `Recibí tu mensaje: "${text}". Este es un ejemplo de respuesta para el sistema de chat en tiempo real.`;
    
    // Guardar mensaje en Supabase si se proporciona un ID de conversación
    if (conversationId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Guardar mensaje del asistente
      await supabase.from('messages').insert({
        content: response,
        is_user: false,
        user_id: session.user?.email || 'anonymous',
        conversation_id: conversationId,
        created_at: new Date().toISOString()
      });
    }
    
    return res.status(200).json({
      success: true,
      response
    });
  } catch (error: any) {
    console.error('Error en MCP:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error en el servidor'
    });
  }
} 