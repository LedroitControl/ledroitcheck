# GUÍA PARA DESARROLLADORES DE SISTEMAS SECUNDARIOS - VERSIÓN 3.0

**INTEGRACIÓN CON EL ECOSISTEMA LEDROIT MASTER**

---

## 📋 ÍNDICE DE CONTENIDO

1. [🎯 Introducción](#-introducción)
2. [🏗️ Arquitectura del Ecosistema](#️-arquitectura-del-ecosistema)
3. [⚙️ Configuraciones Obligatorias](#️-configuraciones-obligatorias)
4. [📊 Estructura Estándar de Datos](#-estructura-estándar-de-datos)
5. [🔐 Implementación de Primer Ingreso](#-implementación-de-primer-ingreso)
6. [🔄 Implementación de Ingreso Derivado](#-implementación-de-ingreso-derivado)
7. [📚 Plantillas y Recursos Disponibles](#-plantillas-y-recursos-disponibles)
8. [🧪 Herramientas de Desarrollo y Pruebas](#-herramientas-de-desarrollo-y-pruebas)
9. [✅ Checklist de Implementación](#-checklist-de-implementación)
10. [🚀 Despliegue y Producción](#-despliegue-y-producción)

---

## 🎯 INTRODUCCIÓN

Esta guía explica cómo integrar tu sistema con el **Ecosistema Ledroit Master** para manejar sesiones de usuario de manera unificada y segura.

### 🎯 **Objetivos de la Integración**
- **Sesión unificada:** Un solo login para acceder a múltiples sistemas
- **Navegación fluida:** Cambiar entre sistemas sin reautenticación
- **Auditoría completa:** Trazabilidad de todos los accesos
- **Experiencia consistente:** Interfaz y comportamiento homogéneo

### 📋 **Tu Sistema Debe Implementar:**
1. **PRIMER INGRESO** - Autenticación inicial con LedroitMaster
2. **INGRESO DERIVADO ACTIVO** - Enviar usuarios a otros sistemas
3. **INGRESO DERIVADO PASIVO** - Recibir usuarios de otros sistemas
4. **COMPONENTES ESTÁNDAR** - Header, gadget y estructura de datos

---

## 🏗️ ARQUITECTURA DEL ECOSISTEMA

### 🎯 **Roles en el Ecosistema**

#### **LedroitMaster (Sistema Madre)**
- **Función:** Autoridad central de autenticación y auditoría
- **Responsabilidades:**
  - Validar credenciales de usuarios
  - Mantener información actualizada de usuarios y empresas
  - Registrar todos los eventos de acceso
  - Proporcionar APIs para autenticación y auditoría

#### **Sistemas Secundarios (Tu Sistema)**
- **Función:** Aplicaciones que consumen los servicios de autenticación
- **Responsabilidades:**
  - Implementar lógica de primer ingreso
  - Manejar ingresos derivados (activo y pasivo)
  - Mantener sesiones locales consistentes
  - Integrar componentes estándar del ecosistema

### 🔄 **Flujo de Comunicación**
```
Usuario → Sistema Secundario → LedroitMaster → Validación → Respuesta → Sesión Local
```

---

## ⚙️ CONFIGURACIONES OBLIGATORIAS

### 🌐 **ENDPOINTS ESTANDARIZADOS**
**OBLIGATORIO:** Todos los sistemas secundarios DEBEN implementar ambos recursos exactos para ingreso derivado:

#### **📥 Endpoint de Ingreso Derivado (POST - obligatorio):**
```
/ingreso-derivado
```
Usado para recibir datos de sesión mediante formulario POST. Este es el método estándar y recomendado para producción.

#### **📄 Página de Procesamiento (GET):**
```
/ingreso-derivado.html
```
Usada para mostrar resultados cuando la información llega por URL o para pruebas visuales. Debe existir, pero el envío estándar se realiza al endpoint POST.

#### **🧪 Página de Pruebas de Desarrollo:**
```
/prueba-ingderivado.html
```
**IMPORTANTE:** Esta página es OBLIGATORIA para desarrollo y testing. Debe implementarse exactamente con este nombre.

### 🔤 **REGLAS DE NOMENCLATURA OBLIGATORIAS**

#### **Conversión de Iniciales a Mayúsculas:**
**OBLIGATORIO:** Las iniciales del usuario en la pagina LOGIN y en cualquier otro, SIEMPRE deben convertirse a mayúsculas antes de enviar a LedroitMaster:

```javascript
// ✅ CORRECTO - Convertir solo las letras a mayúsculas
function normalizarIniciales(iniciales) {
    return iniciales.replace(/[a-zA-Z]/g, function(letra) {
        return letra.toUpperCase();
    });
    // Los números y símbolos se mantienen intactos
}

// Ejemplo de uso en autenticación:
const inicialesNormalizadas = normalizarIniciales(credenciales.iniciales);
```

**Ejemplos:**
- `abc123` → `ABC123` ✅
- `xy#45z` → `XY#45Z` ✅  
- `123abc` → `123ABC` ✅

### 🔄 **PERSISTENCIA DE SESIÓN**
**CONSULTA OBLIGATORIA AL PROPIETARIO:** Debes preguntarle al propietario qué nivel de seguridad requiere:

#### **Opción A - Alta Seguridad (Recomendado para sistemas críticos):**
```javascript
// Solo sessionStorage - datos se borran al cerrar ventana/pestaña
sessionStorage.setItem('ls_session', JSON.stringify(sessionData));
```

#### **Opción B - Baja-Media Seguridad (Recomendado para sistemas de uso frecuente):**
```javascript  
// localStorage - datos persisten entre sesiones del navegador
localStorage.setItem('ls_session', JSON.stringify(sessionData));
```

**Diferencias clave:**
- **sessionStorage:** Más seguro, datos se borran al cerrar pestaña
- **localStorage:** Más conveniente, datos persisten hasta borrado manual

#### 🔀 Comportamiento de apertura y cierre de sesión (Gadget Ingresos Activos)

El gadget incluye la opción "Abrir en nueva ventana" que determina qué sucede con la sesión del sistema actual cuando se envía al usuario a un sistema pasivo:

- Si "Abrir en nueva ventana" está activado: el sistema pasivo se abre en una nueva pestaña/ventana y la sesión del sistema actual permanece abierta.
- Si "Abrir en nueva ventana" está desactivado: el sistema pasivo se abre en la misma ventana y la sesión del sistema actual se cierra inmediatamente después del envío.

Implementación recomendada al enviar por POST:

```javascript
// Dentro de la función de envío por POST
form.submit();
document.body.removeChild(form);

// Cerrar sesión del sistema actual solo si NO se abre en nueva ventana
if (!abrirNuevaVentana) {
  if (window.SessionManager?.logout) {
    window.SessionManager.logout(false); // sin redirección porque se navegará al sistema pasivo
  } else {
    // Fallback
    sessionStorage.removeItem('ledroitAuth');
    sessionStorage.removeItem('ls_session');
    localStorage.removeItem('ledroitAuth');
    localStorage.removeItem('ls_session');
  }
}
```

Asegúrate también de persistir el valor de `abrirNuevaVentana` en tu configuración de sistemas (Firestore y/o localStorage) para respetar la preferencia del usuario en accesos futuros.

### 📡 **MÉTODO DE TRANSFERENCIA**
**ESTADO ACTUAL:** Los sistemas ahora usan método POST como estándar.
**COMPATIBILIDAD:** Se mantiene soporte para GET solo para sistemas antiguos.

#### **Implementación Recomendada (POST):**
```javascript
function enviarPorPOST(urlDestino, respuestaLMaster) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = urlDestino;
    form.target = '_blank';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'respuestaLMaster';
    input.value = JSON.stringify(respuestaLMaster);
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}
```

#### **Implementación Antigua (GET - Solo para compatibilidad):**
```javascript
function enviarPorURL(urlDestino, respuestaLMaster) {
    const urlCompleta = `${urlDestino}?data=${encodeURIComponent(JSON.stringify(respuestaLMaster))}`;
    window.open(urlCompleta, '_blank');
}
```

#### **Preparación para POST (Futuro):**
```javascript
function enviarPorPOST(urlDestino, respuestaLMaster) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = urlDestino;
    form.target = '_blank';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'respuestaLMaster';
    input.value = JSON.stringify(respuestaLMaster);
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}
```

### 🚫 **SISTEMA DE NOTIFICACIONES**
**OBLIGATORIO:** Los mensajes NO deben ser de tipo `alert()`.

#### **❌ NO USAR:**
```javascript
alert('Error en el sistema');
alert('Usuario autenticado correctamente');
```

#### **✅ USAR:** Sistema de notificaciones tipo "toast":
```javascript
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animación de entrada
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remover automáticamente
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || icons.info;
}
```

---

## 📊 ESTRUCTURA ESTÁNDAR DE DATOS

### 🔑 **Estructura de Sesión Local (`ls_session`)**

**IMPORTANTE:** Esta es la estructura ÚNICA y ESTÁNDAR que todos los sistemas deben usar:

```javascript
const ls_session = {
    // Datos básicos del usuario (NOMENCLATURA DE LEDROITMASTER)
    iniciales: "ABC",                    // ✅ Usar "iniciales" (NO "initials")
    nombre: "Nombre Completo Usuario",   // ✅ Usar "nombre" (NO "name")
    foto_url: "https://storage.googleapis.com/ledroitmaster.appspot.com/users/ABC/fotografia/timestamp_foto.jpg",
    
    // Empresas del usuario (NOMENCLATURA DE LEDROITMASTER)
    empresas: [                          // ✅ Usar "empresas" (NO "companies")
        {
            id: "empresa_id_123",        // ID único de la empresa
            nombre: "EMPRESA SA",        // ✅ Usar "nombre" (NO "name")
            empresa_activa: true,        // ✅ Usar "empresa_activa" (NO "active")
            usuario_activo: true,        // ✅ Usar "usuario_activo" (NO "userActive")
            rol: ["A1", "A2"]           // ✅ Array de roles (siempre array)
        }
    ],
    
    // Metadatos de sesión
    timestamp: "2024-01-15T10:30:00.000Z",
    sistemaOrigen: "SISTEMA_ACTUAL"
};
```

### ⚠️ **REGLAS CRÍTICAS:**
- **NUNCA incluir `respuestaLMaster` en `ls_session`** (solo va en "ultimosIngresosSatisfactorios")
- **Usar nomenclatura de LedroitMaster:** `iniciales`, `empresas`, `nombre`, `empresa_activa`
- **Mantener consistencia** en todos los sistemas del ecosistema

### 🗄️ **Estructura de Respaldo (`ultimosIngresosSatisfactorios`)**

**Propósito:** Colección en Firestore para respaldo y fallback, NO para sesión activa.

```javascript
// Documento ID: {iniciales del usuario}
{
    claBComun: "password123",
    iniciales: "ABC", 
    sistemaOrigen: "SISTEMA_EXCEL",
    timestamp: "2024-01-15T10:30:00.000Z",
    
    // Respuesta COMPLETA de LedroitMaster (para fallback)
    respuestaLMaster: {
        success: true,
        data: {
            iniciales: "ABC",
            nombre: "Nombre Completo Usuario", 
            foto_url: "https://...",
            empresas: [
                {
                    nombre: "EMPRESA SA",
                    empresa_activa: true,
                    usuario_activo: true,
                    rol: ["A1"]
                }
            ]
        },
        timestamp: "2024-01-15T10:30:00.000Z"
    }
}
```

---

## 🔐 IMPLEMENTACIÓN DE PRIMER INGRESO

### 🎯 **Propósito**
El "Primer Ingreso" es la autenticación inicial del usuario con LedroitMaster. Es el punto de entrada principal al ecosistema.

### 📋 **Flujo de Primer Ingreso**
1. **Usuario accede** al sistema secundario
2. **Sistema verifica** si existe sesión local válida
3. **Si NO hay sesión:** Redirigir a formulario de autenticación
4. **Usuario ingresa** credenciales (iniciales + clave)
5. **Sistema consulta** API de LedroitMaster
6. **Si autenticación exitosa:** Crear sesión local y continuar
7. **Si falla:** Mostrar error y permitir reintento

### 💻 **Implementación Completa**

```javascript
// ========================================
// PRIMER INGRESO - IMPLEMENTACIÓN COMPLETA
// ========================================

async function primerIngreso() {
    // 1. Verificar si ya existe sesión válida
    const sesionExistente = obtenerSesionLocal();
    if (sesionExistente && validarSesion(sesionExistente)) {
        log('Sesión válida encontrada, continuando...', 'success');
        return sesionExistente;
    }

    // 2. Mostrar formulario de autenticación
    const credenciales = await mostrarFormularioLogin();
    if (!credenciales) {
        showToast('Autenticación cancelada', 'warning');
        return null;
    }

    // 3. Autenticar con LedroitMaster
    try {
        log('Iniciando autenticación con LedroitMaster...', 'info');
        const respuestaLM = await autenticarConLedroitMaster(credenciales);
        
        if (respuestaLM.success) {
            // 4. Crear sesión local
            const sesionLocal = crearSesionLocal(respuestaLM.data);
            guardarSesionLocal(sesionLocal);
            
            // 5. Guardar en respaldo (opcional)
            await guardarEnRespaldo(credenciales, respuestaLM);
            
            log(`Usuario ${respuestaLM.data.iniciales} autenticado correctamente`, 'success');
            showToast(`Bienvenido ${respuestaLM.data.nombre}`, 'success');
            
            return sesionLocal;
        } else {
            throw new Error(respuestaLM.message || 'Error de autenticación');
        }
    } catch (error) {
        log(`Error en autenticación: ${error.message}`, 'error');
        showToast(`Error: ${error.message}`, 'error');
        return null;
    }
}

// Función para autenticar con LedroitMaster
async function autenticarConLedroitMaster(credenciales) {
    // OBLIGATORIO: Normalizar iniciales (solo letras a mayúsculas)
    const inicialesNormalizadas = credenciales.iniciales.replace(/[a-zA-Z]/g, function(letra) {
        return letra.toUpperCase();
    });
    
    const response = await fetch('https://ledroitmaster-api-run-dot-ledroitmaster.uc.r.appspot.com/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            iniciales: inicialesNormalizadas, // ✅ Iniciales normalizadas
            claBComun: credenciales.password,
            sistemaOrigen: 'TU_SISTEMA_AQUI' // CONSULTAR AL PROPIETARIO
        })
    });

    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
}

// Función para crear sesión local estándar
function crearSesionLocal(datosLM) {
    return {
        iniciales: datosLM.iniciales,
        nombre: datosLM.nombre,
        foto_url: datosLM.foto_url,
        empresas: datosLM.empresas,
        timestamp: new Date().toISOString(),
        sistemaOrigen: 'TU_SISTEMA_AQUI'
    };
}

// Función para guardar sesión (usar sessionStorage o localStorage según configuración)
function guardarSesionLocal(sesion) {
    const storage = USAR_SESSION_STORAGE ? sessionStorage : localStorage;
    storage.setItem('ls_session', JSON.stringify(sesion));
}

// Función para obtener sesión local
function obtenerSesionLocal() {
    const sessionData = sessionStorage.getItem('ls_session');
    const localData = localStorage.getItem('ls_session');
    
    // Priorizar sessionStorage si existe
    const data = sessionData || localData;
    return data ? JSON.parse(data) : null;
}
```

---

## 🔄 IMPLEMENTACIÓN DE INGRESO DERIVADO

### 🎯 **Conceptos Clave**

#### **INGRESO DERIVADO ACTIVO**
Tu sistema **ENVÍA** un usuario a otro sistema del ecosistema.

#### **INGRESO DERIVADO PASIVO** 
Tu sistema **RECIBE** un usuario desde otro sistema del ecosistema.

### 📤 **INGRESO DERIVADO ACTIVO - Enviar Usuario**

```javascript
// ========================================
// INGRESO DERIVADO ACTIVO - ENVIAR USUARIO
// ========================================

function enviarUsuarioAOtroSistema(urlDestino, abrirEnNuevaVentana = true) {
    // 1. Obtener sesión actual
    const sesionActual = obtenerSesionLocal();
    if (!sesionActual) {
        showToast('No hay sesión activa para enviar', 'error');
        return false;
    }

    // 2. Preparar datos para envío
    const datosEnvio = {
        success: true,
        data: {
            iniciales: sesionActual.iniciales,
            nombre: sesionActual.nombre,
            foto_url: sesionActual.foto_url,
            empresas: sesionActual.empresas
        },
        timestamp: new Date().toISOString(),
        sistemaOrigen: 'TU_SISTEMA_AQUI'
    };

    // 3. Registrar auditoría
    registrarAuditoria('ENVIO_ACTIVO', {
        destino: urlDestino,
        usuario: sesionActual.iniciales,
        timestamp: datosEnvio.timestamp
    });

    // 4. Enviar por POST (método recomendado)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = urlDestino;
    form.target = abrirEnNuevaVentana ? '_blank' : '_self';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'respuestaLMaster';
    input.value = JSON.stringify(datosEnvio);
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    log(`Usuario enviado a: ${urlDestino}`, 'success');
    showToast('Usuario enviado correctamente', 'success');
    return true;
}
```

### 📥 **INGRESO DERIVADO PASIVO - Recibir Usuario**

```javascript
// ========================================
// INGRESO DERIVADO PASIVO - RECIBIR USUARIO
// ========================================

function recibirUsuarioDeOtroSistema() {
    // 1. Verificar si hay datos en URL
    // 1. Verificar si hay datos POST (método recomendado)
    let datosRecibidos = null;
    
    if (window.location.search.includes('respuestaLMaster=')) {
        // Datos enviados por POST como parámetro de formulario
        const formData = new FormData();
        const urlParams = new URLSearchParams(window.location.search);
        const postData = urlParams.get('respuestaLMaster');
        if (postData) {
            datosRecibidos = JSON.parse(postData);
        }
    } else {
        // Fallback para compatibilidad con GET (sistemas antiguos)
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data') || urlParams.get('respuestaLMaster');
        
        if (!dataParam) {
            log('No se encontraron datos de ingreso derivado', 'info');
            return null;
        }
        
        datosRecibidos = JSON.parse(decodeURIComponent(dataParam));
    }
    
    if (!datosRecibidos) {
        log('No se encontraron datos de ingreso derivado', 'info');
        return null;
    }

    try {
        
        // 3. Validar estructura de datos
        if (!validarDatosRecibidos(datosRecibidos)) {
            throw new Error('Datos recibidos no válidos');
        }

        // 4. Crear sesión local desde datos recibidos
        const sesionLocal = {
            iniciales: datosRecibidos.data.iniciales,
            nombre: datosRecibidos.data.nombre,
            foto_url: datosRecibidos.data.foto_url,
            empresas: datosRecibidos.data.empresas,
            timestamp: new Date().toISOString(),
            sistemaOrigen: datosRecibidos.sistemaOrigen || 'DESCONOCIDO'
        };

        // 5. Guardar sesión local
        guardarSesionLocal(sesionLocal);

        // 6. Registrar auditoría
        registrarAuditoria('RECEPCION_PASIVA', {
            origen: datosRecibidos.sistemaOrigen,
            usuario: sesionLocal.iniciales,
            timestamp: sesionLocal.timestamp
        });

        // 7. Limpiar URL (opcional)
        limpiarParametrosURL();

        log(`Usuario recibido desde ${datosRecibidos.sistemaOrigen}: ${sesionLocal.iniciales}`, 'success');
        showToast(`Bienvenido ${sesionLocal.nombre}`, 'success');
        
        return sesionLocal;

    } catch (error) {
        log(`Error procesando ingreso derivado: ${error.message}`, 'error');
        showToast('Error al procesar datos de sesión', 'error');
        return null;
    }
}

// Función para validar datos recibidos
function validarDatosRecibidos(datos) {
    return datos && 
           datos.success === true &&
           datos.data &&
           datos.data.iniciales &&
           datos.data.nombre &&
           Array.isArray(datos.data.empresas);
}

// Función para limpiar parámetros de URL
function limpiarParametrosURL() {
    const url = new URL(window.location);
    url.searchParams.delete('data');
    url.searchParams.delete('respuestaLMaster');
    window.history.replaceState({}, document.title, url.pathname);
}
```

### 🔄 **INICIALIZACIÓN AUTOMÁTICA**

```javascript
// ========================================
// INICIALIZACIÓN AUTOMÁTICA DEL SISTEMA
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    log('Iniciando sistema...', 'info');
    
    // 1. Intentar recibir usuario de otro sistema (ingreso derivado pasivo)
    let sesionActual = recibirUsuarioDeOtroSistema();
    
    // 2. Si no hay ingreso derivado, verificar sesión local existente
    if (!sesionActual) {
        sesionActual = obtenerSesionLocal();
        
        // 3. Si no hay sesión local, realizar primer ingreso
        if (!sesionActual || !validarSesion(sesionActual)) {
            log('No hay sesión válida, iniciando primer ingreso...', 'info');
            sesionActual = await primerIngreso();
        }
    }
    
    // 4. Si hay sesión válida, inicializar interfaz
    if (sesionActual) {
        inicializarInterfazUsuario(sesionActual);
        log('Sistema inicializado correctamente', 'success');
    } else {
        log('No se pudo establecer sesión de usuario', 'error');
        showToast('Error al inicializar sesión', 'error');
    }
});
```

---

## 📚 PLANTILLAS Y RECURSOS DISPONIBLES

### 📁 **CARPETAS DE REFERENCIA EXISTENTES**

#### **📂 PAGINA PRUEBA-INGDERIVADO**
**Ubicación:** `./PAGINA PRUEBA-INGDERIVADO/`
**Contenido:** Página completa de pruebas para desarrollo y testing
- ✅ **Interfaz con pestañas:** ACTIVO, PASIVO, INFORMACIÓN
- ✅ **Simulador de envío:** Para probar ingresos derivados activos
- ✅ **Simulador de recepción:** Para probar ingresos derivados pasivos
- ✅ **Sistema de logs:** Debugging en tiempo real
- ✅ **Validaciones completas:** Estructura de datos y timestamps
- ✅ **Notificaciones toast:** Sistema moderno de mensajes

**Uso recomendado:** Copiar y personalizar para tu sistema

#### **📂 HEADER**
**Ubicación:** `./HEADER/`
**Contenido:** Componente de header estandarizado completamente documentado
- ✅ **Documentación completa:** README.md con guía de instalación
- ✅ **Guía paso a paso:** GUIA-PASO-A-PASO.md para implementación
- ✅ **Ejemplo funcional:** ejemplo-implementacion.html
- ✅ **Archivos listos:** CSS, JS y templates HTML
- ✅ **Avatar de usuario:** Con fallback a iniciales
- ✅ **Información de usuario:** Nombre, empresas, roles
- ✅ **Diseño responsive:** Adaptable a diferentes pantallas
- ✅ **Estilos CSS:** Tema consistente del ecosistema
- ✅ **Manejo de URLs:** Limpieza automática de avatares

**IMPORTANTE:** La carpeta HEADER contiene toda la documentación y archivos necesarios para implementar el header estandarizado. Revisa especialmente:
- `README.md` - Guía de instalación rápida
- `GUIA-PASO-A-PASO.md` - Implementación detallada
- `ejemplo-implementacion.html` - Ejemplo funcional completo

**Uso recomendado:** Consultar al propietario si desea implementar, luego seguir la documentación de la carpeta

#### **📂 GADGET INGRESOS ACTIVOS**
**Ubicación:** `./GADGET INGRESOS ACTIVOS/`
**Contenido:** Widget flotante para navegación entre sistemas
- ✅ **Botón flotante:** Diseño circular con ícono de envío
- ✅ **Modal de configuración:** Gestión de sistemas disponibles
- ✅ **Validación por roles:** Control de acceso según permisos
- ✅ **Persistencia local:** Configuración guardada en localStorage
- ✅ **Funcionalidad completa:** Agregar, editar, eliminar sistemas

**Uso obligatorio:** Implementar EXACTAMENTE igual en todos los sistemas

### 🎨 **COMPONENTES ESTÁNDAR**

#### **🎨 HEADER ESTANDARIZADO**
**CONSULTA AL PROPIETARIO:** Pregunta si quiere modificar el diseño estándar

```html
<header class="ledroit-header">
    <div class="header-left">
        <div class="user-avatar">
            <img src="{{foto_url}}" alt="Avatar" class="avatar-img" style="display: none;">
            <span class="user-initials">{{iniciales}}</span>
        </div>
        <div class="user-info">
            <span class="system-name">{{nombre_sistema}}</span>
            <span class="user-companies">{{empresas_activas}}</span>
        </div>
    </div>
    <div class="header-right">
        <span class="user-roles">{{roles}}</span>
        <button class="logout-btn" onclick="cerrarSesion()">Salir</button>
    </div>
</header>
```

#### **🖼️ MANEJO CRÍTICO DE AVATAR**
**IMPORTANTE:** Las URLs de avatar pueden tener caracteres especiales

```javascript
function limpiarFotoUrl(fotoUrl) {
    if (!fotoUrl) return null;
    
    return fotoUrl
        .replace(/^[\s`'"]+|[\s`'"]+$/g, '') // Limpiar inicio y final
        .replace(/[`\s]/g, ''); // Limpiar caracteres internos
}

function configurarAvatar(fotoUrl, iniciales) {
    const avatarImg = document.querySelector('.avatar-img');
    const avatarText = document.querySelector('.user-initials');
    
    if (fotoUrl) {
        const fotoLimpia = limpiarFotoUrl(fotoUrl);
        if (fotoLimpia && fotoLimpia.startsWith('http')) {
            avatarImg.src = fotoLimpia;
            avatarImg.style.display = 'block';
            avatarText.style.display = 'none';
            return;
        }
    }
    
    // Fallback a iniciales
    avatarText.textContent = iniciales;
    avatarImg.style.display = 'none';
    avatarText.style.display = 'flex';
}
```

---

## 🧪 HERRAMIENTAS DE DESARROLLO Y PRUEBAS

### 📄 **PÁGINA DE PRUEBA OBLIGATORIA**

**REFERENCIA COMPLETA:** Consultar carpeta `./PAGINA PRUEBA-INGDERIVADO/`

#### **Características Obligatorias:**
- ✅ **Interfaz con pestañas:** ACTIVO, PASIVO, INFORMACIÓN
- ✅ **Modo ACTIVO:** Simular envío de usuarios a otros sistemas
- ✅ **Modo PASIVO:** Simular recepción de usuarios desde otros sistemas
- ✅ **Logs en tiempo real:** Debugging visible en la página (NO solo consola)
- ✅ **Validaciones completas:** Timestamp, empresas, estructura de datos
- ✅ **Sistema de notificaciones:** Toast messages (NO alerts)
- ✅ **Método POST:** Envío por formulario (estándar Ledroit implementado)

#### **Sistema de Logs Obligatorio:**

```javascript
function log(message, type = 'info') {
    // Agregar al área de logs visible en la página
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        <span class="log-type">[${type.toUpperCase()}]</span>
        <span class="log-message">${message}</span>
    `;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // También enviar a consola para desarrollo
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
}

// Ejemplos de uso:
log('ENVÍO ACTIVO - Enviando usuario a SISTEMA_DESTINO', 'info');
log('ENVÍO ACTIVO - URL destino: https://ejemplo.com', 'info');
log('ENVÍO ACTIVO - Datos enviados correctamente', 'success');
log('ENVÍO PASIVO - Recibiendo datos de otro sistema', 'info');
log('ERROR - Datos recibidos no válidos', 'error');
```

### 🔧 **FUNCIONES AUXILIARES ESTÁNDAR**

```javascript
// ========================================
// FUNCIONES AUXILIARES OBLIGATORIAS
// ========================================

// Validar sesión local
function validarSesion(sesion) {
    if (!sesion) return false;
    
    // Verificar estructura básica
    if (!sesion.iniciales || !sesion.nombre || !Array.isArray(sesion.empresas)) {
        return false;
    }
    
    // Verificar timestamp (opcional: validar expiración)
    const ahora = new Date();
    const timestampSesion = new Date(sesion.timestamp);
    const diferenciaDias = (ahora - timestampSesion) / (1000 * 60 * 60 * 24);
    
    // Sesión válida por 7 días (configurable)
    return diferenciaDias <= 7;
}

// Cerrar sesión
function cerrarSesion() {
    sessionStorage.removeItem('ls_session');
    localStorage.removeItem('ls_session');
    
    log('Sesión cerrada correctamente', 'info');
    showToast('Sesión cerrada', 'info');
    
    // Recargar página para reiniciar
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Registrar auditoría
async function registrarAuditoria(accion, detalles) {
    try {
        const response = await fetch('https://ledroitmaster-api-run-dot-ledroitmaster.uc.r.appspot.com/audit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accion: accion,
                detalles: detalles,
                timestamp: new Date().toISOString(),
                sistemaOrigen: 'TU_SISTEMA_AQUI'
            })
        });
        
        if (response.ok) {
            log(`Auditoría registrada: ${accion}`, 'info');
        }
    } catch (error) {
        log(`Error registrando auditoría: ${error.message}`, 'warning');
    }
}

// Obtener empresas activas del usuario
function obtenerEmpresasActivas(sesion) {
    if (!sesion || !Array.isArray(sesion.empresas)) return [];
    
    return sesion.empresas.filter(empresa => 
        empresa.empresa_activa === true && empresa.usuario_activo === true
    );
}

// Verificar si usuario tiene rol específico
function usuarioTieneRol(sesion, rolBuscado) {
    const empresasActivas = obtenerEmpresasActivas(sesion);
    
    return empresasActivas.some(empresa => 
        Array.isArray(empresa.rol) && empresa.rol.includes(rolBuscado)
    );
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### 🔧 **CONFIGURACIÓN INICIAL**
- [ ] **Consultar al propietario:** Nivel de seguridad (sessionStorage vs localStorage)
- [ ] **Configurar constantes:** URLs de API, nombre del sistema, configuraciones
- [ ] **Implementar sistema de logs:** Visible en página + consola
- [ ] **Implementar notificaciones:** Sistema toast (NO alerts)

### 🔐 **PRIMER INGRESO**
- [ ] **Formulario de login:** Iniciales + clave común
- [ ] **Validación de credenciales:** Consulta a API de LedroitMaster
- [ ] **Creación de sesión local:** Estructura estándar `ls_session`
- [ ] **Manejo de errores:** Mensajes claros y reintentos
- [ ] **Auditoría:** Registro de eventos de autenticación

### 🔄 **INGRESO DERIVADO**
- [ ] **Modo ACTIVO:** Enviar usuarios a otros sistemas
- [ ] **Modo PASIVO:** Recibir usuarios desde otros sistemas
- [ ] **Validación de datos:** Estructura y contenido
- [ ] **Limpieza de URL:** Remover parámetros después de procesar
- [ ] **Compatibilidad:** Soportar tanto `data` como `respuestaLMaster`

### 🎨 **COMPONENTES ESTÁNDAR**
- [ ] **Header:** Implementar diseño estándar (consultar modificaciones)
- [ ] **Avatar:** Manejo robusto de URLs con limpieza
- [ ] **Gadget:** Implementar EXACTAMENTE igual (carpeta de referencia)
- [ ] **Estilos CSS:** Consistencia visual con el ecosistema

### 🧪 **HERRAMIENTAS DE DESARROLLO**
- [ ] **Página de prueba:** Basada en carpeta `PAGINA PRUEBA-INGDERIVADO`
- [ ] **Logs en tiempo real:** Sistema visible en página
- [ ] **Simuladores:** Para envío y recepción de usuarios
- [ ] **Validaciones:** Estructura de datos y timestamps

### 🔧 **FUNCIONES AUXILIARES**
- [ ] **Validar sesión:** Estructura y expiración
- [ ] **Cerrar sesión:** Limpieza completa de datos
- [ ] **Auditoría:** Registro de eventos importantes
- [ ] **Utilidades:** Empresas activas, roles, etc.

---

## 🚀 DESPLIEGUE Y PRODUCCIÓN

### 📋 **PREPARACIÓN PARA PRODUCCIÓN**

#### **🔧 Configuraciones Finales**
```javascript
// Configuraciones de producción
const CONFIG_PRODUCCION = {
    API_BASE_URL: 'https://ledroitmaster-api-run-dot-ledroitmaster.uc.r.appspot.com',
    SISTEMA_NOMBRE: 'TU_SISTEMA_AQUI', // CAMBIAR por el nombre real
    USAR_SESSION_STORAGE: true, // Configurar según decisión del propietario
    LOGS_HABILITADOS: false, // Desactivar en producción
    AUDITORIA_HABILITADA: true
};
```

#### **🚀 Despliegue con Firebase**
**IMPORTANTE:** Según las instrucciones del usuario, implementar cambios usando Firebase Deploy

```bash
# Desplegar solo hosting
firebase deploy --only hosting

# Desplegar funciones y hosting
firebase deploy

# Desplegar con configuración específica
firebase deploy --project tu-proyecto-id
```

#### **✅ Verificaciones Post-Despliegue**
- [ ] **Probar primer ingreso:** Con credenciales reales
- [ ] **Probar ingreso derivado:** Envío y recepción entre sistemas
- [ ] **Verificar auditoría:** Eventos registrados correctamente
- [ ] **Validar componentes:** Header, gadget, notificaciones
- [ ] **Revisar logs:** Sin errores en consola de producción

### 📞 **SOPORTE Y CONTACTO**

**Para dudas técnicas o problemas de implementación:**
- Consultar documentación de API: `DOCUMENTACION - API_LEDROITMASTER.md`
- Revisar carpetas de referencia: `PAGINA PRUEBA-INGDERIVADO`, `HEADER`, `GADGET INGRESOS ACTIVOS`
- Contactar al equipo de desarrollo de LedroitMaster

---

**📅 Última actualización:** Diciembre 2024  
**📋 Versión:** 3.0  
**👥 Ecosistema:** Ledroit Master

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

// Función POST recomendada
function enviarPorPOST(urlDestino, respuestaLMaster) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = urlDestino;
    form.target = '_blank';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'respuestaLMaster';
    input.value = JSON.stringify(respuestaLMaster);
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

// Función URL (solo para compatibilidad con sistemas antiguos)
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
                <!-- Solo método POST con formulario -->
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
- **SOLO método POST con formulario** (estándar Ledroit)
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
    // SOLO método POST con formulario - Estándar Ledroit
    enviarPorPOST(urlDestino, respuestaLMaster);
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

// Función GET con parámetros URL (solo para compatibilidad)
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
    
    // 3. Enviar al sistema destino (método POST recomendado)
    enviarPorPOST(urlDestino, respuestaLMasterModificada);
    showToast(`Usuario enviado a ${sistemaDestino}`, 'success');
}

async function obtenerUltimoIngresoSatisfactorio(iniciales) {
    // Obtener de la colección "ultimosIngresosSatisfactorios"
    // Ejemplo temporal con localStorage:
    const data = localStorage.getItem(`ultimosIngresosSatisfactorios_${iniciales}`);
    return data ? JSON.parse(data) : null;
}

function enviarPorURL(urlDestino, respuestaLMasterModificada) {
    // COMPATIBILIDAD: Solo para sistemas antiguos que usen GET
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

## 📋 FLUJO DE TRABAJO OBLIGATORIO

### 🎯 **PROCESO DE IMPLEMENTACIÓN ESTÁNDAR**

**IMPORTANTE:** Antes de comenzar cualquier implementación, DEBES seguir este flujo obligatorio:

#### **FASE 1: CONSULTAS OBLIGATORIAS AL PROPIETARIO**

**1. 🏢 Identidad del Sistema:**
```
❓ PREGUNTAR AL PROPIETARIO:
- ¿Cuál será el nombre oficial del sistema?
- ¿Tienes un logo específico? (Si no, se usará el estándar)
- ¿Qué colores corporativos prefieres?
- ¿Cuál será el dominio/URL final del sistema?
```

**2. 🔒 Configuración de Seguridad:**
```
❓ PREGUNTAR AL PROPIETARIO:
- ¿Qué nivel de seguridad necesitas?
  • Alta: sessionStorage (datos se borran al cerrar pestaña)
  • Media: localStorage (datos persisten entre sesiones)
```

**3. 🎨 Componentes de Interfaz:**
```
❓ PREGUNTAR AL PROPIETARIO:
- ¿Quieres implementar el header estandarizado?
- ¿En qué páginas debe aparecer el gadget de ingresos activos?
- ¿Necesitas alguna personalización específica del diseño?
```

**4. 🔧 Configuraciones Técnicas:**
```
❓ PREGUNTAR AL PROPIETARIO:
- ¿Qué validaciones adicionales necesitas?
- ¿Hay algún flujo de trabajo específico de tu negocio?
- ¿Necesitas integraciones adicionales?
```

#### **FASE 2: IMPLEMENTACIÓN**
1. ✅ Implementar según las respuestas del propietario
2. ✅ Usar endpoints estandarizados obligatorios:
   - `/ingreso-derivado` (recepción por POST)
   - `/prueba-ingderivado.html` (testing)
3. ✅ Aplicar reglas de nomenclatura (iniciales a mayúsculas)
4. ✅ Integrar componentes estándar autorizados

#### **FASE 3: REVISIÓN CON PROPIETARIO**
1. ✅ Mostrar implementación completa
2. ✅ Validar funcionamiento con datos reales
3. ✅ Obtener aprobación final
4. ✅ Proceder al despliegue

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### 📋 **CONSULTAS PREVIAS (OBLIGATORIAS)**
- [ ] **Consultar nombre oficial del sistema**
- [ ] **Consultar logo y colores corporativos**
- [ ] **Consultar nivel de seguridad (sessionStorage vs localStorage)**
- [ ] **Consultar implementación de header estandarizado**
- [ ] **Consultar páginas para gadget de ingresos activos**
- [ ] **Consultar validaciones adicionales específicas**

### 🔐 **PRIMER INGRESO**
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