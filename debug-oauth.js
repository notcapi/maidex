const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('Herramienta de diagnóstico para problemas de OAuth en Next-Auth');

// Comprobar existencia del archivo .env.local
console.log('\n1. Verificando variables de entorno...');
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  
  // Verificar variables críticas
  const requiredVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  
  let missingVars = [];
  
  for (const varName of requiredVars) {
    if (!envFile.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`❌ Faltan variables de entorno: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ Variables de entorno básicas configuradas');
  }
  
  // Extraer NEXTAUTH_URL para verificación
  const nextAuthUrlMatch = envFile.match(/NEXTAUTH_URL=(.+?)(\r?\n|$)/);
  if (nextAuthUrlMatch) {
    const nextAuthUrl = nextAuthUrlMatch[1];
    console.log(`   URL de NextAuth configurada como: ${nextAuthUrl}`);
    
    if (!nextAuthUrl.startsWith('http://localhost') && !nextAuthUrl.startsWith('https://')) {
      console.log('⚠️  NEXTAUTH_URL debería comenzar con http:// o https://');
    }
    
    // Verificar si la URL coincide con los orígenes autorizados en Google Cloud Console
    console.log('\n   ℹ️  Asegúrate de que esta URL esté configurada como URI de redirección autorizado');
    console.log('      en tu proyecto de Google Cloud Console.');
  }
} catch (err) {
  console.log('❌ No se pudo leer .env.local:', err.message);
}

// Verificar configuración de cookies
console.log('\n2. Verificando configuración de cookies...');

// Verificar middleware
try {
  const middlewareExists = fs.existsSync('./middleware.ts');
  if (middlewareExists) {
    const middleware = fs.readFileSync('./middleware.ts', 'utf8');
    console.log('✅ Middleware encontrado');
    
    if (middleware.includes('export const config')) {
      console.log('   ℹ️  El middleware tiene configuración personalizada');
    }
  } else {
    console.log('ℹ️  No se encontró middleware.ts, esto no es necesariamente un problema');
  }
} catch (err) {
  console.log('❌ Error al verificar middleware:', err.message);
}

// Verificar si hay problemas de cookies entre dominios
console.log('\n3. Verificando configuración de Next.js...');

try {
  const nextConfigExists = fs.existsSync('./next.config.js');
  if (nextConfigExists) {
    const nextConfig = fs.readFileSync('./next.config.js', 'utf8');
    console.log('✅ next.config.js encontrado');
    
    if (nextConfig.includes('headers')) {
      console.log('   ℹ️  next.config.js configura headers personalizados');
    }
  }
} catch (err) {
  console.log('❌ Error al verificar next.config.js:', err.message);
}

// Verificar archivos de sesión de next-auth
console.log('\n4. Verificando archivos de sesión de Next-Auth...');
const authSessionsPath = path.join(os.homedir(), '.next-auth');

try {
  if (fs.existsSync(authSessionsPath)) {
    const sessionFiles = fs.readdirSync(authSessionsPath);
    console.log(`✅ Directorio .next-auth encontrado con ${sessionFiles.length} archivos`);
  } else {
    console.log('⚠️  No se encontró el directorio .next-auth (posiblemente no hay sesiones almacenadas)');
  }
} catch (err) {
  console.log('❌ Error al verificar archivos de sesión:', err.message);
}

// Buscar errores comunes en los logs
console.log('\n5. Buscando errores comunes en los logs...');

try {
  // Buscar en los logs del servidor de desarrollo de Next.js
  const logFiles = ['.next/server.log', '.next/error.log'];
  
  for (const logFile of logFiles) {
    if (fs.existsSync(logFile)) {
      const log = fs.readFileSync(logFile, 'utf8');
      console.log(`✅ Archivo ${logFile} encontrado`);
      
      // Buscar errores conocidos
      const oauthErrorMatches = log.match(/(?:OAUTH_CALLBACK_ERROR|State cookie was missing)/g);
      if (oauthErrorMatches) {
        console.log(`⚠️  Se encontraron ${oauthErrorMatches.length} errores OAUTH_CALLBACK_ERROR`);
        console.log('   Este error suele aparecer cuando hay problemas con las cookies de sesión de OAuth');
      }
      
      const signInErrorMatches = log.match(/(?:Error: signin callback error|OAuthAccountNotLinked|AccessDenied)/g);
      if (signInErrorMatches) {
        console.log(`⚠️  Se encontraron ${signInErrorMatches.length} errores relacionados con inicio de sesión`);
      }
    }
  }
} catch (err) {
  console.log('❌ Error al buscar en los logs:', err.message);
}

// Verificar versiones de paquetes relevantes
console.log('\n6. Verificando versiones de paquetes...');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  const relevantPackages = [
    'next',
    'next-auth',
    'react',
    'react-dom',
  ];
  
  for (const pkg of relevantPackages) {
    if (packageJson.dependencies[pkg]) {
      console.log(`   ${pkg}: ${packageJson.dependencies[pkg]}`);
    }
  }
  
  // Verificar compatibilidad entre paquetes
  const nextVersion = packageJson.dependencies['next'];
  const nextAuthVersion = packageJson.dependencies['next-auth'];
  
  if (nextVersion && nextAuthVersion) {
    // Extraer versiones principales
    const nextMajor = parseInt(nextVersion.replace(/^\D+/, ''));
    const nextAuthMajor = parseInt(nextAuthVersion.replace(/^\D+/, ''));
    
    if (nextMajor >= 12 && nextAuthMajor < 4) {
      console.log('⚠️  Posible incompatibilidad: Next.js >= 12 funciona mejor con next-auth >= 4');
    }
  }
} catch (err) {
  console.log('❌ Error al verificar package.json:', err.message);
}

// Recomendaciones para solucionar el problema "State cookie was missing"
console.log('\n7. Recomendaciones para el error "State cookie was missing":');
console.log('  - Asegúrate que NEXTAUTH_URL coincida exactamente con la URL donde accedes a la app');
console.log('  - Verificar que la cookie "next-auth.state" se esté estableciendo correctamente');
console.log('  - Considera añadir la siguiente configuración a [...nextauth].ts:');
console.log(`
  export const authOptions = {
    // ... configuración existente ...
    cookies: {
      sessionToken: {
        name: \`__Secure-next-auth.session-token\`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true
        }
      },
      callbackUrl: {
        name: \`__Secure-next-auth.callback-url\`,
        options: {
          sameSite: 'lax',
          path: '/',
          secure: true
        }
      },
      state: {
        name: \`__Secure-next-auth.state\`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
          maxAge: 900
        }
      }
    }
  };
`);

console.log('\nDiagnóstico completado.'); 