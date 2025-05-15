"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";

interface SpeechRecognitionProps {
  onTranscript: (text: string) => void;
  onListening?: (isListening: boolean) => void;
  placeholder?: string;
}

export function SpeechRecognition({
  onTranscript,
  onListening,
  placeholder = "Habla ahora..."
}: SpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Referencia al objeto de reconocimiento de voz
  const recognitionRef = useRef<any>(null);
  // Temporizador para detección de silencio
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Acumulador de transcripción
  const accumulatedTranscriptRef = useRef("");

  useEffect(() => {
    // Verificar si el navegador soporta la API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
        setError("Tu navegador no soporta reconocimiento de voz");
        return;
      }

      // Crear instancia de reconocimiento de voz
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Modo continuo
      recognition.interimResults = true;
      recognition.lang = 'es-ES'; // Configurar para español
      recognition.maxAlternatives = 1;

      // Guardar referencia
      recognitionRef.current = recognition;

      // Configurar eventos
      recognition.onresult = (event: any) => {
        // Reiniciar el temporizador de silencio cada vez que hay un resultado
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        const current = event.resultIndex;
        const currentTranscript = event.results[current][0].transcript;
        console.log("Transcripción en curso:", currentTranscript);
        
        // Acumular transcripción para resultados intermedios
        if (event.results[current].isFinal) {
          accumulatedTranscriptRef.current += " " + currentTranscript;
          accumulatedTranscriptRef.current = accumulatedTranscriptRef.current.trim();
        }
        
        // Mostrar transcripción en curso
        setTranscript(
          accumulatedTranscriptRef.current + " " + 
          (event.results[current].isFinal ? "" : currentTranscript)
        );
        
        // Configurar temporizador de silencio (3 segundos sin hablar)
        silenceTimerRef.current = setTimeout(() => {
          if (isListening && recognitionRef.current) {
            console.log("Silencio detectado, deteniendo grabación");
            recognitionRef.current.stop();
          }
        }, 3000);
      };

      recognition.onend = () => {
        console.log("Reconocimiento finalizado");
        // Limpiar temporizador
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        setIsListening(false);
        if (onListening) onListening(false);
        
        // Si hay texto acumulado, enviarlo al componente padre
        if (accumulatedTranscriptRef.current) {
          onTranscript(accumulatedTranscriptRef.current);
          setTranscript("");
          accumulatedTranscriptRef.current = "";
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        setError(`Error: ${event.error}`);
        setIsListening(false);
        if (onListening) onListening(false);
        
        // Limpiar temporizador
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };
      
      // Evento para reintentar si hay una desconexión
      recognition.onnomatch = () => {
        console.log("No se ha encontrado coincidencia");
      };
    }

    return () => {
      // Limpiar al desmontar
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Error al abortar reconocimiento:", e);
        }
      }
      
      // Limpiar temporizador
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [onTranscript, onListening]);

  const toggleListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    
    setError(null);

    if (isListening) {
      // Detener manualmente la grabación
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      recognitionRef.current.stop();
    } else {
      // Iniciar grabación
      accumulatedTranscriptRef.current = "";
      setTranscript("");
      try {
        recognitionRef.current.start();
        console.log("Grabación iniciada");
        setIsListening(true);
        if (onListening) onListening(true);
      } catch (err) {
        console.error("Error al iniciar grabación:", err);
        setError("Error al iniciar grabación");
      }
    }
  }, [isListening, isSupported, onListening]);

  if (!isSupported) {
    return (
      <Button 
        variant="outline" 
        size="icon" 
        disabled 
        title="Tu navegador no soporta reconocimiento de voz"
      >
        <MicIcon className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleListening}
      title={isListening ? "Detener grabación" : "Grabar voz"}
      className={isListening ? "bg-red-500 text-white hover:bg-red-600" : ""}
    >
      <MicIcon className="h-4 w-4" />
      {isListening && (
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-white animate-pulse" />
      )}
    </Button>
  );
}

function MicIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

// Tipo para el objeto global de window
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
} 