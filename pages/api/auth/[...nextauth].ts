import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

// Extender las interfaces de NextAuth
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

// Obtener la URL base desde la variable de entorno o usar un valor predeterminado
// Es importante que en producción esto tenga tu dominio real de Vercel
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Función para refrescar el token
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params.toString(),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    console.log("Token refrescado exitosamente");

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.log("Error al refrescar el token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          // Incluir todos los scopes necesarios para Gmail y Calendar
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
          // Forzar pantalla de consentimiento
          prompt: "consent",
          // Acceso sin conexión para obtener refresh token
          access_type: 'offline'
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Guardar el token de acceso y de actualización en el token JWT
      if (account) {
        console.log("Cuenta autenticada:", account.provider);
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: Math.floor(Date.now() / 1000) + (account.expires_in as number),
        };
      }

      // Si el token no ha expirado, devuélvelo
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Si el token ha expirado, intenta refrescarlo
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Enviar propiedades del token a la sesión del cliente
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: '/', // Página de inicio de sesión
    signOut: '/', // Página después de cerrar sesión
    error: '/', // Página de error
  },
  // Configuración para manejo del cierre de sesión
  events: {
    signOut: async (message) => {
      console.log('Usuario cerró sesión:', message);
    },
  },
  // Configuración de seguridad y cookies
  useSecureCookies: process.env.NODE_ENV === "production", // Solo usar cookies seguras en producción
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax", // Esto es importante para CORS
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  // Asegúrate de que el secreto sea fuerte y consistente en todos los entornos
  secret: process.env.NEXTAUTH_SECRET,
  // Habilita los logs de depuración en desarrollo pero no en producción
  debug: process.env.NODE_ENV !== "production",
  // Tiempo de sesión (aumentado para evitar desconexiones frecuentes)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  }
};

export default NextAuth(authOptions); 