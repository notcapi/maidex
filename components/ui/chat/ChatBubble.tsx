import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
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

  // Componente de ChatBubble para el asistente
  if (!isUser) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={bubbleVariants}
        className="flex items-start space-x-3 px-4 py-2.5 mt-2 first:mt-8"
      >
        <Avatar className="h-8 w-8 shrink-0 shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200 font-medium text-sm">
            {initial}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col max-w-[85%] md:max-w-[75%] w-full">
          <div className="bg-card dark:bg-slate-900 rounded-xl rounded-tl-sm px-4 py-3 relative shadow-sm border border-border/30 dark:border-slate-700">
            <div className="text-sm md:text-base leading-relaxed text-card-foreground dark:text-slate-200 whitespace-pre-wrap break-words">
              {message}
            </div>
          </div>
          
          {/* Archivos adjuntos */}
          {files && files.length > 0 && (
            <motion.div 
              variants={attachmentVariants}
              className="mt-2 space-y-2"
            >
              {files.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center text-xs rounded-lg p-2.5 bg-muted/60 dark:bg-slate-800/70 text-muted-foreground dark:text-slate-300 border border-border/30 dark:border-slate-700/50"
                  )}
                >
                  <FileIcon mimeType={file.mimeType} />
                  <span className="ml-2 truncate max-w-[180px] md:max-w-[300px]">{file.name}</span>
                  
                  {showDownload && file.type === 'file' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-7 w-7 rounded-full hover:bg-background dark:hover:bg-slate-700"
                            asChild
                          >
                            <a
                              href={file.downloadUrl || `/api/drive/download?fileId=${file.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Descargar archivo"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Descargar archivo</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
            </motion.div>
          )}
          
          {/* Timestamp con mejor presentación */}
          {timestamp && (
            <time className="block mt-1 text-[11px] text-muted-foreground/60 dark:text-slate-500 text-right mr-1">
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
      className="flex w-full max-w-full mb-4 pl-4 pr-3 gap-3 justify-end mt-2"
    >
      <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
        <div
          className={cn(
            "p-3 rounded-xl rounded-br-sm flex-1 whitespace-pre-wrap break-words",
            "bg-primary dark:bg-primary/90 text-primary-foreground",
            "shadow-sm text-sm md:text-base leading-relaxed"
          )}
        >
          {message}
        </div>

        {/* Archivos adjuntos */}
        {files && files.length > 0 && (
          <motion.div 
            variants={attachmentVariants}
            className="mt-2 space-y-2"
          >
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center text-xs rounded-lg p-2.5 bg-primary/80 dark:bg-primary/70 text-primary-foreground"
              >
                <FileIcon mimeType={file.mimeType} />
                <span className="ml-2 truncate max-w-[180px] md:max-w-[300px]">{file.name}</span>
                
                {showDownload && file.type === 'file' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-7 w-7 rounded-full hover:bg-primary-foreground/10"
                          asChild
                        >
                          <a
                            href={file.downloadUrl || `/api/drive/download?fileId=${file.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Descargar archivo"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Descargar archivo</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Timestamp con mejor presentación */}
        {timestamp && (
          <div className="text-[11px] mt-1 text-muted-foreground/60 dark:text-slate-500 text-right">
            {timestamp.toLocaleTimeString('es', { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      <Avatar className="h-8 w-8 shrink-0 shadow-sm">
        <AvatarImage src={userImage} />
        <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary font-medium text-sm">{initial}</AvatarFallback>
      </Avatar>
    </motion.div>
  );
}

// Íconos para los diferentes tipos de archivos
function FileIcon({ mimeType }: { mimeType: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      {mimeType.includes("image") ? (
        <>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </>
      ) : mimeType.includes("pdf") ? (
        <>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </>
      ) : mimeType.includes("folder") ? (
        <>
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
        </>
      ) : (
        <>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </>
      )}
    </svg>
  );
} 