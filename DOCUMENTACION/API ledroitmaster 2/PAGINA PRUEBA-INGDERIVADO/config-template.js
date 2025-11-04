// ============================================================================
// CONFIGURACIÓN ADAPTABLE - PÁGINA PRUEBA-INGDERIVADO
// ============================================================================
// Este archivo permite personalizar la página para diferentes sistemas
// Incluir ANTES de la página principal: <script src="config-template.js"></script>

// ============================================================================
// CONFIGURACIÓN PRINCIPAL DEL SISTEMA
// ============================================================================

window.PRUEBA_INGDERIVADO_CONFIG = {
    
    // 🏢 INFORMACIÓN DEL SISTEMA
    sistema: {
        nombre: "TU_SISTEMA_AQUI",           // Cambiar por el nombre de tu sistema
        version: "1.0.0",                    // Versión de tu sistema
        descripcion: "Sistema derivado de Ledroit Master"
    },
    
    // 🔗 URLs Y NAVEGACIÓN
    urls: {
        login: "index.html",                 // URL de tu página de login
        ingresoDerivado: "ingreso-derivado.html", // Página de procesamiento (GET)
        ingresoDerivadoEndpoint: "ingreso-derivado", // Endpoint POST estandarizado (OBLIGATORIO)
        dashboard: "dashboard.html",         // URL de tu dashboard principal (opcional)
        ayuda: "ayuda.html"                  // URL de tu página de ayuda (opcional)
    },
    
    // 💾 CONFIGURACIÓN DE SESIÓN
    sesion: {
        storageKey: "ls_session",            // Clave en sessionStorage
        timeoutHoras: 8,                     // Timeout de sesión en horas
        timestampTimeoutMinutos: 15,         // Timeout de timestamp en minutos
        validarEstructura: true              // Validar estructura de sesión
    },
    
    // 🎨 PERSONALIZACIÓN DE UI
    ui: {
        titulo: "Prueba de Ingreso Derivado", // Título de la página
        mostrarLogo: true,                   // Mostrar logo del sistema
        tema: "claro",                       // "claro" o "oscuro"
        colorPrimario: "#007bff",            // Color principal
        colorSecundario: "#6c757d"           // Color secundario
    },
    
    // ⚙️ FUNCIONALIDADES
    funcionalidades: {
        modoActivo: true,                    // Habilitar modo activo
        modoPasivo: true,                    // Habilitar modo pasivo
        logs: true,                          // Habilitar sistema de logs
        exportarLogs: false,                 // Habilitar exportación de logs
        validacionAvanzada: true,            // Validaciones adicionales
        debugMode: false                     // Modo debug (solo desarrollo)
    },
    
    // 📊 CONFIGURACIÓN DE DATOS
    datos: {
        // Estructura esperada de sesión
        estructuraSesion: {
            initials: "string",              // Iniciales del usuario
            user: "string",                  // Usuario
            companies: "array",              // Array de empresas activas
            timestamp: "number",             // Timestamp de la sesión
            ledroitMasterResponse: "object"  // Respuesta de Ledroit Master
        },
        
        // Validaciones de empresas
        empresas: {
            minimoRequerido: 1,              // Mínimo de empresas activas
            validarEstructura: true,         // Validar estructura de empresas
            camposRequeridos: ["id", "name"] // Campos requeridos en cada empresa
        }
    },
    
    // 🔧 CONFIGURACIÓN AVANZADA
    avanzado: {
        timeoutRed: 30000,                   // Timeout de red en ms
        reintentos: 3,                       // Número de reintentos
        logLevel: "info",                    // Nivel de logs: "debug", "info", "warn", "error"
        autoGuardarLogs: true,               // Auto-guardar logs en localStorage
        limpiarLogsAlIniciar: false          // Limpiar logs al iniciar
    }
};

// ============================================================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================================================

// Función para obtener configuración
window.getConfig = function(seccion = null) {
    if (seccion) {
        return window.PRUEBA_INGDERIVADO_CONFIG[seccion] || {};
    }
    return window.PRUEBA_INGDERIVADO_CONFIG;
};

// Función para actualizar configuración
window.updateConfig = function(seccion, valores) {
    if (window.PRUEBA_INGDERIVADO_CONFIG[seccion]) {
        Object.assign(window.PRUEBA_INGDERIVADO_CONFIG[seccion], valores);
        console.log(`✅ Configuración actualizada: ${seccion}`, valores);
    } else {
        console.error(`❌ Sección de configuración no encontrada: ${seccion}`);
    }
};

// Función para validar configuración
window.validateConfiguration = function() {
    const config = window.PRUEBA_INGDERIVADO_CONFIG;
    const errores = [];
    
    // Validar sistema
    if (config.sistema.nombre === "TU_SISTEMA_AQUI") {
        errores.push("❌ Debes cambiar el nombre del sistema");
    }
    
    // Validar URLs
    if (!config.urls.login || !config.urls.ingresoDerivado) {
        errores.push("❌ URLs de login e ingreso derivado son obligatorias");
    }
    
    // Validar sesión
    if (!config.sesion.storageKey) {
        errores.push("❌ Clave de sessionStorage es obligatoria");
    }
    
    if (errores.length > 0) {
        console.error("🚨 ERRORES DE CONFIGURACIÓN:");
        errores.forEach(error => console.error(error));
        return false;
    }
    
    console.log("✅ Configuración válida");
    return true;
};

// Función para aplicar configuración de UI
window.applyUIConfig = function() {
    const ui = window.getConfig('ui');
    
    // Aplicar título
    if (ui.titulo && document.title !== ui.titulo) {
        document.title = ui.titulo;
    }
    
    // Aplicar colores
    if (ui.colorPrimario) {
        document.documentElement.style.setProperty('--color-primario', ui.colorPrimario);
    }
    
    if (ui.colorSecundario) {
        document.documentElement.style.setProperty('--color-secundario', ui.colorSecundario);
    }
    
    // Aplicar tema
    if (ui.tema === 'oscuro') {
        document.body.classList.add('tema-oscuro');
    }
};

// ============================================================================
// CONFIGURACIONES PREDEFINIDAS
// ============================================================================

// Configuración para desarrollo
window.CONFIG_DESARROLLO = {
    funcionalidades: {
        debugMode: true,
        logs: true,
        exportarLogs: true
    },
    avanzado: {
        logLevel: "debug",
        limpiarLogsAlIniciar: true
    }
};

// Configuración para producción
window.CONFIG_PRODUCCION = {
    funcionalidades: {
        debugMode: false,
        logs: false,
        exportarLogs: false
    },
    avanzado: {
        logLevel: "error",
        limpiarLogsAlIniciar: true
    }
};

// Función para aplicar configuración predefinida
window.applyPresetConfig = function(preset) {
    switch(preset) {
        case 'desarrollo':
            Object.assign(window.PRUEBA_INGDERIVADO_CONFIG.funcionalidades, window.CONFIG_DESARROLLO.funcionalidades);
            Object.assign(window.PRUEBA_INGDERIVADO_CONFIG.avanzado, window.CONFIG_DESARROLLO.avanzado);
            console.log("✅ Configuración de desarrollo aplicada");
            break;
        case 'produccion':
            Object.assign(window.PRUEBA_INGDERIVADO_CONFIG.funcionalidades, window.CONFIG_PRODUCCION.funcionalidades);
            Object.assign(window.PRUEBA_INGDERIVADO_CONFIG.avanzado, window.CONFIG_PRODUCCION.avanzado);
            console.log("✅ Configuración de producción aplicada");
            break;
        default:
            console.warn("⚠️ Preset de configuración no reconocido:", preset);
    }
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

// Validar configuración al cargar
window.addEventListener('DOMContentLoaded', function() {
    // Validar configuración
    window.validateConfiguration();
    
    // Aplicar configuración de UI
    window.applyUIConfig();
    
    // Log de configuración cargada
    const config = window.getConfig();
    console.log("📋 Configuración cargada:", config.sistema.nombre, "v" + config.sistema.version);
});

// ============================================================================
// NOTAS PARA DESARROLLADORES
// ============================================================================
/*
📋 CÓMO USAR ESTE ARCHIVO:

1. PERSONALIZACIÓN BÁSICA:
   - Cambiar 'sistema.nombre' por el nombre de tu sistema
   - Actualizar URLs en 'urls' según tu estructura
   - Ajustar configuración de sesión si es necesaria

2. PERSONALIZACIÓN DE UI:
   - Modificar colores, título y tema en 'ui'
   - Los colores se aplicarán como variables CSS

3. FUNCIONALIDADES:
   - Habilitar/deshabilitar características según necesidades
   - Usar presets para desarrollo/producción

4. INCLUSIÓN EN HTML:
   - Incluir ANTES de la página principal:
     <script src="config-template.js"></script>
     <script src="prueba-ingderivado.html"></script>

5. CONFIGURACIÓN DINÁMICA:
   - Usar updateConfig() para cambios en tiempo de ejecución
   - Usar applyPresetConfig() para aplicar configuraciones predefinidas

EJEMPLO DE USO:
```javascript
// Cambiar nombre del sistema
updateConfig('sistema', { nombre: 'Mi Sistema Derivado' });

// Aplicar configuración de desarrollo
applyPresetConfig('desarrollo');

// Obtener configuración de URLs
const urls = getConfig('urls');
```
*/