# Activar el asistente de WhatsApp

## 1. Crear prueba en Twilio

1. Crear una cuenta en Twilio.
2. Abrir **Messaging > Try it out > Send a WhatsApp message**.
3. Activar el WhatsApp Sandbox y guardar el número y el código de unión.

## 2. Configurar el webhook

En **Sandbox settings**, usar:

- **When a message comes in:** `https://futura-agentes-futurabienesraices-projects.vercel.app/api/whatsapp`
- Método: `POST`

## 3. Variables en Vercel

Agregar en el proyecto `futura-agentes`, para Production, Preview y Development:

- `TWILIO_AUTH_TOKEN`: Auth Token de Twilio.
- `TWILIO_WEBHOOK_URL`: `https://futura-agentes-futurabienesraices-projects.vercel.app/api/whatsapp`
- `OPENAI_API_KEY`: clave del proyecto de OpenAI.
- `OPENAI_MODEL`: opcional; valor recomendado inicial `gpt-4.1-mini`.

Ya deben existir:

- `AIRTABLE_API_TOKEN`
- `AIRTABLE_BASE_ID`

Después de guardar las variables, volver a desplegar el proyecto.

## 4. Probar

1. Desde un teléfono, enviar el código de unión al número Sandbox.
2. Escribir: `Busco una casa en Tegucigalpa por menos de 3 millones.`
3. Verificar que WhatsApp responda.
4. Verificar en Airtable que se hayan creado Persona, Lead y Seguimiento.

## 5. Pasar a producción

Cuando la prueba funcione:

1. Comprar o migrar un número exclusivo para Futura Bienes Raíces.
2. Completar el registro de WhatsApp Business en Twilio.
3. Configurar el mismo webhook en el remitente aprobado.
4. Crear plantillas para mensajes iniciados por la empresa.

## Seguridad

El endpoint valida la firma `X-Twilio-Signature`. `TWILIO_WEBHOOK_URL` debe coincidir exactamente con la URL configurada en Twilio.
