/**
 * Interfaz para tokens de OAuth de Google
 */
export interface GoogleTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Tipos para información de archivos de Google Drive
 */
export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  webContentLink?: string;
  content?: string;
}

/**
 * Parámetros para envío de correo electrónico
 */
export interface EmailParams {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  mimeType?: string;
  htmlBody?: string;
  driveAttachments?: string[];
}

/**
 * Parámetros para creación de eventos en calendario
 */
export interface EventParams {
  summary: string;
  description?: string;
  location?: string;
  start: string | Date;
  end: string | Date;
  attendees?: { email: string, optional?: boolean }[];
  reminders?: { useDefault: boolean; overrides?: { method: string; minutes: number }[] };
  calendarId?: string;
}

/**
 * Respuesta genérica de operaciones de API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 