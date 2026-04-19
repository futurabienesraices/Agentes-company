# SKILL: Prospección Activa de Leads
> **ID:** prospeccion_activa | **Versión:** 1.0 | **Creado:** 2026-04-19

---

## Propósito

Generar leads nuevos de forma activa cada día. Esta skill produce copys listos para publicar, mensajes de apertura personalizados y el registro de cada nuevo contacto encontrado.

---

## Modo 1 — Rutina Diaria (20–30 min)

### Input requerido:
```
PROPIEDAD_DEL_DIA: [BR-XXX — datos clave]
GRUPOS_ACTIVOS: [lista de grupos de Facebook donde publicar]
LEADS_PENDIENTES_DE_AYER: [si hay alguno sin contactar]
```

### Output que produce:

**1. Publicación para grupos de Facebook**
```
════════════════════════════════
POST PARA GRUPOS — [fecha]
Grupos objetivo: [lista]
════════════════════════════════

[FOTO SUGERIDA: foto principal de la propiedad]

[TEXTO DEL POST]:
─────────────────
[copy listo para copiar y pegar]
─────────────────

INSTRUCCIÓN: Publicar en cada grupo con al menos 2 horas de diferencia.
Responder TODOS los comentarios en menos de 30 minutos.
════════════════════════════════
```

**2. Story de WhatsApp / Instagram**
```
STORY DEL DÍA:
Foto: [indicación de cuál foto usar]
Texto en pantalla: [máximo 2 líneas]
Link: wa.me/50360272418?text=Hola%2C%20vi%20tu%20historia
```

**3. Registro de leads a contactar**
```
PROSPECTOS NUEVOS ENCONTRADOS:
[Si monitoreaste grupos antes de ejecutar esta rutina]

Prospecto: [nombre/usuario]
Fuente: [grupo/post donde se encontró]
Señal: [qué escribió o hizo]
Mensaje sugerido: [texto de apertura personalizado]
Registrar en Airtable: SÍ
```

---

## Modo 2 — Monitoreo de Grupos

### Cómo monitorear manualmente:
1. Abrir el grupo de Facebook
2. Buscar en el grupo: "busco", "necesito", "quiero comprar", "vendo"
3. Revisar publicaciones de los últimos 3 días
4. Por cada persona relevante encontrada → generar mensaje de apertura

### Input:
```
TEXTO_ENCONTRADO: [copia exacta del post o comentario del prospecto]
CONTEXTO: [grupo donde se encontró]
```

### Output:
```
CLASIFICACIÓN: [comprador activo / vendedor / curioso]
NIVEL DE INTENCIÓN: [alta / media / baja]
MENSAJE DE APERTURA:
─────────────────
[texto personalizado listo para enviar]
─────────────────
CANAL RECOMENDADO: [comentario público primero → DM → WhatsApp]
REGISTRAR EN AIRTABLE: [campos a llenar]
```

---

## Modo 3 — Revisión Semanal de Estrategia

### Input:
```
LEADS_GENERADOS_SEMANA: [número]
FUENTES: [Facebook: X | WhatsApp: X | Instagram: X | Directo: X]
MENSAJES_ENVIADOS: [número]
RESPUESTAS_RECIBIDAS: [número]
MEJOR_PROPIEDAD: [BR-XXX — X consultas]
PEOR_TACTICA: [descripción]
```

### Output:
```
════════════════════════════════════
REPORTE SEMANAL DE PROSPECCIÓN
Semana del [fecha] al [fecha]
════════════════════════════════════

RESUMEN:
  Leads nuevos: [X]
  Tasa de respuesta: [X%]
  Mejor fuente: [X → Y leads]
  Propiedad con más interés: [BR-XXX]

ANÁLISIS:
  ✅ Qué funcionó: [táctica específica]
  ⚠️ Qué necesita ajuste: [táctica específica]
  ❌ Qué pausar: [táctica sin resultados]

AJUSTES PARA LA PRÓXIMA SEMANA:
  1. [cambio específico]
  2. [cambio específico]
  3. [cambio específico]

ACTUALIZAR EN memory.md:
  [línea exacta para agregar al scratchpad]
════════════════════════════════════
```

---

## Plantillas de Mensajes de Apertura

### Para quien busca propiedad activamente:
```
Hola [nombre] 👋 Vi que buscas [tipo] en [zona].
Tengo [descripción breve] en $[precio] — escriturado y disponible.
¿Te mando los detalles por WhatsApp?
```

### Para quien hizo una pregunta en comentarios:
```
[nombre], te respondo por acá 👆
Tengo [propiedad relevante] que puede encajar con lo que buscas.
¿Quieres que te mande la ficha completa?
```

### Para reactivar lead frío:
```
Hola [nombre], ¿cómo estás?
Hace unas semanas hablamos sobre [propiedad/zona].
Acabo de recibir [novedad: precio nuevo / propiedad similar / info de la zona].
¿Todavía está en tu radar?
```

### Para vendedor que quiere vender:
```
Hola [nombre], vi que tienes una propiedad en [zona].
En Futura Bienes Raíces nos especializamos en vender con marketing real — fotos, video y publicidad en redes.
¿Te cuento cómo funciona?
```

---

## Reglas de la Skill

1. **Nunca spam.** Máximo 1 publicación por grupo cada 3 días.
2. **Personalizar siempre.** No copiar el mismo mensaje a todos — adaptar al contexto del prospecto.
3. **Responder rápido.** Comentario en grupo → responder en <30 min para ganar visibilidad.
4. **Registrar todo.** Cada prospecto contactado entra a Airtable, aunque no haya respondido.
5. **Medir para mejorar.** Sin datos no hay mejora. Registrar fuente y resultado de cada contacto.
6. **Migrar a WhatsApp.** El objetivo de cada interacción pública es llevar la conversación a WhatsApp.
