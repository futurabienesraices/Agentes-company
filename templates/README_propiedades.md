# 📋 GUÍA — PLANTILLA DE PROPIEDADES
> **Archivo base:** `propiedades_template.csv` | **Actualizado:** 2026-04-14

---

## Para qué sirve

`propiedades_template.csv` es el formato estándar para registrar propiedades en el sistema.
Puedes llenarlo en Excel, Google Sheets o cualquier editor de texto, y luego importarlo a Airtable o usarlo directamente con los agentes.

---

## Cómo llenar cada campo

| Campo | Formato | Ejemplo | Obligatorio |
|---|---|---|---|
| `id` | `BR-###` | `BR-001` | Sí |
| `titulo` | Texto corto descriptivo | `Terreno esquinero Col. Jardines` | Sí |
| `tipo_propiedad` | `terreno` / `casa_residencial` / `local_comercial` / `alquiler` / `lote_lotificacion` / `bodega` | `terreno` | Sí |
| `operacion` | `venta` / `alquiler` / `preventa` | `venta` | Sí |
| `precio` | Número sin comas, sin símbolo | `45000` | Sí |
| `moneda` | `USD` / `EUR` | `USD` | Sí (default: USD) |
| `ubicacion` | Dirección o referencia clara | `Col. Jardines, Santa Ana, El Salvador` | Sí |
| `zona` | Zona o sector | `Santa Ana Centro` | Recomendado |
| `descripcion` | Descripción factual en texto libre | `Terreno de 500 varas, zona residencial...` | Recomendado |
| `beneficios_clave` | Lista separada por punto y coma | `Escriturado;Sin deudas;Servicios completos` | Recomendado |
| `estado_comercial` | `disponible` / `reservado` / `vendido` / `inactivo` | `disponible` | Sí |
| `prioridad_comercial` | `alta` / `media` / `baja` | `alta` | Sí |
| `publico_objetivo` | `inversionistas` / `familias` / `emprendedores` / texto libre | `inversionistas` | Recomendado |
| `objeciones_probables` | Texto libre, separado por punto y coma | `Precio alto;Sin transporte público cercano` | Opcional |
| `link_carpeta_drive` | URL completa de Google Drive | `https://drive.google.com/drive/folders/XXXX` | Recomendado |
| `links_fotos` | URLs separadas por punto y coma | `https://drive.google.com/file/XXXX` | Opcional |
| `cta_whatsapp` | URL de WhatsApp preformateada | `https://wa.me/50373172574?text=Hola,%20BR-001` | Recomendado |

---

## Reglas importantes al llenar

1. **No dejar `precio` vacío** si la propiedad está activa — los agentes la marcarán como INCOMPLETA.
2. **No usar comas** dentro de los campos de texto (el CSV usa coma como separador). Usar punto y coma dentro de listas.
3. **`id` debe ser único** — nunca repetir el mismo código en dos propiedades.
4. **`estado_comercial`** define si la propiedad aparece en contenido público. Solo `disponible` y `reservado` generan contenido.
5. **`link_carpeta_drive`** debe apuntar a la carpeta de esa propiedad específica, no a la raíz general de Drive.

---

## Cómo mapear a Airtable

1. Abrir Airtable → Crear nueva base: `Futura Bienes Raíces — Inventario`.
2. Crear los campos exactamente con los mismos nombres que las columnas del CSV.
3. Importar el CSV usando la función **Import de Airtable** (Home → + New Base → Import CSV).
4. Configurar tipos de campo:
   - `precio` → **Number** (sin decimales)
   - `tipo_propiedad`, `operacion`, `estado_comercial`, `prioridad_comercial`, `moneda` → **Single Select**
   - `link_carpeta_drive`, `cta_whatsapp` → **URL**
   - `links_fotos` → **Long text** o **URL**
   - Todos los demás → **Single line text** o **Long text** según extensión

---

## Cómo mapear a Notion

1. Crear una base de datos en Notion: `Inventario de Propiedades`.
2. Agregar propiedades como páginas individuales con las mismas columnas.
3. Usar `id` como título de cada página para mantener consistencia con Airtable.

> **Nota:** Si usas tanto Airtable como Notion, Airtable es la fuente de verdad. Notion es solo referencia de consulta.

---

## Cómo usar con los agentes

Una vez llenada la ficha (en el CSV, en Airtable o en cualquier formato), pegarla directamente en el prompt del agente:

```
Actúa como Agente_Analista_Propiedades.
Aquí está la ficha de la propiedad:

id: BR-001
titulo: Terreno esquinero Col. Jardines
tipo_propiedad: terreno
...
```

El agente procesará los datos y producirá el análisis usando la skill `analizar_propiedad_desde_datos`.
