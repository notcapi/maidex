# Maidex - Asistente Personal Inteligente

Un asistente personal inteligente basado en Claude 3.5 Sonnet con integración de Model Context Protocol (MCP) para Gmail, Calendar y Google Drive.

## Características

- **Envío de correos electrónicos**: Integración directa con Gmail mediante MCP
- **Creación de eventos**: Agenda eventos en Google Calendar con comandos en lenguaje natural
- **Gestión de archivos**: Listado, búsqueda y descarga de archivos de Google Drive
- **Interfaz conversacional**: Chat intuitivo al estilo ChatGPT para interactuar con el asistente
- **Interfaz optimizada para móvil**: Diseño adaptable para dispositivos de cualquier tamaño
- **Entrada de voz**: Reconocimiento de voz integrado para dictar mensajes
- **Persistencia de conversaciones**: Historial guardado entre sesiones
- **Modo fallback**: Funcionamiento continuo incluso cuando Claude está sobrecargado
- **Referencias contextuales**: Entiende frases como "envía otro correo al mismo destinatario"
- **Despliegue en Vercel**: Listo para producción en la nube

## Mejoras en la interfaz de usuario

- **Diseño moderno**: Interfaz inspirada en ChatGPT con burbujas de chat, efectos de blur y animaciones fluidas
- **ChatInput mejorado**: Campo de texto autoexpandible con botón de envío animado
- **Acciones rápidas**: Chips de sugerencias para acciones comunes como "Enviar correo" o "Crear evento"
- **Reconocimiento de voz**: Botón de micrófono con indicadores visuales de grabación activa
- **Visualización de archivos**: Componente para mostrar archivos de Drive con iconos y opciones de descarga
- **Tema claro/oscuro**: Soporte completo para modo oscuro y claro con transiciones suaves
- **Responsive design**: Experiencia óptima tanto en escritorio como en dispositivos móviles

## Estructura del Proyecto

```
maidex/
├── components/        # Componentes de UI reutilizables
│   ├── chat/          # Componentes relacionados con el chat (ChatInput, ChatBubble, etc.)
│   ├── drive/         # Componentes para visualización de archivos de Drive
│   ├── ui/            # Componentes de UI básicos (botones, inputs, etc.)
│   └── layout/        # Componentes de estructura y navegación
├── hooks/             # Hooks personalizados de React
├── lib/               # Utilidades y helpers compartidos
├── mcp/               # Implementación de Model Context Protocol para Gmail y Calendar
├── pages/             # Rutas de la aplicación Next.js
│   ├── api/           # Endpoints de la API (autenticación, chat, acciones MCP)
│   └── ...            # Páginas de la aplicación
├── public/            # Archivos estáticos
├── styles/            # Estilos CSS
└── data/              # Almacenamiento local de conversaciones
```

## Requisitos

- Node.js v18+
- API Key de Anthropic (Claude)
- Proyecto OAuth de Google Cloud con acceso a Gmail, Calendar y Drive APIs
- Cuenta de Vercel (para despliegue)

## Configuración Local

1. Clonar el repositorio
   ```bash
   git clone https://github.com/notcapi/maidex.git
   cd maidex
   ```

2. Instalar dependencias
   ```bash
   npm install
   ```

3. Crear archivo `.env.local` con las siguientes variables:
   ```
   # Anthropic API
   ANTHROPIC_API_KEY=your_anthropic_api_key
   
   # NextAuth
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. Iniciar el servidor de desarrollo
   ```bash
   npm run dev
   ```

## Despliegue en Vercel

1. **Crear cuenta en Vercel**: Regístrate en [vercel.com](https://vercel.com) si aún no tienes una cuenta.

2. **Instalar Vercel CLI** (opcional)
   ```bash
   npm install -g vercel
   ```

3. **Configurar archivo `vercel.json`** (ya incluido en el repositorio)
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/next"
       }
     ],
     "env": {
       "NEXTAUTH_URL": "${VERCEL_URL}"
     }
   }
   ```

4. **Desplegar el proyecto**
   ```bash
   # Iniciar sesión en Vercel
   vercel login
   
   # Desplegar
   vercel
   ```

5. **Configurar variables de entorno en Vercel**
   - Ve al panel de control de tu proyecto
   - Navega a "Settings" > "Environment Variables"
   - Añade todas las variables de `.env.local`
   - Asegúrate de configurar `NEXTAUTH_URL` como tu dominio de Vercel

6. **Configurar OAuth de Google**
   - Añade tu dominio de Vercel como URI de redirección autorizada en la consola de Google Cloud
   - Formato: `https://tu-proyecto.vercel.app/api/auth/callback/google`

## Uso

1. Accede a la aplicación a través de tu navegador
2. Inicia sesión con tu cuenta de Google
3. Interactúa con el asistente mediante el chat
4. Comandos principales:
   - "Envía un correo a [correo] y dile [mensaje]"
   - "Crea un evento llamado [nombre] para mañana a las 10am"
   - "Lista mis archivos de Drive"
   - "Busca archivos PDF en mi Drive"

## Tecnologías utilizadas

- **Next.js**: Framework de React para aplicaciones web
- **Tailwind CSS**: Utilidades CSS para diseño rápido y responsive
- **Framer Motion**: Biblioteca para animaciones fluidas
- **NextAuth.js**: Autenticación para aplicaciones Next.js
- **TypeScript**: Tipado estático para desarrollo robusto
- **Claude API**: Modelo de lenguaje de Anthropic
- **Model Context Protocol**: Protocolo para integración segura con APIs

## Licencia

Este proyecto está licenciado bajo la licencia MIT. 