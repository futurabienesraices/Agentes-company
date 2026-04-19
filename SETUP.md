# SETUP — Futura Intelligence: Activación del Stack

> Seguir este orden exacto. Cada paso desbloquea el siguiente.

---

## PASO 1 — Airtable: Crear la base de propiedades

### 1.1 Crear la base

1. Ir a [airtable.com](https://airtable.com) → iniciar sesión
2. Clic en **+ Add a base** → **Start from scratch**
3. Nombre de la base: `Futura Bienes Raíces — Inventario`
4. Nombre de la tabla principal: `Propiedades`

---

### 1.2 Crear los campos (en este orden)

Eliminar los campos predeterminados que Airtable crea automáticamente y crear estos:

| # | Nombre del campo | Tipo en Airtable | Opciones / Notas |
|---|---|---|---|
| 1 | `id` | Single line text | Campo principal (renombrar "Name" a "id") |
| 2 | `titulo` | Single line text | — |
| 3 | `tipo_propiedad` | Single select | Opciones: `terreno`, `casa_residencial`, `local_comercial`, `alquiler`, `lote_lotificacion`, `bodega` |
| 4 | `operacion` | Single select | Opciones: `venta`, `alquiler`, `preventa` |
| 5 | `precio` | Number | Sin decimales (Integer) |
| 6 | `moneda` | Single select | Opciones: `USD`, `EUR` — Default: `USD` |
| 7 | `ubicacion` | Single line text | — |
| 8 | `zona` | Single line text | — |
| 9 | `descripcion` | Long text | — |
| 10 | `beneficios_clave` | Long text | Separar cada beneficio con punto y coma |
| 11 | `estado_comercial` | Single select | Opciones: `disponible`, `reservado`, `vendido`, `inactivo` |
| 12 | `prioridad_comercial` | Single select | Opciones: `alta`, `media`, `baja` |
| 13 | `publico_objetivo` | Single line text | Ej: `inversionistas`, `familias`, `emprendedores` |
| 14 | `objeciones_probables` | Long text | Separar con punto y coma |
| 15 | `link_carpeta_drive` | URL | Link a carpeta de Google Drive de esa propiedad |
| 16 | `links_fotos` | Long text | URLs individuales separadas por salto de línea |
| 17 | `cta_whatsapp` | URL | Formato: `https://wa.me/503XXXXXXXX?text=Hola,%20vi%20BR-001` |

---

### 1.3 Alternativa rápida: importar desde CSV

1. En Airtable → **+ Add a base** → **Import a spreadsheet**
2. Subir el archivo `templates/propiedades_template.csv`
3. Airtable detectará las columnas automáticamente
4. **Revisar y ajustar los tipos de campo** según la tabla anterior (Airtable no puede inferirlos todos)

---

### 1.4 Obtener credenciales de Airtable (para futura automatización)

Cuando se conecte n8n o Make:

1. Ir a [airtable.com/account](https://airtable.com/account) → **API** → **Generate API Token**
2. Guardar el token en un lugar seguro (NO subir al repositorio)
3. El **Base ID** aparece en la URL de la base: `https://airtable.com/appXXXXXXXX/...` → copiar `appXXXXXXXX`
4. El **Table ID** se obtiene desde la URL o desde la API de Airtable

---

## PASO 2 — Google Drive: Crear la estructura de carpetas

### 2.1 Carpeta raíz

1. Abrir Google Drive
2. Crear carpeta: `Futura Bienes Raíces`
3. Dentro, crear subcarpeta: `Propiedades`

### 2.2 Estructura por propiedad

Cada vez que se agrega una propiedad, crear una carpeta con este formato:

```
Propiedades/
└── BR-001 — [Título corto de la propiedad]/
    ├── fotos/
    ├── videos/
    └── documentos/
```

**Ejemplo real:**
```
Propiedades/
└── BR-001 — Terreno Jardines Santa Ana/
    ├── fotos/
    ├── videos/
    └── documentos/
```

### 2.3 Vincular con Airtable

Una vez creada la carpeta de la propiedad:
1. Clic derecho en la carpeta → **Compartir** → **Copiar enlace** (acceso "Cualquiera con el enlace puede ver")
2. Pegar ese URL en el campo `link_carpeta_drive` de la propiedad en Airtable

---

## PASO 3 — WhatsApp: Configurar el número de Futura Bienes Raíces

### 3.1 Definir el número

Asignar un número de WhatsApp específico para Futura Bienes Raíces (diferente al de Futura Cleaning: `+503 7317-2574`).

Una vez definido, actualizar estos archivos:
- `context/bienes_raices.md` → campo "WhatsApp"
- `cloud.md` → sección de datos operativos
- `memory.md` → datos de Futura Bienes Raíces

### 3.2 Formato del CTA de WhatsApp

Para cada propiedad, el link se construye así:

```
https://wa.me/503XXXXXXXX?text=Hola%2C%20me%20interesa%20la%20propiedad%20BR-001
```

Reemplazar:
- `503XXXXXXXX` → número sin guiones ni espacios (incluir código de país 503)
- `BR-001` → ID de la propiedad

---

## PASO 4 — Ingresar la primera propiedad

1. Llenar la ficha en `propiedades/BR-001.md` con los datos reales
2. Copiar esos datos al registro en Airtable
3. Crear la carpeta en Google Drive: `Propiedades/BR-001 — [Título]/`
4. Subir las fotos disponibles a Drive
5. Copiar el link de Drive al campo `link_carpeta_drive` en Airtable
6. Probar el flujo con el agente:

```
Actúa como Agente_Analista_Propiedades.
Lee los contextos en:
- context/base_propiedades.md
- context/bienes_raices.md
- context/audiencia.md

Aquí está la ficha de la propiedad:
[pegar contenido de propiedades/BR-001.md]
```

---

## PASO 5 — Verificar que el sistema funciona

Ejecutar el comando `sistema` con la primera propiedad como input:

```
Actúa como el sistema completo (sistema.md).
Input: "Tenemos una nueva propiedad lista. [Título y datos principales]"
```

El sistema debe responder con las 5 fases y producir al menos:
- Un análisis de la propiedad
- Un borrador de contenido para redes sociales
- Un guión de WhatsApp para el agente de ventas

---

## Estado del Setup

| Paso | Descripción | Estado |
|---|---|---|
| 1 | Crear base en Airtable | ⏳ Pendiente |
| 2 | Crear estructura en Google Drive | ⏳ Pendiente |
| 3 | Definir WhatsApp de Futura Bienes Raíces | ⏳ Pendiente |
| 4 | Ingresar primera propiedad real | ⏳ Pendiente |
| 5 | Probar flujo completo de agentes | ⏳ Pendiente |

Actualizar este archivo marcando ✅ conforme se completa cada paso.
