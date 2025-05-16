// Script para obtener el token de acceso actual de la sesión
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_KEY no configuradas');
  console.log('Asegúrate de tener un archivo .env.local con estas variables');
  process.exit(1);
}

// Email del usuario como argumento (opcional)
const userEmail = process.argv[2];

async function getSessionToken() {
  try {
    console.log('Conectando a Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Consultar la tabla de sesiones
    console.log('Buscando sesiones activas...');
    
    let query = supabase
      .from('sessions')
      .select('*')
      .order('expires', { ascending: false });
    
    // Si se proporcionó un email, filtrar por ese usuario
    if (userEmail) {
      console.log(`Filtrando sesiones para el usuario: ${userEmail}`);
      query = query.ilike('user_id', `%${userEmail}%`);
    }
    
    const { data: sessions, error } = await query;
    
    if (error) {
      throw new Error(`Error al consultar sesiones: ${error.message}`);
    }
    
    if (!sessions || sessions.length === 0) {
      console.log('No se encontraron sesiones activas');
      if (userEmail) {
        console.log(`Prueba sin especificar un email o asegúrate de que ${userEmail} ha iniciado sesión`);
      }
      process.exit(1);
    }
    
    console.log(`Se encontraron ${sessions.length} sesiones`);
    
    // Mostrar información de la sesión más reciente
    const latestSession = sessions[0];
    const sessionData = JSON.parse(latestSession.session_data);
    
    console.log('\nInformación de la sesión:');
    console.log(`- Usuario: ${sessionData.user?.email || 'Desconocido'}`);
    console.log(`- Expira: ${new Date(latestSession.expires).toLocaleString()}`);
    
    // Extraer el token de acceso
    if (sessionData.accessToken) {
      console.log('\n✅ Token de acceso encontrado');
      
      // Guardar el token en un archivo temporal
      const tokenFile = './token-temp.txt';
      await fs.writeFile(tokenFile, sessionData.accessToken);
      
      console.log(`\nToken guardado en ${tokenFile}`);
      console.log('\nPuedes usar este token con los scripts de prueba:');
      console.log(`node test-token.mjs "$(cat ${tokenFile})"`);
      console.log(`node test-email-simple.mjs "$(cat ${tokenFile})"`);
      
      // Mostrar parte del token (por seguridad no lo mostramos completo)
      const tokenStart = sessionData.accessToken.substring(0, 10);
      console.log(`\nInicio del token: ${tokenStart}...`);
    } else {
      console.log('\n❌ No se encontró un token de acceso en la sesión');
      console.log('Es posible que el usuario necesite iniciar sesión nuevamente');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getSessionToken(); 