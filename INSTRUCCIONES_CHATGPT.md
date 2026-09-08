# 🤖 Guía para continuar el desarrollo en ChatGPT (Futura OS / Agentes Company)

> **Si estás leyendo este documento desde ChatGPT u otro modelo de IA:** Este archivo contiene el contexto exacto, la estructura técnica, las integraciones activas y la guía de trabajo para continuar el proyecto sin perder continuidad ni romper la lógica existente.

---

## 1. 📌 Resumen del Proyecto

**Futura OS** es una plataforma y sistema operativo de inteligencia artificial multi-agente diseñado para **Futura** (empresa multi-servicio en El Salvador):
1. **🏠 Bienes Raíces:** Venta y alquiler de casas, terrenos y propiedades.
2. **🧹 Limpieza Profesional:** Lavado e hidroaspirado de muebles, colchones y alfombras.
3. **💻 Productos Digitales:** Desarrollo y comercialización de aplicaciones web y herramientas SaaS.

---

## 2. 🛠️ Stack Tecnológico

* **Framework:** Next.js 15 (App Router), React 19, TypeScript.
* **Hosting / Despliegue:** Vercel (conectado a la rama `main` de GitHub para Auto-Deploy).
* **Base de Datos Operativa:** Airtable (REST API server-side).
* **Almacenamiento y Medios:** Cloudinary (SDK `cloudinary`, gestionado en `/media` y `/lib/cloudinary.ts`).
* **Generación de Video / Reels:** Creatomate API (plantillas animadas con imágenes reales de Airtable/Cloudinary).
* **Generación de Imágenes / Flyers:** Google Imagen / Gemini API (`lib/media/image-generator.ts`).
* **Modelos de IA:** Google Gemini (principal), OpenAI GPT-4o / Claude (respaldos).
* **Canal de Operación Principal:** Bot de Telegram (`/api/telegram/webhook/route.ts`).
* **Seguridad:** Middleware de Next.js (`middleware.ts`) que protege las rutas internas con `FUTURA_ACCESS_CODE` (`/login`).

---

## 3. 🤖 Agentes Especializados (Telegram Bot)

En `app/api/telegram/webhook/route.ts` los mensajes entrantes de Telegram se enrutan automáticamente a 3 agentes principales:

1. **Camila (Agente de Contenido y Copywriting):**
   * **Invocación:** Si el mensaje menciona *"Camila"*, *"post"*, *"contenido"*, *"instagram"*, *"facebook"*, *"redes"*.
   * **Función:** Genera copys persuasivos, hashtags, estructura posts de Instagram/Facebook utilizando los datos de las propiedades en Airtable y las fotos de Cloudinary.

2. **Víctor (Agente de Ventas y CRM):**
   * **Invocación:** Si el mensaje menciona *"Víctor"*, *"venta"*, *"cliente"*, *"lead"*, *"precio"*, *"terreno"*, *"casa"*, *"seguimiento"*.
   * **Función:** Responde preguntas sobre inventario, atención a clientes, negociación y agendamiento de visitas.

3. **Pixel (Agente Multimedia y Creador de Reels/Flyers):**
   * **Invocación:** Si el mensaje menciona *"Pixel"*, *"reel"*, *"video"*, *"flyer"*, *"imagen"*, *"foto"*.
   * **Función:** 
     * **Flyers/Imágenes:** Genera imágenes o afiches con IA usando `generateImage`.
     * **Reels/Videos:** Busca las fotos de la propiedad en Airtable/Cloudinary, llama a **Creatomate API**, hace polling (espera ~20s) y devuelve la URL del video MP4 en Telegram.

---

## 4. 📂 Estructura de Archivos Clave

```text
/
├── app/
│   ├── api/
│   │   ├── telegram/webhook/route.ts   # Endpoint principal del bot de Telegram
│   │   ├── cloudinary/assets/route.ts  # API para listar y firmar subidas a Cloudinary
│   │   └── director/route.ts           # Endpoint IA del panel administrativo
│   ├── media/page.tsx                  # Galería visual y subida de archivos (Drag-and-Drop)
│   ├── login/page.tsx                  # Pantalla de acceso por código
│   └── page.tsx                        # Dashboard central de Futura OS
├── lib/
│   ├── agents/
│   │   ├── content-agent.ts            # Lógica de Camila
│   │   ├── sales-agent.ts              # Lógica de Víctor
│   │   └── base-agent.ts               # Clase base de agentes
│   ├── media/
│   │   ├── video-generator.ts          # Integración Creatomate API (polling y renderizado)
│   │   └── image-generator.ts          # Generación de imágenes y afiches
│   ├── cloudinary.ts                   # Cliente y utilidades Cloudinary (folders por negocio)
│   ├── airtable.ts                     # Conector server-side con Airtable
│   └── gemini.ts                       # Cliente Gemini AI
└── middleware.ts                       # Protección de rutas con FUTURA_ACCESS_CODE
```

---

## 5. 🔑 Variables de Entorno en Vercel (Environment Variables)

Para que el proyecto funcione en Vercel o en entorno local (`.env.local`), deben estar configuradas estas variables:

| Variable | Descripción |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram obtenido de @BotFather |
| `AIRTABLE_API_KEY` | Token de acceso personal de Airtable |
| `AIRTABLE_BASE_ID` | ID de la base de Airtable |
| `GEMINI_API_KEY` | Clave API de Google Gemini (Google AI Studio) |
| `CREATOMATE_API_KEY` | Clave API de Creatomate para render de videos |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name de Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `FUTURA_ACCESS_CODE` | Código de acceso para la web app (`/login`) |
| `OPENAI_API_KEY` | *(Opcional)* Respaldos de IA o generación adicional |

---

## 6. 🚀 Flujo de Trabajo en ChatGPT con GitHub / Vercel

Cuando pidas a ChatGPT que realice modificaciones:
1. **Pídele al modelo que edite el archivo objetivo** respetando el patrón TypeScript y server-side.
2. **Commit y Auto-Deploy:** Una vez aprobado el cambio, al hacer `git commit` y `git push origin main` (o al guardar vía integración de GitHub), **Vercel compilará y desplegará automáticamente**.
3. **Regla de Oro:** Mantener la lógica modular en `lib/` y los endpoints de API en `app/api/`.

---

## 7. 🔮 Próximos Pasos en el Roadmap

1. **Meta Graph API (Instagram & Facebook Auto-Publish):** Publicar automáticamente los posts/reels creados por Camila y Pixel en Instagram Business y Fanpages de Facebook.
2. **WhatsApp Business API:** Expandir la atención al cliente de Víctor de Telegram hacia WhatsApp.
3. **Multi-Servicio (Limpieza de Muebles y Apps Web):** Extender las tablas de Airtable y prompts de los agentes para atender cotizaciones de hidroaspirado de muebles y ventas de productos digitales.
4. **Respaldos de IA (Fallback Strategy):** Conectar OpenAI GPT-4o como segunda opción si Gemini agota cuota.
