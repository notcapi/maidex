import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, File, FileText, FileType, FileImage, Archive, Code, Table, Folder, Video, Music, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriveFileCardProps {
  name: string;
  type: "file" | "folder";
  extension: string;
  downloadUrl?: string;
}

export function DriveFileCard({ name, type, extension, downloadUrl }: DriveFileCardProps) {
  // Función para truncar el nombre si es muy largo
  const truncateName = (name: string, maxLength = 16) => {
    if (name.length <= maxLength) return name;
    const nameParts = name.split(".");
    const ext = nameParts.pop();
    const baseName = nameParts.join(".");
    
    if (baseName.length <= maxLength - 3 - (ext?.length || 0)) {
      return baseName + "." + ext;
    }
    
    return baseName.substring(0, maxLength - 3 - (ext?.length || 0)) + "..." + (ext ? `.${ext}` : "");
  };

  // Seleccionar el icono apropiado según el tipo y extensión
  const getIcon = () => {
    if (type === "folder") return <Folder className="h-8 w-8 text-blue-500" />;

    const lowerExt = extension.toLowerCase();
    
    // Archivos de imagen
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(lowerExt)) {
      return <FileImage className="h-8 w-8 text-purple-500" />;
    }
    
    // Documentos
    if (["doc", "docx", "odt", "rtf", "txt"].includes(lowerExt)) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    }
    
    // PDF
    if (lowerExt === "pdf") {
      return <FileType className="h-8 w-8 text-red-500" />;
    }
    
    // Hojas de cálculo
    if (["xls", "xlsx", "csv", "ods"].includes(lowerExt)) {
      return <Table className="h-8 w-8 text-green-600" />;
    }
    
    // Código
    if (["js", "jsx", "ts", "tsx", "html", "css", "json", "xml", "py", "java", "php", "c", "cpp"].includes(lowerExt)) {
      return <Code className="h-8 w-8 text-yellow-600" />;
    }
    
    // Archivos comprimidos
    if (["zip", "rar", "7z", "tar", "gz"].includes(lowerExt)) {
      return <Archive className="h-8 w-8 text-gray-600" />;
    }
    
    // Videos
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(lowerExt)) {
      return <Video className="h-8 w-8 text-pink-500" />;
    }
    
    // Audio
    if (["mp3", "wav", "ogg", "flac", "aac"].includes(lowerExt)) {
      return <Music className="h-8 w-8 text-indigo-500" />;
    }
    
    // Desconocido o sin extensión
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <Card className="w-full max-w-[220px] h-[130px] hover:shadow-md transition-all duration-200 group border border-border overflow-hidden flex flex-col">
      <CardContent className="p-3 flex flex-col items-center h-full justify-between">
        <div className="w-full flex justify-center items-center h-8">
          {getIcon()}
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full text-center font-medium text-sm truncate h-6 flex items-center justify-center">
                {truncateName(name)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="w-full h-7 flex items-center justify-center">
          {downloadUrl && type === "file" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs py-0 h-7"
              onClick={() => window.open(downloadUrl, "_blank")}
            >
              <Download className="h-3 w-3 mr-1" />
              Descargar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 