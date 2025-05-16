/**
 * Validador de variables de entorno
 * 
 * Este módulo permite validar que todas las variables de entorno requeridas
 * estén presentes y tengan valores válidos antes de iniciar la aplicación.
 */

type EnvVar = {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
};

const requiredEnvVars: EnvVar[] = [
  { 
    name: 'ANTHROPIC_API_KEY', 
    required: true, 
    validator: (val) => val.length > 10 && val.startsWith('sk-') 
  },
  { 
    name: 'NEXTAUTH_URL', 
    required: true,
    validator: (val) => val.startsWith('http')
  },
  { 
    name: 'NEXTAUTH_SECRET', 
    required: true
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    required: true
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: true
  },
  {
    name: 'MCP_BASE_PATH',
    required: false
  }
];

/**
 * Verifica que todas las variables de entorno requeridas estén presentes
 * @returns Objeto con el resultado de la validación
 */
export function validateEnv(): { 
  valid: boolean; 
  missingVars: string[];
  invalidVars: string[];
} {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar.name];
    
    if (envVar.required && (!value || value.trim() === '')) {
      missingVars.push(envVar.name);
    } else if (value && envVar.validator && !envVar.validator(value)) {
      invalidVars.push(envVar.name);
    }
  });

  return {
    valid: missingVars.length === 0 && invalidVars.length === 0,
    missingVars,
    invalidVars
  };
}

/**
 * Registra mensajes de advertencia en la consola si hay variables de entorno faltantes o inválidas
 * @returns true si todas las variables son válidas, false en caso contrario
 */
export function checkEnvVars(): boolean {
  const { valid, missingVars, invalidVars } = validateEnv();
  
  if (!valid) {
    console.error("⚠️ ERROR DE CONFIGURACIÓN: Variables de entorno incorrectas");
    
    if (missingVars.length > 0) {
      console.error(`❌ Variables faltantes: ${missingVars.join(', ')}`);
    }
    
    if (invalidVars.length > 0) {
      console.error(`⚠️ Variables con formato inválido: ${invalidVars.join(', ')}`);
    }
  }
  
  return valid;
} 