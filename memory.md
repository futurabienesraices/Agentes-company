# 🧠 FUTURA INTELLIGENCE — MEMORIA PERSISTENTE
> **Última actualización:** 2026-04-15 (v5) | **Mantenido por:** Sistema de Agentes

> ⚠️ Este archivo se actualiza automáticamente. No editar manualmente salvo para correcciones críticas.

---

## 1. PREFERENCIAS DE USUARIO

### Comunicación
- **Idioma:** Español siempre (código en inglés es aceptable).
- **Tono:** Directo al grano. Sin introducciones largas. Sin frases de relleno como "¡Claro que sí!" o "Excelente pregunta."
- **Formato preferido:** Markdown estructurado con encabezados claros, tablas y listas numeradas.
- **Longitud de respuesta:** Concisa pero completa. Si hay mucho contenido, dividir en secciones.

### Ejecución
- **Permiso de auto-ejecución:** Granted para creación de archivos, carpetas y automatizaciones estándar.
- **Confirmación requerida:** Solo para acciones destructivas (eliminar, sobreescribir producción, gastos económicos).
- **Preferencia de entrega:** Funcional primero, optimizable después.

### Diseño y código
- **Stack preferido:** React + Vite (frontend), PHP + MySQL (backend legacy), Hostinger (hosting).
- **Estética:** Premium, dark mode preferido, inspiración Apple/minimalista.
- **CSS:** Vanilla CSS o módulos CSS. Tailwind solo si se solicita explícitamente.
- **Versiones de build:** Formato `NOMBRE_V{X}_{Y}_STABLE`.

---

## 2. DATOS PERSISTENTES POR NEGOCIO

### 🏠 Futura Bienes Raíces
| Dato | Valor |
|---|---|
| Estado actual | **Activo — Fase de contenido y captación de leads** |
| Zona principal | Santa Ana, El Salvador |
| Fuente de datos | **Airtable** — fuente de verdad operativa para propiedades |
| Repositorio visual | **Google Drive** — carpetas por propiedad (`Propiedades/[ID]-[Titulo]/`) |
| Documentación | **Notion** — SOPs, estrategia y contexto cualitativo |
| CRM | Airtable (pendiente de configurar con base `Inventario de Propiedades`) |
| Prioridad actual | **Alta — Generación de contenido diario** |
| WhatsApp | +503 6027-2418 |
| Primer agente | `Agente_Futura_RealEstate` (activo desde 2026-04-14) |
| Segundo agente | `Agente_Analista_Propiedades` (activo desde 2026-04-14) |
| Skills activas | `captacion_inmuebles`, `analizar_propiedad_desde_datos` |
| Objetivo inmediato | Ingresar primera propiedad real en Airtable y generar primer análisis |

**Reglas de datos — nunca olvidar:**
- No inventar datos faltantes de propiedades
- Si una propiedad no tiene precio, ubicación o tipo, marcarla como INCOMPLETA
- Si no tiene fotos, advertirlo — no bloquear pero sí reportar
- `estado_comercial` = `vendido` o `inactivo` → no generar contenido

### 🧹 Futura Cleaning
| Dato | Valor |
|---|---|
| WhatsApp | +503 7317-2574 |
| Sitio web | futuracleaning.serviciosfutura.com |
| Hosting | Hostinger → `public_html/` |
| Versión actual del sitio | FUTURA_ZONE_V9_3_STABLE |
| Admin panel | `/admin/` con `password_verify` → `admin_users` |
| Tabla de admin | `admin_users` |
| Tabla de cotizaciones | `cotizaciones` (con numeración automática) |
| Tabla de testimonios | `testimonios` |
| WhatsApp Futura Bienes Raíces | +503 6027-2418 |
| Zonas activas | San Salvador, Santa Ana, Sonsonate, La Libertad |
| Opción activa | Colchones doble cara (con recargo automático) |

### 📣 Futura Marketing / Servicios Futura
| Dato | Valor |
|---|---|
| SaaS | serviciosfutura.com |
| Hosting | Hostinger |
| Stack | React 18 + Vite + PHP + MySQL |
| Planes actuales | ESENCIAL (gratis), TRIAL, TRIAL_EXPIRED, PRO |
| Plan ESENCIAL | No mostrar paywall, no bloquear Financial Center |
| Stripe | Integrado para pagos PRO |
| Build de referencia | `dist/` → `public_html/` en Hostinger |

---

## 3. HISTORIAL DE DECISIONES IMPORTANTES

| Fecha | Decisión |
|---|---|
| 2026-04-14 | Arquitectura de datos definida: Airtable + Drive + Notion + GitHub + n8n/Make |
| 2026-04-14 | Creación del sistema `.cloud` de agentes autónomos |
| 2026-03-25 | Preparación y verificación de build para deploy en Hostinger |
| 2026-03-24 | Deploy final de Servicios Futura SaaS con captcha y UI fixes |
| 2026-03-10 | Build de Servicios Futura con `--legacy-peer-deps` |
| 2026-03-09 | Limpieza y consolidación del build final de Futura Cleaning |
| 2026-03-06 | Implementación del dashboard admin con métricas y gráficos |
| 2026-02-24 | Optimización premium del sitio Futura Cleaning (Apple aesthetic) |
| 2026-02-20 | Fix de página en blanco en producción (sugar.serviciosfutura.com) |
| 2026-02-18 | Rediseño calculadora en formato accordion premium |
| 2026-02-17 | Auditoría forense del deploy de futuracleaning.serviciosfutura.com |

---

## 4. SISTEMA MULTIAGENTE

**Estado:** ✅ Base activa | **Enfoque:** Automatización de marketing y ventas inmobiliarias

| ID | Agente | Rol | Estado |
|---|---|---|---|
| 000 | `Agente_Estratega` | CEO — decide, coordina y prioriza | ✅ Activo |
| 001 | `Agente_Ventas` | Convierte conversaciones en leads o ventas | ✅ Activo |
| 002 | `Agente_Contenido` | Crea piezas listas para publicar | ✅ Activo |
| 003 | `Agente_Analista` | Evalúa métricas y genera decisiones accionables | ✅ Activo |
| 004 | `Agente_Operaciones` | Valida datos y mantiene consistencia del sistema | ✅ Activo |
| 005 | `Agente_Futura_RealEstate` | Specialist: guiones y anuncios inmobiliarios | ✅ Activo |
| 006 | `Agente_Analista_Propiedades` | Specialist: análisis de fichas reales | ✅ Activo |
| 007 | `Agente_Cleaning` | Futura Cleaning — cotizaciones y marketing | 🔲 Pendiente |

> Flujo: `Estratega → Operaciones → Analista → Contenido → Ventas`
> Specialists son activados según el negocio o tipo de tarea.

**Modo operativo:** Sistema activado con comando `sistema`. El usuario puede entregar cualquier input (propiedad, idea, problema, "¿qué hago hoy?") y el sistema responde como equipo completo en 5 fases.

**Uso principal:** Dirección diaria, creación de sistemas, generación de contenido y negocios digitales.

**Prioridad de ejecución:** Acción real sobre teoría. Sin outputs genéricos. Sin múltiples prioridades simultáneas.

---

## 5. NOTAS RÁPIDAS (SCRATCHPAD)

> Usar esta sección para ideas, pendientes y recordatorios temporales.

**Prioridad actual:** Sistema multiagente base activo. Próximo paso: ingresar primera propiedad real.

- [x] Crear sistema `.cloud` base *(2026-04-14)*
- [x] Crear `Agente_Futura_RealEstate` + skill `captacion_inmuebles` *(2026-04-14)*
- [x] Crear contextos: `bienes_raices.md`, `cleaning.md`, `audiencia.md` *(2026-04-14)*
- [x] Definir arquitectura de datos: `data_stack.md` *(2026-04-14)*
- [x] Crear `base_propiedades.md` con estructura de 17 campos *(2026-04-14)*
- [x] Crear `Agente_Analista_Propiedades` + skill `analizar_propiedad_desde_datos` *(2026-04-14)*
- [x] Crear `templates/propiedades_template.csv` + `README_propiedades.md` *(2026-04-14)*
- [x] Crear sistema multiagente: `Agente_Ventas`, `Agente_Contenido`, `Agente_Analista`, `Agente_Operaciones` *(2026-04-14)*
- [x] Crear comando `sistema.md` y activar modo operativo *(2026-04-15)*
- [ ] **SIGUIENTE:** Configurar base en Airtable con los campos de `base_propiedades.md`
- [ ] **SIGUIENTE:** Ingresar primera propiedad real y ejecutar flujo completo de agentes
- [x] Definir número de WhatsApp de Futura Bienes Raíces (+503 6027-2418) *(2026-04-19)*
- [ ] Crear `Agente_Cleaning` para cotizaciones automáticas
- [x] Crear `Agente_Estratega.md` *(2026-04-19)*
- [ ] Integrar seguimiento automático de leads por WhatsApp (n8n / Make)

---

*Actualizar este archivo después de cada sesión con cambios relevantes.*
