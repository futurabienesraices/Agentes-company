# 📦 PAQUETE DE AUDITORÍA Y FEEDBACK PARA CLAUDE

> **Instrucción para el usuario:** Copia todo el contenido de este documento y pégalo en una conversación con Claude para obtener una revisión técnica, sugerencias de optimización y feedback de arquitectura sobre todo el proyecto **Futura OS**.

---

## 🤖 PROMPT PARA CLAUDE:

```markdown
Hola Claude, por favor realiza una revisión técnica exhaustiva y proporciona tu feedback sobre la arquitectura, seguridad y funcionalidades de mi proyecto: **Futura OS** (Sistema Operativo Inmobiliario y Multinegocio).

---

### 1. Resumen de Arquitectura y Stack Técnico

- **Framework**: Next.js 15.5 (App Router, React 19, TypeScript 5.8).
- **Diseño & UI**: Mobile-First único en `/` (dashboard con pills reactivas sin saltos de pantalla), Vanilla CSS + CSS Modules.
- **Base de Datos Operativa**: Airtable REST API (Propiedades, Leads, Tareas, Campañas, Consumo IA, Memoria de Prospectos).
- **Motor de IA Principal**: Google Gemini API (Director IA) + soporte opcional para OpenAI (Contenido) y Grok.
- **Seguridad y Autenticación**: Middleware HMAC SHA-256 en Next.js con cookie privada `futura_session` y ruta `/login`.
- **Integraciones e Infraestructura**:
  - **Cloudinary API**: Subida directa de fotos/videos desde la app móvil y almacenamiento CDN.
  - **Bot Multiagente de Telegram**: Webhook integrado para los agentes Camila (Contenido), Víctor (Ventas) y Pixel (Reels).
  - **Creatomate API**: Renderizado automático de videos Reels (MP4) con fotos reales de Airtable/Cloudinary.
  - **Meta Graph API**: Publicación directa de posts en Facebook Pages e Instagram Business Accounts.
  - **Automatización**: Vercel Crons (`vercel.json`) ejecutando el Social Amplifier Agent y la Depuración de Inventario.
  - **Calendarios**: Feed iCalendar (`/api/calendar/feed.ics`) para sincronización con iPhone y Google Calendar.

---

### 2. Estructura del Repositorio

- `app/page.tsx`: Punto de entrada único del sistema con conversador continuo de Futura IA.
- `app/components/HomeModules.tsx`: Orquestador de pills/pestañas principales.
- `app/components/MobilePropertyCapture.tsx`: Módulo de captación en campo mobile-first (Cámara trasera, dictado por voz Web Speech API, ubicación GPS y Quality Score 0-100%).
- `app/components/IntegrationHealthCenter.tsx`: Panel de diagnóstico en vivo de API keys y estado de conexiones.
- `app/api/auth/login` y `logout`: Manejo de autenticación por código.
- `middleware.ts`: Protección de rutas `/api/*` y dashboard, exceptuando webhooks públicos (Telegram, WhatsApp, Meta).
- `lib/agents/`:
  - `inventory-cleanup-agent.ts`: Depuración de inventario en Airtable.
  - `social-amplifier-agent.ts`: Agente de exponenciación en redes sociales.
  - `sales-agent.ts` & `lib/sales.ts`: Cockpit comercial y Lead Scoring.
- `lib/meta-api.ts`: Cliente de Meta Graph API.
- `lib/cloudinary.ts`: Cliente de almacenamiento multimedia.

---

### 3. Áreas sobre las que solicito tu Feedback:

1. **Seguridad & Resiliencia**: Evaluación de la protección por middleware y manejo de secrets.
2. **Escalabilidad de Datos**: Estrategia de transición recomendada de Airtable a PostgreSQL/Supabase en el futuro.
3. **Optimización de Agentes e IA**: Recomendaciones para enriquecer los agentes (Camila, Víctor, Pixel y Director).
4. **Experiencia de Usuario (UX/UI)**: Sugerencias para maximizar el uso móvil por asesores inmobiliarios en campo.
```
