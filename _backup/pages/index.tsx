import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';

export default function Home() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const getDailySummary = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/summary');
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error al obtener el resumen diario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Asistente Personal</title>
        <meta name="description" content="Tu asistente personal inteligente" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Asistente Personal
        </h1>

        {!session ? (
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Bienvenido</h2>
            <p className="mb-4">
              Inicia sesión para acceder a tu asistente personal.
            </p>
            <button
              onClick={() => signIn('google')}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Iniciar sesión con Google
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Hola, {session.user?.name}
              </h2>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="mb-6">
              <button
                onClick={getDailySummary}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-300"
              >
                {loading ? 'Generando...' : 'Obtener resumen diario'}
              </button>
            </div>

            {summary && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-2">Tu resumen diario:</h3>
                <div className="whitespace-pre-wrap">{summary}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 