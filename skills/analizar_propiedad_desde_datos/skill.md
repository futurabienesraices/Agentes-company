# SKILL: Analizar Propiedad Desde Datos
> **ID:** `analizar_propiedad_desde_datos` | **Versión:** 1.0 | **Creado:** 2026-04-14

---

## Propósito

Leer una ficha de propiedad en formato estructurado y producir una salida lista para que otros agentes o el usuario generen marketing, guiones o copies sin tener que procesar los datos en bruto.

Esta skill NO genera el contenido final — produce el **análisis y los insumos** para que la skill `captacion_inmuebles` u otra skill de contenido lo use.

---

## Entradas Esperadas

| Campo | Requerido | Descripción |
|---|---|---|
| Ficha de propiedad | ✅ Sí | Datos en formato CSV, JSON, Markdown o texto estructurado |
| Audiencia objetivo | ✅ Sí | Del campo `publico_objetivo` o de `context/audiencia.md` |
| Contexto de negocio | ✅ Sí | `context/bienes_raices.md` |
| Links o carpeta de fotos | ⚠️ Recomendado | `link_carpeta_drive` o `links_fotos` |

---

## Validaciones Mínimas (ejecutar antes de cualquier análisis)

El agente debe verificar que la ficha tiene:

- [ ] `titulo` — si falta: **detener y reportar como INCOMPLETA**
- [ ] `tipo_propiedad` — si falta: **detener y reportar como INCOMPLETA**
- [ ] `precio` — si falta: **marcar como INCOMPLETA, continuar solo si se solicita explícitamente**
- [ ] `ubicacion` — si falta: **marcar como INCOMPLETA, continuar solo si se solicita explícitamente**
- [ ] `estado_comercial` = `disponible` o `reservado` — si es `vendido` o `inactivo`: **detener**
- [ ] `link_carpeta_drive` o `links_fotos` — si ambos faltan: **advertir "Sin material visual"**

**Regla de oro:** Nunca inventar datos que no estén en la ficha. Si algo falta, reportarlo.

---

## Proceso Paso a Paso

### Paso 1 — Leer la ficha completa
Parsear todos los campos disponibles. Identificar cuáles están presentes y cuáles están vacíos o nulos.

### Paso 2 — Ejecutar validaciones
Correr el checklist de validaciones mínimas. Si hay campos críticos faltantes, incluirlos en la sección `datos_faltantes` del output. Si el bloqueo es total (sin título o sin tipo), detener y reportar solo el estado de la ficha.

### Paso 3 — Identificar tipo de activo y objetivo comercial
Basarse en `tipo_propiedad` + `operacion`:

| Tipo | Operación | Objetivo comercial |
|---|---|---|
| `terreno` | `venta` | Inversión / plusvalía |
| `casa_residencial` | `venta` | Vivienda propia / sueño familiar |
| `casa_residencial` | `alquiler` | Ingresos pasivos / estabilidad |
| `local_comercial` | `venta` o `alquiler` | Rentabilidad / negocio |
| `lote_lotificacion` | `venta` | Inversión en desarrollo |

### Paso 4 — Detectar el ángulo principal de venta
Cruzar `tipo_propiedad` + `publico_objetivo` + `beneficios_clave` + `zona` para identificar el ángulo más poderoso.

**Ángulos posibles:**
- **Inversión** → Plusvalía, zona de crecimiento, retorno
- **Familia** → Seguridad, espacio, ambiente
- **Urgencia** → Precio bajo de mercado, única disponible, reservada
- **Exclusividad** → Ubicación premium, características únicas
- **Practicidad** → Disponible ya, proceso simple, sin complicaciones

### Paso 5 — Elegir el formato de contenido más conveniente
Basarse en si hay material visual disponible:

| Material visual | Formato recomendado |
|---|---|
| Fotos + video | Reel de Instagram / Facebook |
| Solo fotos | Carrusel o post estático |
| Sin material confirmado | WhatsApp Status de texto + solicitar fotos |

### Paso 6 — Proponer el hook
Generar 2 opciones de gancho basadas en el ángulo detectado. Usar la estructura de la skill `captacion_inmuebles` como referencia de estilo.

### Paso 7 — Proponer el CTA
Usar `cta_whatsapp` si existe. Si no, construir con el número principal del negocio:
`https://wa.me/[número]?text=Hola, vi la propiedad [id o titulo]`

---

## Reglas de Decisión

1. **Sin fotos → advertir siempre.** El contenido sin evidencia visual tiene baja conversión en bienes raíces.
2. **Sin precio → no publicar.** Un precio ausente genera desconfianza. Marcar como pendiente.
3. **Sin ubicación → no publicar.** La ubicación es el segundo factor de decisión más importante.
4. **`estado_comercial` ≠ disponible o reservado → no analizar para contenido público.**
5. **No inventar datos.** Si `beneficios_clave` está vacío, el agente puede sugerir preguntas para obtenerlos, no inventarlos.
6. **Priorizar captación.** El análisis siempre debe terminar con un CTA hacia WhatsApp, nunca hacia un formulario como primera opción.

---

## Formato de Salida

```
ANÁLISIS DE PROPIEDAD: [ID] — [Titulo]
Fecha: [YYYY-MM-DD]
Estado: COMPLETA | INCOMPLETA | BLOQUEADA
---

RESUMEN COMERCIAL:
[2-3 líneas que resumen la oportunidad comercial de esta propiedad]

ÁNGULO DE CONTENIDO:
[Inversión / Familia / Urgencia / Exclusividad / Practicidad]
Justificación: [Por qué este ángulo para este activo y audiencia]

FORMATO SUGERIDO:
[Reel / Carrusel / Post estático / WhatsApp Status]
Justificación: [Basado en material visual disponible]

HOOK (2 opciones):
A) [Opción de gancho A]
B) [Opción de gancho B]

CTA:
[Link o texto del WhatsApp preformateado]

DATOS FALTANTES:
- [Campo]: [Impacto — por qué importa]
- [Campo]: [Impacto — por qué importa]

ADVERTENCIAS:
- [Advertencia 1]
- [Advertencia 2]
```

---

## Notas de uso

- Esta skill es un **preprocessor**: su output alimenta a `captacion_inmuebles` u otras skills de contenido.
- Si el usuario da la ficha de propiedad directamente en el chat, el agente puede ejecutar esta skill sin necesidad de leer de Airtable.
- Siempre guardar el output en `output/bienes_raices/analisis_[ID]_[fecha].md`.
