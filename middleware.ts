import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware para manejar configuraciones de CORS y seguridad
export function middleware(request: NextRequest) {
  // Si es una solicitud OPTIONS (preflight), responder inmediatamente con los encabezados CORS
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    // Obtener el origen de la solicitud o usar una URL segura
    const origin = request.headers.get('origin') || 'https://maidex.vercel.app';
    
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
    
    return response;
  }

  // Para solicitudes no OPTIONS, procesar normalmente
  const response = NextResponse.next();
  
  // Configurar encabezados CORS solo para rutas de API de autenticación
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    // Obtener el origen de la solicitud o usar una URL segura
    const origin = request.headers.get('origin') || 'https://maidex.vercel.app';
    
    // Configurar origen específico en lugar de '*' para permitir credenciales
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

// Configuración para especificar en qué rutas debe ejecutarse este middleware
export const config = {
  // Matcher para rutas de API de autenticación
  matcher: ['/api/auth/:path*'],
}; 