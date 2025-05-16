"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Definir interfaces para tipos más precisos
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    isFinal: boolean;
    [index: number]: {
      transcript: string;
    };
  }[];
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionProps {
  onTranscript: (text: string) => void;
  onListening?: (isListening: boolean) => void;
  placeholder?: string;
  language?: string;
}

/**
 * Componente de reconocimiento de voz que utiliza la API Web Speech para
 * convertir audio en texto y enviarlo a través del prop onTranscript.
 * 
 * @param onTranscript - Función para recibir el texto transcrito
 * @param onListening - Función opcional para notificar el estado de grabación
 * @param placeholder - Texto de marcador de posición (no usado actualmente)
 * @param language - Código de idioma (por defecto 'es-ES')
 */
export function SpeechRecognition({
  onTranscript,
  onListening,
  placeholder = "Habla ahora...",
  language = 'es-ES'
}: SpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Referencia al objeto de reconocimiento de voz
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Acumulador de transcripción
  const accumulatedTranscriptRef = useRef("");
  // Variable para controlar si la transcripción final ya se envió
  const finalTranscriptSentRef = useRef(false);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if (typeof window === 'undefined') return; // No ejecutar en SSR
    
      try {
        // Comprobar soporte de navegador
        const SpeechRecognition = 
          window.SpeechRecognition || 
          (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          console.error("API de reconocimiento de voz no soportada");
          setIsSupported(false);
          setError("Tu navegador no soporta reconocimiento de voz");
          return;
        }

      recognitionRef.current = new SpeechRecognition() as SpeechRecognitionInstance;
        const recognition = recognitionRef.current;
        
        recognition.continuous = true;
        recognition.interimResults = true;
      recognition.lang = language;
        
        // Configurar eventos
        recognition.onstart = () => {
          console.log("Reconocimiento iniciado");
          setIsListening(true);
          if (onListening) onListening(true);
          // Reiniciar transcripción acumulada
          accumulatedTranscriptRef.current = "";
        finalTranscriptSentRef.current = false;
        };
        
      recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Actualizar transcripción acumulada con resultados finales
          if (finalTranscript) {
            accumulatedTranscriptRef.current += finalTranscript;
          }
          
          // Si hay resultado final, enviarlo al textarea
          if (finalTranscript) {
            console.log("Enviando transcripción final:", accumulatedTranscriptRef.current);
            onTranscript(accumulatedTranscriptRef.current);
          finalTranscriptSentRef.current = true;
          }
        };
        
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Error en reconocimiento de voz:', event.error);
        const errorMessage = getErrorMessage(event.error);
        setError(errorMessage);
          setIsListening(false);
          if (onListening) onListening(false);
        };
        
        recognition.onend = () => {
          console.log("Reconocimiento finalizado");
          setIsListening(false);
          if (onListening) onListening(false);
          
        // Cuando termina, enviar la transcripción acumulada si existe y no se ha enviado ya
        if (accumulatedTranscriptRef.current && !finalTranscriptSentRef.current) {
            console.log("Enviando transcripción final al terminar:", accumulatedTranscriptRef.current);
            onTranscript(accumulatedTranscriptRef.current);
          }
        };
        
      } catch (error) {
        console.error("Error inicializando reconocimiento de voz:", error);
        setIsSupported(false);
        setError("Error al inicializar reconocimiento de voz");
      }
    
    return () => {
      // Limpiar al desmontar
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error al detener reconocimiento:", e);
        }
      }
    };
  }, [language, onListening, onTranscript]);

  // Función para interpretar errores de reconocimiento de voz
  const getErrorMessage = (errorType: string): string => {
    switch (errorType) {
      case 'no-speech':
        return "No se detectó audio. Por favor, habla más fuerte.";
      case 'audio-capture':
        return "No se pudo acceder al micrófono. Revisa los permisos.";
      case 'not-allowed':
        return "No se permitió el acceso al micrófono. Revisa los permisos del navegador.";
      case 'network':
        return "Error de red. Comprueba tu conexión.";
      case 'aborted':
        return "Reconocimiento de voz cancelado.";
      case 'language-not-supported':
        return `El idioma "${language}" no es soportado.`;
      default:
        return `Error: ${errorType}`;
    }
  };

  // Manejar inicio/parada manual
  const toggleListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      console.error("Reconocimiento no soportado o no inicializado");
      return;
    }
    
    setError(null);
    
    try {
      if (isListening) {
        // Detener grabación
        console.log("Deteniendo grabación...");
        recognitionRef.current.stop();
      } else {
        // Iniciar grabación
        console.log("Iniciando grabación...");
        // Reiniciar el acumulador y flag
        accumulatedTranscriptRef.current = "";
        finalTranscriptSentRef.current = false;
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error("Error al cambiar estado de grabación:", err);
      setError("Error al cambiar estado de grabación");
      // Sincronizamos el estado en caso de error
      setIsListening(false);
      if (onListening) onListening(false);
    }
  }, [isListening, isSupported, onListening]);

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              disabled 
              className="h-10 w-10 rounded-full bg-secondary/30 backdrop-blur-sm text-muted-foreground min-w-[40px] flex-shrink-0"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="h-4 w-4 opacity-50"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Tu navegador no soporta reconocimiento de voz</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleListening}
              disabled={!isSupported}
              size="icon"
              variant="ghost"
              className={cn(
                "rounded-full w-12 h-12 md:w-14 md:h-14 min-w-[48px] bg-background/40 border border-border/40 backdrop-blur-sm shadow-sm",
                isListening 
                  ? "bg-primary/10 border-primary/30 text-primary" 
                  : "hover:bg-background/60 hover:text-primary"
              )}
              aria-label={isListening ? "Detener reconocimiento de voz" : "Iniciar reconocimiento de voz"}
            >
              {isListening ? (
                <motion.div 
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="relative w-5 h-5 md:w-6 md:h-6"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="absolute inset-0 text-primary animate-pulse"
                  >
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="8" y1="19" x2="16" y2="19" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                </motion.div>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="w-5 h-5 md:w-6 md:h-6"
                >
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="8" y1="19" x2="16" y2="19" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                </svg>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isListening ? "Detener grabación" : "Iniciar grabación de voz"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {error && (
        <div className="text-xs text-red-500 mt-1 text-center">
          {error}
        </div>
      )}
    </div>
  );
}

// Tipo para el objeto global de window
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
} 