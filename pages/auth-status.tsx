import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AuthStatus() {
  const { data: session } = useSession();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/token');
        const data = await response.json();
        
        if (response.ok) {
          setTokenInfo(data);
        } else {
          setError(data.error || 'Error al obtener información del token');
        }
      } catch (err) {
        setError('Error al comunicarse con el servidor');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Estado de Autenticación</h1>
          <p className="text-muted-foreground">Diagnóstico y estado de tu sesión</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estado de la Sesión</CardTitle>
            <CardDescription>Información sobre tu sesión actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Estado:</h3>
              {session ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Autenticado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                  No autenticado
                </Badge>
              )}
            </div>

            {session && (
              <>
                <div>
                  <h3 className="font-medium mb-2">Usuario:</h3>
                  <div className="flex items-center space-x-2">
                    {session.user?.image && (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'Usuario'} 
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p>{session.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                    </div>
                  </div>
                </div>

                {tokenInfo && (
                  <div>
                    <h3 className="font-medium mb-2">Token de acceso:</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Válido hasta:</div>
                        <div>{new Date(tokenInfo.expiresAt).toLocaleString()}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Tiempo restante:</div>
                        <div>{tokenInfo.expiresIn} segundos</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Scopes:</div>
                        <div className="flex flex-wrap gap-1">
                          {tokenInfo.scopes?.map((scope: string) => (
                            <Badge key={scope} variant="secondary" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md">
                <p className="font-medium">Error:</p>
                <p>{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/">
                Volver al Inicio
              </Link>
            </Button>
            {!session && (
              <Button asChild>
                <Link href="/api/auth/signin">
                  Iniciar Sesión
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        {session && tokenInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Información Técnica</CardTitle>
              <CardDescription>Detalles técnicos de la autenticación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium mb-2">ID Token:</h3>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {tokenInfo.idToken ? tokenInfo.idToken.substring(0, 50) + '...' : 'No disponible'}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Access Token:</h3>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {tokenInfo.accessToken ? tokenInfo.accessToken.substring(0, 50) + '...' : 'No disponible'}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Refresh Token:</h3>
                  <div className="bg-muted p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {tokenInfo.refreshToken ? '✓ Disponible (oculto por seguridad)' : '✗ No disponible'}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 