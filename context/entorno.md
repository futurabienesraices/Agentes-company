# 🌐 ENTORNO — Futura Intelligence
> **Versión:** 1.0 | **Actualizado:** 2026-04-19
> **Propósito:** Fuente única de verdad sobre DÓNDE vive cada cosa. Todos los agentes leen este archivo para saber cómo conectar con los servicios externos.

---

## Regla fundamental

Antes de ejecutar cualquier tarea que involucre datos externos, el agente lee este archivo.
Si un valor dice `[PENDIENTE]`, notificar al usuario y continuar sin ese servicio.

---

## 1. Google Drive

| Variable | Valor |
|---|---|
| `drive_raiz_url` | https://drive.google.com/drive/folders/1oSzaoaePPb517OexEvRXGjLzjhHZaCBs |
| `drive_raiz_id` | `1oSzaoaePPb517OexEvRXGjLzjhHZaCBs` |
| `drive_estructura` | `Propiedades/BR-XXX — [Título]/fotos/ · /videos/ · /documentos/` |
| `drive_acceso` | Cuenta personal de Ever — compartir link público para lectura |

**Cómo los agentes usan Drive:**
- Leer el `link_carpeta_drive` de la ficha de cada propiedad
- Si la carpeta no existe → instruir al usuario para crearla con el formato correcto
- Nunca asumir que hay fotos — siempre verificar el campo `links_fotos` o `link_carpeta_drive`

---

## 2. Airtable

| Variable | Valor |
|---|---|
| `airtable_base_nombre` | `Futura Bienes Raíces — Inventario` |
| `airtable_base_id` | `[PENDIENTE — copiar de la URL de Airtable: appXXXXXXXX]` |
| `airtable_tabla_propiedades` | `Propiedades` |
| `airtable_tabla_leads` | `Leads` |
| `airtable_api_token` | `[PENDIENTE — guardar en .env, no aquí]` |

**Cómo los agentes usan Airtable:**
- Toda propiedad nueva se registra en `Propiedades`
- Todo lead nuevo se registra en `Leads`
- Agente_Operaciones es el responsable de mantener Airtable actualizado
- Si Airtable no está configurado → guardar en `propiedades/BR-XXX.md` como respaldo local

---

## 3. WhatsApp

| Variable | Valor |
|---|---|
| `whatsapp_bienes_raices` | `+503 6027-2418` |
| `whatsapp_bienes_raices_raw` | `50360272418` (sin guiones, con código de país) |
| `whatsapp_cleaning` | `+503 7317-2574` |
| `whatsapp_cleaning_raw` | `50373172574` |
| `whatsapp_api_provider` | `[PENDIENTE — 360dialog / Twilio]` |
| `whatsapp_api_key` | `[PENDIENTE — guardar en .env]` |

**Formato estándar de CTA:**
```
https://wa.me/50360272418?text=Hola%2C%20me%20interesa%20la%20propiedad%20BR-XXX
```

---

## 4. Numeración de Propiedades

| Variable | Valor |
|---|---|
| `prefijo_propiedades` | `BR-` |
| `ultimo_id_registrado` | `BR-001` |
| `proximo_id` | `BR-002` |

**Regla:** Antes de crear una nueva propiedad, verificar el último ID en la carpeta `propiedades/` y asignar el siguiente en orden. Actualizar `ultimo_id_registrado` en este archivo después de cada creación.

---

## 5. Anthropic / Claude API

| Variable | Valor |
|---|---|
| `anthropic_model` | `claude-sonnet-4-6` |
| `anthropic_api_key` | `[PENDIENTE — guardar en .env]` |
| `anthropic_api_endpoint` | `https://api.anthropic.com/v1/messages` |
| `max_tokens_default` | `2048` |

---

## 6. Automatización (Make / n8n)

| Variable | Valor |
|---|---|
| `make_workspace` | `[PENDIENTE — crear cuenta en make.com]` |
| `make_webhook_propiedades` | `[PENDIENTE — URL del webhook cuando se configure]` |
| `make_webhook_leads` | `[PENDIENTE — URL del webhook cuando se configure]` |
| `n8n_url` | `[PENDIENTE — si se usa n8n self-hosted]` |

---

## 7. Redes Sociales

| Variable | Valor |
|---|---|
| `facebook_pagina` | `[PENDIENTE — nombre o ID de la página de Futura Bienes Raíces]` |
| `instagram_cuenta` | `[PENDIENTE — @usuario de Instagram]` |
| `meta_access_token` | `[PENDIENTE — guardar en .env]` |
| `meta_page_id` | `[PENDIENTE — ID numérico de la página de Facebook]` |

---

## 8. Sitios Web

| Sitio | URL | Estado |
|---|---|---|
| Futura Cleaning | futuracleaning.serviciosfutura.com | ✅ Activo |
| Futura Marketing / SaaS | serviciosfutura.com | ✅ Activo |
| Futura Bienes Raíces | `[PENDIENTE — dominio por definir]` | ⏳ Pendiente |

---

## 9. Archivos del Sistema (Rutas Internas)

| Recurso | Ruta |
|---|---|
| Fuente de verdad | `cloud.md` |
| Memoria persistente | `memory.md` |
| Este archivo | `context/entorno.md` |
| Fichas de propiedades | `propiedades/BR-XXX.md` |
| Contexto inmobiliario | `context/bienes_raices.md` |
| Contexto Cleaning | `context/cleaning.md` |
| Audiencias | `context/audiencia.md` |
| Estructura de datos | `context/base_propiedades.md` |
| CRM y leads | `context/crm.md` |
| Producción de contenido | `context/produccion_contenido.md` |
| Stack de herramientas | `context/data_stack.md` |
| Template CSV | `templates/propiedades_template.csv` |

---

## Estado General del Entorno

| Servicio | Estado | Bloqueante |
|---|---|---|
| Google Drive | ✅ Activo | No |
| Airtable | ⏳ Por configurar | Sí — sin esto no hay base de datos |
| WhatsApp (manual) | ✅ Funcional | No |
| WhatsApp (API automática) | ⏳ Por configurar | No — solo necesario en Fase 2 |
| Claude API | ⏳ Por configurar | Necesario para automatización |
| Make / n8n | ⏳ Por configurar | Necesario para automatización |
| Facebook / Instagram API | ⏳ Por configurar | Solo Fase 3 |

---

## Cómo actualizar este archivo

Cada vez que se activa un nuevo servicio:
1. Reemplazar `[PENDIENTE]` con el valor real
2. Cambiar el estado en la tabla de Estado General
3. Si el valor es sensible (API key, token), escribir `[ver .env]` y guardarlo en `.env`
4. Registrar el cambio en `memory.md` con fecha
