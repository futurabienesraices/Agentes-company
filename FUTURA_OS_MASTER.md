# FUTURA OS — Memoria Maestra del Proyecto

> **Fuente de verdad técnica.** Consultar este documento antes de planificar o modificar el sistema. Actualizarlo en todo cambio relevante: funcionalidad, arquitectura, integración, agente, decisión, limitación, fase, backlog o despliegue.
>
> **Regla de veracidad:** `IMPLEMENTADO` exige evidencia en código y, cuando aplique, verificación de despliegue. `PARCIAL` significa que existe una parte comprobada. `PLANIFICADO` no existe todavía.

## 1. Visión

Futura OS es el sistema operativo empresarial de Futura Bienes Raíces, diseñado para evolucionar a múltiples negocios. Su interfaz principal es **Futura IA**: una capa de decisión y ejecución asistida que prioriza datos internos, herramientas conectadas, investigación externa y, por último, razonamiento del modelo.

Principio de producto: **menos interfaz, más inteligencia y automatización**. La primera vertical es inmobiliaria; el núcleo no debe acoplarse permanentemente a ella.

## 2. Estado actual

- **Fase:** 0 — consolidación de memoria y diagnóstico técnico; dashboard principal mobile-first unificado en una sola vista.
- **Repositorio fuente:** `futurabienesraices/Agentes-company`, rama `main`.
- **Última inspección:** 2026-08-13 (conectada a GitHub; no hubo checkout local disponible).
- **Último cambio local verificado:** 2026-08-13 — Inicio unificado: los módulos se despliegan bajo las pills, sin navegar a pantallas internas.
- **Estado de despliegue:** no verificado en esta revisión. El build local de producción pasó el 2026-08-13 sin credenciales externas.
- **Verificación visual local:** pendiente; el ejecutor actual no dispone de `agent-browser`.
- **Estado de datos reales/Airtable:** el código los consulta y escribe; la conectividad real no se verificó en esta revisión.
- **Estado de autenticación:** no se encontró implementación de autenticación en los archivos inspeccionados. Debe tratarse como pendiente de confirmar/corregir antes de exponer operaciones internas.

## 3. Implementado (comprobado en código)

### Aplicación y experiencia

- Aplicación única con **Next.js 15.5.20, React 19.1, TypeScript 5.8**.
- Inicio `/` como superficie operativa única con Futura IA, conversación continua, contador de consumo y pills activas. Propiedades, CRM, gráficos, agentes, Growth, contenido y captación se muestran en el mismo flujo, sin abrir rutas internas.
- Rutas existentes: `/`, `/ventas`, `/seguimiento`, `/growth`, `/control`, `/contenido`, `/director`, `/vende`. Se conservan como pantallas heredadas; Inicio no las utiliza para operar.
- Layout con metadatos PWA, manifest generado en `app/manifest.ts`, safe-area y componente `MobileShell` para comportamiento móvil/instalación.
- Vista de análisis con datos y gráficos de barras/líneas mediante `VisualDataView`.
- Diseño actual predominantemente claro, con navegación móvil y desktop. No se ha hecho una revisión visual de producción en esta sesión.

### Datos y operación

- Airtable es la fuente operativa actual para propiedades, leads, demandas, seguimientos, tareas, coincidencias y backlog Growth.
- `lib/dashboard.ts`, `lib/operations.ts`, `lib/sales.ts` y `lib/growth.ts` consultan Airtable directamente desde servidor.
- El dashboard obtiene métricas, prioridades e insights a partir de Airtable.
- El formulario de captación `OwnerCaptureForm` se carga dentro de Inicio bajo la pill **Captar**; `/vende` conserva la pantalla heredada.
- `POST /api/owners` crea registros de persona, propiedad, lead y seguimiento en Airtable; valida campos básicos, consentimiento, origen y limita solicitudes en memoria.
- Existe panel de jornada comercial (`/ventas`) basado en `lib/sales.ts`.
- Existe pantalla de seguimiento (`/seguimiento`) basada en `lib/operations.ts`.

### IA, agentes y contenido

- `POST /api/director` usa **Gemini** cuando `GEMINI_API_KEY` está configurada; recibe contexto de datos y usa `lib/growth.ts`.
- La barra de Inicio (`HomeCommandBar`) conversa con `/api/director`, consulta consumo mensual y muestra tokens gastados/saldo contra un presupuesto configurado.
- Catálogo directo de propiedades con vistas Catálogo, Lista y Pendientes; una ficha lateral muestra fotos, datos, enlaces y campos pendientes.
- Pipeline CRM basado en el nuevo campo Airtable `Etapa CRM`, con compatibilidad temporal para estados históricos.
- El backlog de **Growth AI** (`GrowthBacklog`) y el módulo de contenido (`ContentFactory`) se muestran bajo sus pills de Inicio mediante carga diferida; reutilizan sus API y datos existentes.
- Existen `/api/growth`, `/api/content/status` y `/api/content/plan` para esos módulos.
- El plan de contenido puede usar OpenAI si está configurado; el panel identifica preparación de OpenAI Images, ElevenLabs y Adobe Firefly por variables de entorno.
- El paquete declara `twilio`, pero su uso real no se verificó en los archivos inspeccionados.

## 4. Parcial / pendiente de verificación

| Área | Estado comprobado | Falta |
|---|---|---|
| PWA | Manifest y shell móvil presentes | Service worker/offline, pruebas de instalación iOS/Android y cámara/micrófono no verificados |
| Futura IA | Endpoint Gemini y barra de consulta presentes | Herramientas tipadas, ejecución segura, memoria persistente, trazabilidad y respuestas basadas en datos verificables |
| Growth AI | Backlog y API presentes | Ciclo automático completo: ROI medido, experimentos, resultados y aprendizaje |
| CRM | Pipeline de visualización y campo `Etapa CRM` en Airtable | Cambio de etapas, scoring explicable, alertas y priorización diaria verificable |
| Captación | Formulario web integrado en Inicio que crea registros relacionados | Captura interna móvil, fotos/videos/documentos, dictado, geolocalización, revisión y publicación |
| Contenido | Planeación y estados de proveedores | Producción/archivo/distribución/medición real y aprobación humana |
| Gráficos | Componente de barras/líneas | Series temporales confiables, filtros y métricas económicas reales |
| Ventas | Cockpit y jornada comercial en código | Integraciones de publicación, mensajería, seguimiento automatizado y métricas de resultado |
| Despliegue | Next.js preparado para Vercel según el contexto del proyecto | URL, variables de entorno, build y flujo CI/CD no verificados |
| Seguridad | Variables de entorno, validación básica y control de origen en `/api/owners` | Autenticación, autorización, auditoría durable, rate limit distribuido, gestión de secretos y permisos |

## 5. Arquitectura real actual

```
Next.js App Router (una aplicación)
├── app/                 UI, páginas y API routes
├── app/components/      componentes cliente
├── app/api/             director, growth, owners, contenido
└── lib/                 dashboard, sales, operations, growth
        │
        ├── Airtable REST API (datos operativos)
        ├── Gemini API (Director / Futura IA)
        └── OpenAI opcional (plan de contenido)
```

Observaciones comprobadas:

- No existe un monorepo `apps/` + `packages/` en el código inspeccionado.
- No se encontró una base SQL ni ORM.
- Hay IDs de base/tablas Airtable como fallback en código. Los tokens permanecen en variables de entorno, pero los IDs y mapeos están duplicados entre módulos.
- Airtable contiene la tabla `Consumo IA`. Cada respuesta Gemini registra sus tokens y el Inicio muestra el gasto mensual y saldo contra `FUTURA_AI_TOKEN_BUDGET`. Gemini no expone el saldo real de cuota del proyecto; el saldo mostrado es el presupuesto propio configurado.
- No se encontró cola de trabajos, scheduler durable ni capa MCP.
- No se encontraron scripts de test, lint o CI en `package.json` inspeccionado.

## 6. Arquitectura objetivo aprobada (sin reconstrucción inmediata)

### Decisión

**Mantener la aplicación Next.js actual y evolucionarla por módulos.** No crear una app móvil separada todavía: la experiencia mobile-first debe salir primero como PWA desde el mismo frontend y backend. Una app nativa solo se justifica cuando se requieran capacidades que la PWA no resuelva bien (notificaciones nativas confiables, tareas en segundo plano, cámara avanzada o distribución en tiendas).

### Objetivo progresivo

```
apps/
  os-web/                 Next.js: web administrativo + PWA mobile-first
  os-mobile/              Expo/React Native FUTURO; consume la misma API
packages/
  domain/                 entidades y reglas: negocio, propiedades, CRM, contenido
  application/            casos de uso y contratos de servicios
  agents/                 Director y especialistas, prompts y políticas
  ai/                     AIProvider, herramientas, fallback, telemetría
  integrations/           Airtable, Drive, storage, mensajería, MCP
  database/               repositorios; Airtable hoy, SQL mañana
  ui/                     componentes y tokens compartidos
  types/                  DTOs, eventos y contratos
  config/                 configuración no secreta validada
```

Esta estructura es destino de refactorización gradual, no requisito previo para cada mejora. Al extraer código, hacerlo por caso de uso terminado y con pruebas.

### Capas y contratos

1. **UI:** presenta datos y envía comandos; no contiene claves ni reglas de negocio.
2. **Application:** casos de uso: captar propiedad, priorizar seguimientos, crear campaña, registrar acción.
3. **Domain:** reglas reutilizables, estados, validaciones y eventos.
4. **Integrations:** adaptadores intercambiables. Airtable es el adaptador inicial; no debe filtrarse por toda la app.
5. **AI:** interfaz `AIProvider`; registro de ejecución y herramientas explícitas.
6. **Agentes:** orquestación por tareas; no agentes corriendo sin motivo.
7. **Storage:** metadatos en datos operativos; archivos pesados fuera de Airtable/SQL.

### Web y Mobile sin duplicar backend

- **Ahora:** una sola app Next.js con rutas mobile-first, PWA y API server-side.
- **Después:** `os-mobile` consume los mismos endpoints versionados (`/api/v1`) y contratos de `packages/types`.
- **Nunca:** duplicar lógica de captación, CRM, agentes o IA en la UI móvil y web.
- La navegación móvil queda: Inicio, Propiedades, Captar, CRM, IA. Las áreas extensas viven en módulos/hojas desplegables, no en una pantalla saturada.

## 7. Modelo de datos y archivos

### Estado actual

Airtable contiene entidades que el código ya referencia: propiedades, personas, leads, demandas, seguimientos, tareas, coincidencias, publicaciones, visitas, ofertas y oportunidades Growth.

### Decisión de evolución

- Mantener Airtable como base operativa inicial mientras reduce costo y acelera implementación.
- Crear un adaptador `PropertyRepository / CRMRepository` antes de migrar a SQL.
- Migrar a PostgreSQL/Supabase solo cuando volumen, consultas, permisos, auditoría o automatizaciones lo justifiquen.
- No guardar binarios de fotos, videos ni documentos pesados en la base. Guardar metadata, relaciones, estado y URL/versionado.
- Implementar `StorageProvider`: Google Drive inicial si se valida costo/flujo; luego R2, Supabase Storage o S3 sin modificar los casos de uso.

## 8. IA y agentes

### Proveedores

**Estado real:** Gemini opera en Director; OpenAI es opcional en contenido. Grok no está conectado.

**Contrato objetivo:**

```ts
interface AIProvider {
  generate(input: AIRequest): Promise<AIResult>;
}
```

Implementaciones previstas: `GeminiProvider` principal, `GrokProvider` fallback y `OpenAIProvider` opcional por calidad/costo/tarea. El fallback debe ser explícito por tipo de tarea y presupuesto; no una llamada automática ciega.

Cada ejecución debe registrar: proveedor, modelo, agente, tarea, tokens de entrada/salida, costo estimado, duración, resultado/estado y error.

### Agentes

| Agente | Estado |
|---|---|
| Director IA | PARCIAL: UI y endpoint Gemini comprobados |
| Growth AI | PARCIAL: backlog y API comprobados |
| Ventas AI | PARCIAL: cockpit de ventas, sin evidencia de autonomía real |
| Follow-up AI | PARCIAL: pantalla y datos de seguimiento |
| Contenido AI | PARCIAL: planificador de contenido |
| CRM AI | PLANIFICADO |
| Property AI | PLANIFICADO |
| Investigación AI | PLANIFICADO |
| Marketing AI | PLANIFICADO |
| Finance AI | PLANIFICADO |

Todo agente debe operar con: objetivo, datos permitidos, herramientas permitidas, presupuesto, salida estructurada, aprobación requerida y auditoría. Clasificar acciones como **automática**, **asistida** o **humana**.

## 9. Seguridad y costos

### Seguridad

- Claves exclusivamente en variables de entorno server-side; nunca en frontend o Git.
- Antes de funciones internas: autenticación y roles mínimos (`owner`, `operator`, `viewer` como punto inicial).
- Reemplazar rate limit en memoria por uno distribuido antes de tráfico real.
- Validar entrada, autorización y registro de acciones en cada endpoint de escritura.
- No publicar una propiedad sin validación humana de identidad, autorización, precio y documentación.
- Investigar/publicar solo donde API y términos lo permitan; de lo contrario crear tarea humana preparada.

### Costos

Presupuesto limitado: usar free tiers y registrar consumo antes de contratar. No se conocen consumos ni costos reales todavía porque falta telemetría. Airtable, Gemini y proveedores de contenido deben pasar por estimación de consumo/ROI antes de ampliar su uso.

## 10. Contradicciones y riesgos detectados

1. **Producto dual vs. código único:** se pidió Core/Web/Mobile, pero hoy existe una app Next.js única. La decisión es PWA compartida primero; no duplicar app móvil.
2. **Airtable como datos vs. núcleo desacoplado:** los módulos llaman Airtable directamente y duplican IDs/campos. Es deuda técnica prioritaria.
3. **Agencia de agentes vs. endpoints puntuales:** existen pantallas/endpoints de agentes, pero no una orquestación modular, memoria, colas ni trazabilidad completa.
4. **Gemini principal + fallback requerido:** Gemini está conectado; Grok no. OpenAI aparece solo en contenido. Falta la abstracción `AIProvider`.
5. **Captación móvil crítica vs. formulario público básico:** existe captación web, no un flujo interno de visita con cámara, voz, archivos y revisión.
6. **PWA declarada vs. validación móvil:** manifest y shell existen; instalación, offline y hardware no se verificaron.
7. **Seguridad de datos:** no se encontró auth en la inspección. Confirmar protección de despliegue antes de considerar el panel operativo seguro.
8. **Zona horaria:** el código usa `America/Guatemala` por defecto; la operación es El Salvador. Normalizar a `America/El_Salvador` en configuración validada.

## 11. Roadmap por fases

### Fase 0 — Memoria y verificación
- [x] Crear esta memoria maestra.
- [ ] Verificar build, URL de producción, variables y protección de acceso.
- [ ] Confirmar esquemas Airtable y datos reales sin exponer secretos.

### Fase 1 — Fundación operativa
- [ ] Centralizar acceso Airtable detrás de adaptadores/repositorios.
- [ ] Añadir autenticación, roles, auditoría y manejo consistente de errores.
- [ ] Crear tipos de dominio para Propiedad, Persona, Lead, Seguimiento, Tarea y Oportunidad.
- [ ] Crear telemetría de IA y panel de costos real.

### Fase 2 — Captar propiedad desde móvil
- [ ] Flujo interno autenticado mobile-first.
- [ ] Datos, dictado, ubicación, fotos/videos/documentos y checklist de faltantes.
- [ ] `StorageProvider` con Google Drive inicial validado.
- [ ] IA organiza ficha, detecta faltantes y deja borrador para aprobación.

### Fase 3 — CRM y jornada diaria
- [ ] Pipeline, scoring explicable, priorización y tareas.
- [ ] Home: “qué hacer hoy” exclusivamente con datos reales.
- [ ] Seguimiento asistido y medición de conversiones.

### Fase 4 — Agentes y automatización segura
- [ ] `AIProvider`, herramientas tipadas, presupuestos y fallback.
- [ ] Director coordina especialistas bajo aprobación/auditoría.
- [ ] Growth: backlog, experimentos, medición y mejora.
- [ ] Integraciones modulares/MCP y colas solo al necesitar tareas durables.

### Fase 5 — Multi-negocio y mobile nativo
- [ ] Separación de datos por negocio.
- [ ] Adaptadores de dominio por vertical.
- [ ] Evaluar PostgreSQL y app nativa según evidencia de uso.

## 12. Backlog priorizado

1. **Verificar y asegurar el sistema existente**: build/despliegue, auth, Airtable y variables.
2. **Implementar Captar Propiedad interno mobile-first v1** con datos reales, adjuntos mediante StorageProvider y borrador validable.
3. Extraer adaptador único de Airtable y eliminar duplicación gradual de IDs/campos.
4. Configurar `FUTURA_AI_TOKEN_BUDGET` y precios por modelo para completar control de presupuesto/costo.
5. Pipeline/scoring CRM y prioridad diaria.
6. Contrato `AIProvider` y fallback controlado.
7. Growth AI con medición de experimentos.
8. Investigación externa con fuente, fecha, confianza y acción recomendada.
9. Publicación/remarketing asistido con cumplimiento de APIs/TOS.

## 13. Siguiente acción de mayor impacto

**Configurar y verificar la base operativa:** definir `FUTURA_AI_TOKEN_BUDGET` en Vercel, comprobar que Airtable/Gemini registren datos reales, y proteger las rutas internas con autenticación. Esto evita construir captación móvil y agentes sobre datos o paneles expuestos/inestables.

Al completarlo, continuar inmediatamente con **Captar Propiedad interno mobile-first v1**, no con una reconstrucción general. La siguiente mejora de interfaz debe completar las acciones CRM y las fichas editables de propiedad dentro de Inicio, sin reintroducir navegación fragmentada.

## 14. Protocolo de actualización

En cada cambio relevante:

1. inspeccionar el código/estado afectado;
2. implementar el cambio mínimo;
3. verificar build, pruebas y despliegue cuando aplique;
4. actualizar las secciones Estado actual, Implementado/Parcial, Arquitectura, Decisiones, Limitaciones, Backlog, Siguiente acción y Changelog;
5. reportar solo evidencia comprobada.

## 15. Changelog

| Fecha | Cambio | Estado |
|---|---|---|
| 2026-08-13 | Se crea `FUTURA_OS_MASTER.md` tras inspección remota del repositorio. Se documentan arquitectura real, brechas, arquitectura objetivo y siguiente acción. | Completado |
| 2026-08-13 | Inicio rediseñado según el flujo IA → pills → contenido: conversación superior continua, selector activo, panel directo, requisitos faltantes y contador de tokens de sesión Gemini. | Build local de producción verificado; despliegue y datos reales pendientes |
| 2026-08-13 | Se añade tabla Airtable `Consumo IA`, campo `Etapa CRM`, presupuesto de tokens configurable, catálogo de propiedades y pipeline CRM. | Build local de producción verificado; despliegue pendiente |
| 2026-08-13 | Inicio se unifica como una sola superficie: Propiedades, CRM, Gráficos, Agentes, Growth, Contenido y Captar se despliegan dentro del dashboard. Se retiran del Inicio la barra lateral, dock móvil y enlaces a pantallas internas. | Build local de producción verificado; despliegue pendiente |
