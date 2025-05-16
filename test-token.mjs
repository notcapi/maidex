// Script para verificar la validez de un token de acceso de Google
import { google } from 'googleapis';

// Tomar el token como argumento de la línea de comandos
const accessToken = process.argv[2];

if (!accessToken) {
  console.error('Error: Debes proporcionar un token de acceso como argumento');
  console.log('Uso: node test-token.mjs "tu-token-de-acceso"');
  process.exit(1);
}

async function testToken(token) {
  try {
    console.log('Verificando token de acceso...');
    
    // Configurar el cliente OAuth
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    
    // Verificar el token obteniendo información básica del usuario
    const oauth2 = google.oauth2({
      auth,
      version: 'v2'
    });
    
    console.log('Consultando información de usuario...');
    const userInfo = await oauth2.userinfo.get();
    
    console.log('Token válido para el usuario:');
    console.log(`- Email: ${userInfo.data.email}`);
    console.log(`- Nombre: ${userInfo.data.name}`);
    
    // Verificar acceso a Gmail
    const gmail = google.gmail('v1');
    console.log('Verificando acceso a Gmail...');
    
    const profile = await gmail.users.getProfile({
      auth,
      userId: 'me'
    });
    
    console.log('Perfil de Gmail accesible:');
    console.log(`- Email: ${profile.data.emailAddress}`);
    console.log(`- Total mensajes: ${profile.data.messagesTotal}`);
    
    // Verificar permisos específicos
    console.log('\nVerificando permisos específicos...');
    
    try {
      // Intentar listar algunas etiquetas (solo requiere readonly)
      const labels = await gmail.users.labels.list({
        auth,
        userId: 'me'
      });
      console.log('✅ Permiso GMAIL.READONLY confirmado');
    } catch (error) {
      console.log('❌ No hay permiso GMAIL.READONLY');
    }
    
    try {
      // Crear un borrador temporal para verificar permiso de envío
      // (lo eliminamos inmediatamente)
      const draftResponse = await gmail.users.drafts.create({
        auth,
        userId: 'me',
        requestBody: {
          message: {
            raw: Buffer.from('Subject: Test\n\nTest').toString('base64')
          }
        }
      });
      
      // Eliminar el borrador creado
      if (draftResponse.data.id) {
        await gmail.users.drafts.delete({
          auth,
          userId: 'me',
          id: draftResponse.data.id
        });
      }
      
      console.log('✅ Permiso GMAIL.SEND confirmado');
    } catch (error) {
      console.log('❌ No hay permiso GMAIL.SEND - El envío de correos no funcionará');
      console.error('Error al verificar permiso de envío:', error.message);
    }
    
    console.log('\nResumen de la verificación:');
    console.log('- Token funcional: ✅');
    console.log('- Acceso a cuenta de usuario: ✅');
    console.log('- Acceso a Gmail: ✅');
    
  } catch (error) {
    console.error('Error durante la verificación del token:', error);
    console.log('\nEl token parece ser inválido o ha expirado.');
    console.log('Por favor, inicia sesión nuevamente en la aplicación para obtener un token fresco.');
    
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
  }
}

testToken(accessToken); 