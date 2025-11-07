# Lineamientos de Implementación – Registro de Jornadas

Este documento consolida las decisiones y el estándar acordado para implementar el registro de jornadas en LedroitCheck, respetando el estándar existente de sesión (`ls_session`) y las prácticas del ecosistema LedroitMaster.

## 1) Objetivo
Registrar las jornadas de usuarios por empresa, con trazabilidad de entrada/salida, ubicación, dispositivo, IP, folio y estado, de forma óptima y sin romper el estándar de sesión vigente.

## 2) Estructura en Firestore
- Colección raíz: `jornadas`
- Subniveles:
  - Documento por empresa: `jornadas/{empresaNombre}`
    - Subcolección de usuarios: `jornadas/{empresaNombre}/usuarios/{iniciales}` (documento)
      - Subcolección de jornadas del usuario: `jornadas/{empresaNombre}/usuarios/{iniciales}/jornadas/{folio}` (documento)

Ejemplo de ruta concreta:
- `jornadas/EMPRESA_SA/usuarios/ABC/jornadas/00023-20250115-104500`

Notas:
- Se usa el nombre de la empresa exactamente como viene en la respuesta de LedroitMaster (primer ingreso), tal como se define en la guía del ecosistema.
- `iniciales` proviene de `ls_session.iniciales` (normalizadas en mayúsculas).
- El `folio` se define abajo en el punto 4.

## 3) Campos por documento de jornada
Cada documento en `.../jornadas/{folio}` tendrá los siguientes campos:
- `horaEntrada`: Firestore Timestamp (preferentemente `serverTimestamp`)
- `horaSalida`: Firestore Timestamp o `null` hasta que se cierre
- `ip`: string o `null` si no disponible
- `ubicacion`: objeto `{ lat: number|null, lng: number|null, accuracy: number|null }`
- `dispositivo`: objeto `{ isMobile: boolean }`
- `folio`: string (el mismo valor que el ID del documento, para redundancia)
- `estado`: string, uno de `"abierta" | "cerrada"`
- Redundancia controlada (opcional, recomendada para queries y auditoría):
  - `usuario`: string con las iniciales (misma que en la ruta)
  - `empresa`: string con el nombre de la empresa (misma que en la ruta)

Motivación: Aunque `usuario` y `empresa` están implícitos en la ruta, mantenerlos en el documento ayuda en exportaciones, auditorías y consultas agregadas.

## 4) Generación de Folio
Definición acordada: `folio = NumeroConsecutivo + '-' + ${YYYYMMDD}-${HHmmss}`

Lineamientos:
- Alcance del consecutivo: por `empresaId + iniciales` (evita colisiones globales y mantiene orden local).
- Ubicación del contador: documento dedicado por usuario dentro de la ruta:
  - `jornadas/{empresaNombre}/usuarios/{iniciales}/counters/jornada`
  - Campo `nextConsecutivo: number`
- Mecanismo: incrementar el contador vía Transacción de Firestore para evitar condiciones de carrera (multi-pestaña o multi-dispositivo).
- Formato de fecha/hora del folio: usar horario local del cliente para `${YYYYMMDD}-${HHmmss}` y, en los campos `horaEntrada/horaSalida`, guardar `serverTimestamp` (UTC) para consistencia en consultas.

Ejemplo: `00023-20250115-104500`

## 5) Reglas de negocio de apertura/cierre
- Un usuario solo puede tener **una jornada abierta** a nivel global (no puede tener dos jornadas abiertas ni en la misma empresa, ni en otra empresa).
- Índice de jornada abierta por usuario (para rendimiento): `jornadas_open/{iniciales}` con `{ empresaNombre, folio, horaEntrada }`.
- Al abrir jornada:
  - Consultar `jornadas_open/{iniciales}`. Si existe, se bloquea la apertura y se notifica al usuario (empresa, hora de inicio, tiempo transcurrido).
  - Si no existe, crear la jornada y registrar el índice.
- Al cerrar jornada:
  - Localizar `jornadas_open/{iniciales}` y su documento `jornadas/{empresaNombre}/usuarios/{iniciales}/jornadas/{folio}`.
  - Actualizar `horaSalida` + `estado = 'cerrada'` y eliminar el índice `jornadas_open/{iniciales}`.

## 6) Captura de IP
- Preferencia técnica: obtener la IP desde el backend mediante una Cloud Function (callable HTTPS), ya que el navegador no expone de forma confiable la IP pública.
- El campo `ip` puede quedar `null` si no se consigue.

## 7) Ubicación (Geolocalización)
- Uso de `navigator.geolocation.getCurrentPosition` con `enableHighAccuracy: true`, `timeout: 10000`.
- En móvil (`dispositivo.isMobile = true`): si el usuario deniega permisos o no está disponible, BLOQUEAR apertura/cierre de jornada y solicitar nuevamente permisos (flujo controlado). No se permite abrir/cerrar sin ubicación.
- En escritorio: permitir apertura/cierre aunque la ubicación no esté disponible; guardar `{lat: null, lng: null, accuracy: null}`.

## 8) Detección de dispositivo
- `dispositivo.isMobile`: boolean determinado por heurística de `userAgent`.
- SÍ es crítico. 

## 9) DESPUÉS DE LOGIN

## 9.1 VENTANA MODAL BIENVENIDA
- SIEMPRE se debe mostrar una ventana modal "BIENVENIDA" sin opción de "X" para cerrar. EL DISEÑO TIENE QUE SER HERMOSO Y PROFESIONAL. Usa los framewors o lo que necesites para hacer esta experiencia muy avanzada
- El sistema debe buscar si existe alguna jornada abierta en alguna empresa de las que el usuario tiene acceso.
MODO JORNADA CERRADA:  (Cuando no hay una jornada abierta)
  -SI SOLO PERTENECE A UNA EMPRESA
      -Se considerará "empresa seleccionada" a esa unica empresa
      - La ventana de bienvenida debe mostrar datos como el nombre del usuario, inciales, foto (no avatar), datos de la última jornada (cuando comenzó/terminó, cuanto duró, etc), un reloj en tiempo real, y boton para abrir jornada. LUEGO PASARÁ A MODO JORNADA ABIERTA
  -SI PERTENECE A MÁS DE UNA EMPRESA
      - La ventana de bienvenida debe aparecer en modo "selector": debe mostrar botones centrados y repartidos, donde se muestren las empresas a las que el usuario pertenece para que la seleccione. Entonces esa se considerará "empresa seleccionada" LUEGO:
      - La ventana de bienvenida debe mostrar datos como el nombre del usuario, inciales, foto (no avatar), datos de la última jornada (cuando comenzó/terminó, cuanto duró, etc), un reloj en tiempo real, y boton para abrir jornada. LUEGO PASARÁ A MODO JORNADA ABIERTA

MODO JORNADA ABIERTA
  Por default se considerará "empresa seleccionada" a la empresa en la cual está abierta la jornada
  - La ventana de bienvenida debe mostrar datos como el nombre del usuario, inciales, foto (no avatar), fecha/hora de entrada de la jornada abierta, un reloj temporizador en tiempo real, que esté indicando el tiempo que lleva la jornada abierta, y boton para cerrar la jornada

- Aunque exista una jornada abierta (y se omita el selector), en el header debe aparecer opción para cambiar de empresa. Si el usuario selecciona otra empresa, el sistema debe reiniciar el flujo de bienvenida respetando la lógica anterior y considerando la nueva "empresa seleccionada".

Si el usuario, en la empresa seleccionada, tiene rol a1 o a2, entonces, en la ventana modal debe aparecer botones para ir a otras páginas como: configuracion, configuracion maestra, nomina, etc.

## 9.2) "EMPRESA SELECCIONADA"
-Dentro de la sesión (ls_session) se debe crear un nodo llamado empresaSeleccionada donde se guarde la empresa que está seleccionada (y el rol que tiene el usuario en dicha empresa). Esto debe aparecer en el header, ejemplo: empresa seleccionada: EMPRESA5, rol: A3
-Todo el sistema y páginas como configuración y demás, se verán influenciadas por esto. Además, en el header debe haber una opción para cambiar de empresa, en caso de que el usuario pertenezca a más de una empresa. Cuando se cambie de empresa, el sistema debe reiniciar, lanzando la ventana BIENVENIDA, considerando toda la lógica mencionada en el punto 9.1, y considerando a la nueva empresa como "empresa seleccionada" 

## 10) Estándar de sesión (inmutable)
- `ls_session` debe respetar las claves: `iniciales`, `nombre`, `foto_url`, `empresas`. Se pueden agregar nodos, sin que afecte a lo que actualmente ya existe

## 11) Rendimiento e índices
- Operaciones típicas son sobre una ruta concreta, por lo que los accesos son directos y no requieren índices compuestos.
- Si en el futuro se requieren listados agregados (p. ej. todas las jornadas abiertas en una empresa), se recomienda implementar consultas por Cloud Function con seguridad y, si aplica, índices compuestos.

## 12) Seguridad y reglas
- Reglas de Firestore deben permitir que un usuario solo cree/actualice jornadas bajo su `iniciales` y en las empresas a las que pertenece.
- Validar `estado` para que solo acepte `"abierta" | "cerrada"`.
- Validar que `horaEntrada` y `horaSalida` sean Timestamps.
- Permisos:
  - TODOS los usuarios pueden abrir/cerrar su propia jornada.
  - Solo los usuarios con rol A1/A2 podrán ver y acceder a otras páginas (configuración, configuración maestra, nómina).
  - Usuarios con otros roles (p. ej. A3) verán únicamente opciones de abrir/cerrar jornada.

## 13) UI mínima (referencial)
- Botón "Abrir Jornada": crea registro con `estado='abierta'`.
- Botón "Cerrar Jornada": actualiza la última jornada abierta.
- Debe permitir seleccionar empresas cuando aplique.

## 14) Compatibilidades del ecosistema
- Transferencia por POST (estándar) en ingresos derivados; evitar `alert()` y usar `toast`.
- Iniciales siempre normalizadas a mayúsculas.

## 15) Plan por fases
- Fase 1 (Implementación base de datos y lógica):
  - Métodos en FirestoreManager para abrir/cerrar jornada, contador por `{empresaNombre + iniciales}`, índice `jornadas_open` por usuario, y utilidades de formato de folio (zero-padding) y normalización de iniciales.
  - Sin cambios visuales mayores; preparar funciones para ser invocadas desde la UI.
- Fase 2 (UI Bienvenida profesional):
  - Modal "BIENVENIDA" con diseño profesional: modo jornada abierta/cerrada, selector de empresas (cuando aplique), reloj en tiempo real y temporizador.
  - Integración con `toast` y control de permisos de geolocalización (móvil).
- Fase 3 (Header y empresa seleccionada):
  - Mostrar empresa seleccionada y rol en el header; opción para cambiar de empresa que reinicia el flujo de bienvenida.
- Fase 4 (Seguridad y backend):
  - Reglas de Firestore específicas para jornadas y `jornadas_open`.
  - (Opcional) Cloud Function para registrar jornada y capturar IP del request.
- Fase 5 (Configuración y nómina):
  - Acceso y UI para módulos de configuración y nómina según roles A1/A2.

