import React, { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { Layout } from '@/components/layout/Layout';
import '../styles/globals.css';
import { checkEnvVars } from '@/lib/env-validator';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Verificar variables de entorno en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      checkEnvVars();
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp; 