import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';
import { GoogleTokens } from '@/types';
import { refreshAccessToken } from '@/lib/auth/refresh-token';

// Definir el tipo augmentado para las sesiones de NextAuth
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user?: {
      name?: string;
      email?: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    picture?: string;
  }
}

// Obtener la URL base desde la variable de entorno o usar un valor predeterminado
// Es importante que en producción esto tenga tu dominio real de Vercel
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          // Incluir todos los scopes necesarios para Gmail y Calendar
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.modify',
          // Forzar pantalla de consentimiento para asegurar refresh token
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  debug: true, // Habilitar logs detallados para diagnóstico
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  // Configuración explícita de cookies para resolver problemas de autenticación
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    // Configuración crítica para solucionar "State cookie was missing"
    state: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.state`
        : `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900 // 15 minutos en segundos
      }
    }
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Guardar el token en el JWT cuando el usuario se autentica inicialmente
      if (account && user) {
        console.log("Configurando nuevo token JWT");
        
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_in as number) * 1000,
          refreshToken: account.refresh_token,
          picture: user.image,
          ...token
        };
      }

      // Devolver el token previo si el token de acceso aún es válido
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        console.log("Token actual todavía válido");
        return token;
      }

      // Acceso expirado, intentar refrescar
      console.log("Token expirado, intentando renovar");
      const refreshedToken = await refreshAccessToken(token);
      console.log("Token refrescado exitosamente");
      
      return refreshedToken;
    },
    async session({ session, token }) {
      // Pasar el token y la información del usuario a la sesión del cliente
      session.accessToken = token.accessToken;
      session.error = token.error;
      
      if (token.picture) {
        if (!session.user) session.user = {};
        session.user.image = token.picture;
      }
      
      return session;
    }
  },
};

export default NextAuth(authOptions); 