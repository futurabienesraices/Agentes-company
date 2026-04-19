# 📊 CONTEXTO — CRM Y SEGUIMIENTO DE CLIENTES
> **Actualizado:** 2026-04-19 | **Fuente de verdad:** Airtable

---

## Regla fundamental

Todo lead que entra al sistema debe tener un estado, un siguiente paso y un responsable. Sin esos tres elementos, el lead no existe operativamente.

---

## Estados del Lead

```
NUEVO → CALIFICADO → EN SEGUIMIENTO → VISITA AGENDADA → PROPUESTA ENVIADA → CERRADO ✅ / PERDIDO ❌
```

| Estado | Descripción | Acción del agente |
|---|---|---|
| **Nuevo** | Lead recién llegado, sin calificar | Agente_Ventas: calificar con 2–3 preguntas |
| **Calificado** | Tiene intención, presupuesto aproximado y propiedad de interés | Agente_Ventas: enviar información y proponer visita |
| **En seguimiento** | No cerró en el primer contacto, pero hay interés | Agente_Ventas: recordatorio en 48–72h con nuevo valor |
| **Visita agendada** | Tiene cita confirmada | Agente_Operaciones: confirmar datos y preparar ficha de propiedad |
| **Propuesta enviada** | Recibió propuesta formal de precio o condiciones | Agente_Ventas: seguimiento en 24–48h |
| **Cerrado** | Venta o acuerdo concretado | Agente_Analista: documentar en historial, retro del proceso |
| **Perdido** | Sin respuesta o desistió | Agente_Analista: registrar razón, nutrir a largo plazo |

---

## Estructura del Registro de Lead (Airtable)

### Tabla: `Leads`

| Campo | Tipo | Descripción |
|---|---|---|
| `id_lead` | Texto | Formato: `LEAD-001`, `LEAD-002`... |
| `nombre` | Texto | Nombre del prospecto |
| `telefono` | Texto | Número de WhatsApp con código de país |
| `canal_origen` | Single select | `Facebook`, `Instagram`, `WhatsApp directo`, `Referido`, `Web` |
| `tipo_cliente` | Single select | `familia`, `inversionista`, `vendedor`, `emprendedor` |
| `propiedad_interes` | Texto / Link | ID de la propiedad o descripción de lo que busca |
| `presupuesto_aprox` | Number | En USD, sin formato |
| `estado` | Single select | Ver estados arriba |
| `nivel_intencion` | Single select | `alta`, `media`, `baja` |
| `fecha_primer_contacto` | Date | — |
| `fecha_ultimo_contacto` | Date | — |
| `proximo_seguimiento` | Date | Fecha del siguiente contacto programado |
| `historial_resumido` | Long text | Resumen de la conversación (actualizar en cada interacción) |
| `objeciones_detectadas` | Long text | Qué frenó al cliente |
| `nota_interna` | Long text | Observaciones del agente para el equipo |
| `negocio` | Single select | `bienes_raices`, `cleaning`, `marketing` |

---

## Protocolo de Seguimiento

### Frecuencia según nivel de intención

| Nivel | Seguimiento | Qué enviar |
|---|---|---|
| **Alta** | Cada 24–48h | Información adicional, respuesta a objeciones, confirmación de visita |
| **Media** | Cada 3–5 días | Nuevo contenido de valor, pregunta de reactivación |
| **Baja** | 1 vez por semana máx | Contenido educativo, no presionar |

### Mensaje de reactivación (lead en seguimiento)

```
Hola [nombre], soy Ever de Futura Bienes Raíces.
Te escribo porque [propiedad de interés] sigue disponible.
[Dato nuevo de valor: precio actualizado / nueva foto / dato de la zona]
¿Sigue siendo algo que te interesa?
```

---

## Reglas del CRM

1. **Ningún lead queda sin estado.** Si llega un mensaje, se abre ficha inmediatamente.
2. **No preguntar dos veces lo mismo.** El historial debe contener todo lo que el lead ya dijo.
3. **Un siguiente paso siempre definido.** Cada interacción debe terminar con una fecha o acción programada.
4. **Leads perdidos no se eliminan.** Se mantienen en estado `Perdido` con la razón documentada. En 30–60 días se pueden reactivar.
5. **Cruzar leads con propiedades.** Si entra un lead buscando algo que no está en inventario, documentar el perfil para cuando llegue esa propiedad.

---

## Integración con el Sistema de Agentes

```
Lead nuevo llega por WhatsApp
       │
       ▼
Agente_Ventas → califica, responde, actualiza estado en Airtable
       │
       ▼
Agente_Operaciones → crea o actualiza el registro del lead
       │
       ▼
Agente_Analista → revisa conversiones semanalmente, reporta al Estratega
       │
       ▼
Agente_Estratega → ajusta prioridades según pipeline actual
```

---

## KPIs del CRM

| Métrica | Frecuencia | Responsable |
|---|---|---|
| Leads nuevos por semana | Semanal | Agente_Analista |
| Tasa de conversión Nuevo → Calificado | Semanal | Agente_Analista |
| Tasa de conversión Calificado → Visita | Mensual | Agente_Analista |
| Tiempo promedio de cierre | Mensual | Agente_Analista |
| Leads perdidos por razón | Mensual | Agente_Estratega |
