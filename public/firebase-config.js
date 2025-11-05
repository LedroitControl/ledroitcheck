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