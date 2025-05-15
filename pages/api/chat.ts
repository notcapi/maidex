import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import Anthropic from '@anthropic-ai/sdk';
import { getConversation, addMessage } from '@/lib/conversation-store';

// Inicializar cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuración para reintentos
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Función para esperar un tiempo determinado
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Extraer los datos de la solicitud
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Se requiere el campo "message"' });
    }

    // Obtener email del usuario para identificar la conversación
    const userEmail = session.user?.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'No se pudo identificar al usuario' });
    }

    // Obtener la conversación del usuario
    const conversation = getConversation(userEmail);
    
    // Agregar mensaje del usuario a la conversación con timestamp
    addMessage(userEmail, {
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Filtrar y transformar mensajes para adaptarse a la API de Claude
    const messages = conversation
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      // Ordenar por timestamp para asegurar secuencia correcta
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    // Para mensajes de sistema, los añadimos en el parámetro system
    const systemMessage = conversation.find(msg => msg.role === 'system')?.content || '';

    // Implementar reintentos con backoff exponencial
    let lastError: any = null;
    let response: Anthropic.Messages.Message | null = null;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Llamar a Claude con la conversación completa
        response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          temperature: 0.7,
          system: systemMessage,
          messages: messages
        });
        
        // Si llegamos aquí, la llamada fue exitosa
        break;
      } catch (error: any) {
        lastError = error;
        
        // Determinar si es un error temporal (como sobrecarga)
        const isTemporaryError = error.status === 529 || 
                               (error.error && error.error.error && error.error.error.type === 'overloaded_error');
        
        if (isTemporaryError && attempt < MAX_RETRIES - 1) {
          // Esperar antes de reintentar (con backoff exponencial)
          const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.log(`API sobrecargada. Reintentando en ${delayMs}ms... (intento ${attempt + 1}/${MAX_RETRIES})`);
          await wait(delayMs);
          continue;
        }
        
        // Si no es un error temporal o ya agotamos los reintentos, propagar el error
        throw error;
      }
    }
    
    if (!response) {
      throw lastError || new Error('No se pudo obtener respuesta de Claude después de múltiples intentos');
    }

    // Extraer la respuesta del asistente (asegurándonos de que sea texto)
    const responseContent = response.content.find(block => block.type === 'text');
    const assistantMessage = responseContent && responseContent.type === 'text' 
      ? responseContent.text 
      : 'Lo siento, ocurrió un error al procesar la respuesta.';

    // Guardar la respuesta del asistente en el historial con timestamp
    addMessage(userEmail, {
      role: 'assistant',
      content: assistantMessage,
      timestamp: Date.now()
    });

    // Devolver la respuesta
    return res.status(200).json({
      success: true,
      message: assistantMessage
    });
  } catch (error: any) {
    console.error('Error al procesar mensaje de chat:', error);
    
    // Mejorar el manejo de errores para casos específicos
    if (error.status === 529 || (error.error && error.error.error && error.error.error.type === 'overloaded_error')) {
      return res.status(503).json({
        success: false,
        error: 'El servicio de Claude está sobrecargado en este momento. Por favor, inténtalo de nuevo en unos minutos.',
        errorCode: 'CLAUDE_OVERLOADED'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
      errorCode: error.code || error.status || 'UNKNOWN_ERROR'
    });
  }
} 