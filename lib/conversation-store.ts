import fs from 'fs';
import path from 'path';

// Almacén en memoria para conversaciones de chat
// En una implementación de producción esto se guardaría en una base de datos

// Tipos para los mensajes
export type Message = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string; // Para mensajes de herramientas
  timestamp?: number; // Añadir timestamp para ordenar mensajes
  metadata?: {
    emailRecipients?: string[]; // Para almacenar destinatarios de correo
    emailSubject?: string;      // Para almacenar asunto de correo
    action?: string;            // Acción realizada (send_email, create_event, etc.)
  };
};

// Mapeo de email de usuario a su historial de conversación
export const sessionConversations = new Map<string, Message[]>();

// Directorio para almacenar conversaciones
const CONVERSATIONS_DIR = path.join(process.cwd(), 'data', 'conversations');

// Asegurar que el directorio existe
try {
  if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'));
  }
  if (!fs.existsSync(CONVERSATIONS_DIR)) {
    fs.mkdirSync(CONVERSATIONS_DIR);
  }
} catch (error) {
  console.error('Error al crear directorios para conversaciones:', error);
}

/**
 * Obtiene el path del archivo de conversación para un usuario
 */
function getConversationFilePath(userEmail: string): string {
  // Sanitizar el email para usarlo como nombre de archivo
  const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
  return path.join(CONVERSATIONS_DIR, `${sanitizedEmail}.json`);
}

/**
 * Carga la conversación del almacenamiento persistente
 */
function loadConversationFromDisk(userEmail: string): Message[] {
  const filePath = getConversationFilePath(userEmail);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(data);
      
      // Verificar que el formato sea correcto
      if (Array.isArray(parsedData)) {
        console.log(`Conversación cargada para ${userEmail} con ${parsedData.length} mensajes`);
        return parsedData;
      } else {
        console.error(`El archivo de conversación para ${userEmail} no tiene el formato correcto`);
      }
    }
  } catch (error) {
    console.error(`Error al cargar conversación para ${userEmail}:`, error);
  }
  return [];
}

/**
 * Guarda la conversación en almacenamiento persistente
 */
function saveConversationToDisk(userEmail: string, conversation: Message[]): void {
  const filePath = getConversationFilePath(userEmail);
  try {
    fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2), 'utf8');
    console.log(`Conversación guardada para ${userEmail} con ${conversation.length} mensajes`);
  } catch (error) {
    console.error(`Error al guardar conversación para ${userEmail}:`, error);
  }
}

/**
 * Obtiene la conversación de un usuario o la inicializa si no existe
 */
export function getConversation(userEmail: string): Message[] {
  if (!sessionConversations.has(userEmail)) {
    // Intentar cargar la conversación del disco primero
    const loadedConversation = loadConversationFromDisk(userEmail);
    
    if (loadedConversation.length > 0) {
      sessionConversations.set(userEmail, loadedConversation);
    } else {
      // Inicializar con un mensaje del sistema
      sessionConversations.set(userEmail, [
        {
          role: "system",
          content: "Eres un asistente personal que ayuda con correos y eventos de calendario usando Google. Puedes enviar correos, crear eventos, y buscar información en Gmail y Google Calendar.",
          timestamp: Date.now()
        }
      ]);
    }
  }
  return sessionConversations.get(userEmail)!;
}

/**
 * Añade un mensaje a la conversación de un usuario
 */
export function addMessage(userEmail: string, message: Message): Message[] {
  const conversation = getConversation(userEmail);
  
  // Añadir timestamp si no tiene
  if (!message.timestamp) {
    message.timestamp = Date.now();
  }
  
  // Si es un mensaje del asistente que menciona enviar un correo, extraer el destinatario
  if (message.role === 'assistant' && message.content.includes('enviado un correo a')) {
    const emailMatch = message.content.match(/(?:He|he) enviado (?:un|el) correo (?:a|al?) ([\w.-]+@[\w.-]+\.\w+)/i);
    if (emailMatch) {
      // Guardar el destinatario en los metadatos
      message.metadata = {
        ...message.metadata,
        emailRecipients: [emailMatch[1]],
        action: 'send_email'
      };
      
      // Buscar el asunto si se menciona
      const subjectMatch = message.content.match(/con (?:el )?asunto ["'](.+?)["']/i);
      if (subjectMatch) {
        message.metadata.emailSubject = subjectMatch[1];
      }
    }
  }
  
  conversation.push(message);
  
  // Limitar el tamaño del historial para evitar tokens excesivos
  // Aumentamos el límite para mantener más contexto
  if (conversation.length > 30) {
    // Mantener el mensaje del sistema y los últimos 29 mensajes
    const systemMessage = conversation.find(msg => msg.role === "system");
    const recentMessages = conversation.slice(-29);
    const newConversation = systemMessage ? [systemMessage, ...recentMessages] : recentMessages;
    sessionConversations.set(userEmail, newConversation);
    
    // Guardar en disco
    saveConversationToDisk(userEmail, newConversation);
    return newConversation;
  }
  
  // Guardar en disco
  saveConversationToDisk(userEmail, conversation);
  return conversation;
}

/**
 * Obtiene el último destinatario de correo electrónico usado
 */
export function getLastEmailRecipient(userEmail: string): string | undefined {
  const conversation = getConversation(userEmail);
  
  // Buscar de más reciente a más antiguo
  for (let i = conversation.length - 1; i >= 0; i--) {
    const msg = conversation[i];
    
    // Primero buscar en metadatos
    if (msg.metadata?.emailRecipients && msg.metadata.emailRecipients.length > 0) {
      return msg.metadata.emailRecipients[0];
    }
    
    // Si no hay metadatos, buscar en el contenido
    if (msg.role === 'assistant') {
      const emailMatch = msg.content.match(/(?:He|he) enviado (?:un|el) correo (?:a|al?) ([\w.-]+@[\w.-]+\.\w+)/i);
      if (emailMatch) {
        return emailMatch[1];
      }
    }
  }
  
  // Buscar cualquier email en la conversación como último recurso
  const emailPattern = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  for (let i = conversation.length - 1; i >= 0; i--) {
    const emailMatch = conversation[i].content.match(emailPattern);
    if (emailMatch) {
      return emailMatch[0];
    }
  }
  
  return undefined;
}

/**
 * Reinicia la conversación de un usuario
 */
export function resetConversation(userEmail: string): void {
  if (sessionConversations.has(userEmail)) {
    const systemMessage = sessionConversations.get(userEmail)!.find(msg => msg.role === "system");
    const newConversation = systemMessage ? [systemMessage] : [];
    sessionConversations.set(userEmail, newConversation);
    
    // Guardar en disco
    saveConversationToDisk(userEmail, newConversation);
    
    console.log(`Conversación reiniciada para ${userEmail}`);
  }
}

/**
 * Devuelve todas las conversaciones (para depuración)
 */
export function getAllConversations(): Record<string, Message[]> {
  const result: Record<string, Message[]> = {};
  sessionConversations.forEach((conversation, email) => {
    result[email] = conversation;
  });
  return result;
} 