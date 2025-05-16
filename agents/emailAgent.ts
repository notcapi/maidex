import { google, gmail_v1 } from 'googleapis';

// Definir el tipo de correo electrónico
interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

export class EmailAgent {
  private gmail: gmail_v1.Gmail;

  constructor() {
    this.gmail = google.gmail('v1');
  }

  async getImportantEmails(accessToken: string, maxResults = 20): Promise<Email[]> {
    try {
      // Configurar el cliente OAuth
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Calcular la fecha de hace 12 horas
      const twelveHoursAgo = new Date();
      twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
      
      // Formato para la consulta de Gmail (timestamp en segundos)
      const timestamp = Math.floor(twelveHoursAgo.getTime() / 1000);
      
      // Query simplificada usando el formato que Gmail entiende mejor
      const queryString = `after:${timestamp}`;
      
      console.log('Buscando correos desde:', twelveHoursAgo.toISOString());
      console.log('Query de búsqueda para Gmail:', queryString);

      // Obtener lista de mensajes sin filtros adicionales
      const response = await this.gmail.users.messages.list({
        auth,
        userId: 'me',
        maxResults,
        q: queryString,
      });

      console.log('Total de correos encontrados:', response.data.messages?.length || 0);

      const emails: Email[] = [];
      
      // Si no hay mensajes, devolver un array vacío
      if (!response.data.messages || response.data.messages.length === 0) {
        return [];
      }

      // Obtener detalles de cada mensaje
      for (const message of response.data.messages) {
        if (message.id) {
          const messageDetails = await this.gmail.users.messages.get({
            auth,
            userId: 'me',
            id: message.id,
          });

          const headers = messageDetails.data.payload?.headers || [];
          const subject = headers.find(header => header.name === 'Subject')?.value || 'Sin asunto';
          const from = headers.find(header => header.name === 'From')?.value || 'Desconocido';
          
          // Extraer snippet (resumen del contenido)
          const snippet = messageDetails.data.snippet || '';
          
          emails.push({
            id: message.id,
            subject,
            from,
            snippet,
            date: new Date(parseInt(messageDetails.data.internalDate || '0')).toLocaleString(),
          });
        }
      }
      
      console.log('Correos procesados:', emails.length);
      
      return emails;
    } catch (error) {
      console.error('Error al obtener correos:', error);
      throw new Error('No se pudieron obtener los correos');
    }
  }

  async sendEmail(accessToken: string, options: {
    to: string[],
    subject: string,
    body: string,
    cc?: string[],
    bcc?: string[],
    mimeType?: string,
    htmlBody?: string,
    driveAttachments?: string[]
  }) {
    try {
      console.log('Iniciando envío de correo con opciones:', JSON.stringify(options, null, 2));
      
      // Configurar el cliente OAuth
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Verificar si hay adjuntos de Drive
      const hasDriveAttachments = options.driveAttachments && Array.isArray(options.driveAttachments) && options.driveAttachments.length > 0;
      
      // Si hay adjuntos de Drive, forzar multipart/mixed, de lo contrario usar el tipo proporcionado
      const mimeType = hasDriveAttachments ? 'multipart/mixed' : (options.mimeType || 'text/plain');
      
      // Convertir el destinatario a array si es una cadena
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      console.log('Destinatarios:', toArray);
      
      // Crear la estructura del correo según el tipo MIME
      let emailLines: string[] = [];
      const headers = [
        `To: ${toArray.join(', ')}`,
        `Subject: ${options.subject}`,
        // Importante: añadir cabecera MIME-Version para compatibilidad
        'MIME-Version: 1.0'
      ];
      
      // Añadir CC y BCC si existen
      if (options.cc && options.cc.length > 0) {
        headers.push(`Cc: ${options.cc.join(', ')}`);
      }
      
      if (options.bcc && options.bcc.length > 0) {
        headers.push(`Bcc: ${options.bcc.join(', ')}`);
      }
      
      // Generar un límite único para partes multipart
      const boundary = `boundary_${Math.random().toString(36).substring(2)}`;
      
      // Si tenemos adjuntos de Drive, usar formato multipart/mixed
      if (hasDriveAttachments && options.driveAttachments) {
        console.log(`Procesando ${options.driveAttachments.length} adjuntos de Drive`);
        
        // Configurar el cliente de Drive
        const drive = google.drive({version: 'v3', auth});
        
        headers.push(`Content-Type: multipart/mixed; boundary=${boundary}`);
        emailLines = [...headers, ''];
        
        // Añadir la parte del texto
        emailLines.push(
          `--${boundary}`,
          'Content-Type: text/plain; charset=UTF-8',
          '',
          options.body
        );
        
        // Si hay una versión HTML del cuerpo, añadirla también
        if (options.htmlBody) {
          emailLines.push(
            `--${boundary}`,
            'Content-Type: text/html; charset=UTF-8',
            '',
            options.htmlBody
          );
        }
        
        // Procesar cada adjunto de Drive
        for (const fileId of options.driveAttachments) {
          try {
            console.log(`Procesando adjunto con ID: ${fileId}`);
            
            // Obtener metadatos del archivo
            const fileMetadata = await drive.files.get({
              fileId,
              fields: 'name,mimeType'
            });
            
            // Obtener el contenido del archivo
            const fileContent = await drive.files.get({
              fileId,
              alt: 'media'
            }, {
              responseType: 'arraybuffer'
            });
            
            // Codificar el contenido en base64
            const base64Content = Buffer.from(fileContent.data as ArrayBuffer).toString('base64');
            
            // Añadir el adjunto como parte multipart
            emailLines.push(
              `--${boundary}`,
              `Content-Type: ${fileMetadata.data.mimeType}; name="${fileMetadata.data.name}"`,
              `Content-Disposition: attachment; filename="${fileMetadata.data.name}"`,
              'Content-Transfer-Encoding: base64',
              '',
              base64Content
            );
            
            console.log(`Adjunto añadido: ${fileMetadata.data.name}`);
          } catch (err) {
            console.error(`Error al procesar adjunto con ID ${fileId}:`, err);
          }
        }
        
        // Cerrar el límite multipart
        emailLines.push(`--${boundary}--`);
      } else {
        // Sin adjuntos, procesar según el tipo MIME original
        if (mimeType === 'text/plain') {
          headers.push('Content-Type: text/plain; charset=UTF-8');
          emailLines = [...headers, '', options.body];
        } else if (mimeType === 'text/html') {
          headers.push('Content-Type: text/html; charset=UTF-8');
          emailLines = [...headers, '', options.body];
        } else if (mimeType === 'multipart/alternative' && options.htmlBody) {
          // Crear un correo multipart con versión texto y HTML
          headers.push(`Content-Type: multipart/alternative; boundary=${boundary}`);
          
          emailLines = [
            ...headers,
            '',
            `--${boundary}`,
            'Content-Type: text/plain; charset=UTF-8',
            '',
            options.body,
            `--${boundary}`,
            'Content-Type: text/html; charset=UTF-8',
            '',
            options.htmlBody,
            `--${boundary}--`
          ];
        }
      }
      
      // Convertir el email a formato base64 URL-safe
      const email = emailLines.join('\r\n');
      console.log('Email raw (primeros 500 chars):', email.substring(0, 500));
      
      const encodedEmail = Buffer.from(email).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Parámetros adicionales para asegurar que se guarde en Enviados
      const requestParams = {
        auth,
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          // Asegurar que se guarde en Enviados
          labelIds: ['SENT']
        }
      };
      
      console.log('Enviando correo con parámetros:', JSON.stringify(
        { userId: requestParams.userId, labels: requestParams.requestBody.labelIds }, 
        null, 
        2
      ));
      
      // Enviar el correo
      const response = await this.gmail.users.messages.send(requestParams);
      
      console.log('Correo enviado correctamente:', response.data.id);
      console.log('Respuesta completa:', JSON.stringify(response.data, null, 2));
      
      return {
        success: true,
        messageId: response.data.id,
      };
    } catch (error) {
      console.error('Error al enviar correo:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
} 