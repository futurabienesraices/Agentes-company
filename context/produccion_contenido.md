# 🎬 CONTEXTO — PRODUCCIÓN DE CONTENIDO
> **Actualizado:** 2026-04-19

---

## Regla fundamental

Todo contenido producido por los agentes debe estar **listo para usar**. No borradores, no ideas generales. El output es el entregable final.

---

## Tipos de Contenido por Formato

### 1. Guión de Reel (Video corto)

**Duración objetivo:** 30–60 segundos
**Estructura obligatoria:**

| Parte | Duración | Qué incluye |
|---|---|---|
| **Hook** | 0–3 seg | Frase de impacto o dato sorpresa. Sin introducción. |
| **Problema/Contexto** | 3–10 seg | Por qué esta propiedad importa ahora |
| **Cuerpo** | 10–40 seg | 3 beneficios clave mostrados visualmente (indicar qué mostrar en cámara) |
| **CTA** | Últimos 5 seg | Acción concreta: "Escríbenos al WhatsApp" + número |

**Output esperado del agente:**
```
HOOK: [frase exacta, en pantalla o en voz]
VOZ EN OFF / TEXTO EN PANTALLA:
  - [línea 1]
  - [línea 2]
  - [línea 3]
INDICACIONES DE TOMA: [qué mostrar en cada momento]
CTA FINAL: [texto exacto]
CAPTION PARA PUBLICACIÓN: [texto del post con hashtags]
```

---

### 2. Carrusel (Instagram / Facebook)

**Número de slides:** 5–7
**Estructura obligatoria:**

| Slide | Contenido |
|---|---|
| **1 — Portada** | Hook visual + título llamativo. Debe hacer que la gente quiera deslizar. |
| **2** | Beneficio principal o dato clave |
| **3** | Segundo beneficio con contexto |
| **4** | Tercer beneficio o argumento de inversión |
| **5** | Objeción más probable + respuesta |
| **6 (opcional)** | Comparativa o dato de plusvalía |
| **Último slide** | CTA + número de WhatsApp + nombre del negocio |

**Output esperado del agente:**
```
SLIDE 1 — PORTADA:
  Título: [texto]
  Subtítulo: [texto]
  Indicación visual: [qué foto o diseño va aquí]

SLIDE 2:
  Titular: [texto]
  Descripción: [1–2 líneas]
  ...

SLIDE FINAL:
  CTA: [texto exacto]
  Número: [WhatsApp]
```

---

### 3. Flyer (Imagen estática)

**Uso:** Publicaciones en Facebook, Instagram Stories, grupos de WhatsApp

**Output esperado del agente:**
```
TÍTULO PRINCIPAL: [texto grande, máximo 6 palabras]
SUBTÍTULO: [datos clave: precio, ubicación, tamaño]
BULLETS (máx 3):
  - [beneficio 1]
  - [beneficio 2]
  - [beneficio 3]
CTA: [texto del botón o pie de imagen]
CONTACTO: [número de WhatsApp]
INSTRUCCIÓN DE DISEÑO: [fondo sugerido, colores, foto principal a usar]
```

---

### 4. Copy para Anuncio Pagado (Facebook / Instagram Ads)

**Output esperado del agente:**
```
TITULAR DEL ANUNCIO: [máximo 40 caracteres]
TEXTO PRINCIPAL: [2–3 oraciones, incluye precio y CTA]
DESCRIPCIÓN: [1 línea de apoyo]
CTA DEL BOTÓN: [Enviar mensaje / Más información / Contactar]
PÚBLICO SUGERIDO: [demografía, intereses, zona geográfica]
```

---

## Reglas de Producción de Contenido

1. **Assets primero:** Antes de crear contenido, verificar si hay fotos/videos en `link_carpeta_drive`. Si no hay, indicarlo en el output y generar el copy igual, marcando dónde irán las imágenes.
2. **Un ángulo por pieza:** Cada contenido tiene un solo objetivo (generar interés, agendar visita, posicionar como experto). No mezclar.
3. **Tono consistente:** Profesional, aspiracional, confiable. Sin hipérboles baratas. Sin "increíble oportunidad única".
4. **Siempre CTA:** Ninguna pieza termina sin una acción concreta que el usuario puede tomar.
5. **Adaptar al público objetivo:** Si la propiedad es para inversionistas, hablar de rentabilidad y plusvalía. Si es para familias, hablar de seguridad, espacio y comunidad.
6. **No repetir formatos:** Si ya se creó un Reel para una propiedad, el siguiente contenido debe ser Carrusel o Flyer, no otro Reel igual.

---

## Flujo de Producción de Contenido (por propiedad)

```
1. Agente_Operaciones valida la ficha (todos los campos críticos)
2. Agente_Analista_Propiedades analiza y define el ángulo de venta
3. Agente_Futura_RealEstate produce los formatos solicitados
4. Agente_Contenido revisa y adapta el tono si es necesario
5. Output listo: guión, carrusel, flyer o copy de anuncio
```

---

## Carpeta de Assets por Propiedad (Google Drive)

Estructura esperada:
```
Propiedades/
└── BR-001 — [Título]/
    ├── fotos/         → imágenes de la propiedad
    ├── videos/        → tomas para Reels
    └── documentos/    → escritura, planos, permisos
```

El agente debe referenciar el `link_carpeta_drive` de la ficha de la propiedad para saber dónde están los assets.
Si la carpeta está vacía o no existe, el agente produce el copy con indicaciones de qué fotos tomar.
