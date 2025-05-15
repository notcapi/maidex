import React from 'react';
import { DriveFileList } from './DriveFileList';

// Datos de ejemplo
const sampleFiles = [
  {
    name: "Documento de texto.txt",
    type: "file" as const,
    extension: "txt",
    downloadUrl: "#"
  },
  {
    name: "Imagen de paisaje.jpg",
    type: "file" as const,
    extension: "jpg",
    downloadUrl: "#"
  },
  {
    name: "Presentación del proyecto.pdf",
    type: "file" as const,
    extension: "pdf",
    downloadUrl: "#"
  },
  {
    name: "Hoja de cálculo.xlsx",
    type: "file" as const,
    extension: "xlsx",
    downloadUrl: "#"
  },
  {
    name: "Código fuente.js",
    type: "file" as const,
    extension: "js",
    downloadUrl: "#"
  },
  {
    name: "Archivos comprimidos.zip",
    type: "file" as const,
    extension: "zip",
    downloadUrl: "#"
  },
  {
    name: "Video de demostración.mp4",
    type: "file" as const,
    extension: "mp4",
    downloadUrl: "#"
  },
  {
    name: "Música de fondo.mp3",
    type: "file" as const,
    extension: "mp3",
    downloadUrl: "#"
  },
  {
    name: "Carpeta de documentos",
    type: "folder" as const,
    extension: "",
  }
];

export function DriveExample() {
  return (
    <div className="p-4">
      <DriveFileList 
        files={sampleFiles} 
        title="Archivos de ejemplo" 
      />
    </div>
  );
} 