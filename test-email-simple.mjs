// Script de prueba para enviar un correo electrónico simple
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

// Si tienes un token de acceso, puedes probarlo directamente
const accessToken = process.argv[2]; // Pasar el token como argumento al script

async function sendTestEmail(accessToken) {
  if (!accessToken) {
    console.error('Error: Debes proporcionar un token de acceso como primer argumento');
    console.log('Uso: node test-email-simple.mjs "tu-token-de-acceso"');
    process.exit(1);
  }

  try {
    console.log('Iniciando prueba de envío de correo...');
    
    // Configurar el cliente OAuth
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    // Crear cliente de Gmail
    const gmail = google.gmail('v1');
    
    // Prompt para ingresar el destinatario
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Solicitar destinatario
    const recipient = await new Promise(resolve => {
      rl.question('Ingresa la dirección de correo del destinatario: ', (answer) => {
        resolve(answer.trim());
      });
    });

    // Crear un email básico
    const emailLines = [
      `To: ${recipient}`,
      'Subject: Correo de prueba desde Maidex',
      'From: me',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      'Este es un correo de prueba enviado desde Maidex para verificar la funcionalidad de envío de correos.',
      '',
      'Si has recibido este correo, significa que la integración con Gmail está funcionando correctamente.',
      '',
      'Saludos,',
      'Maidex - Tu asistente personal'
    ];
    
    // Codificar el email en base64 URL-safe
    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    console.log(`Enviando correo a ${recipient}...`);
    
    // Enviar el correo
    const response = await gmail.users.messages.send({
      auth,
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    console.log('Correo enviado correctamente. ID:', response.data.id);
    
    // Etiquetar como SENT
    try {
      await gmail.users.messages.modify({
        auth,
        userId: 'me',
        id: response.data.id,
        requestBody: {
          addLabelIds: ['SENT']
        }
      });
      console.log('Correo etiquetado como SENT');
    } catch (error) {
      console.error('Error al etiquetar el correo:', error);
    }
    
    rl.close();
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    if (error.response) {
      console.error('Respuesta de error:', error.response.data);
    }
  }
}

sendTestEmail(accessToken); 