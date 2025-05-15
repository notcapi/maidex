import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

  return (
    <div
      className={cn(
        "flex w-full max-w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col max-w-[80%]">
        <div
          className={cn(
            "p-3 rounded-2xl flex-1 whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-muted text-foreground rounded-bl-none",
            "animate-fade-in transition-all"
          )}
        >
          {message}
        </div>

        {/* Archivos adjuntos */}
        {files && files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center text-xs rounded-lg p-2",
                  isUser ? "bg-primary/80 text-primary-foreground" : "bg-muted/80 text-foreground"
                )}
              >
                <FileIcon mimeType={file.mimeType} />
                <span className="ml-2 truncate max-w-[180px]">{file.name}</span>
                
                {showDownload && (
                  <a
                    href={`/api/drive/download?fileId=${file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "ml-auto flex items-center p-1 rounded-full",
                      isUser ? "hover:bg-primary-foreground/10" : "hover:bg-foreground/10"
                    )}
                  >
                    <DownloadIcon />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div
            className={cn(
              "text-xs mt-1",
              isUser ? "text-muted-foreground text-right" : "text-muted-foreground"
            )}
          >
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 ml-2 shrink-0">
          <AvatarImage src={userImage} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      )}
    </div>
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

function DownloadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
} 