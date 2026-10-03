import 'dotenv/config';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!TOKEN) {
  console.error("❌ ERROR: No se encontró TELEGRAM_BOT_TOKEN en el archivo .env");
  process.exit(1);
}

const webhookUrl = process.argv[2];

if (!webhookUrl) {
  console.error("❌ ERROR: Debes proporcionar la URL de tu servidor.");
  console.error("Ejemplo: node scripts/register-webhook.mjs https://tu-dominio.vercel.app/api/telegram/webhook");
  process.exit(1);
}

async function register() {
  console.log(`Intentando registrar webhook en: ${webhookUrl}`);
  if (SECRET) console.log("🔒 Incluyendo secret_token de seguridad.");

  try {
    const payload = {
      url: webhookUrl,
      ...(SECRET ? { secret_token: SECRET } : {}),
    };

    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ok) {
      console.log("✅ ¡Éxito! Telegram ahora enviará los mensajes a tu servidor de forma segura.");
    } else {
      console.error("❌ Error de Telegram:", data.description);
    }
  } catch (error) {
    console.error("❌ Error conectando con Telegram:", error);
  }
}

register();
