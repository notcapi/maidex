import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWindowProps {
  children: React.ReactNode;
  className?: string;
  autoScroll?: boolean;
  isLoading?: boolean;
}

// Variantes de animación
const typingIndicatorVariants = {
  initial: { opacity: 0, y: 10, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const scrollButtonVariants = {
  initial: { opacity: 0, scale: 0.8, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.8, y: 10, transition: { duration: 0.15 } }
};

const dateVariants = {
  initial: { opacity: 0, y: -5 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function ChatWindow({
  children,
  className,
  autoScroll = true,
  isLoading = false,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Función para desplazarse hasta el final de los mensajes
  const scrollToBottom = () => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Detectar cuando el usuario se ha desplazado hacia arriba
  const handleScroll = () => {
    const scrollArea = scrollRef.current;
    if (scrollArea) {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      // Si está a más de 300px del fondo, mostrar botón
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    }
  };

  // Agrupar mensajes por fecha
  const groupMessagesByDate = () => {
    // El React.Children.toArray permite acceder a los hijos como array
    const messages = React.Children.toArray(children);
    
    let messageGroups: { date: string; messages: React.ReactNode[] }[] = [];
    let currentDate = "";
    let currentGroup: React.ReactNode[] = [];
    
    React.Children.forEach(children, (child) => {
      // Intentar extraer la fecha del mensaje (esto puede necesitar ajustes basados en la estructura exacta del mensaje)
      // Asumimos que cada ChatBubble tiene una prop timestamp
      const timestamp = (child as any).props?.timestamp;
      const messageDate = timestamp ? new Date(timestamp).toLocaleDateString() : "";
      
      if (messageDate && messageDate !== currentDate) {
        // Guardar el grupo actual si existe
        if (currentGroup.length > 0) {
          messageGroups.push({
            date: currentDate,
            messages: [...currentGroup]
          });
        }
        
        // Iniciar un nuevo grupo
        currentDate = messageDate;
        currentGroup = [child];
      } else {
        // Añadir al grupo actual
        currentGroup.push(child);
      }
    });
    
    // Añadir el último grupo si contiene mensajes
    if (currentGroup.length > 0) {
      messageGroups.push({
        date: currentDate,
        messages: [...currentGroup]
      });
    }
    
    return messageGroups;
  };

  // Desplazarse al final cuando se añadan nuevos mensajes o cambie el estado de carga
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [children, isLoading, autoScroll]);

  // Aplicar evento de scroll
  useEffect(() => {
    const scrollArea = scrollRef.current;
    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll);
      return () => scrollArea.removeEventListener("scroll", handleScroll);
    }
  }, []);
  
  // Agrupar los mensajes por fecha
  const messageGroups = groupMessagesByDate();

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div 
        ref={scrollRef} 
        className="h-full overflow-y-auto pr-2 md:pr-4 pb-safe pt-4 md:pt-6 scroll-smooth"
        onScroll={handleScroll}
      >
        <div className="flex flex-col px-1 md:px-2 min-h-full">
          {/* Añadir un espacio vacío al principio para evitar que el primer mensaje quede oculto */}
          <div className="h-4"></div>
          
          {messageGroups.map((group, i) => (
            <div key={`group-${i}`} className="w-full mb-6">
              {group.date && (
                <motion.div 
                  variants={dateVariants}
                  initial="initial"
                  animate="animate"
                  className="relative py-3 flex items-center justify-center mb-3"
                >
                  <Separator className="absolute inset-x-0" />
                  <span className="relative px-2 text-xs text-muted-foreground bg-background z-10 font-medium rounded">
                    {new Date(group.date).toLocaleDateString('es', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </motion.div>
              )}
              <div className="space-y-5">
                {group.messages}
              </div>
            </div>
          ))}
          
          {/* Indicador de escritura */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                variants={typingIndicatorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center space-x-2 text-muted-foreground p-3 rounded-full self-start bg-card/30 ml-4 mt-1 mb-4"
              >
                <div className="w-2 h-2 rounded-full bg-black/60 dark:bg-white/60 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-black/60 dark:bg-white/60 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-black/60 dark:bg-white/60 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Elemento de referencia para el desplazamiento automático */}
          <div ref={endRef} className="h-6" />
        </div>
      </div>
      
      {/* Botón para desplazarse hacia abajo */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            variants={scrollButtonVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-10"
            aria-label="Desplazarse hacia abajo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 13 6 6 6-6" />
              <path d="m6 5 6 6 6-6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
} 