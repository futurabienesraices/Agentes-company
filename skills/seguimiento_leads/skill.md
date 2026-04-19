# SKILL: Seguimiento de Leads — CRM
> **ID:** seguimiento_leads | **Versión:** 1.0 | **Creado:** 2026-04-19

---

## Propósito

Mantener leads activos hasta el cierre. Cada lead que entra al sistema tiene un siguiente paso — ninguno queda sin estado ni sin seguimiento programado.

---

## Entradas Esperadas

| Campo | Descripción |
|---|---|
| `id_lead` | Identificador del lead (ej: LEAD-001) |
| `nombre` | Nombre del prospecto |
| `estado_actual` | Estado actual en el pipeline |
| `historial_resumido` | Resumen de interacciones anteriores |
| `propiedad_interes` | ID o descripción de lo que busca |
| `nivel_intencion` | alta / media / baja |
| `dias_sin_contacto` | Días transcurridos desde el último mensaje |
| `objeciones_detectadas` | Qué frenó al lead anteriormente |

---

## Proceso Paso a Paso

### 1. Evaluar el estado del lead

```
¿El lead respondió el último mensaje?
├── SÍ → ¿Avanzó en el pipeline? → Actualizar estado y definir próximo paso
└── NO → ¿Cuántos días sin respuesta?
         ├── 1–2 días → Enviar mensaje de seguimiento suave
         ├── 3–5 días → Enviar mensaje con nuevo valor (foto, dato, oferta)
         └── +7 días → Lead frío → Reducir frecuencia, nutrir mensualmente
```

### 2. Seleccionar el tipo de mensaje según nivel de intención

| Nivel | Mensaje |
|---|---|
| **Alta** | Directo: confirmar visita, resolver objeción, cerrar |
| **Media** | Dar un dato nuevo de valor + pregunta de calificación |
| **Baja** | Contenido educativo o noticia relevante, sin presión |

### 3. Redactar el mensaje de seguimiento

**Estructura estándar:**
```
Hola [nombre], soy Ever de Futura [negocio].
[Referencia a la última conversación en 1 línea]
[Nuevo dato de valor o actualización]
[Pregunta o CTA suave]
```

**Reglas de redacción:**
- Máximo 3 líneas en WhatsApp
- Sin bloques de texto largos
- Siempre terminar con pregunta o acción concreta
- No copiar/pegar el mismo mensaje dos veces al mismo lead

### 4. Actualizar el registro en Airtable

Después de cada interacción:
- Actualizar `fecha_ultimo_contacto`
- Actualizar `estado` si cambió
- Resumir la interacción en `historial_resumido` (1–2 líneas)
- Definir `proximo_seguimiento` con fecha exacta

---

## Mensajes por Situación

### Lead nuevo (primer contacto)
```
Hola [nombre], gracias por tu interés en [propiedad/servicio].
Soy Ever de Futura [negocio]. ¿Me cuentas un poco más sobre lo que estás buscando?
```

### Lead que no respondió (seguimiento a 48h)
```
Hola [nombre], te escribo de nuevo sobre [propiedad/servicio].
[Dato nuevo: precio actualizado / foto nueva / disponibilidad limitada]
¿Sigue siendo algo que te interesa?
```

### Lead con objeción de precio
```
Entiendo que el precio es un factor importante.
¿Me cuentas cuál es tu presupuesto aproximado? Así te oriento hacia lo que mejor te funciona.
```

### Lead que dijo "déjame pensarlo"
```
Perfecto, tómate tu tiempo.
Solo te aviso que [propiedad] sigue disponible. Si quieres que te la reserve mientras decides, dímelo.
```

### Reactivación de lead frío (+30 días)
```
Hola [nombre], ¿cómo estás?
Hace tiempo hablamos sobre [propiedad/servicio]. Quería avisarte que [novedad relevante].
¿Todavía es algo en tu radar?
```

---

## Secuencia Estándar por Lead

| Día | Acción | Responsable |
|---|---|---|
| 0 | Primer contacto — calificar | Agente_Ventas |
| 1 | Si no responde — seguimiento suave | Agente_Ventas |
| 3 | Si no responde — nuevo valor | Agente_Ventas |
| 7 | Si no responde — pausa activa | Agente_Ventas |
| 30 | Reactivación con novedad | Agente_Ventas |
| 60 | Si sigue sin respuesta — marcar Perdido, mantener en lista | Agente_Analista |

---

## Formato de Output

```
ACCIÓN RECOMENDADA: [enviar mensaje / actualizar estado / escalar a Estratega]
MENSAJE LISTO PARA ENVIAR:
---
[texto del mensaje]
---
ACTUALIZAR EN AIRTABLE:
- estado: [nuevo estado]
- fecha_ultimo_contacto: [hoy]
- proximo_seguimiento: [fecha]
- historial_resumido: [resumen en 1 línea]
```
