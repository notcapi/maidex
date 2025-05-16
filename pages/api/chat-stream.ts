import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getSession } from 'next-auth/react';

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''; // Usar clave de servicio para operaciones desde API routes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar método HTTP
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  // Obtener sesión del usuario
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const userId = session.user?.email || 'anonymous';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    if (req.method === 'GET') {
      // Obtener los mensajes para una conversación
      const { conversationId } = req.query;
      
      if (!conversationId || Array.isArray(conversationId)) {
        return res.status(400).json({ success: false, error: 'Se requiere un ID de conversación válido' });
      }
      
      // Consultar mensajes ordenados por timestamp
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, messages: data });
    } 
    else if (req.method === 'POST') {
      // Añadir un nuevo mensaje
      const { content, isUser, conversationId, action, driveFiles, fileId } = req.body;
      
      if (!content || !conversationId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Se requieren contenido y ID de conversación' 
        });
      }
      
      const newMessage = {
        content,
        is_user: isUser,
        conversation_id: conversationId,
        user_id: userId,
        created_at: new Date().toISOString(),
        action,
        drive_files: driveFiles,
        file_id: fileId
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select();
      
      if (error) throw error;
      
      return res.status(201).json({ success: true, message: data[0] });
    }
  } catch (error: any) {
    console.error('Error en la API de chat en tiempo real:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error en el servidor'
    });
  }
} 