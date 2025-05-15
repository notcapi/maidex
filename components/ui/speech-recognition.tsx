"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Referencia al objeto de reconocimiento de voz
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    // Verificar si el navegador soporta la API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      // Crear instancia de reconocimiento de voz
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES'; // Configurar para español

      // Guardar referencia
      recognitionRef.current = recognition;

      // Configurar eventos
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const currentTranscript = event.results[current][0].transcript;
        setTranscript(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (onListening) onListening(false);
        
        // Si hay texto, enviarlo al componente padre
        if (transcript) {
          onTranscript(transcript);
          setTranscript("");
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        setIsListening(false);
        if (onListening) onListening(false);
      };
    }

    return () => {
      // Limpiar al desmontar
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript, onListening]);

  // Actualizar el callback cuando cambia el transcript
  useEffect(() => {
    if (transcript && !isListening) {
      onTranscript(transcript);
      setTranscript("");
    }
  }, [transcript, isListening, onTranscript]);

  const toggleListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
      if (onListening) onListening(true);
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