import React from 'react';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { Layout } from '@/components/layout/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
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