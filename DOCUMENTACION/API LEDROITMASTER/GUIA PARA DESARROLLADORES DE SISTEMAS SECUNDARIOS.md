# GUÍA PARA DESARROLLADORES DE SISTEMAS SECUNDARIOS - VERSIÓN 2.1

**INTEGRACIÓN CON EL SISTEMA MADRE DE SESIONES: LEDROITMASTER**

---

## 🎯 INTRODUCCIÓN

Esta guía explica cómo integrar tu sistema con la Familia Ledroit para manejar sesiones de usuario de manera unificada.

**Tu sistema debe implementar:**
1. **PRIMER INGRESO** - Autenticación inicial con LEDROITMASTER
2. **INGRESO DERIVADO ACTIVO** - Enviar usuarios a otros sistemas
3. **INGRESO DERIVADO PASIVO** - Recibir usuarios de otros sistemas

---

## ⚙️ CONFIGURACIONES OBLIGATORIAS

### 🔄 PERSISTENCIA DE SESIÓN
**CONSULTA OBLIGATORIA AL PROPIETARIO:** Debes preguntarle al propietario si su sistema debe funcionar en múltiples ventanas del mismo navegador:

**Opción A - Una sola ventana (Recomendado):**
```javascript
// Solo usar sessionStorage
sessionStorage.setItem('isAuthenticated', 'true');
sessionStorage.setItem('userInitials', respuestaLedroitmaster.iniciales);
```

**Opción B - Múltiples ventanas:**
```javascript
// Usar sessionStorage + localStorage como respaldo
sessionStorage.setItem('isAuthenticated', 'true');
localStorage.setItem('userInitials_backup', respuestaLedroitmaster.iniciales);
```

### 📡 MÉTODO DE ENVÍO
**OBLIGATORIO:** Todos los sistemas deben usar **método GET con parámetros URL** para envío de datos entre sistemas.

**✅ USAR:** GET con parámetros URL codificados
**❌ NO USAR:** POST para datos de sesión (reservado para formularios)

```javascript
function enviarPorURL(urlDestino, respuestaLMaster) {
    const urlCompleta = `${urlDestino}?respuestaLMaster=${encodeURIComponent(JSON.stringify(respuestaLMaster))}`;
    window.open(urlCompleta, '_blank');
}
```

### 🚫 MENSAJES DE USUARIO
**OBLIGATORIO:** Los mensajes NO deben ser de tipo `alert()` (todos incluyendo los de error).

**❌ NO USAR:**
```javascript
alert('Error en el sistema');
alert('Usuario autenticado correctamente');
```

**✅ USAR:** Sistema de notificaciones tipo "toast" o mensajes en pantalla:
```javascript
function showToast(message, type = 'info') {
    // Implementar sistema de notificaciones moderno
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
```

### 🎛️ GADGET DE INGRESOS ACTIVOS
**OBLIGATORIO:** Todos los sistemas secundarios deben implementar el gadget de ingresos activos con funciones y estilos EXACTAMENTE IGUALES.

**📋 REFERENCIA COMPLETA:** Para implementar el gadget correctamente, consultar:

**→ [GUIA GADGET INGRESOS ACTIVOS.md](./GUIA%20GADGET%20INGRESOS%20ACTIVOS.md)**

**Características obligatorias:**
- ✅ **Botón flotante circular** con flecha de envío blanca
- ✅ **Modal de configuración** con opciones exactas
- ✅ **Modal de agregar sistema** con validaciones
- ✅ **Modal de editar sistema** con funcionalidad completa
- ✅ **Checkbox "Abrir en nueva ventana"** con estilo específico
- ✅ **Validación por roles y empresas** según reglas establecidas
- ✅ **Persistencia en localStorage** con estructura definida
- ✅ **Notificaciones toast** (NO alerts)
- ✅ **Scroll automático** y navegación fluida

**⚠️ IMPORTANTE:** NO modificar funciones, estilos o comportamientos. La implementación debe ser IDÉNTICA en todos los sistemas para mantener homogeneidad.

### 🎨 HEADER ESTANDARIZADO (RECOMENDACIÓN)
**ESTÁNDAR RECOMENDADO:** Este es el header estándar, pero debes preguntarle al propietario si quiere cambiar algo de este estándar:

```html
<header class="ledroit-header">
    <div class="header-left">
        <div class="user-avatar">
            <img src="{{foto_url}}" alt="Avatar" class="avatar-img">
            <span class="user-initials">{{iniciales}}</span>
        </div>
        <div class="user-info">
            <span class="system-name">{{nombre_sistema}}</span>
            <span class="user-companies">{{empresas_activas}}</span>
        </div>
    </div>
    <div class="header-right">
        <span class="user-roles">{{roles}}</span>
        <span class="user-status">{{estatus}}</span>
    </div>
</header>
```

**Elementos incluidos:**
- Avatar del usuario con iniciales como fallback
- Nombre del sistema
- Empresas activas del usuario
- Roles del usuario
- Estatus de conexión
- Diseño responsive

### 🖼️ MANEJO DE AVATAR DEL USUARIO
**CRÍTICO:** La URL del avatar puede contener caracteres especiales que requieren limpieza:

```javascript
function limpiarFotoUrl(fotoUrl) {
    if (!fotoUrl) return null;
    
    // Limpieza robusta de la URL del avatar
    return fotoUrl
        .replace(/^[\s`'"]+|[\s`'"]+$/g, '') // Eliminar espacios, backticks y comillas del inicio y final
        .replace(/[`\s]/g, ''); // Eliminar todos los backticks y espacios internos
}

// Uso en el avatar
if (fotoUrl) {
    const fotoUrlLimpia = limpiarFotoUrl(fotoUrl);
    if (fotoUrlLimpia && fotoUrlLimpia.startsWith('http')) {
        // Usar imagen limpia
        img.src = fotoUrlLimpia;
    } else {
        // Usar iniciales como fallback
        avatar.textContent = iniciales;
    }
}
```

---

## 🧪 HERRAMIENTA DE DESARROLLO Y PRUEBAS

### Página de Prueba: `prueba-ingderivado.html`

**OBLIGATORIO:** Todo sistema secundario debe implementar una página de pruebas similar para desarrollo y testing.

#### Características principales:
- **Interfaz con pestañas:** ACTIVO, PASIVO, INFORMACIÓN
- **Modo ACTIVO:** Simula envío de usuarios a otros sistemas
- **Modo PASIVO:** Simula recepción de usuarios desde otros sistemas
- **Logs en tiempo real:** Para debugging y seguimiento en la página (NO en consola)
- **Validaciones completas:** Timestamp, empresas, metainformación
- **Sistema de notificaciones:** Usar "toasts" en lugar de alerts. Modals/dialog cuando sea necesario confirmacion del usuario, o ingreso de texto.
- **Método URL obligatorio:** Solo envío por parámetros URL

#### Sistema de Logs en Página
**OBLIGATORIO:** Los logs deben aparecer en la página de actividad, NO solo en consola:

```javascript
function log(message, type = 'info') {
    // Agregar al área de logs visible en la página
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Ejemplos de uso:
log('ENVÍO ACTIVO - Enviando usuario a SISTEMA_DESTINO', 'info');
log('ENVÍO ACTIVO - URL destino: https://ejemplo.com', 'info');
log('ENVÍO ACTIVO - Datos enviados: {...}', 'info');
log('ENVÍO PASIVO - Recibiendo datos de otro sistema', 'info');
```

#### Plantilla HTML Completa

**📄 REFERENCIA:** Para obtener la plantilla HTML/CSS/JavaScript completa y lista para usar, consultar:

**→ [GUIA HTML-JAVASCRIPT PLANTILLAS.md](./GUIA%20HTML-JAVASCRIPT%20PLANTILLAS.md)**

Esta guía contiene:
- ✅ **Código completo** de `prueba-ingderivado.html`
- ✅ **Instrucciones de personalización** paso a paso
- ✅ **Checklist de implementación**
- ✅ **Documentación de funciones principales**

#### Elementos Mínimos Requeridos

Si prefieres implementar desde cero, estos son los elementos **OBLIGATORIOS**:

```html
<!-- Contenedor de toasts (OBLIGATORIO) -->
<div class="toast-container" id="toastContainer"></div>

<!-- Área de logs visible (OBLIGATORIO) -->
<div class="log-area">
    <h3>📝 Logs del Sistema</h3>
    <div id="logContainer" class="log-container"></div>
</div>
```

```javascript
// Sistema de toasts (OBLIGATORIO - NO usar alert())
function showToast(message, type = 'info') { /* Ver guía completa */ }

// Sistema de logs en página (OBLIGATORIO - NO solo consola)
function log(message, type = 'info') { /* Ver código arriba */ }

// Función de envío URL (OBLIGATORIO - NO usar POST)
function enviarPorURL(urlDestino, respuestaLMaster) { /* Ver código arriba */ }
```

#### Funcionalidades obligatorias:

**MODO ACTIVO:**
- Obtener datos de sesión actual
- Formulario para especificar sistema destino
- Generar metainformación automáticamente
- **SOLO método URL** (eliminar opciones POST)
- Validar datos antes del envío
- **Usar toasts** para notificaciones
- **Logs visibles** en la página de actividad

**MODO PASIVO:**
- Área para pegar JSON de prueba
- Actualizar timestamp automáticamente
- Validar estructura de respuestaLMaster
- Procesar y guardar en ultimosIngresosSatisfactorios
- Crear sesión derivada
- **Usar toasts** para mensajes de estado
- **Logs visibles** en la página de actividad

**LOGS:**
- Registro de todas las operaciones **EN LA PÁGINA**
- Diferentes niveles (INFO, SUCCESS, ERROR, WARNING)
- Función para limpiar logs
- Timestamps en cada entrada
- **NO depender solo de consola del navegador**

#### JavaScript esencial:
```javascript
// Sistema de notificaciones (OBLIGATORIO)
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.float = 'right';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => toast.remove();
    
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Variables globales
let currentTab = 'activo';
let sessionData = null;

// Funciones principales
function switchTab(tabName) { /* Cambiar pestañas */ }
function enviarIngresoDerivado() { 
    // SOLO método URL - NO implementar POST
    log('ENVÍO ACTIVO - Iniciando envío', 'info');
    enviarPorURL(urlDestino, respuestaLMaster);
    log('ENVÍO ACTIVO - Usuario enviado exitosamente', 'success');
}
function testIngresoDerivadoPasivo() { 
    log('ENVÍO PASIVO - Procesando datos recibidos', 'info');
    /* Modo PASIVO */ 
}
function generarJSON() { /* Generar JSON para copiar */ }
function copiarJSON() { 
    // ❌ NO USAR: alert('JSON copiado');
    // ✅ USAR: 
    showToast('JSON copiado al portapapeles', 'success');
}
function log(message, type) { /* Agregar entrada al log VISIBLE */ }
function clearLogs() { /* Limpiar área de logs */ }

// Función URL obligatoria
function enviarPorURL(urlDestino, respuestaLMaster) {
    const urlCompleta = `${urlDestino}?respuestaLMaster=${encodeURIComponent(JSON.stringify(respuestaLMaster))}`;
    window.open(urlCompleta, '_blank');
    
    showToast('Usuario enviado correctamente', 'success');
}

// Limpieza de foto_url (CRÍTICO)
function limpiarFotoUrl(fotoUrl) {
    if (!fotoUrl) return null;
    
    return fotoUrl
        .replace(/^[\s`'"]+|[\s`'"]+$/g, '') // Eliminar espacios, backticks y comillas del inicio y final
        .replace(/[`\s]/g, ''); // Eliminar todos los backticks y espacios internos
}
```
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>🧪 Prueba Ingreso Derivado - [TU_SISTEMA]</title>
    <!-- CSS minimalista y profesional -->
</head>
<body>
    <div class="container">
        <!-- Header con título y descripción -->
        <div class="header">
            <h1>🧪 Prueba Ingreso Derivado</h1>
            <p>Herramienta de desarrollo para testing de sesiones derivadas</p>
        </div>

        <!-- Pestañas de navegación -->
        <div class="tabs">
            <button class="tab active" onclick="switchTab('activo')">🚀 ACTIVO</button>
            <button class="tab" onclick="switchTab('pasivo')">📥 PASIVO</button>
            <button class="tab" onclick="switchTab('info')">📋 INFO</button>
        </div>

        <!-- Contenido de pestañas -->
        <div class="content">
            <!-- MODO ACTIVO -->
            <div id="activo" class="section active">
                <h2>🚀 Ingreso Derivado ACTIVO</h2>
                <!-- Formulario para enviar usuarios -->
                <!-- Solo método GET con parámetros URL -->
                <!-- Botón para generar JSON -->
            </div>

            <!-- MODO PASIVO -->
            <div id="pasivo" class="section">
                <h2>📥 Ingreso Derivado PASIVO</h2>
                <!-- Área de texto para JSON de prueba -->
                <!-- Botón para actualizar timestamp -->
                <!-- Botón para probar procesamiento -->
            </div>

            <!-- INFORMACIÓN -->
            <div id="info" class="section">
                <h2>📋 Información del Sistema</h2>
                <!-- Documentación y guías -->
            </div>

            <!-- LOGS -->
            <div class="log-area">
                <!-- Área de logs en tiempo real -->
            </div>
        </div>
    </div>
</body>
</html>
```

#### Funcionalidades obligatorias:

**MODO ACTIVO:**
- Obtener datos de sesión actual
- Formulario para especificar sistema destino
- Generar metainformación automáticamente
- **SOLO método GET con parámetros URL** (eliminar opciones POST)
- Validar datos antes del envío
- **Usar toasts** para notificaciones

**MODO PASIVO:**
- Área para pegar JSON de prueba
- Actualizar timestamp automáticamente
- Validar estructura de respuestaLMaster
- Procesar y guardar en ultimosIngresosSatisfactorios
- Crear sesión derivada
- **Usar toasts** para mensajes de estado

**LOGS:**
- Registro de todas las operaciones
- Diferentes niveles (INFO, SUCCESS, ERROR, WARNING)
- Función para limpiar logs
- Timestamps en cada entrada

#### JavaScript esencial:
```javascript
// Sistema de notificaciones (OBLIGATORIO)
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.float = 'right';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => toast.remove();
    
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Variables globales
let currentTab = 'activo';
let sessionData = null;

// Funciones principales
function switchTab(tabName) { /* Cambiar pestañas */ }
function enviarIngresoDerivado() { 
    // SOLO método GET con parámetros URL - NO implementar POST
    enviarPorURL(urlDestino, respuestaLMaster);
}
function testIngresoDerivadoPasivo() { /* Modo PASIVO */ }
function generarJSON() { /* Generar JSON para copiar */ }
function copiarJSON() { 
    // ❌ NO USAR: alert('JSON copiado');
    // ✅ USAR: 
    showToast('JSON copiado al portapapeles', 'success');
}
function addLog(message, type) { /* Agregar entrada al log */ }
function clearLogs() { /* Limpiar área de logs */ }

// Función GET con parámetros URL obligatoria
function enviarPorURL(urlDestino, respuestaLMaster) {
    const urlCompleta = `${urlDestino}?respuestaLMaster=${encodeURIComponent(JSON.stringify(respuestaLMaster))}`;
    
    window.open(urlCompleta, '_blank');
    
    showToast('Usuario enviado correctamente', 'success');
}
```

---

## 🔐 1. PRIMER INGRESO

### ¿Qué es?
Es cuando un usuario intenta ingresar **por primera ocasión** a un sistema de la familia Ledroit mediante login local.

### Flujo del PRIMER INGRESO:
1. Usuario envía credenciales a LEDROITMASTER
2. Recibe respuesta JSON
3. **[OPCIONAL]** Tu sistema decide si agregar una segunda capa de análisis
4. **Si se permite el acceso:** Guardar la respuesta JSON en colección "ultimosIngresosSatisfactorios" con estructura estandarizada

### Implementación:

#### 1.1 Formulario de Login
```html
<form id="loginForm">
    <input type="text" id="iniciales" placeholder="Iniciales (opcional)" autofocus>
    <input type="text" id="claBComun" placeholder="Escribe tu ClaBComun" required>
    <button type="submit">Ingresar</button>
    <button type="button" id="togglePassword">👁️</button>
</form>
```

**Reglas de diseño:**
- Diseño minimalista, hermoso y profesional
- Focus automático en campo "iniciales" al cargar
- ClaBComun oculta con `***` pero NO declarar como `type="password"`
- Toggle profesional y minimalista para mostrar/ocultar ClaBComun
- Navegación con Tab: iniciales → claBComun → botón Ingresar (saltar toggle)
- Enter en claBComun ejecuta el botón Ingresar
- **NO usar alerts** para mensajes de error o éxito

#### 1.2 Llamada a API LEDROITMASTER
```javascript
async function primerIngreso() {
    const claBComun = document.getElementById('claBComun').value;
    const iniciales = document.getElementById('iniciales').value;
    const empresa = document.getElementById('empresa').value; // Consultar al propietario
    
    const requestData = { claBComun };
    if (iniciales) requestData.iniciales = iniciales;
    if (empresa) requestData.empresaSolicitante = empresa;
    
    try {
        const response = await fetch('https://authlogin-fmunxt6pjq-uc.a.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        const respuestaLedroitmaster = await response.json();
        
        if (respuestaLedroitmaster.success) {
            // ✅ USAR toasts en lugar de alerts
            showToast('Autenticación exitosa', 'success');
            
            // Validar acceso local (opcional)
            const accesoPermitido = validarAccesoLocal(respuestaLedroitmaster.data);
            
            if (accesoPermitido) {
                // Guardar en ultimosIngresosSatisfactorios
                await guardarUltimoIngresoSatisfactorio(respuestaLedroitmaster);
                
                // Crear sesión local
                crearSesionLocal(respuestaLedroitmaster.data);
                
                // Redirigir a dashboard
                window.location.href = '/dashboard';
            } else {
                showToast('No tienes permisos para acceder a este sistema', 'error');
            }
        } else {
            showToast('Credenciales incorrectas', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        
        // Intentar fallback solo si hay error de conexión
        const fallbackExitoso = await intentarFallback(claBComun, iniciales);
        if (!fallbackExitoso) {
            showToast('Error de conexión. Intenta más tarde.', 'error');
        }
    }
}
```
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        const respuestaLedroitmaster = await response.json();
        
        if (respuestaLedroitmaster.success) {
            // ✅ USAR toasts en lugar de alerts
            showToast('Autenticación exitosa', 'success');
            
            // Validar acceso local (opcional)
            const accesoPermitido = validarAccesoLocal(respuestaLedroitmaster.data);
            
            if (accesoPermitido) {
                // Guardar en ultimosIngresosSatisfactorios
                await guardarUltimoIngresoSatisfactorio(respuestaLedroitmaster);
                
                // Crear sesión local
                crearSesionLocal(respuestaLedroitmaster.data);
                
                // Redirigir a dashboard
                window.location.href = '/dashboard';
            } else {
                showToast('No tienes permisos para acceder a este sistema', 'error');
            }
        } else {
            showToast('Credenciales incorrectas', 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        
        // Intentar fallback solo si hay error de conexión
        const fallbackExitoso = await intentarFallback(claBComun, iniciales);
        if (!fallbackExitoso) {
            showToast('Error de conexión. Intenta más tarde.', 'error');
        }
    }
}

function validarAccesoLocal(datosUsuario) {
    // CONSULTAR AL PROPIETARIO: ¿Qué validaciones adicionales necesitas?
    // Ejemplos:
    // - ¿Solo usuarios con rol específico?
    // - ¿Solo empresas específicas?
    // - ¿Validar estado activo del usuario?
    
    // Validaciones básicas:
    if (!datosUsuario.iniciales || !datosUsuario.empresas) {
        return false;
    }
    
    // Verificar que tenga al menos una empresa activa
    const empresasActivas = datosUsuario.empresas.filter(emp => 
        emp.empresa_activa && emp.usuario_activo
    );
    
    return empresasActivas.length > 0;
}

async function guardarUltimoIngresoSatisfactorio(respuestaLedroitmaster) {
    // ESTRUCTURA ESTANDARIZADA OBLIGATORIA
    const iniciales = respuestaLedroitmaster.data.iniciales;
    const documentoKey = iniciales;
    
    const documentoEstandarizado = {
        claBComun: '', // Se deja vacío por seguridad
        iniciales: iniciales,
        sistemaOrigen: 'TU_SISTEMA_NOMBRE', // Consultar al propietario
        timestamp: new Date().toISOString(),
        respuestaLMaster: respuestaLedroitmaster  // Respuesta completa tal cual
    };
    
    // Implementar según tu base de datos:
    // Firebase: await db.collection('ultimosIngresosSatisfactorios').doc(documentoKey).set(documentoEstandarizado)
    // MySQL: INSERT INTO ultimosIngresosSatisfactorios (iniciales, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?
    // MongoDB: await collection.replaceOne({iniciales: documentoKey}, documentoEstandarizado, {upsert: true})
    
    // Ejemplo temporal con localStorage:
    localStorage.setItem(`ultimosIngresosSatisfactorios_${documentoKey}`, JSON.stringify(documentoEstandarizado));
}

function crearSesionLocal(respuestaLedroitmaster) {
    // CONSULTAR AL PROPIETARIO sobre persistencia de sesión:
    // Opción A - Una sola ventana (sessionStorage únicamente)
    // Opción B - Múltiples ventanas (sessionStorage + localStorage como respaldo)
    
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userInitials', respuestaLedroitmaster.iniciales);
    sessionStorage.setItem('userEmpresas', JSON.stringify(respuestaLedroitmaster.empresas));
    sessionStorage.setItem('loginTimestamp', new Date().toISOString());
    sessionStorage.setItem('sessionType', 'PRIMER_INGRESO');
}
```

#### 1.3 Sistema de Fallback
```javascript
async function intentarFallback(claBComun, iniciales) {
    // Solo usar fallback si la API NO responde (error de conexión)
    // NO usar si la API responde negativamente
    
    try {
        const ultimoIngreso = localStorage.getItem(`ultimosIngresosSatisfactorios_${iniciales}`);
        if (ultimoIngreso) {
            const documentoEstandarizado = JSON.parse(ultimoIngreso);
            
            // Validar credenciales contra último ingreso exitoso
            if (documentoEstandarizado.claBComun === claBComun && documentoEstandarizado.iniciales === iniciales) {
                // Crear sesión con la información de respuestaLMaster/data
                crearSesionLocal(documentoEstandarizado.respuestaLMaster.data);
                return true;
            }
        }
    } catch (error) {
        console.error('Error en fallback:', error);
    }
    
    return false;
}
```

---

## 🔄 2. INGRESO DERIVADO ACTIVO

### ¿Qué es?
Cuando tu sistema **ACTIVAMENTE solicita** ingresar a otro sistema (que se convierte en pasivo).

### Flujo:
1. Usuario hace clic en botón para ir a otro sistema
2. Tu sistema obtiene el documento estandarizado de "ultimosIngresosSatisfactorios"
3. Modifica la metainformación (sistemaOrigen, timestamp) y envía respuestaLMaster al sistema destino
4. Sistema destino decide si permite acceso

### Implementación:
```javascript
async function enviarAOtroSistema(urlDestino, sistemaDestino) {
    // 1. Obtener documento estandarizado guardado
    const iniciales = sessionStorage.getItem('userInitials');
    const documentoEstandarizado = await obtenerUltimoIngresoSatisfactorio(iniciales);
    
    if (!documentoEstandarizado) {
        showToast('Debes iniciar sesión primero', 'error');
        return;
    }
    
    // 2. Preparar respuestaLMaster con metainformación actualizada
    const respuestaLMasterModificada = {
        ...documentoEstandarizado.respuestaLMaster,
        // Actualizar metainformación secundaria (fuera del nodo data)
        sistemaOrigen: 'TU_SISTEMA_NOMBRE', // Consultar al propietario
        timestamp: new Date().toISOString()
    };
    
    // 3. Enviar al sistema destino (SOLO GET con parámetros URL)
    enviarPorURL(urlDestino, respuestaLMasterModificada);
    showToast(`Usuario enviado a ${sistemaDestino}`, 'success');
}

async function obtenerUltimoIngresoSatisfactorio(iniciales) {
    // Obtener de la colección "ultimosIngresosSatisfactorios"
    // Ejemplo temporal con localStorage:
    const data = localStorage.getItem(`ultimosIngresosSatisfactorios_${iniciales}`);
    return data ? JSON.parse(data) : null;
}

function enviarPorURL(urlDestino, respuestaLMasterModificada) {
    // OBLIGATORIO: Solo método GET con parámetros URL
    const urlCompleta = `${urlDestino}?respuestaLMaster=${encodeURIComponent(JSON.stringify(respuestaLMasterModificada))}`;
    
    // Log en página de actividad
    log(`ENVÍO - URL completa generada (${urlCompleta.length} caracteres)`, 'info');
    
    window.open(urlCompleta, '_blank');
    
    showToast('Usuario enviado correctamente', 'success');
    log('ENVÍO - Ventana abierta exitosamente', 'success');
}
```

---

## 📥 3. INGRESO DERIVADO PASIVO

### ¿Qué es?
Cuando tu sistema **RECIBE una solicitud** de ingreso de otro sistema (activo).

### Flujo:
1. Recibir respuestaLMaster del sistema activo
2. Analizar metainformación (fuera del nodo data) y validar nodo data
3. Decidir si permitir acceso
4. **Si se permite:** Actualizar "ultimosIngresosSatisfactorios" con la respuestaLMaster recibida

### Implementación:
```javascript
// Al cargar la página, verificar si hay solicitud de ingreso derivado
window.addEventListener('DOMContentLoaded', function() {
    verificarIngresoDerivado();
});

function verificarIngresoDerivado() {
    // Verificar si hay datos de respuestaLMaster (POST o URL)
    const respuestaLMaster = obtenerRespuestaLMaster();
    
    if (respuestaLMaster) {
        procesarIngresoDerivadoPasivo(respuestaLMaster);
    }
}

function obtenerRespuestaLMaster() {
    // Opción 1: Desde POST
    const formData = new FormData(document.forms[0]); // Si hay formulario
    const postData = formData.get('respuestaLMaster');
    if (postData) {
        return JSON.parse(postData);
    }
    
    // Opción 2: Desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlData = urlParams.get('respuestaLMaster');
    if (urlData) {
        return JSON.parse(urlData);
    }
    
    return null;
}

async function procesarIngresoDerivadoPasivo(respuestaLMaster) {
    try {
        // 1. Extraer metainformación (fuera del nodo data) y datos del usuario
        const metaInfo = {
            sistemaOrigen: respuestaLMaster.sistemaOrigen || 'SISTEMA_DESCONOCIDO',
            timestamp: respuestaLMaster.timestamp,
            iniciales: respuestaLMaster.data.iniciales
        };
        
        const datosUsuario = respuestaLMaster.data;
        
        // 2. Validar metainformación
        const metaInfoValida = validarMetaInformacion(metaInfo);
        
        // 3. Validar datos del usuario
        const datosValidos = validarDatosUsuario(datosUsuario);
        
        // 4. Decidir si permitir acceso
        if (metaInfoValida && datosValidos) {
            // 5. OBLIGATORIO: Actualizar ultimosIngresosSatisfactorios con respuestaLMaster recibida
            await actualizarUltimoIngresoSatisfactorio(respuestaLMaster, metaInfo.iniciales);
            
            // 6. Crear sesión derivada
            crearSesionDerivada(datosUsuario, metaInfo);
            
            // 7. Notificar auditoría
            await notificarAuditoria(metaInfo.iniciales, metaInfo.sistemaOrigen, 'TU_SISTEMA', 'EXITOSO');
            
            // 8. Redirigir a dashboard
            window.location.href = '/dashboard';
        } else {
            // Rechazar acceso
            showToast('No tienes permisos para acceder a este sistema', 'error');
            await notificarAuditoria(metaInfo.iniciales, metaInfo.sistemaOrigen, 'TU_SISTEMA', 'RECHAZADO');
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error procesando ingreso derivado:', error);
        showToast('Error procesando solicitud de acceso', 'error');
    }
}

function validarMetaInformacion(metaInfo) {
    // CONSULTAR AL PROPIETARIO: ¿Qué validaciones necesitas en la metainformación?
    // Ejemplos:
    // - ¿Verificar que el sistema origen esté autorizado?
    // - ¿Comprobar timestamp (no muy antiguo)?
    
    // Validaciones básicas:
    if (!metaInfo.sistemaOrigen || !metaInfo.iniciales) {
        return false;
    }
    
    // Verificar que el timestamp no sea muy antiguo (ej: máximo 1 hora)
    if (metaInfo.timestamp) {
        const timestamp = new Date(metaInfo.timestamp);
        const ahora = new Date();
        const horasTranscurridas = (ahora - timestamp) / (1000 * 60 * 60);
        
        return horasTranscurridas <= 1;
    }
    
    return true;
}

function validarDatosUsuario(datosUsuario) {
    // Misma lógica que en PRIMER INGRESO
    return validarAccesoLocal(datosUsuario);
}

async function actualizarUltimoIngresoSatisfactorio(respuestaLMaster, iniciales) {
    // OBLIGATORIO: Actualizar colección "ultimosIngresosSatisfactorios"
    // Crear o actualizar documento con las iniciales como llave
    
    const documentoKey = iniciales;
    
    // ESTRUCTURA ESTANDARIZADA: Crear metainformación si no existe
    const documentoEstandarizado = {
        claBComun: respuestaLMaster.claBComun || '', // Si no viene, se deja vacío
        iniciales: iniciales,
        sistemaOrigen: respuestaLMaster.sistemaOrigen || 'SISTEMA_DERIVADO',
        timestamp: respuestaLMaster.timestamp || new Date().toISOString(),
        respuestaLMaster: respuestaLMaster  // Respuesta completa recibida
    };
    
    // Implementar según tu base de datos:
    // Firebase: await db.collection('ultimosIngresosSatisfactorios').doc(documentoKey).set(documentoEstandarizado)
    // MySQL: UPDATE ultimosIngresosSatisfactorios SET data = ? WHERE iniciales = ?
    // MongoDB: await collection.replaceOne({iniciales: documentoKey}, documentoEstandarizado, {upsert: true})
    
    // Ejemplo temporal con localStorage:
    localStorage.setItem(`ultimosIngresosSatisfactorios_${documentoKey}`, JSON.stringify(documentoEstandarizado));
}

function crearSesionDerivada(datosUsuario, metaInfo) {
    // CONSULTAR AL PROPIETARIO: ¿Qué información necesitas en la sesión?
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userInitials', datosUsuario.iniciales);
    sessionStorage.setItem('userEmpresas', JSON.stringify(datosUsuario.empresas));
    sessionStorage.setItem('loginTimestamp', new Date().toISOString());
    sessionStorage.setItem('sessionType', 'DERIVADO_PASIVO');
    sessionStorage.setItem('sistemaOrigen', metaInfo.sistemaOrigen);
}

async function notificarAuditoria(iniciales, sistemaOrigen, sistemaDestino, resultado) {
    // OBLIGATORIO: Notificar a LEDROITMASTER sobre el ingreso derivado
    try {
        await fetch('https://auditingresoderivado-fmunxt6pjq-uc.a.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                iniciales: iniciales,
                sistemaOrigen: sistemaOrigen,
                sistemaDestino: sistemaDestino,
                resultado: resultado
            })
        });
    } catch (error) {
        console.error('Error registrando auditoría:', error);
        // Continuar con el proceso aunque falle la auditoría
    }
}
```

---

## 🔄 4. ACTIVO DESPUÉS DE HABER SIDO PASIVO

### ¿Qué es?
Tu sistema recibió un usuario (fue PASIVO), y ahora ese usuario quiere ir a un tercer sistema (tu sistema se vuelve ACTIVO).

### Implementación:
```javascript
// Usar la misma lógica de INGRESO DERIVADO ACTIVO
// La RESPUESTALEDROIMASTER ya está guardada en ultimosIngresosSatisfactorios
// Solo cambiar el sistemaActivo a tu sistema

async function enviarDesdeSesionDerivada(urlDestino, sistemaDestino) {
    const tipoSesion = sessionStorage.getItem('sessionType');
    
    if (tipoSesion === 'DERIVADO_PASIVO') {
        // Usar la misma función pero con tu sistema como origen
        await enviarAOtroSistema(urlDestino, sistemaDestino);
    }
}
```

---

## 🛡️ CONSIDERACIONES DE SEGURIDAD

### 1. Validación de Datos
```javascript
function validarDatosRecibidos(datos) {
    if (!datos || typeof datos !== 'object') return false;
    if (!datos.iniciales || datos.iniciales.length < 2) return false;
    if (!datos.RESPUESTALEDROIMASTER) return false;
    
    return true;
}
```

### 2. Timeout de Sesiones
```javascript
function verificarTimeoutSesion() {
    const loginTimestamp = sessionStorage.getItem('loginTimestamp');
    if (loginTimestamp) {
        const loginTime = new Date(loginTimestamp);
        const ahora = new Date();
        const horasTranscurridas = (ahora - loginTime) / (1000 * 60 * 60);
        
        if (horasTranscurridas > 8) { // 8 horas máximo
            cerrarSesion();
            alert('Su sesión ha expirado');
            window.location.href = '/login';
        }
    }
}

function cerrarSesion() {
    sessionStorage.clear();
    // Limpiar datos específicos de tu sistema
}
```

---

## 🧪 TESTING

### Herramienta Oficial
Usar: `https://ledroitmaster.web.app/TEST_API.html`

### Datos de Prueba
```javascript
const datosPrueba = {
    claBComun: "a1234",
    iniciales: "ABC",
    empresaSolicitante: "EMPRESA_PRUEBA"
};
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### PRIMER INGRESO
- [ ] Formulario de login con reglas de diseño
- [ ] Llamada a API LEDROITMASTER
- [ ] Validación de acceso local (consultar propietario)
- [ ] Guardado en "ultimosIngresosSatisfactorios"
- [ ] Sistema de fallback
- [ ] Manejo de errores

### INGRESO DERIVADO ACTIVO
- [ ] Obtener RESPUESTALEDROIMASTER de BD
- [ ] Crear solicitud con metainformación + RESPUESTALEDROIMASTER
- [ ] Envío seguro al sistema destino
- [ ] Manejo de errores

### INGRESO DERIVADO PASIVO
- [ ] Recepción de solicitudes (POST/URL)
- [ ] Validación de metainformación
- [ ] Validación de RESPUESTALEDROIMASTER
- [ ] Guardado en "ultimosIngresosSatisfactorios"
- [ ] Notificación de auditoría obligatoria
- [ ] Creación de sesión derivada

### SEGURIDAD
- [ ] Validación de todos los datos
- [ ] Timeout de sesiones
- [ ] Manejo seguro de errores
- [ ] Logs de eventos importantes

---

## 📋 CONSULTAS AL PROPIETARIO

**Antes de implementar, consultar:**

1. **PRIMER INGRESO:**
   - ¿Basta con respuesta positiva de LEDROITMASTER o necesitas validación adicional?
   - ¿Qué información guardar en la sesión local?

2. **METAINFORMACIÓN:**
   - ¿Cómo se llama tu sistema (sistemaActivo)?
   - ¿Cómo determinar la empresaSolicitante?
   - ¿Qué validaciones adicionales en metainformación?

3. **BASE DE DATOS:**
   - ¿Qué tecnología usas? (Firebase, MySQL, MongoDB, etc.)
   - ¿Cómo implementar "ultimosIngresosSatisfactorios"?

**Esta documentación refleja fielmente la lógica explicada y está lista para implementación una vez resueltas las consultas al propietario.**