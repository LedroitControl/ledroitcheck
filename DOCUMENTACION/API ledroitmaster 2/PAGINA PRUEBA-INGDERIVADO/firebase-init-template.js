// ============================================================================
// FIREBASE INIT TEMPLATE - PARA PÁGINA PRUEBA-INGDERIVADO
// ============================================================================
// Este archivo debe ser adaptado para cada sistema secundario
// Copiar a: ./assets/firebase-init.js

// ⚠️ IMPORTANTE: Configurar estos valores para tu proyecto
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "tu-app-id"
};

// ============================================================================
// INICIALIZACIÓN DE FIREBASE
// ============================================================================
try {
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Inicializar servicios
    const db = firebase.firestore();
    const auth = firebase.auth();
    const storage = firebase.storage();
    
    console.log('✅ Firebase inicializado correctamente');
    
    // Autenticación anónima (opcional)
    auth.signInAnonymously().then(() => {
        console.log('✅ Autenticación anónima exitosa');
    }).catch((error) => {
        console.warn('⚠️ Error en autenticación anónima:', error);
    });
    
    // Promesa para saber cuándo está listo
    window.authReady = auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ Usuario autenticado:', user.uid);
        }
    });
    
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
}

// ============================================================================
// CONFIGURACIONES ESPECÍFICAS DEL SISTEMA
// ============================================================================

// 🔧 ADAPTAR ESTAS CONFIGURACIONES PARA TU SISTEMA:

// 1. Nombre del sistema (cambiar "LEDROITSENDER" por tu nombre)
window.SISTEMA_NOMBRE = "TU_SISTEMA_AQUI";

// 2. URL de la página de login (cambiar si es diferente)
window.LOGIN_URL = "index.html";

// 3. Ruta de ingreso derivado estandarizada
//    - Página de procesamiento (GET): ingreso-derivado.html
//    - Endpoint de recepción (POST): ingreso-derivado
window.INGRESO_DERIVADO_URL = "ingreso-derivado.html";
window.INGRESO_DERIVADO_ENDPOINT = "ingreso-derivado";

// 4. Clave de sesión en sessionStorage (cambiar si usas otra)
window.SESSION_STORAGE_KEY = "ls_session";

// 5. Timeout de sesión en horas (cambiar si usas otro)
window.SESSION_TIMEOUT_HOURS = 8;

// 6. Timeout de timestamp en minutos (cambiar si usas otro)
window.TIMESTAMP_TIMEOUT_MINUTES = 15;

// ============================================================================
// FUNCIONES AUXILIARES (NO MODIFICAR)
// ============================================================================

// Función para obtener configuración del sistema
window.getSystemConfig = function() {
    return {
        nombre: window.SISTEMA_NOMBRE,
        loginUrl: window.LOGIN_URL,
        ingresoDerivadoUrl: window.INGRESO_DERIVADO_URL,
        ingresoDerivadoEndpoint: window.INGRESO_DERIVADO_ENDPOINT,
        sessionKey: window.SESSION_STORAGE_KEY,
        sessionTimeout: window.SESSION_TIMEOUT_HOURS,
        timestampTimeout: window.TIMESTAMP_TIMEOUT_MINUTES
    };
};

// Función para validar configuración
window.validateConfig = function() {
    const config = window.getSystemConfig();
    const errors = [];
    
    if (config.nombre === "TU_SISTEMA_AQUI") {
        errors.push("❌ Debes cambiar SISTEMA_NOMBRE");
    }
    
    if (firebaseConfig.apiKey === "TU_API_KEY_AQUI") {
        errors.push("❌ Debes configurar Firebase");
    }
    
    if (errors.length > 0) {
        console.error("🚨 ERRORES DE CONFIGURACIÓN:");
        errors.forEach(error => console.error(error));
        return false;
    }
    
    console.log("✅ Configuración válida");
    return true;
};

// Validar configuración al cargar
window.addEventListener('DOMContentLoaded', function() {
    window.validateConfig();
});

// ============================================================================
// NOTAS PARA DESARROLLADORES
// ============================================================================
/*
📋 PASOS PARA ADAPTAR ESTE ARCHIVO:

1. CONFIGURACIÓN DE FIREBASE:
   - Obtener configuración desde Firebase Console
   - Reemplazar valores en firebaseConfig

2. CONFIGURACIÓN DEL SISTEMA:
   - Cambiar SISTEMA_NOMBRE por el nombre de tu sistema
   - Verificar URLs de login e ingreso derivado
   - Ajustar timeouts si es necesario

3. ESTRUCTURA DE SESIÓN:
   - La página espera sesión en sessionStorage con clave 'ls_session'
   - Estructura: { initials, user, companies, timestamp, ledroitMasterResponse }
   - Si tu sistema usa otra estructura, adaptar la página principal

4. DEPENDENCIAS:
   - Firebase SDK v8.10.1 (ya incluido en la página)
   - Este archivo debe estar en ./assets/firebase-init.js

5. VALIDACIÓN:
   - Al cargar la página, se validará automáticamente la configuración
   - Revisar consola del navegador para errores

⚠️ IMPORTANTE:
- NO subir este archivo con configuraciones reales a repositorios públicos
- Usar variables de entorno en producción
- Configurar reglas de seguridad en Firebase
*/