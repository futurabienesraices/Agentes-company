# Futura Intelligence — Sistema Multiagente

Sistema de agentes de IA para automatizar marketing, ventas y operaciones de tres líneas de negocio en El Salvador.

---

## Líneas de Negocio

| Negocio | Descripción |
|---|---|
| 🏠 **Futura Bienes Raíces** | Compra, venta y gestión de propiedades |
| 🧹 **Futura Cleaning** | Limpieza profesional de muebles y colchones |
| 📣 **Futura Marketing** | Agencia de marketing digital y automatización |

---

## Estructura del Sistema

```
Agentes-company/
├── cloud.md                    → Configuración maestra y fuente de verdad
├── memory.md                   → Memoria persistente del sistema
├── agents/                     → Definiciones de cada agente
├── context/                    → Contexto operativo por negocio
├── skills/                     → Procedimientos especializados
├── commands/                   → Comandos reutilizables (ej: sistema)
├── templates/                  → Plantillas de datos (CSV, guías)
└── output/                     → Entregables generados (no versionar)
```

---

## Agentes Disponibles

| ID | Agente | Rol | Estado |
|---|---|---|---|
| 000 | `Agente_Estratega` | CEO — coordina y prioriza | ✅ Activo |
| 001 | `Agente_Ventas` | Convierte leads en ventas | ✅ Activo |
| 002 | `Agente_Contenido` | Crea piezas listas para publicar | ✅ Activo |
| 003 | `Agente_Analista` | Evalúa métricas y decide | ✅ Activo |
| 004 | `Agente_Operaciones` | Valida datos y mantiene consistencia | ✅ Activo |
| 005 | `Agente_Futura_RealEstate` | Guiones y anuncios inmobiliarios | ✅ Activo |
| 006 | `Agente_Analista_Propiedades` | Análisis de fichas de propiedades | ✅ Activo |
| 007 | `Agente_Cleaning` | Cotizaciones y marketing de limpieza | 🔲 Pendiente |

---

## Cómo Usar el Sistema

### Modo rápido — comando `sistema`

Escribe cualquier objetivo, propiedad o problema. El sistema responde como equipo completo:

```
Input: "Tengo un terreno en Santa Ana, 400 varas, $22,000. Escriturado."
```

El sistema ejecuta 5 fases: Dirección → Orden → Decisión → Ejecución → Resultado.

Ver: [`commands/sistema.md`](commands/sistema.md)

---

### Activar un agente directamente

Cada agente tiene su propio **Prompt de Activación** en su archivo. Ejemplo:

```
Actúa como Agente_Estratega.
Lee memory.md y el contexto relevante del negocio.

OBJETIVO: Crear contenido para una nueva propiedad en Santa Ana
NEGOCIO: bienes_raices
URGENCIA: alta
```

---

## Flujo de Coordinación

```
ESTRATEGA → decide prioridad
    │
    ├─► OPERACIONES → valida los datos
    ├─► ANALISTA    → define el enfoque
    ├─► CONTENIDO   → crea las piezas
    └─► VENTAS      → convierte en acción
```

Los Specialists (`RealEstate`, `Analista_Propiedades`, `Cleaning`) son activados por el Estratega o Contenido según el tipo de tarea.

---

## Archivos Clave

| Archivo | Qué contiene |
|---|---|
| [`cloud.md`](cloud.md) | Configuración global, reglas y perfil del CEO |
| [`memory.md`](memory.md) | Memoria persistente: decisiones, datos por negocio, pendientes |
| [`context/base_propiedades.md`](context/base_propiedades.md) | Estructura de 17 campos para propiedades |
| [`context/data_stack.md`](context/data_stack.md) | Arquitectura: Airtable + Drive + Notion + GitHub |
| [`templates/propiedades_template.csv`](templates/propiedades_template.csv) | Plantilla para ingresar propiedades al sistema |

---

## Próximos Pasos

- [ ] Configurar base en Airtable (`context/data_stack.md` tiene el detalle)
- [ ] Ingresar primera propiedad real y probar el flujo completo
- [ ] Definir número de WhatsApp de Futura Bienes Raíces
- [ ] Crear `Agente_Cleaning`

---

*Propietario: Ever Quiñonez Morales — Futura Intelligence*
