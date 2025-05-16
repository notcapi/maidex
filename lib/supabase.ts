import { createClient } from '@supabase/supabase-js';

// Obtener las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey); 