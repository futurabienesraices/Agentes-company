#!/bin/bash

# Este script hace deploy a Vercel, extrae la URL de producción y registra el webhook
echo "🚀 Iniciando deploy a Vercel..."

# Hacer deploy a producción y capturar la URL
# Usamos npx --yes --no-package-lock vercel --prod --yes para que no pida confirmaciones
DEPLOY_URL=$(npx --yes --no-package-lock vercel --prod --yes)

if [ -z "$DEPLOY_URL" ]; then
  echo "❌ Error: No se pudo obtener la URL del deploy. Asegúrate de estar logueado en Vercel."
  exit 1
fi

echo "✅ Deploy exitoso: $DEPLOY_URL"

# Añadir la ruta del webhook a la URL
WEBHOOK_URL="${DEPLOY_URL}/api/telegram/webhook"

echo "🔗 Registrando webhook en Telegram: $WEBHOOK_URL"

# Correr el script de registro
node scripts/register-webhook.mjs "$WEBHOOK_URL"
