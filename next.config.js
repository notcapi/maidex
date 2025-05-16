/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optimización de imágenes
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    domains: ['lh3.googleusercontent.com'], // Para imágenes de perfil de Google
  },
  // Compresión para mejorar el rendimiento
  compress: true,
  poweredByHeader: false, // Eliminar cabecera X-Powered-By por seguridad
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    MCP_BASE_PATH: process.env.MCP_BASE_PATH || './mcp',
  },
  // Asegúrate de que los archivos .json se carguen correctamente
  webpack(config, { isServer, dev }) {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });

    // Optimizaciones adicionales para producción
    if (!dev) {
      // Eliminar console.log en producción
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = true;
        }
      });
    }

    return config;
  },
  // Optimización de producción
  productionBrowserSourceMaps: false, // Deshabilitar source maps en producción
}

module.exports = nextConfig; 