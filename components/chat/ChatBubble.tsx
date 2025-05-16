import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type File = {
  id: string;
  name: string;
  mimeType: string;
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
  const initial = userName ? userName.charAt(0).toUpperCase() : isUser ? "U" : "AI";

  if (!isUser) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={bubbleVariants}
        className="flex items-start space-x-3 px-4 py-4 mt-2 first:mt-8"
      >
        <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-black to-gray-700 text-white shadow-md border border-border/20">
          <span className="font-medium text-sm">AI</span>
        </div>
        
        <div className="flex flex-col max-w-[85%] md:max-w-[75%] w-full">
          <div className="bg-card rounded-2xl px-4 py-3 relative shadow-sm border border-border/30">
            <div className="text-sm md:text-base leading-relaxed text-card-foreground whitespace-pre-wrap break-words">
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
                    "flex items-center text-xs rounded-lg p-3 bg-muted/60 text-muted-foreground border border-border/30"
                  )}
                >
                  <FileIcon mimeType={file.mimeType} />
                  <span className="ml-2 truncate max-w-[180px] md:max-w-[300px]">{file.name}</span>
                  
                  {showDownload && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 rounded-full hover:bg-background"
                      asChild
                    >
                      <a
                        href={`/api/drive/download?fileId=${file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Descargar archivo"
                      >
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
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
          
          {/* Timestamp */}
          {timestamp && (
            <time className="block mt-1 text-xs text-muted-foreground/70 text-right mr-1">
              {timestamp.toLocaleTimeString('es', { hour: "2-digit", minute: "2-digit" })}
            </time>
          )}
        </div>
      </motion.div>
    );
  }
  
  // Mejorar diseño para las burbujas del usuario
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={bubbleVariants}
      className="flex w-full max-w-full mb-4 px-3 gap-2 justify-end mt-2"
    >
      <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
        <div
          className={cn(
            "p-3 rounded-2xl flex-1 whitespace-pre-wrap break-words",
            "bg-primary text-primary-foreground rounded-br-none",
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
                className="flex items-center text-xs rounded-lg p-3 bg-primary/80 text-primary-foreground"
              >
                <FileIcon mimeType={file.mimeType} />
                <span className="ml-2 truncate max-w-[180px] md:max-w-[300px]">{file.name}</span>
                
                {showDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8 rounded-full hover:bg-primary-foreground/10"
                    asChild
                  >
                    <a
                      href={`/api/drive/download?fileId=${file.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Descargar archivo"
                    >
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
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className="text-xs mt-1 text-muted-foreground/70 text-right">
            {timestamp.toLocaleTimeString('es', { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      <Avatar className="h-9 w-9 shrink-0 shadow-sm border">
        <AvatarImage src={userImage} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{initial}</AvatarFallback>
      </Avatar>
    </motion.div>
  );
}

// Íconos simples para los archivos
function FileIcon({ mimeType }: { mimeType: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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
      ) : (
        <>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </>
      )}
    </svg>
  );
} 