# 🚀 Guía Paso a Paso - Implementación Página Prueba Ingreso Derivado

## 📋 Índice
1. [Preparación del Entorno](#1-preparación-del-entorno)
2. [Configuración de Firebase](#2-configuración-de-firebase)
3. [Adaptación de Archivos](#3-adaptación-de-archivos)
4. [Integración con el Sistema](#4-integración-con-el-sistema)
5. [Configuración de Sesión](#5-configuración-de-sesión)
6. [Testing y Validación](#6-testing-y-validación)
7. [Despliegue](#7-despliegue)
8. [Mantenimiento](#8-mantenimiento)

---

## 1. Preparación del Entorno

### 1.1 Verificar Requisitos Previos

**✅ Checklist de Requisitos:**
- [ ] Sistema con autenticación funcional
- [ ] Página `index.html` (login) existente
- [ ] Endpoint `ingreso-derivado` (POST) funcional
- [ ] Página `ingreso-derivado.html` (GET) funcional
- [ ] Proyecto Firebase configurado
- [ ] Acceso a sessionStorage del navegador

### 1.2 Crear Estructura de Carpetas

```bash
# En la raíz de tu proyecto
mkdir -p assets/js
mkdir -p pages/testing
mkdir -p docs
```

**Estructura recomendada:**
```
tu-proyecto/
├── assets/
│   ├── js/
│   │   ├── firebase-init.js
│   │   └── config-prueba-ingderivado.js
│   └── css/
├── pages/
│   ├── testing/
│   │   └── prueba-ingderivado.html
│   ├── index.html
│   └── ingreso-derivado.html
└── docs/
```

### 1.3 Copiar Archivos Base

```bash
# Copiar archivos desde la documentación
cp firebase-init-template.js ./assets/js/firebase-init.js
cp config-template.js ./assets/js/config-prueba-ingderivado.js
cp prueba-ingderivado.html ./pages/testing/
```

---

## 2. Configuración de Firebase

### 2.1 Obtener Configuración de Firebase

1. **Ir a Firebase Console**: https://console.firebase.google.com
2. **Seleccionar tu proyecto**
3. **Ir a Configuración del proyecto** (⚙️)
4. **Scroll down** hasta "Tus apps"
5. **Seleccionar app web** o crear una nueva
6. **Copiar configuración**

### 2.2 Configurar firebase-init.js

Editar `./assets/js/firebase-init.js`:

```javascript
// ⚠️ REEMPLAZAR CON TU CONFIGURACIÓN
const firebaseConfig = {
    apiKey: "AIzaSyC...",                    // Tu API Key
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// ⚠️ CONFIGURAR NOMBRE DE TU SISTEMA
window.SISTEMA_NOMBRE = "MI_SISTEMA_DERIVADO";  // CAMBIAR AQUÍ

// ⚠️ VERIFICAR ESTAS URLs
window.LOGIN_URL = "index.html";                 // Tu página de login
window.INGRESO_DERIVADO_URL = "ingreso-derivado.html";      // Página de procesamiento
window.INGRESO_DERIVADO_ENDPOINT = "ingreso-derivado";      // Endpoint POST
```

### 2.3 Verificar Configuración

```javascript
// Agregar al final de firebase-init.js para testing
console.log("🔧 Configuración Firebase:", firebaseConfig.projectId);
console.log("🏢 Sistema:", window.SISTEMA_NOMBRE);
```

---

## 3. Adaptación de Archivos

### 3.1 Personalizar Configuración

Editar `./assets/js/config-prueba-ingderivado.js`:

```javascript
window.PRUEBA_INGDERIVADO_CONFIG = {
    sistema: {
        nombre: "Mi Sistema Derivado",        // ⚠️ CAMBIAR
        version: "1.0.0",
        descripcion: "Sistema derivado de Ledroit Master"
    },
    
    urls: {
        login: "index.html",                  // ⚠️ VERIFICAR
        ingresoDerivado: "ingreso-derivado.html",           // ⚠️ Página de procesamiento
        ingresoDerivadoEndpoint: "ingreso-derivado",        // ⚠️ Endpoint POST
        dashboard: "dashboard.html",          // Opcional
        ayuda: "ayuda.html"                   // Opcional
    },
    
    sesion: {
        storageKey: "ls_session",             // ⚠️ CAMBIAR SI ES DIFERENTE
        timeoutHoras: 8,                      // ⚠️ AJUSTAR SEGÚN TU SISTEMA
        timestampTimeoutMinutos: 15,          // ⚠️ AJUSTAR SEGÚN NECESIDAD
        validarEstructura: true
    }
    
    // ... resto de configuración
};
```

### 3.2 Adaptar Página Principal

Editar `./pages/testing/prueba-ingderivado.html`:

**Buscar y reemplazar:**
```html
<!-- ANTES -->
<title>Prueba de Ingreso Derivado - LEDROITSENDER</title>

<!-- DESPUÉS -->
<title>Prueba de Ingreso Derivado - MI_SISTEMA</title>
```

**Actualizar referencias de scripts:**
```html
<!-- Al final del body, ANTES de los scripts de Firebase -->
<script src="../../assets/js/config-prueba-ingderivado.js"></script>
<script src="../../assets/js/firebase-init.js"></script>
```

### 3.3 Verificar Rutas de Archivos

**Asegurar que las rutas sean correctas:**
```html
<!-- Si la página está en pages/testing/ -->
<script src="../../assets/js/config-prueba-ingderivado.js"></script>
<script src="../../assets/js/firebase-init.js"></script>

<!-- Si la página está en la raíz -->
<script src="./assets/js/config-prueba-ingderivado.js"></script>
<script src="./assets/js/firebase-init.js"></script>
```

---

## 4. Integración con el Sistema

### 4.1 Verificar Sistema de Autenticación

**Tu sistema debe tener:**
```javascript
// Estructura de sesión en sessionStorage
const sesionEjemplo = {
    "iniciales": "AB",
    "nombre": "Usuario Ejemplo",
    "foto_url": "https://...",
    "empresas": [
        {
            "nombre": "Empresa Ejemplo",
            "empresa_activa": true,
            "usuario_activo": true,
            "rol": ["A1"]
        }
    ],
    "timestamp": Date.now()
};

// Guardar en sessionStorage
sessionStorage.setItem('ls_session', JSON.stringify(sesionEjemplo));
```

### 4.2 Adaptar Estructura de Sesión (Si es Diferente)

Si tu sistema usa una estructura diferente, modificar en la página:

```javascript
// Buscar función cargarSesion() y adaptar a las claves estándar
function cargarSesion() {
    const sessionKey = getConfig('sesion').storageKey;
    const sessionData = sessionStorage.getItem(sessionKey);
    
    if (!sessionData) {
        mostrarAlertaNoSesion();
        return false;
    }
    
    try {
        const session = JSON.parse(sessionData);
        
        // ⚠️ ADAPTAR SEGÚN TU ESTRUCTURA -> MAPEAR A CLAVES ESTÁNDAR
        const iniciales = session.iniciales || session.userInitials;
        const nombre = session.nombre || session.iniciales;
        const empresas = session.empresas || session.activeCompanies;
        
        // Resto de la función...
    } catch (error) {
        console.error('Error parsing session:', error);
        return false;
    }
}
```

### 4.3 Verificar Página ingreso-derivado.html

**Asegurar que existe y funciona:**
```javascript
// Test básico - ejecutar en consola del navegador
fetch('ingreso-derivado.html')
    .then(response => {
        if (response.ok) {
console.log('✅ Página ingreso-derivado.html encontrada');
        } else {
console.error('❌ Página ingreso-derivado.html no encontrada');
        }
    });
```

---

## 5. Configuración de Sesión

### 5.1 Crear Sesión de Prueba

**Script para crear sesión de testing:**
```javascript
// Ejecutar en consola del navegador para crear sesión de prueba
function crearSesionPrueba() {
    const sesionPrueba = {
        iniciales: "TP",
        nombre: "Test Prueba",
        empresas: [
            {
                nombre: "Empresa de Prueba",
                empresa_activa: true,
                usuario_activo: true,
                rol: ["A1"]
            }
        ],
        timestamp: Date.now()
    };
    
    sessionStorage.setItem('ls_session', JSON.stringify(sesionPrueba));
    console.log('✅ Sesión de prueba creada');
    location.reload();
}

// Ejecutar
crearSesionPrueba();
```

### 5.2 Validar Estructura de Sesión

**Script de validación:**
```javascript
function validarSesion() {
    const session = sessionStorage.getItem('ls_session');
    
    if (!session) {
        console.error('❌ No hay sesión en sessionStorage');
        return false;
    }
    
    try {
        const data = JSON.parse(session);
        const required = ['iniciales', 'empresas', 'timestamp'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            console.error('❌ Campos faltantes:', missing);
            return false;
        }
        
        if (!Array.isArray(data.empresas) || data.empresas.length === 0) {
            console.error('❌ No hay empresas activas');
            return false;
        }
        
        console.log('✅ Sesión válida');
        return true;
        
    } catch (error) {
        console.error('❌ Error parsing sesión:', error);
        return false;
    }
}

// Ejecutar validación
validarSesion();
```

---

## 6. Testing y Validación

### 6.1 Test de Configuración

**Abrir la página y verificar en consola:**
```javascript
// 1. Verificar Firebase
console.log('Firebase apps:', firebase.apps.length);

// 2. Verificar configuración
console.log('Config sistema:', getConfig('sistema'));

// 3. Verificar sesión
console.log('Sesión válida:', validarSesion());

// 4. Verificar URLs
console.log('URLs configuradas:', getConfig('urls'));
```

### 6.2 Test de Modo ACTIVO

**Pasos de testing:**
1. ✅ Abrir página con sesión activa
2. ✅ Ir a pestaña "Modo ACTIVO"
3. ✅ Verificar que se muestra información de sesión
4. ✅ Ingresar URL destino: `https://ejemplo.com`
5. ✅ Ingresar nombre sistema: `Sistema Destino`
6. ✅ Hacer clic en "Generar JSON"
7. ✅ Verificar que se abre modal con JSON
8. ✅ Hacer clic en "Enviar por URL"
9. ✅ Verificar que se abre nueva ventana

### 6.3 Test de Modo PASIVO

**JSON de prueba:**
```json
{
    "iniciales": "TP",
    "nombre": "Usuario Test",
    "empresas": [
        {
            "nombre": "Empresa Test",
            "empresa_activa": true,
            "usuario_activo": true,
            "rol": ["A1"]
        }
    ],
    "timestamp": 1703123456789
}
```

**Pasos de testing:**
1. ✅ Ir a pestaña "Modo PASIVO"
2. ✅ Pegar JSON de prueba
3. ✅ Hacer clic en "Actualizar Timestamp"
4. ✅ Hacer clic en "Test Ingreso Derivado Pasivo"
5. ✅ Verificar validación exitosa
6. ✅ Hacer clic en "Enviar al endpoint /ingreso-derivado (POST)"
7. ✅ Verificar redirección correcta

### 6.4 Test de Logs y Notificaciones

**Verificar:**
- ✅ Logs se muestran en área correspondiente
- ✅ Notificaciones toast aparecen correctamente
- ✅ Botón "Limpiar Logs" funciona
- ✅ Timestamps en logs son correctos

---

## 7. Despliegue

### 7.1 Preparación para Producción

**Configurar para producción:**
```javascript
// En config-prueba-ingderivado.js
applyPresetConfig('produccion');

// Verificar configuración
window.PRUEBA_INGDERIVADO_CONFIG.funcionalidades.debugMode = false;
window.PRUEBA_INGDERIVADO_CONFIG.avanzado.logLevel = "error";
```

### 7.2 Verificaciones Finales

**Checklist pre-despliegue:**
- [ ] Configuración Firebase correcta
- [ ] URLs de navegación funcionando
- [ ] Sesión de usuario real funciona
- [ ] Endpoint /ingreso-derivado (POST) responde
- [ ] Página ingreso-derivado.html (GET) responde
 - [ ] Página ingreso-derivado.html (GET) responde

Notas de comportamiento esperado:
- Si accedes a `ingreso-derivado.html` directamente en el navegador, verás un mensaje de error como “No se encontraron datos de ingreso derivado válidos en la URL”. Esto es correcto: la página solo debe procesar solicitudes válidas que lleguen con token (redirigidas desde el endpoint POST `/ingreso-derivado`) o con parámetros en la URL.
- El flujo correcto es: enviar por POST al endpoint `/ingreso-derivado` con el campo `respuestaLMaster` en el body; el backend redirige con código 303 a `ingreso-derivado.html?token=...` y el frontend procede automáticamente a crear la sesión y redirigir a `inicio.html`.
- [ ] No hay errores en consola
- [ ] Responsive design funciona
- [ ] Todos los tests pasan

### 7.3 Despliegue con Firebase (Opcional)

Si usas Firebase Hosting:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init hosting

# Configurar firebase.json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}

# Desplegar
firebase deploy --only hosting
```

---

## 8. Mantenimiento

### 8.1 Monitoreo Regular

**Verificaciones mensuales:**
- [ ] Firebase SDK actualizado
- [ ] Configuraciones vigentes
- [ ] URLs funcionando
- [ ] Logs sin errores críticos
- [ ] Performance adecuada

### 8.2 Actualizaciones

**Cuando actualizar:**
- 🔄 Cambios en estructura de sesión
- 🔄 Nuevas URLs en el sistema
- 🔄 Actualizaciones de Firebase
- 🔄 Cambios en páginas relacionadas

### 8.3 Backup de Configuración

**Guardar configuraciones:**
```bash
# Crear backup
cp assets/js/firebase-init.js backup/firebase-init-$(date +%Y%m%d).js
cp assets/js/config-prueba-ingderivado.js backup/config-$(date +%Y%m%d).js
```

### 8.4 Troubleshooting Común

**Problemas frecuentes:**

1. **"Firebase no inicializado"**
   - ✅ Verificar configuración en firebase-init.js
   - ✅ Comprobar orden de scripts en HTML

2. **"Sesión no encontrada"**
   - ✅ Verificar clave de sessionStorage
   - ✅ Comprobar estructura de datos

3. **"Página no redirige"**
   - ✅ Verificar URLs en configuración
   - ✅ Comprobar rutas relativas/absolutas

4. **"JSON inválido en modo pasivo"**
   - ✅ Verificar formato JSON
   - ✅ Comprobar campos requeridos

---

## 🎯 Checklist Final de Implementación

### Configuración Base
- [ ] Firebase configurado correctamente
- [ ] Archivos copiados y adaptados
- [ ] Rutas de archivos correctas
- [ ] Configuración del sistema personalizada

### Integración
- [ ] Sesión de usuario funciona
- [ ] Estructura de datos compatible
- [ ] Páginas relacionadas funcionando
- [ ] URLs de navegación correctas

### Testing
- [ ] Modo ACTIVO funciona
- [ ] Modo PASIVO funciona
- [ ] Logs y notificaciones operativos
- [ ] Responsive design correcto

### Producción
- [ ] Configuración de producción aplicada
- [ ] Sin errores en consola
- [ ] Performance adecuada
- [ ] Backup de configuración creado

---

**¡Implementación Completada! 🎉**

Tu página de prueba de ingreso derivado está lista para usar. Recuerda mantener las configuraciones actualizadas y realizar testing regular para asegurar el correcto funcionamiento.