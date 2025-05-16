# Solución para Problemas de Envío de Correos en Maidex

## Resumen del Problema

Los correos enviados desde la aplicación Maidex no aparecen en la bandeja de enviados y no llegan a los destinatarios.

## Cambios Implementados

1. **Modificación del método `sendEmail` en `agents/emailAgent.ts`**:
   - Añadida cabecera `From: me` para identificar correctamente al remitente
   - Modificada la forma de etiquetar correos enviados, usando `users.messages.modify` después del envío
   - Mejorado el registro de errores para diagnóstico

2. **Actualización de permisos en `pages/api/auth/[...nextauth].ts`**:
   - Añadidos permisos adicionales: `gmail.labels` y `gmail.modify` para permitir correcta gestión de etiquetas
   - Asegurado uso de `prompt: "consent"` para solicitar todos los permisos al usuario

3. **Scripts de diagnóstico creados**:
   - `test-email-simple.mjs`: Para probar el envío de correos directamente
   - `test-token.mjs`: Para verificar la validez del token y permisos
   - `check-oauth-config.mjs`: Para verificar la configuración de OAuth
   - `check-sent-labels.mjs`: Para verificar la configuración de etiquetas en Gmail

## Pasos para Solucionar el Problema

1. **Volver a iniciar sesión en la aplicación**:
   - Cierra sesión en la aplicación
   - Abre la aplicación en modo incógnito y vuelve a iniciar sesión
   - Durante el inicio de sesión, acepta TODOS los permisos solicitados
   - Si no ves la pantalla de permisos, ve a tu [cuenta de Google](https://myaccount.google.com/permissions), revoca el acceso a Maidex y vuelve a iniciar sesión

2. **Verificar permisos de Gmail**:
   - Asegúrate que en la pantalla de consentimiento aceptas los permisos "Ver y gestionar tu correo" y "Enviar correos como tú"

3. **Hacer una prueba de envío**:
   - En la aplicación, envía un correo de prueba
   - Verifica los logs del servidor para ver si hay errores
   - Comprueba si el correo aparece en la bandeja de enviados
   - Comprueba si el correo llega al destinatario (puede tardar hasta 5 minutos)

4. **Solución adicional si el problema persiste**:
   - Ejecuta el script `node check-sent-labels.mjs` y completa el proceso de autorización para verificar las etiquetas de Gmail
   - Verifica si la etiqueta SENT existe y si hay mensajes en la bandeja de enviados
   - Si continúa fallando, puede haber un problema con la configuración de OAuth en Google Cloud Console

## Configuración de Google Cloud Console

Si los pasos anteriores no resuelven el problema, verifica la configuración en Google Cloud Console:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a "APIs y servicios" > "Credenciales"
4. Edita el cliente OAuth y verifica que la URI de redirección coincida con `http://localhost:3000/api/auth/callback/google` (o el dominio correspondiente en producción)
5. Ve a "APIs y servicios" > "Biblioteca" y asegúrate que la API de Gmail está habilitada

## Cómo usar los Scripts de Diagnóstico

### Verificar configuración OAuth
```bash
node check-oauth-config.mjs
```

### Verificar etiquetas de Gmail
```bash
node check-sent-labels.mjs
```

### Probar envío de correo
```bash
node test-email-simple.mjs "tu-token-de-acceso"
```

### Verificar token
```bash
node test-token.mjs "tu-token-de-acceso"
```

## Si nada de esto funciona

Si después de intentar todas estas soluciones el problema persiste, considera:

1. Revisa si hay restricciones en tu cuenta de Gmail (como 2FA para aplicaciones menos seguras)
2. Verifica que el dominio de la aplicación esté correctamente configurado en tu proyecto de Google Cloud
3. Prueba con otra cuenta de Google que no tenga restricciones adicionales
4. Añade logs detallados durante el proceso de envío para identificar exactamente dónde ocurre el fallo 