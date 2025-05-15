import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { SpeechRecognition } from '@/components/ui/speech-recognition';
import TextareaAutosize from 'react-textarea-autosize';

// Añadir este tipo para el manejo de archivos de Drive
type DriveFileInfo = {
  id: string;
  name: string;
  mimeType: string;
};

type Message = {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  action?: 'send_email' | 'create_event' | 'gdrive_operations';
  // Añadir campos para archivos de Drive
  driveFiles?: DriveFileInfo[];
  fileId?: string;
};

export default function Chat() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Mensaje de bienvenida cuando se carga la página
      if (messages.length === 0) {
        setMessages([
          {
            id: 1,
            content: 'Hola, soy tu asistente personal. ¿En qué puedo ayudarte hoy? Puedo enviar correos electrónicos o crear eventos en tu calendario.',
            isUser: false,
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [status, router, messages.length]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    // Detener el comportamiento predeterminado del formulario
    e.preventDefault();
    
    // Validación adicional
    if (input.trim() === '') return;

    // Determinar si el mensaje implica una acción específica
    const action = detectAction(input);
    
    // Añadir mensaje del usuario
    const userMessage: Message = {
      id: messages.length + 1,
      content: input,
      isUser: true,
      timestamp: new Date(),
      action: action as 'send_email' | 'create_event' | 'gdrive_operations' | undefined
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Llamar a la API MCP si se detecta una acción específica
      if (action) {
        // Mostrar un mensaje de estado mientras se procesa
        toast({
          title: action === 'send_email' ? "Enviando correo..." : action === 'create_event' ? "Creando evento..." : "Gestionando archivo...",
          description: "Por favor, espera un momento",
        });
        
        const response = await fetch('/api/mcp-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: input, action })
        });

        const result = await response.json();

        if (result.success) {
          let responseMessage = '';
          
          if (action === 'send_email') {
            responseMessage = `He enviado un correo a ${result.params.to.join(', ')} con el asunto "${result.params.subject}".`;
            toast({
              title: "Correo enviado",
              description: `A: ${result.params.to.join(', ')}`,
            });
          } else if (action === 'create_event') {
            const startTime = new Date(result.params.start).toLocaleString();
            responseMessage = `He creado un evento titulado "${result.params.summary}" para el ${startTime}.`;
            toast({
              title: "Evento creado",
              description: `${result.params.summary} - ${startTime}`,
            });
          } else if (action === 'gdrive_operations') {
            // Mejorar el manejo de respuestas de Google Drive según la operación
            if (result.params.operation === 'list') {
              const fileCount = result.result.files?.length || 0;
              const fileList = result.result.files?.map((file: any) => `- ${file.name}`).join('\n');
              responseMessage = `He encontrado ${fileCount} archivos en tu Google Drive:\n\n${fileList}`;
              
              // Añadir información de archivos para posible descarga
              const driveFiles = result.result.files?.map((file: any) => ({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType
              }));
              
              toast({
                title: "Archivos listados",
                description: `${fileCount} archivos encontrados`,
              });
              
              // Añadir respuesta del sistema con la lista de archivos
              setMessages(prevMessages => [
                ...prevMessages, 
                {
                  id: prevMessages.length + 2,
                  content: responseMessage,
                  isUser: false,
                  timestamp: new Date(),
                  driveFiles: driveFiles
                }
              ]);
              
              return; // Salir temprano ya que hemos manejado esto de forma especial
            } else if (result.params.operation === 'search') {
              const fileCount = result.result.files?.length || 0;
              const fileList = result.result.files?.map((file: any) => `- ${file.name}`).join('\n');
              responseMessage = `He encontrado ${fileCount} archivos que coinciden con tu búsqueda:\n\n${fileList}`;
              
              // Añadir información de archivos para posible descarga
              const driveFiles = result.result.files?.map((file: any) => ({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType
              }));
              
              toast({
                title: "Búsqueda completada",
                description: `${fileCount} archivos encontrados`,
              });
              
              // Añadir respuesta del sistema con los resultados de búsqueda
              setMessages(prevMessages => [
                ...prevMessages, 
                {
                  id: prevMessages.length + 2,
                  content: responseMessage,
                  isUser: false,
                  timestamp: new Date(),
                  driveFiles: driveFiles
                }
              ]);
              
              return; // Salir temprano ya que hemos manejado esto de forma especial
            } else if (result.params.operation === 'get') {
              responseMessage = `He recuperado el archivo "${result.result.file?.name || 'solicitado'}"`;
              const fileId = result.params.fileId;
              
              toast({
                title: "Archivo recuperado",
                description: result.result.file?.name || "Archivo",
              });
              
              // Añadir respuesta del sistema con el archivo que puede descargarse
              setMessages(prevMessages => [
                ...prevMessages, 
                {
                  id: prevMessages.length + 2,
                  content: responseMessage,
                  isUser: false,
                  timestamp: new Date(),
                  fileId: fileId
                }
              ]);
              
              return; // Salir temprano ya que hemos manejado esto de forma especial
            } else if (result.params.operation === 'create') {
              responseMessage = `He creado el archivo "${result.params.name}"`;
              toast({
                title: "Archivo creado",
                description: result.params.name,
              });
            } else if (result.params.operation === 'update') {
              responseMessage = `He actualizado el archivo "${result.result.file?.name || result.params.fileId}"`;
              toast({
                title: "Archivo actualizado",
                description: result.result.file?.name || result.params.fileId,
              });
            } else if (result.params.operation === 'delete') {
              responseMessage = `He eliminado el archivo correctamente`;
              toast({
                title: "Archivo eliminado",
                description: "Operación completada",
              });
            } else {
              responseMessage = `He completado la operación de Google Drive "${result.params.operation}"`;
              toast({
                title: "Operación completada",
                description: `${result.params.operation}`,
              });
            }
          }

          // Añadir respuesta del sistema
          setMessages(prevMessages => [
            ...prevMessages, 
            {
              id: prevMessages.length + 2,
              content: responseMessage,
              isUser: false,
              timestamp: new Date()
            }
          ]);
        } else {
          // Mejorar el manejo de errores con mensajes más específicos
          const errorMsg = result.error || "Error desconocido";
          const isOverloaded = errorMsg.includes("Overloaded") || errorMsg.includes("sobrecargado");
          
          toast({
            title: isOverloaded ? "Servicio temporalmente no disponible" : "Error",
            description: isOverloaded ? 
              "Claude está sobrecargado en este momento. Intentando método alternativo..." : 
              errorMsg,
            variant: "destructive",
          });
          
          setMessages(prevMessages => [
            ...prevMessages, 
            {
              id: prevMessages.length + 2,
              content: isOverloaded ? 
                `Lo siento, el servicio de Claude está sobrecargado en este momento. ${result.params ? 'He intentado procesar tu solicitud con un método alternativo.' : 'Por favor, inténtalo de nuevo en unos minutos.'}` :
                `Lo siento, no pude completar la acción: ${errorMsg}`,
              isUser: false,
              timestamp: new Date()
            }
          ]);
        }
      } else {
        // Conversación general (usa el nuevo endpoint de chat con contexto)
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: input })
        });

        const result = await response.json();
        
        // Añadir respuesta del asistente
        setMessages(prevMessages => [
          ...prevMessages, 
          {
            id: prevMessages.length + 2,
            content: result.message || result.error || 'Lo siento, ocurrió un error',
            isUser: false,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Determinar si el error podría ser de sobrecarga
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isOverloaded = errorMsg.includes("Overloaded") || 
                          errorMsg.includes("529") || 
                          errorMsg.includes("sobrecargado");
      
      toast({
        title: isOverloaded ? "Servicio no disponible" : "Error",
        description: isOverloaded ? 
          "Los servidores están ocupados en este momento. Intenta más tarde." : 
          "No se pudo procesar tu solicitud",
        variant: "destructive",
      });
      
      // Añadir mensaje de error
      setMessages(prevMessages => [
        ...prevMessages, 
        {
          id: prevMessages.length + 2,
          content: isOverloaded ? 
            'Lo siento, el servicio está sobrecargado en este momento. Por favor, inténtalo de nuevo en unos minutos.' : 
            'Lo siento, ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',
          isUser: false,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Ejemplos para el usuario
  const examples = [
    { text: "Enviar correo", action: "send_email" },
    { text: "Crear evento", action: "create_event" },
    { text: "Listar archivos de Drive", action: "gdrive_operations" }
  ];

  const handleExampleClick = (text: string) => {
    setInput(text);
  };

  // Función para reiniciar la conversación
  const handleResetConversation = async () => {
    try {
      setLoading(true);
      
      // Llamar al endpoint para reiniciar la conversación
      const response = await fetch('/api/chat-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // Reiniciar mensajes en el cliente
        setMessages([
          {
            id: 1,
            content: 'Hola, soy tu asistente personal. ¿En qué puedo ayudarte hoy? Puedo enviar correos electrónicos o crear eventos en tu calendario.',
            isUser: false,
            timestamp: new Date()
          }
        ]);
        
        toast({
          title: "Conversación reiniciada",
          description: "Se ha reiniciado la conversación"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo reiniciar la conversación",
          variant: "destructive"
        });
      }
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

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto border shadow-md">
      <CardHeader className="bg-primary text-primary-foreground">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Asistente Personal</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Puedo enviar correos, crear eventos en tu calendario y gestionar tus archivos en Google Drive
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetConversation}
            disabled={loading}
            className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
          >
            Reiniciar conversación
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Mensajes */}
        <div className="h-[60vh] overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
            >
              {!message.isUser && (
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Mostrar botones de descarga para archivos individuales */}
                {!message.isUser && message.fileId && (
                  <div className="mt-2">
                    <a 
                      href={`/api/drive/download?fileId=${message.fileId}`} 
                      target="_blank"
                      className="inline-flex items-center px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Descargar archivo
                    </a>
                  </div>
                )}
                
                {/* Mostrar lista de archivos con botones de descarga */}
                {!message.isUser && message.driveFiles && message.driveFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium">Archivos disponibles:</p>
                    <div className="flex flex-col gap-1">
                      {message.driveFiles.map((file) => (
                        <div key={file.id} className="flex items-center text-xs">
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <a 
                            href={`/api/drive/download?fileId=${file.id}`}
                            target="_blank"
                            className="ml-2 inline-flex items-center px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-xs mt-1 ${message.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.action && (
                    <span className="ml-2 bg-background text-foreground px-2 py-0.5 rounded-full text-xs">
                      {message.action === 'send_email' ? '📧 Email' : 
                       message.action === 'create_event' ? '📅 Evento' : 
                       '📄 Drive'}
                    </span>
                  )}
                </div>
              </div>
              
              {message.isUser && (
                <Avatar className="ml-2 h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback>{session?.user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
          
          {/* Indicador de escritura */}
          {loading && (
            <div className="flex items-center space-x-2 text-muted-foreground p-3">
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Formulario de entrada */}
        <form 
          onSubmit={(e) => {
            e.preventDefault(); // Prevenir envío por defecto
            if (!input.trim()) return; // No enviar si está vacío
            handleSubmit(e);
          }} 
          className="p-4"
        >
          <div className="flex flex-col space-y-2">
            <div className="flex">
              <div className="flex-1 relative">
                <TextareaAutosize
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Escuchando..." : "Escribe un mensaje..."}
                  className="w-full border rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[42px] max-h-[150px]" 
                  disabled={loading || isListening}
                  minRows={1}
                  maxRows={6}
                  onKeyDown={(e) => {
                    // Enviar con Shift+Enter
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        const event = new Event('submit', { bubbles: true });
                        e.currentTarget.form?.dispatchEvent(event);
                      }
                    }
                  }}
                />
              </div>
              <SpeechRecognition 
                onTranscript={handleTranscript}
                onListening={handleListening}
              />
              <Button
                type="submit"
                className="rounded-l-none"
                disabled={loading || input.trim() === ''}
              >
                Enviar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-muted-foreground">Ejemplos:</span>
              {examples.map((example) => (
                <Button
                  key={example.action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example.text)}
                  className="text-xs"
                >
                  {example.action === 'send_email' ? '📧' : 
                   example.action === 'create_event' ? '📅' : 
                   '📄'} {example.text}
                </Button>
              ))}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 