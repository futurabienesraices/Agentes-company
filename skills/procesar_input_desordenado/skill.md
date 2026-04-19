# SKILL: Procesar Input Desordenado
> **ID:** procesar_input_desordenado | **Versión:** 1.0 | **Creado:** 2026-04-19

---

## Propósito

Convertir cualquier input del usuario — sin importar el formato, orden o completitud — en una ficha estructurada lista para el sistema.

El agente que usa esta skill **nunca le pide al usuario que reformatee su input**. Se adapta a lo que recibe.

---

## Tipos de Input Aceptados

| Formato | Ejemplo |
|---|---|
| Texto libre | "tengo una casa en santa ana, 3 cuartos, $65,000, escriturada" |
| Abreviaciones | "casa 3/2 sta ana 65k escriturada col sta lucia" |
| Lista desordenada | "- jardín - 120m2 - 3 hab - sin deudas - santa ana - precio 65000" |
| Conversación copiada | "[WhatsApp] Buenas, quiero vender mi terreno en Metapán..." |
| CSV pegado | `id,titulo,tipo...` con datos mezclados |
| Múltiples propiedades | Datos de 3 propiedades en el mismo mensaje |
| Datos parciales | Solo precio y ubicación, sin más |
| Fotos referenciadas | "foto1.jpg foto2.jpg — terreno 400v2 santa ana" |

---

## Proceso Paso a Paso

### 1. Detectar el tipo de datos

```
¿Qué hay en el input?
├── Datos de propiedad (ubicación / precio / tipo / m²)  → clasificar como PROPIEDAD
├── Mensaje de cliente o lead (pregunta / interés)        → clasificar como LEAD
├── Solicitud de tarea o contenido                        → clasificar como TAREA
└── Mezcla de varios                                      → separar y procesar cada uno
```

### 2. Extraer los campos conocidos

Mapear el lenguaje natural a los campos del sistema:

| Lo que el usuario escribe | Campo del sistema |
|---|---|
| "casa", "terreno", "local", "bodega" | `tipo_propiedad` |
| "vendo", "alquilo", "preventa" | `operacion` |
| "$65,000", "65k", "65 mil" | `precio` (convertir a número: 65000) |
| "santa ana", "col. jardines", dirección | `ubicacion` + `zona` |
| "3 cuartos / 3/2 / 3 hab" | parte de `descripcion` |
| "escriturado", "con escritura" | parte de `beneficios_clave` |
| "sin deudas", "libre de gravámenes" | parte de `beneficios_clave` |
| "disponible", "ya vendido", "reservado" | `estado_comercial` |
| nombre del propietario o contacto | dato del lead (no de la propiedad) |

### 3. Asignar valores por defecto para lo que falta

| Campo | Default si falta |
|---|---|
| `moneda` | USD |
| `estado_comercial` | disponible |
| `prioridad_comercial` | media |
| `id` | Siguiente BR-XXX según `context/entorno.md` |
| `cta_whatsapp` | Usar `whatsapp_bienes_raices` de `context/entorno.md` |

### 4. Identificar campos críticos faltantes

Si falta alguno de estos, **no crear la ficha aún** — solicitarlos:
- `precio` → "¿Cuál es el precio de esta propiedad?"
- `ubicacion` → "¿En qué zona o colonia está la propiedad?"
- `tipo_propiedad` → "¿Es terreno, casa, local o alquiler?"

Para todo lo demás (fotos, descripción, zona, beneficios), crear la ficha con `[PENDIENTE]` y continuar.

### 5. Producir la ficha estructurada

---

## Formato de Output

```
════════════════════════════════════════
FICHA EXTRAÍDA — [ID asignado]
Confianza del procesamiento: [ALTA / MEDIA / BAJA]
════════════════════════════════════════

id:                   BR-XXX
titulo:               [generado automáticamente si no se proveyó]
tipo_propiedad:       [extraído o inferido]
operacion:            [extraído o inferido]
precio:               [número limpio]
moneda:               USD
ubicacion:            [extraído]
zona:                 [extraído o [PENDIENTE]]
descripcion:          [construido desde los datos disponibles]
beneficios_clave:     [extraído y formateado con punto y coma]
estado_comercial:     disponible
prioridad_comercial:  media
publico_objetivo:     [inferido según tipo y precio]
objeciones_probables: [PENDIENTE]
link_carpeta_drive:   [PENDIENTE]
links_fotos:          [PENDIENTE]
cta_whatsapp:         https://wa.me/50360272418?text=Hola%2C%20me%20interesa%20BR-XXX

────────────────────────────────────────
CAMPOS CRÍTICOS FALTANTES:
  ❌ [listar si hay alguno]

CAMPOS RECOMENDADOS FALTANTES:
  ⏳ [listar los no críticos que faltan]

CONFIANZA BAJA EN:
  ⚠️ [listar campos donde el dato fue inferido, no explícito]
════════════════════════════════════════
```

---

## Ejemplos de Procesamiento

### Ejemplo 1 — Input mínimo
```
Input: "tengo un terreno en santa ana 400v2 22000"

Output:
id: BR-002
titulo: Terreno en Santa Ana (400 varas²)
tipo_propiedad: terreno
operacion: venta
precio: 22000
moneda: USD
ubicacion: Santa Ana, El Salvador
zona: [PENDIENTE]
descripcion: Terreno de 400 varas cuadradas en Santa Ana.
beneficios_clave: [PENDIENTE]
estado_comercial: disponible
prioridad_comercial: media
publico_objetivo: inversionistas
...

CAMPOS CRÍTICOS FALTANTES: ninguno
CAMPOS RECOMENDADOS FALTANTES: zona, beneficios_clave, link_carpeta_drive
CONFIANZA BAJA EN: operacion (asumida "venta"), zona (no especificada)
```

---

### Ejemplo 2 — Input de conversación de WhatsApp
```
Input:
"[Cliente] Buenas, vi su anuncio del terreno en Santa Ana,
¿sigue disponible? ¿Cuánto cuesta?"

Output: → CLASIFICADO COMO LEAD, no como propiedad

id_lead: LEAD-002
nombre: [desconocido]
telefono: [no disponible en este input]
canal_origen: WhatsApp
tipo_cliente: curioso (intención baja-media)
propiedad_interes: terreno en Santa Ana (posiblemente BR-001 o BR-002)
nivel_intencion: media
estado: Nuevo
historial_resumido: "Pregunta por disponibilidad y precio de terreno en Santa Ana"

ACCIÓN RECOMENDADA: Agente_Ventas responde con disponibilidad + precio + CTA
```

---

### Ejemplo 3 — Input muy desordenado
```
Input:
"casa col sta lucia santa ana 3 cuartos 2 baños cochera 120m2 jardin
precio 65mil escriturada lista para habitar"

Output:
id: BR-003
titulo: Casa residencial en Col. Santa Lucía, Santa Ana
tipo_propiedad: casa_residencial
operacion: venta
precio: 65000
moneda: USD
ubicacion: Colonia Santa Lucía, Santa Ana, El Salvador
zona: Santa Ana Centro
descripcion: Casa de 120m² con 3 habitaciones, 2 baños, cochera y jardín. Lista para habitar.
beneficios_clave: Escriturada;3 habitaciones;2 baños;Cochera;Jardín;Lista para habitar
estado_comercial: disponible
prioridad_comercial: alta
publico_objetivo: familias
...

CAMPOS CRÍTICOS FALTANTES: ninguno ✅
```

---

## Reglas de la Skill

1. **Nunca perder datos.** Si algo no encaja en ningún campo, ponerlo en `descripcion`.
2. **Preferir inferencia sobre bloqueo.** Si el tipo no se especifica pero hay precio residencial → inferir casa.
3. **Marcar claramente lo inferido.** El agente que recibe la ficha debe saber qué fue explícito y qué fue inferido.
4. **Un ID por ficha.** Nunca reusar IDs. Consultar `context/entorno.md` para el siguiente disponible.
5. **Separar propiedades de leads.** Si el input mezcla datos de propiedad con mensaje de cliente, clasificar por separado.
