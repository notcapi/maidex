import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type Message = {
  id: number | string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  conversationId?: string;
  action?: 'send_email' | 'create_event' | 'gdrive_operations';
  driveFiles?: any[];
  fileId?: string;
};

type UseChatStreamOptions = {
  conversationId?: string;
  initialMessages?: Message[];
};

export function useChatStream({ conversationId, initialMessages = [] }: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar mensajes históricos cuando se proporciona un ID de conversación
  useEffect(() => {
    if (!conversationId) return;

    const loadHistoricalMessages = async () => {
      try {
        setIsLoading(true);
        
        // Obtener mensajes desde Supabase
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        // Convertir los datos al formato de Message
        const formattedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at),
          conversationId: msg.conversation_id,
          action: msg.action,
          driveFiles: msg.drive_files,
          fileId: msg.file_id
        }));
        
        setMessages(formattedMessages);
      } catch (err: any) {
        console.error('Error al cargar los mensajes:', err);
        setError(err.message || 'Error al cargar los mensajes');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHistoricalMessages();
  }, [conversationId]);

  // Suscribirse a nuevos mensajes
  useEffect(() => {
    if (!conversationId) return;
    
    // Establecer la suscripción a cambios en tiempo real
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Convertir el nuevo mensaje recibido al formato Message
        const newMessage: Message = {
          id: payload.new.id,
          content: payload.new.content,
          isUser: payload.new.is_user,
          timestamp: new Date(payload.new.created_at),
          conversationId: payload.new.conversation_id,
          action: payload.new.action,
          driveFiles: payload.new.drive_files,
          fileId: payload.new.file_id
        };
        
        // Añadir el nuevo mensaje al estado
        setMessages(prevMessages => [...prevMessages, newMessage]);
      })
      .subscribe();
    
    // Limpiar la suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  // Función para añadir un nuevo mensaje
  const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      setIsLoading(true);
      
      // Crear objeto de mensaje para la base de datos
      const messageToInsert = {
        content: message.content,
        is_user: message.isUser,
        conversation_id: conversationId,
        action: message.action,
        drive_files: message.driveFiles,
        file_id: message.fileId
      };
      
      // Insertar en Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert(messageToInsert)
        .select();
        
      if (error) throw error;
      
      // Si no hay errores, la suscripción se encargará de añadir el mensaje al estado
    } catch (err: any) {
      console.error('Error al añadir el mensaje:', err);
      setError(err.message || 'Error al añadir el mensaje');
      
      // Añadir mensaje localmente en caso de error (modo offline)
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: message.content,
        isUser: message.isUser,
        timestamp: new Date(),
        conversationId,
        action: message.action,
        driveFiles: message.driveFiles,
        fileId: message.fileId
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    addMessage
  };
} 