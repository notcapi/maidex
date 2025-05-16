import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, FileText, Image, FileArchive, File } from "lucide-react";

type File = {
  id: string;
  name: string;
  mimeType: string;
  type?: "file" | "folder";
  extension?: string;
  downloadUrl?: string;
};

interface ChatBubbleProps {
  role: "user" | "ai";
  message: string;
  timestamp?: Date;
  files?: File[];
  userImage?: string;
  userName?: string;
  showDownload?: boolean;
}

// Variantes de animación
const bubbleVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: "easeOut" } }
};

const attachmentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, delay: 0.1 } }
};

export function ChatBubble({
  role,
  message,
  timestamp,
  files,
  userImage,
  userName,
  showDownload = false,
}: ChatBubbleProps) {
  const isUser = role === "user";
  const initial = userName ? userName.charAt(0).toUpperCase() : isUser ? "U" : "A";
  
  // Formatear mensaje si contiene saltos de línea
  const formattedMessage = message.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < message.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  // Componente de ChatBubble para el asistente
  if (!isUser) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={bubbleVariants}
        className="flex items-start space-x-3 px-4 py-2 mt-1 first:mt-6"
      >
        <Avatar className="h-8 w-8 shrink-0 border border-border/30">
          <AvatarFallback className="bg-muted text-muted-foreground font-medium text-sm">
            {initial}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col max-w-[85%] md:max-w-[75%] lg:max-w-[65%] w-full">
          <div className="bg-muted/50 dark:bg-muted/20 rounded-lg rounded-tl-sm px-4 py-3 relative shadow-sm border border-border/10">
            <div className="text-sm md:text-base leading-relaxed text-foreground whitespace-pre-wrap break-words">
              {formattedMessage}
            </div>
          </div>
          
          {/* Archivos adjuntos */}
          {files && files.length > 0 && (
            <motion.div 
              variants={attachmentVariants}
              className="mt-2 space-y-1.5"
            >
              {files.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center rounded-md p-2 bg-muted/30 dark:bg-muted/10 text-muted-foreground border border-border/10",
                    "hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors"
                  )}
                >
                  <FileIcon mimeType={file.mimeType} />
                  <span className="ml-2 truncate max-w-[220px] md:max-w-[300px] text-xs">
                    {file.name}
                  </span>
                  
                  {showDownload && file.type === 'file' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-6 w-6 rounded-full hover:bg-background"
                            asChild
                          >
                            <a
                              href={file.downloadUrl || `/api/drive/download?fileId=${file.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Descargar archivo"
                              className="flex items-center justify-center"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Descargar archivo
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
            </motion.div>
          )}
          
          {/* Timestamp con mejor presentación */}
          {timestamp && (
            <time className="block mt-1 text-[10px] text-muted-foreground/50 dark:text-muted-foreground/40 text-right mr-1">
              {timestamp.toLocaleTimeString('es', { hour: "2-digit", minute: "2-digit" })}
            </time>
          )}
        </div>
      </motion.div>
    );
  }
  
  // ChatBubble para el usuario
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={bubbleVariants}
      className="flex w-full max-w-full mb-1 pl-4 pr-4 gap-3 justify-end mt-1"
    >
      <div className="flex flex-col max-w-[85%] md:max-w-[70%] lg:max-w-[60%]">
        <div
          className={cn(
            "p-3 rounded-lg rounded-br-sm flex-1 whitespace-pre-wrap break-words",
            "bg-primary text-primary-foreground",
            "shadow-sm text-sm md:text-base leading-relaxed"
          )}
        >
          {formattedMessage}
        </div>

        {/* Archivos adjuntos */}
        {files && files.length > 0 && (
          <motion.div 
            variants={attachmentVariants}
            className="mt-2 space-y-1.5"
          >
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center rounded-md p-2 bg-primary/10 dark:bg-primary/20 text-primary"
              >
                <FileIcon mimeType={file.mimeType} />
                <span className="ml-2 truncate max-w-[220px] md:max-w-[300px] text-xs">
                  {file.name}
                </span>
                
                {showDownload && file.type === 'file' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-6 w-6 rounded-full hover:bg-primary/20"
                          asChild
                        >
                          <a
                            href={file.downloadUrl || `/api/drive/download?fileId=${file.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Descargar archivo"
                            className="flex items-center justify-center"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Descargar archivo
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Timestamp con mejor presentación */}
        {timestamp && (
          <div className="text-[10px] mt-1 text-muted-foreground/50 dark:text-muted-foreground/40 text-right">
            {timestamp.toLocaleTimeString('es', { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      <Avatar className="h-8 w-8 shrink-0 border border-border/30">
        <AvatarImage src={userImage} />
        <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary font-medium text-sm">
          {initial}
        </AvatarFallback>
      </Avatar>
    </motion.div>
  );
}

// Íconos para los diferentes tipos de archivos
function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes("image")) {
    return <Image className="h-4 w-4 flex-shrink-0" />;
  }
  
  if (mimeType.includes("pdf")) {
    return <FileText className="h-4 w-4 flex-shrink-0" />;
  }
  
  if (mimeType.includes("folder")) {
    return <File className="h-4 w-4 flex-shrink-0" />;
  }
  
  if (mimeType.includes("zip") || mimeType.includes("archive")) {
    return <FileArchive className="h-4 w-4 flex-shrink-0" />;
  }
  
  return <File className="h-4 w-4 flex-shrink-0" />;
} 