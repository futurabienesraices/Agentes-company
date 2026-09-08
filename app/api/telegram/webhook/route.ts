import { NextResponse } from "next/server";
import { salesAgent, askSalesAgent } from "../../../../lib/agents/sales-agent";
import { contentAgent, askContentAgent } from "../../../../lib/agents/content-agent";
import { propertyAgent } from "../../../../lib/agents/property-agent";
import { generateImage } from "../../../../lib/media/image-generator";
import { generateVideoConfig } from "../../../../lib/media/video-generator";
import { buildMemoryPromptContext, saveUserDirective } from "../../../../lib/memory-service";

// Definimos los tipos para los mensajes de Telegram
type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
};

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Función para enviar respuestas de vuelta a Telegram
async function sendTelegramMessage(chatId: number, text: string, photoUrl?: string) {
  if (!TELEGRAM_TOKEN) return;

  const cleanPhotoUrl = (typeof photoUrl === "string" && photoUrl.startsWith("http")) ? photoUrl : undefined;

  try {
    if (cleanPhotoUrl) {
      // Enviar foto con pie de foto
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: cleanPhotoUrl,
          caption: text.slice(0, 1024),
          parse_mode: "Markdown",
        }),
      });
      
      // Si falla la foto (URL inválida, etc), hacemos fallback a texto
      if (!res.ok) {
        console.warn("Fallo enviando foto, enviando solo texto:", await res.text());
        return await sendTelegramMessage(chatId, text); // Fallback sin foto
      }
    } else {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown",
        }),
      });
    }
  } catch (error) {
    console.error("Error enviando mensaje a Telegram:", error);
  }
}

// El Webhook que recibe los mensajes
export async function POST(request: Request) {
  if (!TELEGRAM_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN no configurado" }, { status: 500 });
  }

  try {
    const body = (await request.json()) as TelegramUpdate;

    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = body.message.chat.id;
    const userText = body.message.text.trim();
    const userName = body.message.from.first_name;

    // Mostrar que el bot está escribiendo...
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    }).catch(() => {});

    // Cargar la memoria del sistema para contextualizar a Sov
    const memoryContext = await buildMemoryPromptContext();

    let responseText = "";
    let mediaUrl: string | undefined = undefined;

    const lowerText = userText.toLowerCase();
    
    // Si el usuario enseña o da una orden de aprendizaje
    if (lowerText.startsWith("aprende:") || lowerText.startsWith("recuerda:")) {
      const ruleText = userText.replace(/^(aprende|recuerda):\s*/i, "");
      await saveUserDirective("Instrucción de Ever", ruleText, "rule");
      responseText = `**[Sov - Memoria]**\nEntendido Ever. He guardado esta instrucción en mi memoria permanente:\n\n> "${ruleText}"`;
    }
    else if (lowerText === "/start" || lowerText.includes("hola")) {
      responseText = `¡Hola ${userName}! Soy **Sov**, tu Director y Orquestador de Futura OS.\n\nEquipo a tu disposición:\n- **Víctor** (Ventas y CRM)\n- **Camila** (Contenido y Copys)\n- **Alex** (Análisis de Propiedades)\n- **Pixel** (Imágenes y Videos)\n\nPuedes decirme: *"Mi Sov, crea un post con imagen para la casa en Escalón"* o *"Recuerda: los domingos no hacemos llamadas"*`;
    } 
    else if (lowerText.includes("imagen") || lowerText.includes("flyer") || lowerText.includes("foto") || lowerText.includes("pixel")) {
      // Usar Pixel (Agente Multimedia)
      const imageResult = await generateImage({
        prompt: userText,
        style: lowerText.includes("flyer") ? "flyer" : "social",
      });
      mediaUrl = imageResult.url;
      responseText = `**[Pixel - Multimedia]**\nHe generado esta propuesta visual publicitaria para tu campaña.`;
    }
    else if (lowerText.includes("video") || lowerText.includes("reel")) {
      // Configuración de Video Reel
      const videoResult = generateVideoConfig({
        slides: [
          { imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", title: "Residencia Exclusiva" },
          { imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", title: "Acabados de Lujo" }
        ],
        property: { title: "Propiedad Destacada", price: "250,000" },
        format: "reel",
      });
      responseText = `**[Pixel - Video]**\nHe estructurado un guión de Reel para Instagram (Duración: ${videoResult.config?.totalDuration}s).\n\n📌 **Estructura de Slides:**\n${videoResult.config?.slides.map((s, i) => `${i+1}. ${s.title} (${s.duration}s)`).join("\n")}\n\nListo para exportar a la fábrica de contenido.`;
    }
    else if (lowerText.includes("prioridad") || lowerText.includes("hoy") || lowerText.includes("ventas") || lowerText.includes("victor") || lowerText.includes("víctor") || lowerText.includes("precio") || lowerText.includes("leads") || lowerText.includes("seguimiento")) {
      try {
        // askSalesAgent carga datos reales de Airtable (leads, followups, propiedades)
        const result = await askSalesAgent(`${userText}`);
        responseText = `**[Víctor - Ventas]**\n${result.answer}`;
      } catch (e: any) {
        responseText = `**[Error Interno - Víctor]**\nAlgo falló: ${e.message}`;
      }
    }
    else if (lowerText.includes("post") || lowerText.includes("contenido") || lowerText.includes("instagram") || lowerText.includes("camila") || lowerText.includes("publicación") || lowerText.includes("facebook") || lowerText.includes("copy") || lowerText.includes("reel")) {
      try {
        // askContentAgent carga propiedades reales de Airtable para el contexto de Camila
        const result = await askContentAgent(userText);
        responseText = `**[Camila - Contenido]**\n${result.answer}`;
        
        // Si Camila encontró una foto real de la propiedad, la adjuntamos
        if (result.data && (result.data as any).photoUrl) {
          mediaUrl = (result.data as any).photoUrl;
        }
      } catch (e: any) {
        responseText = `**[Error Interno - Camila]**\nAlgo falló: ${e.message}`;
      }
    }
    else if (lowerText.includes("analiza") || lowerText.includes("falta") || lowerText.includes("alex") || lowerText.includes("propiedad")) {
      try {
        const result = await propertyAgent.execute(`Contexto Memoria: ${memoryContext}\nEl usuario pide a Sov análisis: ${userText}`);
        responseText = `**[Alex - Propiedades]**\n${result.answer}`;
      } catch (e: any) {
        responseText = `**[Error Interno - Alex]**\nAlgo falló: ${e.message}`;
      }
    }
    else {
      try {
        const cleanedQuery = userText.replace(/^mi sov,?\s*/i, "");
        const result = await salesAgent.execute(`Contexto Memoria: ${memoryContext}\nResponde como Sov (Orquestador principal) a la consulta de Ever (dueño): ${cleanedQuery}`);
        responseText = `**[Sov - Orquestador]**\n${result.answer}`;
      } catch (e: any) {
        responseText = `**[Error Interno - Sov]**\nAlgo falló: ${e.message}`;
      }
    }

    // Enviar la respuesta a Telegram (con o sin imagen)
    await sendTelegramMessage(chatId, responseText, mediaUrl);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error en webhook de Telegram:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

