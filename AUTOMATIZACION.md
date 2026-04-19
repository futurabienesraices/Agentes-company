# ⚡ AUTOMATIZACIÓN — Futura Intelligence
> **Versión:** 1.1 | **Actualizado:** 2026-04-19

---

## Arquitectura General

```
                    AGENTE_MAESTRO (punto de entrada)
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
        Drive           WhatsApp        Input directo
    (fotos subidas)   (lead entrante)  (datos en chat)
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                    Make / n8n (orquestador)
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
        Airtable      Claude API        Redes sociales
    (base de datos)  (agentes IA)      (publicación)
```

---

## Flujo Central: Drive → Sistema Completo

Este es el flujo principal que automatiza todo desde que subes fotos hasta que tienes contenido listo:

```
1. Subes fotos a Drive (carpeta Propiedades/BR-XXX/)
         │
         ▼
2. Make detecta archivos nuevos en Drive (trigger automático)
         │
         ▼
3. Make identifica el ID de propiedad desde el nombre de la carpeta
         │
         ▼
4. Make consulta Airtable: ¿existe BR-XXX?
    ├── SÍ  → leer datos existentes
    └── NO  → crear fila nueva en tabla Propiedades
         │
         ▼
5. Make llama a Claude API con:
   - Datos de la propiedad (de Airtable o vacíos)
   - Referencia a las fotos recién subidas
   - Prompt de Agente_Maestro / Agente_Futura_RealEstate
         │
         ▼
6. Claude genera:
   - Título comercial (si faltaba)
   - Guión de Reel con indicaciones de toma
   - Copy para carrusel
   - Caption para publicación
         │
         ▼
7. Make guarda el contenido generado en Airtable
   (campo: contenido_generado / estado: listo_para_revisar)
         │
         ▼
8. Make notifica al CEO por WhatsApp:
   "✅ BR-XXX procesado. Contenido listo para revisar."
         │
         ▼
9. CEO aprueba en Airtable (cambia estado a "aprobado")
         │
         ▼
10. [Fase 3] Make publica automáticamente en Facebook/Instagram
```

---

## Fases de Implementación

### FASE 1 — Manual (Ahora)
**Estado:** Activo
**Cuándo activar la siguiente fase:** Cuando haya 10+ propiedades y el flujo manual sea sostenido

| Tarea | Cómo se hace ahora |
|---|---|
| Ingresar propiedad | Llenar `propiedades/BR-XXX.md` → copiar a Airtable manualmente |
| Crear contenido | Activar agentes en Claude con la ficha de la propiedad |
| Responder leads | Copiar respuesta del Agente_Ventas al WhatsApp manualmente |
| Registrar lead | Agregar fila en la tabla `Leads` de Airtable manualmente |
| Seguimiento | Revisar Airtable, usar mensajes de la skill `seguimiento_leads` |

---

### FASE 2 — Semi-automatizada (10+ propiedades)
**Herramienta:** Make (Integromat) o n8n
**Costo estimado:** Make gratuito hasta 1,000 operaciones/mes. n8n: self-hosted gratuito.

**Flujos a automatizar primero:**

#### Flujo 1 — Nueva propiedad → Contenido automático
```
Trigger: Nueva fila en tabla "Propiedades" de Airtable
    │
    ▼
Make / n8n lee los campos de la propiedad
    │
    ▼
Llama a Claude API con prompt de Agente_Futura_RealEstate
    │
    ▼
Guarda el contenido generado en Airtable (campo "contenido_generado")
    │
    ▼
[Opcional] Notifica por WhatsApp al CEO: "Contenido listo para BR-XXX"
```

#### Flujo 2 — WhatsApp → Registro de lead automático
```
Trigger: Mensaje entrante en WhatsApp Business
    │
    ▼
Make / n8n extrae número, nombre (si disponible), mensaje
    │
    ▼
Crea fila en tabla "Leads" de Airtable (estado: Nuevo)
    │
    ▼
Notifica al CEO o agente humano para respuesta
```

#### Flujo 3 — Seguimiento automático de leads
```
Trigger: Cada día a las 9am
    │
    ▼
Make / n8n consulta Airtable: leads con "proximo_seguimiento" = hoy
    │
    ▼
Para cada lead → llama a Claude API con skill "seguimiento_leads"
    │
    ▼
Envía mensaje por WhatsApp Business API
    │
    ▼
Actualiza "fecha_ultimo_contacto" en Airtable
```

---

### FASE 3 — Totalmente automatizada (futuro)
**Requiere:** API de WhatsApp Business + Make Pro o n8n Cloud

| Automatización | Descripción |
|---|---|
| Respuesta automática a leads | WhatsApp entrante → Agente_Ventas responde en segundos |
| Publicación de contenido | Airtable → contenido generado → publicado en Facebook/Instagram |
| Reporte semanal automático | Cada lunes → Agente_Analista → resumen de leads, propiedades y conversiones |
| Alerta de propiedad reservada | Airtable cambia estado → notificación al CEO al instante |

---

## Conexiones por Servicio

### 1. Airtable

**Qué conectar:**
- Tabla `Propiedades` — trigger para generación de contenido
- Tabla `Leads` — trigger para seguimiento y alertas

**Cómo conectar con Make/n8n:**
1. Ir a Airtable → Account → Developer Hub → Create Token
2. Dar permisos: `data.records:read`, `data.records:write` para las tablas relevantes
3. En Make: módulo "Airtable" → Watch Records (trigger por nueva fila o cambio de estado)
4. En n8n: nodo "Airtable" → operación "List/Create/Update Records"

---

### 2. WhatsApp Business API

**Opciones (de más fácil a más avanzado):**

| Opción | Costo | Dificultad | Recomendado |
|---|---|---|---|
| **Meta Business Suite** (manual) | Gratis | Ninguna | Fase 1 |
| **Twilio for WhatsApp** | ~$0.005/mensaje | Media | Fase 2 |
| **360dialog** | ~$5/mes base | Media | Fase 2 |
| **Meta Cloud API directa** | Por volumen | Alta | Fase 3 |

**Recomendación:** Empezar con **360dialog** — se conecta nativamente con Make y n8n, tiene sandbox gratuito para pruebas.

**Pasos para activar 360dialog:**
1. Crear cuenta en 360dialog.com
2. Conectar número de WhatsApp Business (+503 6027-2418)
3. Obtener API Key
4. En Make: módulo "HTTP" o conector nativo de 360dialog
5. En n8n: nodo "HTTP Request" con endpoint de 360dialog

---

### 3. Google Drive

**Qué conectar:**
- Detectar cuando se suben fotos nuevas a una carpeta de propiedad
- Trigger: foto nueva → proceso de generación de contenido con imagen

**Cómo conectar:**
1. En Make: módulo "Google Drive" → Watch Files in Folder (trigger)
2. Dar acceso OAuth a la cuenta de Google desde Make
3. Seleccionar la carpeta raíz: `Futura Bienes Raíces/Propiedades/`

**Flujo sugerido:**
```
Foto nueva en Drive (carpeta BR-XXX)
    │
    ▼
Make lee el nombre de la carpeta → identifica el ID de la propiedad
    │
    ▼
Consulta los datos en Airtable (tabla Propiedades, fila BR-XXX)
    │
    ▼
Llama a Claude API con datos + referencia a la foto
    │
    ▼
Genera caption o guión de reel con esa foto específica
```

---

### 4. Claude API (Motor de los agentes)

**Para automatizar los agentes, necesitas la API de Anthropic.**

**Pasos:**
1. Crear cuenta en console.anthropic.com
2. Generar API Key en Settings → API Keys
3. Guardar la key en un lugar seguro (NO subir al repositorio)
4. En Make: módulo "HTTP" → POST a `https://api.anthropic.com/v1/messages`

**Ejemplo de llamada a la API (para Make/n8n):**
```json
Headers:
  x-api-key: [TU_API_KEY]
  anthropic-version: 2023-06-01
  content-type: application/json

Body:
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Actúa como Agente_Futura_RealEstate. [DATOS DE LA PROPIEDAD]"
    }
  ]
}
```

**Modelo recomendado:** `claude-sonnet-4-6` — balance óptimo entre calidad y costo de tokens.

---

### 5. Facebook / Instagram (Publicación automática)

**Herramienta:** Meta Graph API + Make

**Flujo:**
```
Contenido generado por agente (guardado en Airtable)
    │
    ▼
CEO aprueba en Airtable (cambia estado a "aprobado")
    │
    ▼
Make detecta el cambio → toma el copy y la foto de Drive
    │
    ▼
Publica en la página de Facebook / perfil de Instagram vía Graph API
```

**Nota:** La aprobación manual antes de publicar es recomendable en Fase 2. En Fase 3 puede ser totalmente automático con horario programado.

---

## Variables de Entorno Necesarias

Crear archivo `.env` (nunca subir al repositorio — ya está en `.gitignore`):

```env
# Anthropic / Claude
ANTHROPIC_API_KEY=sk-ant-...

# Airtable
AIRTABLE_API_TOKEN=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_PROPIEDADES=Propiedades
AIRTABLE_TABLE_LEADS=Leads

# WhatsApp (360dialog o Twilio)
WHATSAPP_API_KEY=...
WHATSAPP_NUMBER=50360272418

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=1oSzaoaePPb517OexEvRXGjLzjhHZaCBs
GOOGLE_SERVICE_ACCOUNT_JSON=./credentials/google-service-account.json

# Meta (Facebook/Instagram)
META_ACCESS_TOKEN=...
META_PAGE_ID=...
META_INSTAGRAM_ID=...
```

---

## Orden de Implementación Recomendado

| Prioridad | Integración | Tiempo estimado | Impacto |
|---|---|---|---|
| 1 | Airtable + datos manuales | Ya disponible | Base de todo |
| 2 | Claude API + Make (generación de contenido) | 1–2 días | Alto |
| 3 | WhatsApp Business API (360dialog) | 2–3 días | Alto |
| 4 | Google Drive trigger | 1 día | Medio |
| 5 | Facebook/Instagram publicación | 2–3 días | Medio |
| 6 | Seguimiento automático de leads | 1–2 días | Alto |
| 7 | Reporte semanal automático | 1 día | Medio |

---

## Herramientas Recomendadas

| Herramienta | Para qué | Plan recomendado | Link |
|---|---|---|---|
| **Make** | Automatización principal | Free → Core ($9/mes) | make.com |
| **n8n** (alternativa) | Más control, self-hosted | Community (gratis) | n8n.io |
| **360dialog** | WhatsApp Business API | Starter (~$5/mes) | 360dialog.com |
| **Airtable** | Base de datos + CRM | Free → Plus ($10/mes) | airtable.com |
| **Anthropic Console** | Claude API | Pay-per-use | console.anthropic.com |

---

## Estado de las Integraciones

| Integración | Estado |
|---|---|
| Airtable | ⏳ Pendiente — crear base (ver SETUP.md) |
| Google Drive | ✅ Carpeta raíz activa |
| WhatsApp | ⏳ Pendiente — activar API (Fase 2) |
| Claude API | ⏳ Pendiente — obtener API key |
| Make / n8n | ⏳ Pendiente — esperar Fase 2 |
| Facebook/Instagram | ⏳ Pendiente — Fase 2/3 |

Actualizar este archivo conforme se activan las integraciones.
