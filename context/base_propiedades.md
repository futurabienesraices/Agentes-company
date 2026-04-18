# 🏘️ ESTRUCTURA DE DATOS — PROPIEDADES
> **Actualizado:** 2026-04-14 | **Fuente de verdad:** Airtable

---

## Regla de uso para agentes

Antes de generar cualquier contenido sobre una propiedad, el agente debe leer su ficha completa.
Si faltan campos críticos (`precio`, `ubicacion`, `tipo_propiedad`), marcar la propiedad como **INCOMPLETA** y no generar contenido hasta resolver.

---

## Campos de una propiedad

### `id`
- **Tipo:** Texto / código único
- **Formato sugerido:** `BR-001`, `BR-002`, etc.
- **Uso:** Referencia interna para cruzar con Drive, Notion y contenido generado.

---

### `titulo`
- **Tipo:** Texto corto
- **Ejemplo:** "Terreno esquinero en Col. Jardines, Santa Ana"
- **Uso:** Título comercial de la propiedad. Debe ser descriptivo y atractivo.

---

### `tipo_propiedad`
- **Tipo:** Selección
- **Opciones válidas:** `terreno`, `casa_residencial`, `local_comercial`, `alquiler`, `lote_lotificacion`, `bodega`
- **Uso:** Define el ángulo emocional del contenido (ver skill `captacion_inmuebles`).

---

### `operacion`
- **Tipo:** Selección
- **Opciones válidas:** `venta`, `alquiler`, `preventa`
- **Uso:** Determina el tipo de CTA y urgencia del mensaje.

---

### `precio`
- **Tipo:** Número
- **Ejemplo:** `45000` (sin formato, sin comas)
- **Uso:** Siempre incluir en el contenido. Si no hay precio, la propiedad es INCOMPLETA.

---

### `moneda`
- **Tipo:** Selección
- **Opciones válidas:** `USD`, `EUR`
- **Default:** `USD`
- **Uso:** Se muestra junto al precio. En El Salvador = USD por defecto.

---

### `ubicacion`
- **Tipo:** Texto
- **Ejemplo:** "Colonia Jardines, Santa Ana, El Salvador"
- **Uso:** Campo crítico. Si está vacío, la propiedad es INCOMPLETA. Define el mercado objetivo.

---

### `zona`
- **Tipo:** Selección o texto corto
- **Ejemplo:** `Santa Ana Centro`, `Carretera a Metapán`, `Zona Rosa`
- **Uso:** Permite segmentar audiencia y adaptar el mensaje de plusvalía o ubicación.

---

### `descripcion`
- **Tipo:** Texto largo
- **Uso:** Descripción factual de la propiedad. El agente la procesa para extraer los puntos más relevantes. No debe ser el copy final — es la materia prima.

---

### `beneficios_clave`
- **Tipo:** Texto o lista
- **Ejemplo:** "Escriturado, zona residencial, cerca de escuelas, sin deudas"
- **Uso:** El agente los convierte en bullets de venta orientados a beneficio, no a característica.

---

### `estado_comercial`
- **Tipo:** Selección
- **Opciones válidas:** `disponible`, `reservado`, `vendido`, `inactivo`
- **Uso:** Solo generar contenido si el estado es `disponible`. Si es `reservado`, informar con urgencia. Si es `vendido` o `inactivo`, no publicar.

---

### `prioridad_comercial`
- **Tipo:** Selección
- **Opciones válidas:** `alta`, `media`, `baja`
- **Uso:** Determina frecuencia de publicación. Alta = publicar primero y con mayor frecuencia.

---

### `publico_objetivo`
- **Tipo:** Texto o selección
- **Ejemplo:** `inversionistas`, `familias`, `emprendedores`
- **Uso:** El agente ajusta el ángulo emocional y el gancho del contenido según este campo.

---

### `objeciones_probables`
- **Tipo:** Texto
- **Ejemplo:** "Precio alto para la zona, sin servicios municipales frente"
- **Uso:** El agente puede preparar respuestas preventivas o evitar mencionar puntos débiles directamente en contenido público.

---

### `link_carpeta_drive`
- **Tipo:** URL
- **Ejemplo:** `https://drive.google.com/drive/folders/XXXX`
- **Uso:** Carpeta raíz de fotos y videos de esa propiedad en Google Drive. Si está vacío, advertir que no hay material visual.

---

### `links_fotos`
- **Tipo:** Texto (URLs separadas por coma o salto de línea)
- **Uso:** Links directos a fotos individuales para referencia rápida. Puede estar vacío si existe `link_carpeta_drive`.

---

### `cta_whatsapp`
- **Tipo:** URL o número
- **Ejemplo:** `https://wa.me/50373172574?text=Hola,%20vi%20la%20propiedad%20BR-001`
- **Uso:** Link de WhatsApp preformateado para el CTA. Si está vacío, usar el número principal del negocio.

---

## Validaciones que debe hacer un agente

| Campo | ¿Crítico? | Acción si falta |
|---|---|---|
| `id` | No | Asignar temporal `BR-TEMP` |
| `titulo` | Sí | Advertir — no generar contenido |
| `tipo_propiedad` | Sí | Advertir — no generar contenido |
| `operacion` | Sí | Asumir `venta` si hay precio, sino advertir |
| `precio` | Sí | Marcar como INCOMPLETA |
| `ubicacion` | Sí | Marcar como INCOMPLETA |
| `estado_comercial` | Sí | No publicar si no es `disponible` o `reservado` |
| `link_carpeta_drive` | Recomendado | Advertir: "Sin material visual" |
| `cta_whatsapp` | Recomendado | Usar número principal del negocio |
