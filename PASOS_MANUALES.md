# FUTURA OS — Guía de Configuración Manual

Este documento detalla **únicamente las acciones manuales** que debes realizar en las plataformas externas para poner a operar el proyecto al 100%.

---

## 1. Configuración de Variables en Vercel (Production Environment)

Ingresa a tu proyecto en **Vercel → Settings → Environment Variables** y añade las siguientes claves:

| Variable | Descripción / Dónde conseguirla | Obligatoria |
|---|---|---|
| `FUTURA_ACCESS_CODE` | Código/contraseña elegida por ti para ingresar al dashboard (`/login`). | **Sí** |
| `FUTURA_SESSION_SECRET` | Texto aleatorio largo para firmar la cookie de sesión (ej. `super-secret-key-12345`). | **Sí** |
| `AIRTABLE_API_TOKEN` | Token personal de Airtable (*Personal Access Token* con permisos de lectura/escritura). | **Sí** |
| `AIRTABLE_BASE_ID` | ID de la base en Airtable (`app...`). | **Sí** |
| `GEMINI_API_KEY` | Clave API de Google AI Studio para activar Futura IA y el Director. | **Sí** |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram entregado por `@BotFather`. | Opcional |
| `META_GRAPH_TOKEN` | Token de acceso de página (*Page Access Token*) de larga duración de Meta/Facebook Graph API. | Opcional |
| `META_INSTAGRAM_ACCOUNT_ID` | ID de la cuenta comercial de Instagram conectada a tu página de Facebook. | Opcional |
| `CLOUDINARY_CLOUD_NAME` | Nombre del Cloud en Cloudinary. | Opcional |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary. | Opcional |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary. | Opcional |
| `CREATOMATE_API_KEY` | Clave API de Creatomate para renderizar Reels automáticos. | Opcional |

---

## 2. Registro del Webhook de Telegram

Una vez desplegada la aplicación en Vercel (ej. `https://tu-dominio.vercel.app`), ejecuta el siguiente comando en tu terminal para vincular el bot de Telegram:

```bash
npm run register-webhook https://tu-dominio.vercel.app/api/telegram/webhook
```

O abre en tu navegador la siguiente URL reemplazando los valores:
```text
https://api.telegram.org/bot<TU_TELEGRAM_BOT_TOKEN>/setWebhook?url=https://tu-dominio.vercel.app/api/telegram/webhook
```

---

## 3. Verificación de Salud en el Dashboard

1. Ingresa a la aplicación en `https://tu-dominio.vercel.app/login` digitando tu `FUTURA_ACCESS_CODE`.
2. Dirígete a la pestaña **`🔍 Salud & API Keys`**.
3. El panel verificará automáticamente las integraciones y mostrará cuáles están **✓ Conectadas** y cuáles permanecen **⚠ Pendientes en Vercel**.
