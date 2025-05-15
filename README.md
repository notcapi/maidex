# Asistente Personal

Un asistente personal inteligente basado en Claude 3.5 Sonnet con integración de Model Context Protocol (MCP) para Gmail y Calendar.

## Características

- **Envío de correos electrónicos**: Integración directa con Gmail mediante MCP
- **Creación de eventos**: Agenda eventos en Google Calendar con comandos en lenguaje natural
- **Interfaz conversacional**: Chat intuitivo para interactuar con el asistente
- **Persistencia de conversaciones**: Historial guardado entre sesiones
- **Modo fallback**: Funcionamiento continuo incluso cuando Claude está sobrecargado
- **Referencias contextuales**: Entiende frases como "envía otro correo al mismo destinatario"
- **Despliegue en Vercel**: Listo para producción en la nube

## Estructura del Proyecto

```
asistente_personal/
├── components/        # Componentes de UI reutilizables
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
- Proyecto OAuth de Google Cloud con acceso a Gmail y Calendar APIs
- Cuenta de Vercel (para despliegue)

## Configuración Local

1. Clonar el repositorio
   ```bash
   git clone https://github.com/tu-usuario/asistente-personal.git
   cd asistente-personal
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

## Licencia

Este proyecto está licenciado bajo la licencia MIT. 