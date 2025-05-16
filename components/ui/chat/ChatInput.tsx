import React, { useState, useRef, KeyboardEvent, useEffect, useMemo, useCallback } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PaperPlaneIcon, PlusIcon, Link1Icon, FileIcon, ImageIcon } from "@radix-ui/react-icons";
import { MotionConfig, AnimatePresence, motion } from "framer-motion";

interface ChatInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  className?: string;
  maxRows?: number;
  disabled?: boolean;
  onMicrophoneClick?: () => void;
  isListening?: boolean;
  initialValue?: string;
}

/**
 * Componente de entrada de chat optimizado con React.memo para reducir renderizados
 */
export const ChatInput = React.memo(function ChatInputInner({
  placeholder = "Escribe un mensaje...",
  onSubmit,
  isLoading = false,
  className,
  maxRows = 6,
  disabled = false,
  onMicrophoneClick,
  isListening = false,
  initialValue = "",
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (inputContainerRef.current) {
      const height = inputContainerRef.current.getBoundingClientRect().height;
      setInputHeight(height);
    }
  }, [value]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!value.trim()) return;
    
    onSubmit(value);
    setValue("");
    
    // Restaurar focus
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, [value, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enviar con Enter (sin Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const toggleActions = useCallback(() => {
    setShowActions(prev => !prev);
  }, []);

  // Memorizar botones de acción para evitar recreación en cada render
  const actionButtons = useMemo(() => [
    { icon: <Link1Icon className="h-4 w-4" />, label: "Enlazar Drive" },
    { icon: <FileIcon className="h-4 w-4" />, label: "Buscar archivo" },
    { icon: <ImageIcon className="h-4 w-4" />, label: "Imagen" },
  ], []);

  // Memorizar el estado del placeholder
  const currentPlaceholder = useMemo(() => {
    if (isLoading) return "Procesando...";
    if (isListening) return "Escuchando...";
    return placeholder;
  }, [isLoading, isListening, placeholder]);

  // Función para manejar cambios en el textarea
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  }, []);

  // Gestionar el focus y blur
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <div className={cn(
      "relative z-10 mt-auto",
      className
    )}>
      <MotionConfig>
        <div className="relative w-full flex flex-col">
          {/* Eliminamos el fondo con blur que causa problemas */}
          
          <form
            onSubmit={handleSubmit}
            className="relative z-10 flex flex-col max-w-4xl mx-auto gap-2 w-full"
          >
            <div 
              ref={inputContainerRef}
              className={cn(
                "relative flex flex-1 items-center overflow-hidden rounded-3xl border bg-background shadow-sm transition-all duration-200",
                isFocused ? "border-primary ring-2 ring-primary/20" : "border-border/50",
                value.trim() ? "pr-20" : "pr-20"  // Cambiado de pr-14 a pr-20 para dejar espacio al botón de micrófono
              )}
            >
              {/* Efecto de resplandor cuando está enfocado */}
              {isFocused && (
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              )}
              
              {/* Botón de acciones adicionales con animación mejorada */}
              <button
                type="button"
                onClick={toggleActions}
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 md:left-4 p-2 rounded-full transition-all duration-300",
                  "text-muted-foreground/70 hover:text-foreground hover:bg-muted",
                  showActions ? "text-primary bg-primary/10 rotate-45 scale-110" : "scale-100"
                )}
                aria-label="Mostrar acciones"
              >
                <PlusIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              
              <TextareaAutosize
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={currentPlaceholder}
                disabled={isLoading || disabled}
                className={cn(
                  "w-full resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70",
                  "py-3.5 pl-12 pr-12 min-h-[50px]", // Base para móvil
                  "md:py-4 md:pl-14 md:pr-14 md:text-base md:min-h-[60px]" // Más grande en tablet/desktop
                )}
                maxRows={maxRows}
              />
              
              {/* Área para botones de acción */}
              <div className="absolute right-3 md:right-4 flex items-center justify-center gap-2">
                {/* Botón de micrófono */}
                {onMicrophoneClick && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={onMicrophoneClick}
                          className={cn(
                            "h-9 w-9 md:h-10 md:w-10 rounded-full transition-all",
                            isListening 
                              ? "text-primary bg-primary/10 animate-pulse" 
                              : "text-muted-foreground/70 hover:text-foreground hover:bg-muted"
                          )}
                          aria-label={isListening ? "Detener grabación" : "Iniciar grabación de voz"}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            className="h-4 w-4 md:h-5 md:w-5"
                          >
                            <rect x="9" y="2" width="6" height="12" rx="3" />
                            <path d="M5 10a7 7 0 0 0 14 0" />
                            <line x1="8" y1="19" x2="16" y2="19" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                          </svg>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {isListening ? "Detener grabación" : "Iniciar grabación de voz"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Botón de enviar */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!value.trim() || isLoading || disabled}
                        className={cn(
                          "h-9 w-9 md:h-10 md:w-10 rounded-full transition-all",
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                          "disabled:bg-muted disabled:text-muted-foreground/70"
                        )}
                        aria-label="Enviar mensaje"
                      >
                        {isLoading ? (
                          <motion.div
                            className="animate-spin"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          </motion.div>
                        ) : (
                          <PaperPlaneIcon className="h-4 w-4 md:h-5 md:w-5 translate-x-[1px] translate-y-[-1px]" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Enviar mensaje</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {/* Panel de acciones extras */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -5 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 px-2 overflow-hidden"
                >
                  <div className="flex overflow-x-auto w-full py-1 scrollbar-hide">
                    <div className="flex gap-2 px-2">
                      {actionButtons.map((button, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 rounded-full border-border/40 px-3 py-2 text-sm text-muted-foreground"
                                onClick={() => {}}
                                disabled={isLoading || disabled}
                              >
                                {button.icon}
                                <span className="ml-1">{button.label}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{button.label}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </MotionConfig>
    </div>
  );
}); 