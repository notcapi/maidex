import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PaperPlaneIcon, PlusIcon } from "@radix-ui/react-icons";
import { MotionConfig, AnimatePresence, motion } from "framer-motion";

interface ChatInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  className?: string;
  maxRows?: number;
  disabled?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatInput({
  placeholder = "Escribe un mensaje...",
  onSubmit,
  isLoading = false,
  className,
  maxRows = 6,
  disabled = false,
  suggestions = [],
  onSuggestionClick,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(0);

  useEffect(() => {
    if (inputContainerRef.current) {
      const height = inputContainerRef.current.getBoundingClientRect().height;
      setInputHeight(height);
    }
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!value.trim()) return;
    
    onSubmit(value);
    setValue("");
    
    // Restaurar focus
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enviar con Enter (sin Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn(
      "relative z-10 mt-auto",
      className
    )}>
      {suggestions && suggestions.length > 0 && (
        <div className="mb-3 px-1 flex flex-wrap gap-2">
          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onSuggestionClick) {
                      onSuggestionClick(suggestion);
                    } else {
                      setValue(suggestion);
                      textareaRef.current?.focus();
                    }
                  }}
                  className="rounded-full text-xs bg-background/50 backdrop-blur-sm border border-border/30 hover:bg-background/80 transition-all shadow-sm"
                >
                  {suggestion}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      <MotionConfig>
        <div className="relative w-full flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none h-16 z-0" />
          
          <form
            onSubmit={handleSubmit}
            className="relative z-10 container flex flex-col max-w-4xl mx-auto gap-3"
          >
            <div 
              ref={inputContainerRef}
              className={cn(
                "relative flex flex-1 overflow-hidden rounded-2xl border bg-background/30 backdrop-blur-lg shadow-sm transition-all duration-200",
                isFocused ? "border-primary ring-1 ring-primary/20" : "border-border/50",
                value.trim() ? "pr-16" : "pr-3"
              )}
            >
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-0">
                <PlusIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <TextareaAutosize
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isLoading ? "Procesando..." : placeholder}
                disabled={isLoading || disabled}
                className="w-full resize-none bg-transparent py-3 pl-4 pr-2 outline-none min-h-[56px] text-foreground placeholder:text-muted-foreground/70"
                maxRows={maxRows}
              />
              
              <AnimatePresence>
                {value.trim() && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-3 bottom-2 flex items-center"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || disabled || !value.trim()}
                            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                            aria-label="Enviar mensaje"
                          >
                            <PaperPlaneIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Enviar mensaje</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="text-xs text-muted-foreground/60 text-center pb-1 opacity-80 hover:opacity-100 transition-opacity">
              <span className="select-none">Asistente con tecnología de Claude AI</span>
            </div>
          </form>
        </div>
      </MotionConfig>
    </div>
  );
} 