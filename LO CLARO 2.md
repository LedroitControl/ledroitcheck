LO CLARO 2 — Decisiones en firme y plan por fases para implementar la Guía de Sistemas Secundarios

Se consolidan las decisiones aprobadas y el plan de implementación por fases para LEDROITCHECK, apegado a:
- DOCUMENTACION - API_LEDROITMASTER.md
- GUIA PARA DESARROLLADORES DE SISTEMAS SECUNDARIOS.md

1) Decisiones en firme
- Persistencia de sesión: localStorage (múltiples ventanas). Prioridad de lectura: sessionStorage si existe, y si no, localStorage; escritura principal en localStorage.
- sistemaOrigen: LEDROITCHECK (usar en todas las llamadas y registros).
- Endpoints Cloud Run:
  - Autenticación (Primer Ingreso): https://authlogin-fmunxt6pjq-uc.a.run.app
  - Auditoría (Ingreso Derivado PASIVO): https://auditingresoderivado-fmunxt6pjq-uc.a.run.app
- Ingreso Derivado:
  - Activo (Enviar): usar método GET por URL (data=respuestaLMaster serializada), apegado a la guía operativa que seleccionaste.
  - Pasivo (Recibir): implementar endpoint POST /ingreso-derivado (Firebase Function) con rewrite desde Hosting. Mantener compatibilidad GET para pruebas/antiguos.
- Header: estándar según guía, tonos verdes, incluir logo SVG hecho por nosotros, marca izquierda, usuario (iniciales, nombre, foto) y menú derecha. Si la guía incluye selector de empresa activa, se implementará conforme el estándar.
- Gadget de ingresos activos: comportamiento, estilo y flujos exactamente iguales a la guía; lista inicial vacía para que el usuario registre destinos; opción de abrir en nueva ventana o misma, configurable al crear cada destino; persistencia en localStorage.
- Página de pruebas: prueba-ingderivado.html con interfaz estándar (pestañas ACTIVO/PASIVO/INFO), logs visibles, toasts, método URL obligatorio (GET). El usuario ingresa la URL destino manualmente.
- Firestore (respaldo crítico): colección ultimosIngresosSatisfactorios con documento ID = iniciales, campos: claBComun, iniciales, sistemaOrigen, timestamp, respuestaLMaster completa. Se actualiza en cada ingreso exitoso. Fallback solo para errores de conexión (no para respuestas negativas).
- Mensajería: toasts para notificaciones; modals en casos que requieran respuesta del usuario. Lenguaje español en toda la UI.
- Login: campos “Iniciales” y “Clave común (claBComun)”; claBComun se muestra/oculta con UI profesional pero el input no será type="password"; las letras de las iniciales se normalizan a mayúsculas antes del envío.
- Acceso: no habrá segunda capa de filtrado local; si LedroitMaster autoriza, el acceso es permitido.
- Auditoría PASIVO: registrar siempre evento (EXITOSO/FALLIDO) en Cloud Run; capturar dirección IP del cliente cuando esté disponible.
- Despliegue: manual (firebase deploy), sin GitHub Actions por ahora.

2) Alcance básico a implementar
- Login (primer ingreso) completo y apegado a la guía.
- Header estándar verde con SVG propio.
- Gadget de ingresos activos con configuración por el usuario, estilos y flujos estándar.
- Página obligatoria de pruebas: prueba-ingderivado.html.
- Página de procesamiento/visualización: ingreso-derivado.html.
- Endpoint POST /ingreso-derivado mediante Firebase Functions con rewrite desde Hosting.

3) Plan por fases (con criterios de aceptación)

Fase 1 — Estructura mínima sin llamadas a API
- Crear páginas y módulos base en /public:
  - login.html
  - header.html o módulo JS reutilizable del header
  - prueba-ingderivado.html
  - ingreso-derivado.html
  - módulo de toasts y modals estándar
- Criterios de aceptación:
  - Todas las páginas existen y cargan en Hosting.
  - Normalización de iniciales presente en UI (sin envío real).
  - Sistema de toasts activo; sin alert().
  - Estilos primarios verdes y layout básico conforme guía.

Fase 2 — Primer Ingreso (login) conectado a Cloud Run
- Implementar llamada POST a https://authlogin-fmunxt6pjq-uc.a.run.app.
- Crear ls_session con nomenclatura estándar (iniciales, nombre, foto_url, empresas, timestamp, sistemaOrigen = LEDROITCHECK).
- Guardar ls_session en localStorage (y priorizar sessionStorage al leer, si existe).
- Guardar respuesta exitosa en Firestore: colección ultimosIngresosSatisfactorios.
- Fallback para errores de conexión (no para negativas). Captura de IP si está disponible.
- Criterios de aceptación:
  - Login funcional y creación de ls_session.
  - Iniciales normalizadas (solo letras a mayúsculas) antes de enviar.
  - Firestore registra respaldo correctamente por iniciales.
  - Mensajería con toasts/modals.

Fase 3 — Header estándar y logo SVG
- Implementar header estándar según guía en tonos verdes.
- Generar y usar un logo SVG para LEDROITCHECK.
- Mostrar marca izquierda y usuario (iniciales/nombre/foto) a la derecha; incluir elementos específicos de la guía (ej. selector de empresa activa si aplica).
- Criterios de aceptación:
  - Header visible en todas las páginas del sistema.
  - Visual consistente con la guía; sin variaciones propias.

Fase 4 — Gadget de ingresos activos (GET)
- Implementar gadget según guía exacta: botón flotante, modales de configuración, creación/edición de sistemas destino, opción de abrir en nueva o misma ventana, validaciones por roles/empresas si aplica, persistencia en localStorage.
- Envío activo con método GET por URL, parámetro data/respuestaLMaster.
- Criterios de aceptación:
  - Gadget opera exactamente como la guía.
  - Lista inicial vacía y configurable por el usuario.
  - Navegación fluida y logs visibles.

Fase 5 — Ingreso Derivado PASIVO (POST + GET compatibilidad)
- Implementar Firebase Function para /ingreso-derivado (POST), con rewrite en firebase.json.
- Procesar respuestaLMaster recibida, validar estructura, crear ls_session derivada, actualizar respaldo en Firestore.
- Registrar auditoría en Cloud Run con captura de IP cuando esté disponible.
- Mostrar resultados en ingreso-derivado.html y limpiar parámetros de URL.
- Criterios de aceptación:
  - Recepción por POST operativa con auditoría.
  - ingreso-derivado.html presenta y limpia correctamente.
  - Compatibilidad GET para pruebas/antiguos confirmada.

Fase 6 — Página de pruebas y QA
- Completar prueba-ingderivado.html con pestañas ACTIVO/PASIVO/INFO, logs visibles, toasts, ingreso de URL destino por el usuario.
- Pruebas integrales de login, gadget, ingreso derivado, respaldo y auditoría.
- Criterios de aceptación:
  - Pruebas exitosas con herramienta y flujos descritos en documentación.

Fase 7 — Despliegue manual y cierre
- Deploy a Firebase Hosting y Functions manualmente.
- Documentación breve de uso y flujos.
- Criterios de aceptación:
  - Producción estable en https://ledroitcheck.web.app/.

4) Reglas de datos y nomenclatura (resumen operativo)
- ls_session: estructura estándar con campos en nomenclatura de LedroitMaster (iniciales, nombre, empresas, empresa_activa, usuario_activo, rol[]).
- No incluir respuestaLMaster completa dentro de ls_session; solo en respaldo de Firestore.
- Normalizar iniciales: convertir únicamente letras a mayúsculas; números y símbolos no se alteran.

5) Auditoría y seguridad
- Registrar siempre auditoría en ingreso derivado PASIVO (EXITOSO/FALLIDO) vía Cloud Run.
- Capturar IP del cliente cuando esté disponible.
- HTTPS obligatorio, no hardcodear credenciales, manejo de errores con toasts/modals.

6) Entregables
- Páginas y módulos en /public (login, header, gadget, prueba-ingderivado, ingreso-derivado).
- Firebase Function para /ingreso-derivado y configuración de rewrites en firebase.json.
- Registros en Firestore (ultimosIngresosSatisfactorios) y llamadas a endpoints Cloud Run.
- Logo SVG propio en tonos verdes.

7) Próximo paso
- Con esta definición final, quedo a la espera de tu confirmación explícita para iniciar la Fase 1. Una vez implementada, te mostraré la vista previa en Hosting para que apruebes y avancemos al resto de fases.