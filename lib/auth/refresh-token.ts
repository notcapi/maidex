import type { JWT } from 'next-auth/jwt';

/**
 * Refresca el token de acceso usando el refresh token almacenado en el JWT
 * @param token Token JWT actual que contiene el refresh_token
 * @returns Un nuevo JWT con el token de acceso actualizado
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    // Verificar que tengamos un refresh token
    if (!token.refreshToken) {
      throw new Error('No hay refresh token disponible');
    }

    console.log('Iniciando renovación de token con refresh token');

    // Realizar solicitud a la API de OAuth 2.0 de Google
    const url = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken
    });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: params.toString()
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('Error al refrescar el token:', refreshedTokens);
      throw refreshedTokens;
    }

    // Calcular nueva fecha de expiración
    const newExpiresAt = Date.now() + (refreshedTokens.expires_in * 1000);
    
    console.log(`Token refrescado. Expira en ${refreshedTokens.expires_in} segundos`);

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: newExpiresAt,
      // Usar nuevo refresh token si está presente, o mantener el anterior
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
    };
  } catch (error) {
    console.error('Error en refresh-token:', error);
    
    return {
      ...token,
      error: 'RefreshAccessTokenError'
    };
  }
} 