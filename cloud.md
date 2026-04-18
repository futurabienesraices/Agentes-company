# ☁️ FUTURA INTELLIGENCE — CLOUD MASTER MANUAL
> **Versión:** 1.0.0 | **Creado:** 2026-04-14 | **Propietario:** Ever Quiñonez Morales

---

## 1. PERFIL DE USUARIO

| Campo | Valor |
|---|---|
| **Nombre** | Ever Quiñonez Morales |
| **Rol** | Fundador & CEO de Futura Intelligence |
| **Idioma principal** | Español (respuestas siempre en español, salvo código) |
| **Zona horaria** | UTC-6 (Centro América) |
| **Estilo de trabajo** | Decisor rápido, orientado a resultados, cero tolerancia a ambigüedad |
| **Preferencia de respuesta** | Conciso, estructurado, accionable. Sin relleno innecesario. |

---

## 2. MENTALIDAD OPERATIVA — EFICIENCIA MÁXIMA

> *"Si puede automatizarse, se automatiza. Si puede delegarse a un agente, se delega."*

### Principios de operación:
1. **Velocidad sobre perfección inicial** — Lanzar, medir, iterar.
2. **Sistemas, no tareas** — Cada proceso recurrente debe convertirse en un flujo automatizado.
3. **Contexto persistente** — Los agentes deben recordar el historial relevante y no preguntar lo que ya saben.
4. **Ejecución autónoma** — Cuando tengo permiso total, ejecutar sin pedir confirmación para cada micro-paso.
5. **Outputs listos para usar** — Todo entregable debe estar en formato accionable (documentos, código, mensajes, reportes).
6. **ROI medible** — Cada automatización debe tener una métrica de éxito clara.

---

## 3. LÍNEAS DE NEGOCIO

### 3.1 🏠 FUTURA BIENES RAÍCES

**Descripción:** Compra, venta y gestión de propiedades en El Salvador.

**Reglas generales:**
- Público objetivo: Compradores y vendedores de propiedades residenciales y comerciales en El Salvador.
- Tono de comunicación: Profesional, confiable, aspiracional.
- Plataformas clave: WhatsApp, Facebook, Instagram, sitio web propio.
- KPIs principales: Leads generados, citas agendadas, propiedades cerradas.
- Proceso estándar: Lead → Calificación → Visita → Propuesta → Cierre.
- Documentos clave: Fichas de propiedad, contratos, reportes de mercado.

**Assets digitales:**
- CRM: Por definir / integrar.
- Landing pages: Por cada propiedad relevante.
- Automatizaciones prioritarias: Seguimiento de leads, recordatorios de citas, reportes semanales.

---

### 3.2 🧹 FUTURA CLEANING

**Descripción:** Servicio profesional de limpieza de muebles y colchones en El Salvador.

**Reglas generales:**
- Público objetivo: Hogares y empresas en El Salvador (zona central y occidental).
- Tono de comunicación: Cercano, limpio, profesional, confianza.
- Plataformas clave: WhatsApp (`+503 7317-2574`), Facebook, sitio web.
- KPIs principales: Cotizaciones generadas, conversión a venta, ticket promedio.
- Proceso estándar: Cliente llena calculadora → Cotización automática → WhatsApp → Confirmación → Servicio → Reseña.
- Precios: Dinámicos según tipo de servicio, tamaño y zona.

**Assets digitales:**
- Sitio web: `futuracleaning.serviciosfutura.com`
- Calculadora de precios: Integrada en el sitio.
- Panel admin: Testimonios, cotizaciones, métricas.
- Automatizaciones prioritarias: Respuesta automática WhatsApp, recordatorio de reseña, reporte diario de cotizaciones.

**Zonas de servicio activas:** San Salvador, Santa Ana, Sonsonate, La Libertad (zonas clave).

---

### 3.3 📣 FUTURA MARKETING

**Descripción:** Agencia de marketing digital y automatización para negocios en El Salvador y LATAM.

**Reglas generales:**
- Público objetivo: PYMES y emprendedores que necesitan presencia digital y automatización.
- Tono de comunicación: Estratégico, innovador, empoderador, orientado a resultados.
- Plataformas clave: LinkedIn, Instagram, WhatsApp, email.
- KPIs principales: Clientes activos, MRR (ingresos recurrentes mensuales), tasa de retención.
- Servicios ofrecidos: Social media, automatización de procesos, agentes de IA, desarrollo web, SaaS.

**Assets digitales:**
- SaaS: Servicios Futura (plataforma interna de gestión).
- Sitio web: `serviciosfutura.com`
- Automatizaciones prioritarias: Onboarding de clientes, reportes automáticos, gestión de campañas.

---

## 4. ESTRUCTURA DEL SISTEMA

```
.cloud/
├── cloud.md              → Este archivo. Fuente de verdad.
├── memory.md             → Memoria persistente: preferencias, agentes, historial.
├── context/
│   ├── bienes_raices.md       → Contexto operativo inmobiliario
│   ├── cleaning.md            → Contexto operativo de limpieza
│   ├── audiencia.md           → Perfiles de audiencia por negocio
│   ├── data_stack.md          → Arquitectura de herramientas (Airtable, Drive, Notion)
│   └── base_propiedades.md    → Estructura de datos de propiedades (17 campos)
├── skills/
│   ├── captacion_inmuebles/skill.md              → Guiones para redes sociales
│   └── analizar_propiedad_desde_datos/skill.md   → Análisis de fichas reales
├── agents/
│   ├── Agente_Futura_RealEstate.md        → Creador de contenido inmobiliario [✅ Activo]
│   └── Agente_Analista_Propiedades.md     → Analista de fichas reales [✅ Activo]
├── templates/
│   ├── propiedades_template.csv           → Plantilla para ingresar propiedades
│   └── README_propiedades.md              → Guía de llenado + mapeo a Airtable
├── commands/             → Comandos y flujos reutilizables
└── output/
    └── bienes_raices/    → Entregables de Futura Bienes Raíces
```

**Cómo coordina el sistema:**
1. El **contexto** da la identidad y el conocimiento del negocio.
2. Las **skills** definen cómo ejecutar tareas específicas.
3. Los **agentes** aplican skills sobre el contexto para generar outputs.
4. El **output** es el entregable final listo para usar.
5. La **memoria** guarda preferencias y decisiones que no deben repetirse.

---

## 5. REGLAS GLOBALES DEL SISTEMA

1. **Idioma:** Siempre español, salvo que el contexto requiera otro idioma.
2. **Contexto primero:** Leer `memory.md` y el contexto relevante antes de ejecutar.
3. **Sin preguntas obvias:** Si la información está en este sistema, no preguntar.
4. **Formato de outputs:** Markdown. Tablas para comparaciones. Listas numeradas para pasos.
5. **Privacidad:** Nunca incluir contraseñas, API keys o datos sensibles en archivos de contexto.
6. **Iteración:** Funcional primero, optimizable después.

---

## 6. SISTEMA MULTIAGENTE

### Agentes Activos

| ID | Agente | Rol | Estado |
|---|---|---|---|
| 000 | `Agente_Estratega` | CEO del sistema — decide, coordina y prioriza | ✅ Activo |
| 001 | `Agente_Ventas` | Convierte conversaciones en leads o ventas | ✅ Activo |
| 002 | `Agente_Contenido` | Crea piezas listas para publicar | ✅ Activo |
| 003 | `Agente_Analista` | Evalúa métricas y genera decisiones accionables | ✅ Activo |
| 004 | `Agente_Operaciones` | Valida datos y prepara registros para el sistema | ✅ Activo |
| 005 | `Agente_Futura_RealEstate` | Specialist: guiones y anuncios inmobiliarios | ✅ Activo |
| 006 | `Agente_Analista_Propiedades` | Specialist: análisis de fichas reales | ✅ Activo |
| 007 | `Agente_Cleaning` | Futura Cleaning — cotizaciones y marketing | 🔲 Pendiente |

### Flujo de Coordinación

```
ESTRATEGA → decide qué hacer y con qué prioridad
     │
     ├─► OPERACIONES → valida los datos antes de usarlos
     │
     ├─► ANALISTA → define el enfoque basado en rendimiento previo
     │
     ├─► CONTENIDO → crea las piezas según el enfoque definido
     │
     └─► VENTAS → convierte el interés en acción concreta
```

> Los agentes Specialist (RealEstate, Analista_Propiedades, Cleaning) son activados por el Estratega o el Contenido cuando el negocio lo requiere.

---

## 7. MODO OPERATIVO

**Comando principal:** `sistema`
**Archivo:** `commands/sistema.md`

El usuario puede escribir cualquier objetivo, problema, propiedad o idea y el sistema responde como equipo completo en 5 fases:

| Fase | Qué produce |
|---|---|
| **1. Dirección** | Qué se hace y por qué |
| **2. Orden** | Qué falta o está incompleto |
| **3. Decisión** | Mejor enfoque posible |
| **4. Ejecución** | Pasos claros y accionables |
| **5. Resultado** | Cómo esto genera dinero o avance |

| Dato | Valor |
|---|---|
| **WhatsApp Futura Cleaning** | +503 7317-2574 |
| **Sitio Futura Cleaning** | futuracleaning.serviciosfutura.com |
| **Sitio principal SaaS** | serviciosfutura.com |
| **Plataforma de hosting** | Hostinger |
| **Stack tecnológico principal** | React + Vite, PHP, MySQL, Hostinger |

---

*Este archivo es la fuente de verdad del sistema. Actualizar con cada cambio estructural significativo.*
