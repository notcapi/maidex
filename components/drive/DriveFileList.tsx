import React from "react";
import { DriveFileCard } from "./DriveFileCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DriveFile {
  name: string;
  type: "file" | "folder";
  extension: string;
  downloadUrl?: string;
}

interface DriveFileListProps {
  files: DriveFile[];
  title?: string;
  emptyMessage?: string;
}

export function DriveFileList({ 
  files, 
  title = "Archivos", 
  emptyMessage = "No hay archivos para mostrar"
}: DriveFileListProps) {
  return (
    <Card className="w-full border-border">
      {title && (
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="px-3 py-2">
        {files.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" style={{ gridAutoRows: '130px' }}>
            {files.map((file, index) => (
              <DriveFileCard
                key={`${file.name}-${index}`}
                name={file.name}
                type={file.type}
                extension={file.extension}
                downloadUrl={file.downloadUrl}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 