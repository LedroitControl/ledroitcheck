/**
 * CONFIGURACIÓN DE FIREBASE - LEDROITCHECK
 * Configuración para Firestore y manejo de la colección ultimosIngresosSatisfactorios
 */

// Configuración de Firebase (se debe actualizar con los datos reales del proyecto)
const firebaseConfig = {
    apiKey: "AIzaSyBI8wP7mGBKmK0Gej_4irGR_HgwK0gvO6",
    authDomain: "ledroitcheck.firebaseapp.com",
    projectId: "ledroitcheck",
    storageBucket: "ledroitcheck.firebasestorage.app",
    messagingSenderId: "262599097567",
    appId: "1:262599097567:web:81f272f7b1cd5c6be33d6a"
};

// Inicializar Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    // Exponer para el header global (documentación HEADER)
    window.db = db;
    // Algunos headers esperan authReady; aquí resolvemos inmediatamente
    if (!window.authReady) {
        window.authReady = Promise.resolve();
    }
    console.log('Firebase inicializado correctamente');
} catch (error) {
    console.error('Error al inicializar Firebase:', error);
}

/**
 * MANEJO DE LA COLECCIÓN ultimosIngresosSatisfactorios
 */
class FirestoreManager {
    constructor() {
        this.db = db;
        this.collection = 'ultimosIngresosSatisfactorios';
    }

    /**
     * Guarda un ingreso satisfactorio en Firestore
     * @param {Object} respuestaLedroitmaster - Respuesta completa de la API
     * @returns {Promise<boolean>} True si se guardó correctamente
     */
    async guardarUltimoIngresoSatisfactorio(respuestaLedroitmaster) {
        try {
            if (!this.db) {
                throw new Error('Base de datos no inicializada');
            }

            if (!respuestaLedroitmaster || !respuestaLedroitmaster.success) {
                throw new Error('Respuesta de LEDROITMASTER inválida');
            }

            const userData = respuestaLedroitmaster.data;
            const iniciales = userData.iniciales;

            if (!iniciales) {
                throw new Error('Iniciales del usuario no encontradas');
            }

            // Estructura según especificaciones
            const documento = {
                claBComun: userData.claBComun || '', // Se puede omitir por seguridad
                iniciales: iniciales,
                sistemaOrigen: 'LEDROITCHECK',
                timestamp: new Date().toISOString(),
                respuestaLMaster: respuestaLedroitmaster
            };

            // Usar iniciales como ID del documento (reemplaza registros anteriores)
            await this.db.collection(this.collection).doc(iniciales).set(documento);
            
            console.log('Ingreso satisfactorio guardado:', iniciales);
            return true;

        } catch (error) {
            console.error('Error al guardar ingreso satisfactorio:', error);
            return false;
        }
    }

    /**
     * Obtiene el último ingreso satisfactorio de un usuario
     * @param {string} iniciales - Iniciales del usuario
     * @returns {Promise<Object|null>} Datos del último ingreso o null
     */
    async obtenerUltimoIngreso(iniciales) {
        try {
            if (!this.db || !iniciales) return null;

            const doc = await this.db.collection(this.collection).doc(iniciales).get();
            
            if (doc.exists) {
                return doc.data();
            }
            
            return null;
        } catch (error) {
            console.error('Error al obtener último ingreso:', error);
            return null;
        }
    }

    /**
     * Verifica si existe un registro previo para fallback
     * @param {string} iniciales - Iniciales del usuario
     * @returns {Promise<boolean>} True si existe registro previo
     */
    async existeRegistroPrevio(iniciales) {
        try {
            const registro = await this.obtenerUltimoIngreso(iniciales);
            return registro !== null;
        } catch (error) {
            console.error('Error al verificar registro previo:', error);
            return false;
        }
    }

    /**
     * Guarda un registro de entrada/salida de personal
     * @param {Object} registro - Datos del registro
     * @returns {Promise<boolean>} True si se guardó correctamente
     */
    async guardarRegistroPersonal(registro) {
        try {
            if (!this.db) {
                throw new Error('Base de datos no inicializada');
            }

            const documento = {
                ...registro,
                timestamp: new Date().toISOString(),
                iniciales: registro?.iniciales || 'SISTEMA'
            };

            await this.db.collection('entradas_salidas').add(documento);
            
            console.log('Registro de personal guardado');
            return true;

        } catch (error) {
            console.error('Error al guardar registro de personal:', error);
            return false;
        }
    }

    /**
     * Obtiene registros de entrada/salida
     * @param {number} limite - Número máximo de registros
     * @returns {Promise<Array>} Array de registros
     */
    async obtenerRegistrosPersonal(iniciales = null, fecha = null, limite = 50) {
        try {
            if (!this.db) return [];

            let query = this.db.collection('entradas_salidas');

            // Filtrar por iniciales si se especifica
            if (iniciales) {
                query = query.where('iniciales', '==', iniciales);
            }

            // Filtrar por fecha si se especifica
            if (fecha) {
                query = query.where('fecha', '==', fecha);
            }

            const snapshot = await query
                .orderBy('timestamp', 'desc')
                .limit(limite)
                .get();

            const registros = [];
            snapshot.forEach(doc => {
                registros.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return registros;
        } catch (error) {
            console.error('Error al obtener registros:', error);
            return [];
        }
    }

    // =============================
    // JORNADAS – FASE 1 (BASE)
    // =============================

    /**
     * Normaliza iniciales (solo letras a mayúsculas; números/símbolos intactos)
     */
    _normalizeIniciales(iniciales = '') {
        return String(iniciales).replace(/[a-zA-Z]/g, (letra) => letra.toUpperCase());
    }

    /**
     * Zero-padding para consecutivo del folio
     */
    _padConsecutivo(num, width = 5) {
        const s = String(num);
        return s.length >= width ? s : '0'.repeat(width - s.length) + s;
    }

    /**
     * Formatea fecha local como YYYYMMDD-HHmmss para folio
     */
    _formatLocalDateYYYYMMDDHHmmss(date = new Date()) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const HH = String(date.getHours()).padStart(2, '0');
        const MM = String(date.getMinutes()).padStart(2, '0');
        const SS = String(date.getSeconds()).padStart(2, '0');
        return `${yyyy}${mm}${dd}-${HH}${MM}${SS}`;
    }

    /**
     * Obtiene empresa seleccionada por nombre desde ls_session
     * Si existe empresaSeleccionada, usa esa; si no, retorna la única activa si solo hay una.
     * Si hay múltiples activas y no se seleccionó, retorna null.
     */
    getEmpresaSeleccionadaNombreFromSession() {
        try {
            const sesLocal = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
            if (!sesLocal) return null;
            const ses = JSON.parse(sesLocal);
            const seleccionada = ses?.empresaSeleccionada?.nombre;
            if (seleccionada) return seleccionada;
            const activas = Array.isArray(ses?.empresas) ? ses.empresas.filter(e => e?.empresa_activa) : [];
            if (activas.length === 1) return activas[0].nombre;
            return null; // múltiple o no disponible
        } catch { return null; }
    }

    /**
     * Referencia al índice global de jornada abierta por usuario
     */
    _jornadasOpenRef(iniciales) {
        return this.db.collection('jornadas_open').doc(iniciales);
    }

    /**
     * Abre una jornada para un usuario en una empresa dada por nombre
     * Requiere control previo de geolocalización en móvil desde la UI.
     * @param {Object} opts
     * @param {string} opts.empresaNombre - Nombre exacto de la empresa
     * @param {string} opts.iniciales - Iniciales del usuario
     * @param {Object} [opts.ubicacion] - { lat, lng, accuracy } (nullables)
     * @param {Object} [opts.dispositivo] - { isMobile: boolean }
     * @param {string} [opts.ip] - IP o null
     * @returns {Promise<{success:boolean, reason?:string, data?:Object}>}
     */
    async openJornada(opts = {}) {
        const { empresaNombre, iniciales, ubicacion = { lat: null, lng: null, accuracy: null }, dispositivo = { isMobile: false }, ip = null } = opts;
        if (!this.db) return { success: false, reason: 'db_not_initialized' };
        if (!empresaNombre) return { success: false, reason: 'empresa_required' };
        if (!iniciales) return { success: false, reason: 'iniciales_required' };

        const userKey = this._normalizeIniciales(iniciales);
        const openRef = this._jornadasOpenRef(userKey);

        // Bloqueo si ya hay jornada abierta
        const openSnap = await openRef.get();
        if (openSnap.exists) {
            return { success: false, reason: 'already_open', data: openSnap.data() };
        }

        const counterRef = this.db
            .collection('jornadas')
            .doc(empresaNombre)
            .collection('usuarios')
            .doc(userKey)
            .collection('counters')
            .doc('jornada');

        const jornadasCol = this.db
            .collection('jornadas')
            .doc(empresaNombre)
            .collection('usuarios')
            .doc(userKey)
            .collection('jornadas');

        const result = await this.db.runTransaction(async (tx) => {
            const counterDoc = await tx.get(counterRef);
            let nextConsecutivo = 1;
            if (counterDoc.exists) {
                const data = counterDoc.data();
                nextConsecutivo = (data?.nextConsecutivo || 0) + 1;
                // Actualizar si existe
                tx.update(counterRef, { nextConsecutivo });
            } else {
                // Crear si no existe (evita failed-precondition)
                tx.set(counterRef, { nextConsecutivo });
            }

            const consecutivoStr = this._padConsecutivo(nextConsecutivo);
            const fechaStr = this._formatLocalDateYYYYMMDDHHmmss(new Date());
            const folio = `${consecutivoStr}-${fechaStr}`;

            const jornadaRef = jornadasCol.doc(folio);
            // Crear jornada (set) y aplicar serverTimestamp vía transform
            tx.set(jornadaRef, {
                horaEntrada: firebase.firestore.FieldValue.serverTimestamp(),
                horaSalida: null,
                ip: ip || null,
                ubicacion: {
                    lat: ubicacion?.lat ?? null,
                    lng: ubicacion?.lng ?? null,
                    accuracy: ubicacion?.accuracy ?? null,
                },
                dispositivo: { isMobile: !!(dispositivo?.isMobile) },
                folio,
                estado: 'abierta',
                usuario: userKey,
                empresa: empresaNombre,
            });

            // Crear índice de jornada abierta
            tx.set(openRef, {
                empresaNombre,
                folio,
                horaEntrada: firebase.firestore.FieldValue.serverTimestamp(),
            });

            return { folio };
        });

        return { success: true, data: { folio: result.folio, empresaNombre, iniciales: userKey } };
    }

    /**
     * Cierra la jornada abierta para el usuario
     * @param {Object} opts
     * @param {string} opts.iniciales
     * @returns {Promise<{success:boolean, reason?:string, data?:Object}>}
     */
    async closeJornada(opts = {}) {
        const { iniciales } = opts;
        if (!this.db) return { success: false, reason: 'db_not_initialized' };
        if (!iniciales) return { success: false, reason: 'iniciales_required' };

        const userKey = this._normalizeIniciales(iniciales);
        const openRef = this._jornadasOpenRef(userKey);
        const openSnap = await openRef.get();
        if (!openSnap.exists) {
            return { success: false, reason: 'no_open_jornada' };
        }
        const { empresaNombre, folio } = openSnap.data();

        const jornadaRef = this.db
            .collection('jornadas')
            .doc(empresaNombre)
            .collection('usuarios')
            .doc(userKey)
            .collection('jornadas')
            .doc(folio);

        await this.db.runTransaction(async (tx) => {
            tx.update(jornadaRef, {
                horaSalida: firebase.firestore.FieldValue.serverTimestamp(),
                estado: 'cerrada',
            });
            tx.delete(openRef);
        });

        return { success: true, data: { empresaNombre, folio, iniciales: userKey } };
    }

    /**
     * Obtiene la jornada abierta (índice) para un usuario
     */
    async getJornadaAbierta(iniciales) {
        if (!this.db || !iniciales) return null;
        const userKey = this._normalizeIniciales(iniciales);
        const snap = await this._jornadasOpenRef(userKey).get();
        return snap.exists ? snap.data() : null;
    }

    /**
     * Obtiene la última jornada cerrada del usuario buscando en todas sus empresas
     * basadas en ls_session.empresas.
     * Devuelve { empresa, folio, horaEntrada, horaSalida, duracionMs } o null.
     */
    async getUltimaJornada(iniciales) {
        try {
            if (!this.db || !iniciales) return null;
            const userKey = this._normalizeIniciales(iniciales);
            // Obtener lista de empresas desde sesión local
            let empresas = [];
            try {
                const sesRaw = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
                const ses = sesRaw ? JSON.parse(sesRaw) : null;
                empresas = Array.isArray(ses?.empresas) ? ses.empresas.map(e => e?.nombre).filter(Boolean) : [];
            } catch {}
            if (!empresas || empresas.length === 0) return null;

            let mejor = null;
            for (const empresaNombre of empresas) {
                try {
                    const col = this.db
                        .collection('jornadas').doc(empresaNombre)
                        .collection('usuarios').doc(userKey)
                        .collection('jornadas');
                    // Tomar las últimas 5 por horaEntrada para localizar la más reciente cerrada
                    const qs = await col.orderBy('horaEntrada', 'desc').limit(5).get();
                    qs.forEach(doc => {
                        const d = doc.data();
                        if (d && d.estado === 'cerrada' && d.horaEntrada && d.horaSalida) {
                            const he = d.horaEntrada.toDate ? d.horaEntrada.toDate() : null;
                            const hs = d.horaSalida.toDate ? d.horaSalida.toDate() : null;
                            if (!he || !hs) return;
                            const dur = hs.getTime() - he.getTime();
                            const candidato = { empresa: empresaNombre, folio: d.folio, horaEntrada: he, horaSalida: hs, duracionMs: dur };
                            if (!mejor || (candidato.horaSalida.getTime() > mejor.horaSalida.getTime())) {
                                mejor = candidato;
                            }
                        }
                    });
                } catch {}
            }
            return mejor;
        } catch { return null; }
    }
}

// Instancia global del manejador de Firestore
const firestoreManager = new FirestoreManager();

// Funciones globales para compatibilidad
async function guardarUltimoIngresoSatisfactorio(respuestaLedroitmaster) {
    return await firestoreManager.guardarUltimoIngresoSatisfactorio(respuestaLedroitmaster);
}

async function obtenerUltimoIngreso(iniciales) {
    return await firestoreManager.obtenerUltimoIngreso(iniciales);
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirestoreManager, firestoreManager };
}

// Exponer utilidades globales para la UI (fase 1)
window.FirestoreManager = FirestoreManager;
window.firestoreManager = firestoreManager;
window.openJornada = async function(empresaNombre, ubicacion, dispositivo, ip) {
    try {
        const sesLocal = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
        const ses = sesLocal ? JSON.parse(sesLocal) : null;
        const iniciales = ses?.iniciales;
        if (!iniciales) {
            console.error('Sin iniciales en ls_session');
            return { success: false, reason: 'no_session' };
        }
        const result = await firestoreManager.openJornada({ empresaNombre, iniciales, ubicacion, dispositivo, ip });
        // Notificar al header en tiempo real
        try {
            if (result?.success) {
                window.dispatchEvent(new CustomEvent('jornadaChanged', { detail: { status: 'open', empresaNombre, iniciales } }));
            }
        } catch (e) { /* noop */ }
        return result;
    } catch (e) {
        console.error('Error en openJornada:', e);
        return { success: false, reason: 'exception', data: { message: e?.message } };
    }
}

window.closeJornada = async function() {
    try {
        const sesLocal = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
        const ses = sesLocal ? JSON.parse(sesLocal) : null;
        const iniciales = ses?.iniciales;
        if (!iniciales) {
            console.error('Sin iniciales en ls_session');
            return { success: false, reason: 'no_session' };
        }
        const result = await firestoreManager.closeJornada({ iniciales });
        // Notificar al header en tiempo real
        try {
            if (result?.success) {
                window.dispatchEvent(new CustomEvent('jornadaChanged', { detail: { status: 'closed', iniciales } }));
            }
        } catch (e) { /* noop */ }
        return result;
    } catch (e) {
        console.error('Error en closeJornada:', e);
        return { success: false, reason: 'exception', data: { message: e?.message } };
    }
}