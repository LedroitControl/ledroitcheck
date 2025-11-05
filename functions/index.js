/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
try { admin.initializeApp(); } catch (e) { /* already initialized */ }

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

/**
 * Ingreso Derivado PASIVO (POST)
 * Endpoint que recibe los datos enviados por sistemas secundarios (gadget) y
 * setea la sesión en el navegador, guarda respaldo en Firestore y audita.
 *
 * Ruta de Hosting: /ingreso-derivado (configurada en firebase.json)
 */
exports.ingresoDerivado = onRequest({ maxInstances: 10 }, async (req, res) => {
  // CORS básico para permitir llamadas cross-origin del gadget
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).set("Allow", "POST").send("Método no permitido. Use POST.");
  }

  try {
    // Extraer payload de forma flexible
    let payload = null;
    if (req.body && typeof req.body === "object") {
      payload = req.body.respuestaLMaster ?? req.body.data ?? req.body;
    } else if (typeof req.body === "string") {
      try { payload = JSON.parse(req.body); } catch {}
    }

    if (typeof payload === "string") {
      try { payload = JSON.parse(payload); } catch {}
    }

    if (!payload || typeof payload !== "object") {
      return res.status(400).send("Body inválido: se esperaba JSON en 'respuestaLMaster' o 'data'.");
    }

    const respuesta = payload;
    const ok = !!respuesta.success && !!respuesta.data;
    if (!ok) {
      return res.status(400).send("Estructura inválida: { success: true, data: { ... } } requerida.");
    }

    const data = respuesta.data || {};
    // Sesión estándar en español, acorde a la guía
    const ses = {
      nombre: data.nombre || (data.user && data.user.nombre) || null,
      iniciales: data.iniciales || (data.user && data.user.iniciales) || null,
      foto_url: data.foto_url || (data.user && data.user.foto_url) || null,
      empresas: Array.isArray(data.empresas) ? data.empresas : [],
      timestamp: new Date().toISOString(),
      sistemaOrigen: respuesta.sistemaOrigen || 'LEDROITCHECK'
    };

    // Guardar respaldo en Firestore (colección ya usada en front)
    try {
      const db = admin.firestore();
      const idDoc = ses.iniciales || "sin_iniciales";
      await db.collection("ultimosIngresosSatisfactorios").doc(idDoc).set({
        respuestaLMaster: respuesta,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      logger.info("Respaldo de ingreso derivado guardado", { idDoc, empresas: ses.empresas.length });
    } catch (err) {
      logger.error("Error guardando respaldo en Firestore", err);
    }

    // Auditoría (best-effort)
    try {
      const auditUrl = "https://auditingresoderivado-fmunxt6pjq-uc.a.run.app";
      const body = {
        sistema: "LedroitCheck",
        iniciales: ses.iniciales || null,
        empresasCount: ses.empresas.length,
        success: !!respuesta.success,
        ts: Date.now(),
      };
      await fetch(auditUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      logger.info("Auditoría enviada");
    } catch (err) {
      logger.warn("Auditoría fallida (continuando)", err);
    }

    // Responder con una página HTML que establece la sesión, guarda el payload
    // completo y redirige al menú principal
    const html = `<!doctype html>
      <html lang="es">
      <head><meta charset="utf-8"><title>Ingreso derivado</title></head>
      <body>
        <p>Procesando ingreso derivado…</p>
        <script>
          try {
            const ses = ${JSON.stringify(ses)};
            const resp = ${JSON.stringify(respuesta)};
            localStorage.setItem('ls_session', JSON.stringify(ses));
            sessionStorage.setItem('ls_session', JSON.stringify(ses));
            // Guardar el payload completo para que ingreso-derivado.html pueda mostrarlo
            localStorage.setItem('ls_lastRespuestaLMaster', JSON.stringify(resp));
            sessionStorage.setItem('ls_lastRespuestaLMaster', JSON.stringify(resp));
            if (ses.iniciales) sessionStorage.setItem('iniciales', ses.iniciales);
          } catch (e) {}
          // Redirigir directamente al menú principal
          location.href = '/menu.html';
        </script>
      </body></html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (error) {
    logger.error("Error en ingreso derivado", error);
    return res.status(500).send("Error interno procesando ingreso derivado");
  }
});
