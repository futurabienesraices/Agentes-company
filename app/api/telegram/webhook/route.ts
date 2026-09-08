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
    else {
      // Routing lógico: priorizamos menciones directas a agentes
      const isCamila = lowerText.includes("camila") || lowerText.includes("post") || lowerText.includes("contenido") || lowerText.includes("instagram") || lowerText.includes("publicación") || lowerText.includes("copy");
      const isVictor = lowerText.includes("victor") || lowerText.includes("víctor") || lowerText.includes("prioridad") || lowerText.includes("ventas") || lowerText.includes("leads") || lowerText.includes("seguimiento") || lowerText.includes("precio");
      const isPixel = lowerText.includes("pixel") || lowerText.includes("diseño") || lowerText.includes("video") || lowerText.includes("reel") || lowerText.includes("animación");
      
      // Si el usuario dijo "foto" pero explícitamente llamó a Camila, es de Camila.
      // Si no mencionó a Camila, pero dijo foto/imagen, es de Pixel.
      const isImageRequestForPixel = (lowerText.includes("imagen") || lowerText.includes("foto")) && !lowerText.includes("camila");

      if (isVictor) {
        try {
          const result = await askSalesAgent(userText);
          responseText = `**[Víctor - Ventas]**\n${result.answer}`;
        } catch (e: any) {
          responseText = `**[Error Interno - Víctor]**\nAlgo falló: ${e.message}`;
        }
      }
      else if (isCamila) {
        try {
          const result = await askContentAgent(userText);
          responseText = `**[Camila - Contenido]**\n${result.answer}`;
          if (result.data && (result.data as any).photoUrl) {
            mediaUrl = (result.data as any).photoUrl;
          }
        } catch (e: any) {
          responseText = `**[Error Interno - Camila]**\nAlgo falló: ${e.message}`;
        }
      }
      else if (isPixel || isImageRequestForPixel) {
        try {
          if (lowerText.includes("video") || lowerText.includes("reel")) {
            const videoResult = generateVideoConfig({
              slides: [{ imageUrl: "https://example.com/slide1.jpg", duration: 3 }],
              property: { title: "Concepto de Video" },
              format: "reel",
            });
            responseText = `**[Pixel - Video]**\nHe estructurado un guión de Reel para Instagram.\n\n📌 **Duración:** ${videoResult.config?.totalDuration}s\n\nListo para exportar.`;
          } else {
            const imageResult = await generateImage({
              prompt: userText,
              style: "social",
            });
            responseText = `**[Pixel - Multimedia]**\nHe generado esta propuesta visual para tu campaña:\n\n${imageResult.url ? "*(Ver imagen adjunta)*" : "*(No se pudo adjuntar la imagen)*"}`;
            mediaUrl = imageResult.url;
          }
        } catch (e: any) {
          responseText = `**[Error Interno - Pixel]**\nAlgo falló: ${e.message}`;
        }
      }
      else if (lowerText.includes("analiza") || lowerText.includes("alex") || lowerText.includes("propiedad")) {
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
    }

    // Enviar la respuesta a Telegram (con o sin imagen)
    await sendTelegramMessage(chatId, responseText, mediaUrl);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error en webhook de Telegram:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

