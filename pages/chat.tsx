import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { SpeechRecognition } from '@/components/ui/speech-recognition';
import { ChatBubble, ChatWindow, ChatInput } from '@/components/ui/chat';
import { DriveFileList } from '@/components/drive';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCcw, Zap } from 'lucide-react';
import { useChatStream, Message as ChatMessage } from '@/hooks/useChatStream';

// Añadir este tipo para el manejo de archivos de Drive
type DriveFileInfo = {
  id: string;
  name: string;
  mimeType: string;
  type?: "file" | "folder";  // Nuevo campo para determinar si es archivo o carpeta
  extension?: string;        // Nuevo campo para la extensión
  downloadUrl?: string;      // URL para descargar el archivo
};

export default function Chat() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Obtener el ID de conversación de la URL o generar uno único si no existe
  const conversationId = Array.isArray(router.query.id) 
    ? router.query.id[0] 
    : router.query.id || `conversation-${Date.now()}`;
  
  // Usar el hook de chat en tiempo real
  const { 
    messages, 
    isLoading: chatLoading, 
    error: chatError, 
    addMessage 
  } = useChatStream({ 
    conversationId,
    initialMessages: [{
      id: 1,
      content: 'Hola, soy tu asistente personal. ¿En qué puedo ayudarte hoy? Puedo enviar correos electrónicos o crear eventos en tu calendario.',
      isUser: false,
      timestamp: new Date()
    }] 
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const detectAction = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    
    // Detección de acciones de email
    if (
      lowerText.includes('envía') || 
      lowerText.includes('enviar') || 
      lowerText.includes('mandar') || 
      lowerText.includes('email') || 
      lowerText.includes('correo')
    ) {
      return 'send_email';
    }
    
    // Detección de acciones de calendario
    if (
      lowerText.includes('crear evento') || 
      lowerText.includes('crea evento') || 
      lowerText.includes('agenda') || 
      lowerText.includes('programa') || 
      lowerText.includes('añadir evento') || 
      lowerText.includes('añade evento') || 
      lowerText.includes('reunión')
    ) {
      return 'create_event';
    }
    
    // Detección de acciones de Google Drive
    if (
      lowerText.includes('drive') || 
      lowerText.includes('documento') || 
      lowerText.includes('archivo') || 
      lowerText.includes('crear archivo') ||
      lowerText.includes('crea archivo') ||
      lowerText.includes('lista archivos') ||
      lowerText.includes('busca archivo') ||
      lowerText.includes('actualiza archivo') ||
      lowerText.includes('elimina archivo')
    ) {
      return 'gdrive_operations';
    }
    
    return null;
  };

  // Ejemplos para el usuario
  const examples = [
    { text: "Enviar correo", action: "send_email", icon: "📧" },
    { text: "Crear evento", action: "create_event", icon: "📅" },
    { text: "Listar archivos de Drive", action: "gdrive_operations", icon: "📁" }
  ];

  const handleExampleClick = (text: string) => {
    handleSendMessage(text);
  };

  // Función para reiniciar la conversación
  const handleResetConversation = async () => {
    try {
      setLoading(true);
      
      // Generar una nueva ID de conversación
      const newConversationId = `conversation-${Date.now()}`;
      
      // Redirigir a una nueva conversación
      router.push(`/chat?id=${newConversationId}`);
      
      toast({
        title: "Conversación reiniciada",
        description: "Se ha reiniciado la conversación"
      });
    } catch (error) {
      console.error('Error al reiniciar la conversación:', error);
      toast({
        title: "Error",
        description: "No se pudo reiniciar la conversación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la transcripción de voz
  const handleTranscript = (text: string) => {
    console.log("Recibida transcripción en chat:", text);
    // Solo actualizamos el estado del input, no enviamos el formulario
    setInput(text);
  };

  // Función para manejar cuando se está escuchando
  const handleListening = (isListeningNow: boolean) => {
    console.log("Estado de escucha cambiado:", isListeningNow);
    setIsListening(isListeningNow);
  };

  // Función para manejar el envío desde el ChatInput
  const handleSendMessage = (value: string) => {
    if (!value.trim()) return;
    
    const actionType = detectAction(value);
    
    // Añadir mensaje del usuario usando addMessage del hook
    addMessage({
      content: value,
      isUser: true,
      action: actionType as 'send_email' | 'create_event' | 'gdrive_operations' | undefined
    });
    
    setInput('');
    
    // Procesar el mensaje y generar respuesta
    processMessage(value, actionType);
  };
  
  // Función para procesar mensajes
  const processMessage = async (messageText: string, actionType: string | null) => {
    // Verificar si es una solicitud explícita de descarga
    const isDownloadRequest = messageText.toLowerCase().includes('descarga') || 
                             messageText.toLowerCase().includes('descargar') ||
                             messageText.toLowerCase().includes('bajar') ||
                             messageText.toLowerCase().includes('download');
    
    try {
      if (actionType) {
        // Mostrar un mensaje de estado mientras se procesa
        toast({
          title: actionType === 'send_email' 
            ? "Enviando correo..." 
            : actionType === 'create_event' 
              ? "Creando evento..." 
              : "Gestionando archivo...",
          description: "Por favor, espera un momento",
        });
        
        setLoading(true);
        
        const response = await fetch('/api/mcp-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: messageText, 
            action: actionType,
            conversationId // Añadir ID de conversación para persistencia
          })
        });

        const result = await response.json();

        if (result.success) {
          let responseMessage = '';
          
          if (actionType === 'send_email') {
            responseMessage = `He enviado un correo a ${result.params.to.join(', ')} con el asunto "${result.params.subject}".`;
            
            // Añadir respuesta del asistente usando addMessage del hook
            addMessage({
              content: responseMessage,
              isUser: false
            });
            
          } else if (actionType === 'create_event') {
            responseMessage = `He creado el evento "${result.params.title}" para el ${new Date(result.params.start).toLocaleString('es', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: 'numeric',
              minute: 'numeric'
            })}.`;
            
            // Añadir respuesta del asistente usando addMessage del hook
            addMessage({
              content: responseMessage,
              isUser: false
            });
            
          } else if (actionType === 'gdrive_operations') {
            // Manejar operaciones de Google Drive
            handleDriveOperationResponse(result, isDownloadRequest);
          }
          
        } else {
          // Manejar error
          handleErrorResponse(result);
        }
      } else {
        // Procesar mensaje general sin acción específica
        setLoading(true);
        
        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: messageText,
            conversationId // Añadir ID de conversación para persistencia 
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Añadir respuesta del asistente usando addMessage del hook
          addMessage({
            content: result.response,
            isUser: false
          });
        } else {
          // Manejar error
          handleErrorResponse(result);
        }
      }
    } catch (error) {
      console.error('Error procesando el mensaje:', error);
      
      // Añadir mensaje de error usando addMessage del hook
      addMessage({
        content: "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, inténtalo de nuevo.",
        isUser: false
      });
      
      toast({
        title: "Error",
        description: "No se pudo procesar tu solicitud",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Función para manejar respuestas específicas de Drive
  const handleDriveOperationResponse = (result: any, showDownload: boolean = false) => {
    let responseMessage = '';
    
    // Función auxiliar para extraer la extensión del nombre de archivo
    const getFileExtension = (filename: string): string => {
      const parts = filename.split('.');
      return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
    };
    
    // Función auxiliar para determinar si es un folder basado en mimeType
    const isFolder = (mimeType: string): boolean => {
      return mimeType === 'application/vnd.google-apps.folder';
    };
    
    // Función para preparar los archivos en el formato requerido por los componentes
    const prepareFiles = (files: any[]): DriveFileInfo[] => {
      return files.map(file => {
        const extension = getFileExtension(file.name);
        const fileType = isFolder(file.mimeType) ? 'folder' as const : 'file' as const;
        
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          type: fileType,
          extension: extension,
          downloadUrl: fileType === 'file' ? `/api/drive/download?fileId=${file.id}` : undefined
        };
      });
    };
    
    // Para listar archivos
    if (result.action === 'list_files') {
      const fileCount = result.result.files?.length || 0;
      const fileList = result.result.files?.map((file: any) => `- ${file.name}`).join('\n');
      responseMessage = `He encontrado ${fileCount} archivos en tu Google Drive:`;
      
      // Añadir información de archivos con el formato adecuado
      const driveFiles = result.result.files ? prepareFiles(result.result.files) : [];
      
      toast({
        title: "Archivos listados",
        description: `${fileCount} archivos encontrados`,
      });
      
      // Añadir respuesta del sistema con la lista de archivos
      addMessage({
        content: responseMessage,
        isUser: false,
        driveFiles: driveFiles
      });
      
      return;
    }
    
    // Para buscar archivos
    if (result.action === 'search_files') {
      const fileCount = result.result.files?.length || 0;
      const fileList = result.result.files?.map((file: any) => `- ${file.name}`).join('\n');
      responseMessage = `He encontrado ${fileCount} archivos que coinciden con tu búsqueda:`;
      
      // Añadir información de archivos con el formato adecuado
      const driveFiles = result.result.files ? prepareFiles(result.result.files) : [];
      
      toast({
        title: "Búsqueda completada",
        description: `${fileCount} archivos encontrados`,
      });
      
      // Añadir respuesta del sistema con los resultados de búsqueda
      addMessage({
        content: responseMessage,
        isUser: false,
        driveFiles: driveFiles
      });
      
      return;
    }
    
    // Para descargar un archivo
    if (result.action === 'get_file' && showDownload) {
      responseMessage = `He recuperado el archivo "${result.result.file?.name || 'solicitado'}"`;
      
      // Preparar la información del archivo para mostrarla adecuadamente
      const file = result.result.file;
      const extension = file ? getFileExtension(file.name) : '';
      const fileType = file && isFolder(file.mimeType) ? 'folder' as const : 'file' as const;
      
      const driveFiles = file ? [{
        id: result.params.fileId,
        name: file.name,
        mimeType: file.mimeType,
        type: fileType,
        extension: extension,
        downloadUrl: fileType === 'file' ? `/api/drive/download?fileId=${result.params.fileId}` : undefined
      }] : [];
      
      toast({
        title: "Archivo recuperado",
        description: result.result.file?.name || "Archivo",
      });
      
      // Añadir respuesta del sistema con el archivo que puede descargarse
      addMessage({
        content: responseMessage,
        isUser: false,
        driveFiles: driveFiles
      });
      
      return;
    }
    
    // Añadir respuesta del sistema para otros casos
    addMessage({
      content: responseMessage,
      isUser: false
    });
  };
  
  // Función para manejar respuestas de error
  const handleErrorResponse = (result: any) => {
    const errorMsg = result.error || "Error desconocido";
    const isOverloaded = errorMsg.includes("Overloaded") || errorMsg.includes("sobrecargado");
    
    toast({
      title: isOverloaded ? "Servicio temporalmente no disponible" : "Error",
      description: isOverloaded ? 
        "Claude está sobrecargado en este momento. Intentando método alternativo..." : 
        errorMsg,
      variant: "destructive",
    });
    
    addMessage({
      content: isOverloaded ? 
        `Lo siento, el servicio de Claude está sobrecargado en este momento. ${result.params ? 'He intentado procesar tu solicitud con un método alternativo.' : 'Por favor, inténtalo de nuevo en unos minutos.'}` :
        `Lo siento, no pude completar la acción: ${errorMsg}`,
      isUser: false
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background dark:bg-slate-950">
      <div className="container mx-auto px-4 py-6 flex flex-col flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
          {/* Panel lateral con ejemplos y acciones */}
          <Card className="hidden lg:block h-auto">
            <CardHeader>
              <CardTitle className="text-lg">Sugerencias</CardTitle>
              <CardDescription>Prueba estos ejemplos</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-2">
                {examples.map((example, index) => (
                  <div 
                    key={index}
                    onClick={() => handleExampleClick(example.text)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="text-xl">{example.icon}</div>
                    <span className="text-sm font-medium">{example.text}</span>
                  </div>
                ))}
                <Separator className="my-4 bg-border dark:bg-slate-700" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-sm text-muted-foreground dark:text-slate-400 dark:hover:text-slate-300"
                  onClick={handleResetConversation}
                  disabled={loading}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Nueva conversación
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Área principal de chat */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="border-b border-border dark:border-slate-700 px-4 py-3">
                <CardTitle className="text-lg flex items-center">
                  <Avatar className="h-8 w-8 mr-2 bg-primary/10 text-primary dark:bg-primary/20">
                    <AvatarFallback><Zap className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  Asistente Personal
                  {loading && (
                    <span className="ml-3 text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground animate-pulse">
                      procesando...
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-16rem)] p-0 rounded-none">
                  <div className="p-4 pb-0">
                    {messages.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        role={msg.isUser ? "user" : "ai"}
                        message={msg.content}
                        userImage={session?.user?.image || undefined}
                        userName={session?.user?.name || undefined}
                        timestamp={msg.timestamp}
                        files={msg.driveFiles}
                        showDownload={!!msg.action}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
              
              <div className="p-3 border-t border-border dark:border-slate-700 bg-background dark:bg-slate-950">
                <ChatInput
                  placeholder="Escribe un mensaje..."
                  onSubmit={handleSendMessage}
                  isLoading={loading}
                  onMicrophoneClick={() => {
                    setIsListening((prev) => !prev);
                  }}
                  isListening={isListening}
                  initialValue={input}
                />
                
                {/* Botones de acción móviles */}
                <div className="md:hidden flex justify-between mt-3">
                  {examples.map((example, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExampleClick(example.text)}
                      className="text-xs flex-1 mx-1"
                    >
                      {example.icon} <span className="ml-1">{example.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 