// Script para verificar la configuración de OAuth en .env.local
import dotenv from 'dotenv';
import fs from 'fs';
import { google } from 'googleapis';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Variables OAuth requeridas
const requiredVars = [
  'GOOGLE_CLIENT_ID', 
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

// Variables para Supabase
const supabaseVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY'
];

// Verificar existencia y formato de las variables
console.log('=== Verificación de Variables de Entorno ===\n');

// Verificar variables OAuth
console.log('Variables OAuth:');
let oauthConfigOk = true;
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: No encontrada`);
    oauthConfigOk = false;
  } else {
    // Ocultar parte del valor por seguridad
    const maskedValue = value.length > 8 
      ? value.substring(0, 4) + '...' + value.substring(value.length - 4)
      : '********';
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
}

// Verificar variables Supabase
console.log('\nVariables Supabase:');
let supabaseConfigOk = true;
for (const varName of supabaseVars) {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: No encontrada`);
    supabaseConfigOk = false;
  } else {
    // Ocultar parte del valor por seguridad
    const maskedValue = value.length > 8 
      ? value.substring(0, 4) + '...' + value.substring(value.length - 4)
      : '********';
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
}

// Verificar la URL de NextAuth
const nextauthUrl = process.env.NEXTAUTH_URL;
if (nextauthUrl) {
  console.log('\nVerificando URL de NextAuth:');
  try {
    const url = new URL(nextauthUrl);
    console.log(`✅ Protocolo: ${url.protocol}`);
    console.log(`✅ Dominio: ${url.hostname}`);
    console.log(`✅ Puerto: ${url.port || 'Por defecto'}`);
    console.log(`✅ URL completa de callback: ${url.origin}/api/auth/callback/google`);
  } catch (error) {
    console.log(`❌ URL inválida: ${nextauthUrl}`);
  }
}

// Configuración de OAuth con Google
if (oauthConfigOk) {
  console.log('\nConfigurando cliente OAuth:');
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
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
    
    console.log('✅ Cliente OAuth configurado correctamente');
    console.log('✅ URL de autorización generada');
    console.log('\nPara verificar el proceso completo de autenticación y envío de correo:');
    console.log('1. Detén y vuelve a iniciar sesión en la aplicación');
    console.log('2. Asegúrate de aceptar todos los permisos solicitados');
    console.log('3. Verifica los logs del servidor para detectar errores durante el envío');
  } catch (error) {
    console.log(`❌ Error al configurar cliente OAuth: ${error.message}`);
  }
}

// Verificar archivo nextauth.ts
console.log('\nVerificando configuración de NextAuth:');
try {
  // Ruta al archivo de configuración de NextAuth
  const nextauthFile = './pages/api/auth/[...nextauth].ts';
  
  if (fs.existsSync(nextauthFile)) {
    const content = fs.readFileSync(nextauthFile, 'utf8');
    
    // Verificar scope de Gmail
    if (content.includes('gmail.send')) {
      console.log('✅ Permiso gmail.send configurado');
    } else {
      console.log('❌ PERMISO FALTANTE: No se encontró scope gmail.send');
    }
    
    if (content.includes('gmail.readonly')) {
      console.log('✅ Permiso gmail.readonly configurado');
    } else {
      console.log('❌ PERMISO FALTANTE: No se encontró scope gmail.readonly');
    }
    
    // Verificar prompt de consentimiento
    if (content.includes('prompt: "consent"')) {
      console.log('✅ Prompt de consentimiento configurado');
    } else {
      console.log('❌ Advertencia: No se encontró prompt de consentimiento');
    }
    
    // Verificar access_type offline
    if (content.includes('access_type: \'offline\'')) {
      console.log('✅ Access type: offline configurado (para obtener refresh token)');
    } else {
      console.log('❌ Advertencia: No se encontró access_type: offline');
    }
  } else {
    console.log(`❌ No se encontró el archivo ${nextauthFile}`);
  }
} catch (error) {
  console.log(`❌ Error al verificar configuración de NextAuth: ${error.message}`);
}

// Resumen
console.log('\n=== Resumen de la verificación ===');
console.log(`Configuración OAuth: ${oauthConfigOk ? '✅ Correcta' : '❌ Incompleta'}`);
console.log(`Configuración Supabase: ${supabaseConfigOk ? '✅ Correcta' : '❌ Incompleta'}`);
console.log('\nSolución de problemas comunes:');
console.log('1. Asegúrate de que has concedido todos los permisos en la pantalla de autorización de Google');
console.log('2. Verifica que la URI de redirección en Google Cloud Console coincida exactamente con tu NEXTAUTH_URL/api/auth/callback/google');
console.log('3. El token puede haber expirado - vuelve a iniciar sesión en la aplicación');
console.log('4. Las credenciales en .env.local deben coincidir con las de tu proyecto en Google Cloud Console');
console.log('5. Verifica que el usuario de Gmail no tenga restricciones adicionales (como 2FA para aplicaciones menos seguras)'); 