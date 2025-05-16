// Script para probar el envío de correo electrónico con OAuth 2.0
import { google } from 'googleapis';
import dotenv from 'dotenv';
import readline from 'readline';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configurar cliente OAuth
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.NEXTAUTH_URL || 'http://localhost:3000';

if (!clientId || !clientSecret) {
  console.error('Error: Se requieren GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local');
  process.exit(1);
}

// Crear cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  `${redirectUri}/api/auth/callback/google`
);

// Obtener URL para autorización
const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
});

console.log('Abre esta URL en tu navegador para autorizar la aplicación:');
console.log(authUrl);

// Configurar readline para ingresar el código de autorización
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para enviar el correo
async function sendEmail(auth) {
  try {
    console.log('Configurando cliente de Gmail...');
    const gmail = google.gmail({version: 'v1', auth});
    
    const destinatario = await new Promise(resolve => {
      rl.question('\nIngresa la dirección de correo electrónico del destinatario: ', answer => {
        resolve(answer.trim());
      });
    });
    
    // Crear correo simple
    const emailLines = [
      `To: ${destinatario}`,
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
    
    console.log(`\nEnviando correo a ${destinatario}...`);
    
    // Enviar el correo
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    console.log('\n✅ Correo enviado correctamente. ID:', response.data.id);
    
    // Etiquetar como SENT
    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: response.data.id,
        requestBody: {
          addLabelIds: ['SENT']
        }
      });
      console.log('✅ Correo etiquetado como SENT');
    } catch (error) {
      console.error('❌ Error al etiquetar el correo:', error.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error al enviar el correo:', error.message);
    if (error.response) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Solicitar el código de autorización
rl.question('\nPega aquí el código de autorización después de iniciar sesión: ', async (code) => {
  try {
    console.log('\nObteniendo tokens de acceso...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    console.log('\n✅ Autenticación exitosa');
    console.log('Token de acceso:', tokens.access_token.substring(0, 20) + '...');
    
    // Mostrar información del usuario
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    
    const userInfo = await oauth2.userinfo.get();
    console.log('\nUsuario autenticado:');
    console.log(`- Email: ${userInfo.data.email}`);
    console.log(`- Nombre: ${userInfo.data.name}`);
    
    // Enviar un correo de prueba
    await sendEmail(oauth2Client);
    
  } catch (error) {
    console.error('\n❌ Error durante la autenticación:', error.message);
    if (error.response) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    rl.close();
  }
}); 