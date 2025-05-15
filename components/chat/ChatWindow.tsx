import React, { useEffect, useRef } from "react";
// Comentamos temporalmente la importación del componente ScrollArea
// import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  children: React.ReactNode;
  className?: string;
  autoScroll?: boolean;
  isLoading?: boolean;
}

export function ChatWindow({
  children,
  className,
  autoScroll = true,
  isLoading = false,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Función para desplazarse hasta el final de los mensajes
  const scrollToBottom = () => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Desplazarse al final cuando se añadan nuevos mensajes o cambie el estado de carga
  useEffect(() => {
    scrollToBottom();
  }, [children, isLoading]);

  return (
    <div ref={scrollRef} className={cn("relative h-full w-full", className)}>
      {/* Reemplazamos temporalmente el ScrollArea por un div con overflow-y-auto */}
      <div className="h-full overflow-y-auto pr-4">
        <div className="flex flex-col py-4 px-1">
          {children}
          
          {/* Indicador de escritura */}
          {isLoading && (
            <div className="flex items-center space-x-2 text-muted-foreground p-3 self-start">
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          )}
          
          {/* Elemento de referencia para el desplazamiento automático */}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
} 