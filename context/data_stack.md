# 🗄️ ARQUITECTURA DE DATOS — FUTURA BIENES RAÍCES
> **Actualizado:** 2026-04-14

---

## Regla fundamental

**Airtable manda sobre todo lo operativo.**
Si hay conflicto entre Airtable y cualquier otro sistema sobre datos de una propiedad, Airtable gana.

---

## Stack por función

| Herramienta | Rol | Qué vive ahí |
|---|---|---|
| **Airtable** | Fuente de verdad operativa | Inventario de propiedades, estado comercial, datos de contacto, historial de leads |
| **Google Drive** | Repositorio visual | Fotos, videos, renders, material de dron, carpetas por propiedad |
| **Notion** | Documentación y conocimiento | SOPs, estrategia, guías de proceso, briefings, contexto cualitativo |
| **GitHub** | Control de versiones | Archivos del sistema `.cloud`, agentes, skills, contexto, templates |
| **n8n / Make** | Automatización (futuro) | Flujos entre Airtable → WhatsApp, Airtable → contenido, alertas, reportes |

---

## Jerarquía de decisión

```
Airtable (datos)
    → Google Drive (archivos visuales vinculados)
    → Notion (contexto y documentación de soporte)
    → GitHub (versionado del sistema de agentes)
    → n8n / Make (automatización cuando esté maduro)
```

---

## Reglas de sincronización

1. **Airtable como base de entrada:** Toda propiedad nueva se registra primero en Airtable.
2. **Drive vinculado:** Cada propiedad en Airtable tiene un campo `link_carpeta_drive` que apunta a su carpeta de archivos.
3. **Notion como referencia:** SOPs, estrategia de contenido y briefings viven en Notion. No en Airtable.
4. **GitHub sin datos sensibles:** El sistema local solo versiona archivos de texto (`.md`, `.csv` templates). Nunca fotos, API keys ni datos privados de clientes.
5. **n8n / Make cuando haya volumen:** No construir automatizaciones hasta tener mínimo 10 propiedades activas en inventario.

---

## Tablas requeridas en Airtable

| Tabla | Descripción | Referencia |
|---|---|---|
| `Propiedades` | Inventario de propiedades (17 campos) | `context/base_propiedades.md` |
| `Leads` | CRM de prospectos y clientes | `context/crm.md` |

---

## Estado actual (2026-04-19)

| Herramienta | Estado |
|---|---|
| Airtable | Por configurar — tablas: `Propiedades` y `Leads` |
| Google Drive | Por crear carpeta raíz `Futura Bienes Raíces/Propiedades/` |
| Notion | Usar para SOPs y briefings |
| GitHub | ✅ Activo — rama `claude/review-agents-setup-hQMvP` |
| n8n / Make | No activo — esperar 10+ propiedades en inventario |

---

## Próximo paso para activar el stack

1. Crear la base en Airtable con las tablas `Propiedades` y `Leads` (ver `SETUP.md`).
2. Crear la carpeta raíz `Futura Bienes Raíces/Propiedades/` en Google Drive.
3. Ingresar la primera propiedad real usando `propiedades/BR-001.md` como referencia.
