// Script para verificar etiquetas de Gmail y la configuración de la bandeja de enviados
import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Crear cliente OAuth2
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`;

if (!clientId || !clientSecret) {
  console.error('Error: Se requieren GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Obtener URL para autorización
const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
});

console.log('Para verificar la configuración de etiquetas de Gmail y la bandeja de enviados,');
console.log('debes autorizar esta aplicación visitando la siguiente URL:');
console.log(authUrl);

// Configurar readline para ingresar el código de autorización
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para listar etiquetas
async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  
  try {
    console.log('\nObteniendo lista de etiquetas de Gmail...');
    const response = await gmail.users.labels.list({
      userId: 'me',
    });
    
    const labels = response.data.labels;
    if (!labels || labels.length === 0) {
      console.log('No se encontraron etiquetas.');
      return;
    }
    
    console.log('\nEtiquetas disponibles:');
    const sentLabel = labels.find(label => label.id === 'SENT');
    
    labels.forEach(label => {
      const isSent = label.id === 'SENT' ? '⭐️' : '';
      console.log(`${isSent} ID: ${label.id} - Nombre: ${label.name}`);
    });
    
    if (sentLabel) {
      console.log('\n✅ La etiqueta SENT existe correctamente');
      
      // Obtener detalles de la etiqueta SENT
      const sentDetails = await gmail.users.labels.get({
        userId: 'me',
        id: 'SENT'
      });
      
      console.log('\nDetalles de la etiqueta SENT:');
      console.log(JSON.stringify(sentDetails.data, null, 2));
    } else {
      console.log('\n❌ No se encontró la etiqueta SENT. Esto podría ser un problema grave.');
    }
    
    // Verificar mensajes recientes en SENT
    console.log('\nBuscando mensajes recientes en la bandeja de enviados...');
    const sentMessages = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SENT'],
      maxResults: 5
    });
    
    if (!sentMessages.data.messages || sentMessages.data.messages.length === 0) {
      console.log('❌ No se encontraron mensajes en la bandeja de enviados.');
      return;
    }
    
    console.log(`✅ Se encontraron ${sentMessages.data.messages.length} mensajes recientes en la bandeja de enviados.`);
    
    // Verificar un mensaje específico para ver sus etiquetas
    const messageId = sentMessages.data.messages[0].id;
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId
    });
    
    console.log('\nEtiquetas del mensaje más reciente:');
    console.log(message.data.labelIds);
    
    // Verificar headers del mensaje
    const headers = message.data.payload.headers;
    const subject = headers.find(header => header.name === 'Subject')?.value || 'Sin asunto';
    const to = headers.find(header => header.name === 'To')?.value || 'Desconocido';
    const from = headers.find(header => header.name === 'From')?.value || 'Desconocido';
    
    console.log('\nInformación del mensaje más reciente:');
    console.log(`De: ${from}`);
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
  }
}

// Solicitar el código de autorización y listar etiquetas
rl.question('\nPega aquí el código de autorización: ', async (code) => {
  try {
    console.log('\nObteniendo token de acceso...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    console.log('Token de acceso obtenido correctamente');
    
    // Listar etiquetas
    await listLabels(oauth2Client);
    
    console.log('\n=== Análisis de problemas con el envío de correos ===');
    console.log('Si los correos no aparecen en la bandeja de enviados, puede deberse a:');
    console.log('1. La etiqueta SENT no se está aplicando correctamente al enviar');
    console.log('2. El usuario no tiene los permisos adecuados para etiquetar mensajes');
    console.log('3. Los correos se están enviando pero no se están etiquetando como SENT');
    console.log('\nSolución:');
    console.log('- Asegúrate de aplicar la etiqueta SENT con users.messages.modify después de enviar');
    console.log('- Verifica que el token tenga el scope gmail.modify o gmail.labels');
    console.log('- Incluye los labelIds: ["SENT"] en el requestBody al enviar el correo');
    console.log('- Inicia sesión nuevamente para obtener tokens frescos con todos los permisos');
    
  } catch (error) {
    console.error('Error durante la autenticación:', error);
  } finally {
    rl.close();
  }
}); 