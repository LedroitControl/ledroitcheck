# 📖 Guía Paso a Paso - Implementación del Header Global

Esta guía te llevará paso a paso para implementar el sistema de header global en tu proyecto.

## 🎯 Antes de Empezar

### Requisitos Previos
- [ ] Proyecto web con HTML, CSS y JavaScript
- [ ] Navegador moderno (Chrome 70+, Firefox 65+, Safari 12+, Edge 79+)
- [ ] Sistema de autenticación de usuarios (opcional)
- [ ] Firebase (opcional, para datos dinámicos)

### Lo que Necesitarás
- [ ] Los 5 archivos del sistema de header
- [ ] Logo de tu aplicación (formato SVG recomendado)
- [ ] Datos de sesión de usuario

---

## 📁 PASO 1: Preparar los Archivos

### 1.1 Crear Estructura de Carpetas
```
tu-proyecto/
├── assets/
│   ├── global-header.css
│   ├── global-header.js
│   ├── global-header-template.html
│   ├── firebase-init.js (opcional)
│   ├── ledroitmaster-auth.js (opcional)
│   └── tu-logo.svg
├── index.html
└── ...
```

### 1.2 Copiar Archivos del Header
Copia estos archivos desde la carpeta de documentación:

1. **global-header.css** → `assets/global-header.css`
2. **global-header.js** → `assets/global-header.js`
3. **global-header-template.html** → `assets/global-header-template.html`
4. **firebase-init.js** → `assets/firebase-init.js` (si usas Firebase)
5. **ledroitmaster-auth.js** → `assets/ledroitmaster-auth.js` (si usas el sistema de auth)

### 1.3 Agregar tu Logo
- Coloca tu logo en `assets/tu-logo.svg`
- Formato recomendado: SVG (escalable y ligero)
- Tamaño recomendado: 40x40px o proporcional

---

## 🔧 PASO 2: Configurar el Header

### 2.1 Personalizar Configuración
Abre `assets/global-header.js` y busca las líneas 15-20:

```javascript
this.config = {
    templatePath: './assets/global-header-template.html',
    cssPath: './assets/global-header.css',
    logoPath: './assets/tu-logo.svg',        // ← Cambiar por tu logo
    appName: 'Tu Aplicación'                 // ← Cambiar por tu nombre
};
```

**Ejemplo:**
```javascript
this.config = {
    templatePath: './assets/global-header-template.html',
    cssPath: './assets/global-header.css',
    logoPath: './assets/mi-empresa-logo.svg',
    appName: 'Mi Sistema ERP'
};
```

### 2.2 Personalizar Colores (Opcional)
Abre `assets/global-header.css` y modifica las variables CSS:

```css
:root {
    --header-bg: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9));
    --header-text: #1f2937;
    --header-border: rgba(0,0,0,0.1);
    --brand-color: #3b82f6;
    --logout-color: #ef4444;
}
```

---

## 📄 PASO 3: Integrar en tu HTML

### 3.1 Estructura Básica del HTML
```html
<!DOCTYPE html>
<html lang="es" data-include-header="true">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Aplicación</title>
    
    <!-- IMPORTANTE: Incluir archivos del header -->
    <link rel="stylesheet" href="./assets/global-header.css">
    <script src="./assets/global-header.js"></script>
</head>
<body>
    <!-- El header se insertará automáticamente aquí -->
    
    <main>
        <!-- Tu contenido aquí -->
    </main>
</body>
</html>
```

### 3.2 Tipos de Header Disponibles

**Header Completo (recomendado):**
```html
<html data-include-header="true">
```

**Header Mínimo:**
```html
<html data-include-header="minimal">
```

**Solo Logo:**
```html
<html data-include-header="brand-only">
```

**Sin Header:**
```html
<html>
<!-- Sin atributo -->
```

---

## 👤 PASO 4: Configurar Datos de Usuario

### 4.1 Estructura de Datos Mínima
```javascript
const userData = {
    user: {
        nombre: "Juan Pérez",
        foto_url: null, // opcional
        empresas: []    // opcional
    },
    iniciales: "JP" // ✅ Usar "iniciales" (nomenclatura estándar)
};
```

### 4.2 Estructura Completa con Empresas
```javascript
const userData = {
    user: {
        nombre: "María García López",
        foto_url: "https://ejemplo.com/avatar.jpg",
        empresas: [
            {
                nombre: "Empresa Principal S.A.",
                empresa_activa: true,
                usuario_activo: true,
                rol: ["admin", "gerente"]
            },
            {
                nombre: "Sucursal Norte",
                empresa_activa: true,
                usuario_activo: false,
                rol: ["usuario"]
            },
            {
                nombre: "Empresa Inactiva",
                empresa_activa: false,
                usuario_activo: true,
                rol: ["consultor"]
            }
        ]
    },
    iniciales: "MG" // ✅ Usar "iniciales" (nomenclatura estándar)
};
```

### 4.3 Guardar Datos de Sesión
```javascript
// Guardar en sessionStorage
sessionStorage.setItem('ls_session', JSON.stringify(userData));

// Hacer disponible globalmente
window.ledroitAuth = userData;

// Notificar al header (si ya está cargado)
window.dispatchEvent(new CustomEvent('sessionChanged', { detail: userData }));
```

---

## 🔐 PASO 5: Integrar con tu Sistema de Autenticación

### 5.1 Opción A: Sistema Personalizado

Si tienes tu propio sistema de login, modifica tu función de login:

```javascript
async function loginUser(username, password) {
    try {
        // Tu lógica de autenticación
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Adaptar datos para el header
            const headerData = {
                user: {
                    nombre: result.user.fullName,
                    foto_url: result.user.avatar,
                    empresas: result.user.companies || []
                },
                iniciales: result.user.iniciales || username.substring(0, 2).toUpperCase() // ✅ Usar "iniciales"
            };
            
            // Guardar para el header
            sessionStorage.setItem('ls_session', JSON.stringify(headerData));
            window.ledroitAuth = headerData;
            
            // Notificar cambio
            window.dispatchEvent(new CustomEvent('sessionChanged', { detail: headerData }));
            
            return { success: true };
        }
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: error.message };
    }
}
```

### 5.2 Opción B: Usar Sistema Incluido

Si quieres usar el sistema de autenticación incluido, modifica `assets/ledroitmaster-auth.js`:

```javascript
constructor() {
    this.apiUrl = 'https://tu-api.com/login';    // ← Tu endpoint de login
    this.sistemaOrigen = 'MI_SISTEMA';           // ← Identificador de tu sistema
    this.sessionKey = 'ls_session';              // ← Clave de sesión
}
```

---

## 🔥 PASO 6: Configurar Firebase (Opcional)

### 6.1 Si NO usas Firebase
Simplemente no incluyas `firebase-init.js` en tu HTML:

```html
<!-- NO incluir esta línea -->
<!-- <script src="./assets/firebase-init.js"></script> -->
```

### 6.2 Si SÍ usas Firebase

**Incluir Firebase SDK:**
```html
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
```

**Configurar tu proyecto:**
Edita `assets/firebase-init.js`:

```javascript
const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

**Crear colección en Firestore:**
```javascript
// Colección: ultimosIngresosSatisfactorios
// Documento: {iniciales_usuario}
{
    respuestaLMaster: {
        success: true,
        data: {
            nombre: "Usuario",
            foto_url: "URL",
            empresas: [...]
        }
    }
}
```

---

## 🧪 PASO 7: Probar la Implementación

### 7.1 Prueba Básica
1. Abre tu página en el navegador
2. Verifica que aparezca el header
3. Revisa la consola del navegador por errores

### 7.2 Prueba con Datos de Usuario
```javascript
// Ejecutar en la consola del navegador
const testUser = {
    user: {
        nombre: "Usuario de Prueba",
        empresas: [
            {
                nombre: "Empresa Test",
                empresa_activa: true,
                usuario_activo: true,
                rol: ["admin"]
            }
        ]
    },
    iniciales: "UT" // ✅ Usar "iniciales" (nomenclatura estándar)
};

sessionStorage.setItem('ls_session', JSON.stringify(testUser));
window.ledroitAuth = testUser;
window.dispatchEvent(new CustomEvent('sessionChanged', { detail: testUser }));
```

### 7.3 Prueba de Responsive
1. Abre las herramientas de desarrollador (F12)
2. Activa el modo responsive
3. Prueba diferentes tamaños de pantalla
4. Verifica que el header se adapte correctamente

---

## 🎮 PASO 8: Controles Avanzados

### 8.1 Refrescar Header Programáticamente
```javascript
// Cuando cambien los datos del usuario
function updateUserData(newData) {
    sessionStorage.setItem('ls_session', JSON.stringify(newData));
    window.ledroitAuth = newData;
    
    // Refrescar header
    window.refreshGlobalHeader();
}
```

### 8.2 Manejar Logout
```javascript
function logoutUser() {
    // Limpiar datos
    sessionStorage.removeItem('ls_session');
    localStorage.removeItem('ls_session');
    window.ledroitAuth = null;
    
    // Notificar logout
    window.dispatchEvent(new CustomEvent('userLogout'));
    
    // Redirigir
    window.location.href = 'login.html';
}
```

### 8.3 Escuchar Eventos del Header
```javascript
// Cambios de sesión
window.addEventListener('sessionChanged', (event) => {
    console.log('Usuario actualizado:', event.detail);
});

// Logout
window.addEventListener('userLogout', () => {
    console.log('Usuario cerró sesión');
    // Tu lógica de logout aquí
});
```

---

## ✅ PASO 9: Lista de Verificación Final

### Archivos
- [ ] `global-header.css` copiado y personalizado
- [ ] `global-header.js` copiado y configurado
- [ ] `global-header-template.html` copiado
- [ ] Logo agregado en formato SVG
- [ ] Archivos incluidos correctamente en HTML

### Configuración
- [ ] `data-include-header` configurado en HTML
- [ ] Logo y nombre de aplicación personalizados
- [ ] Colores adaptados (opcional)
- [ ] Sistema de autenticación integrado

### Funcionalidad
- [ ] Header aparece correctamente
- [ ] Datos de usuario se muestran
- [ ] Empresas se listan (si aplica)
- [ ] Botón de logout funciona
- [ ] Responsive funciona en móviles

### Pruebas
- [ ] Probado en diferentes navegadores
- [ ] Probado en diferentes tamaños de pantalla
- [ ] Sin errores en consola del navegador
- [ ] Datos se actualizan correctamente

---

## 🚨 Solución de Problemas Comunes

### El header no aparece
```javascript
// Verificar en consola:
console.log('Atributo header:', document.documentElement.getAttribute('data-include-header'));
console.log('Instancia header:', window.globalHeaderInstance);
```

### Los datos no se muestran
```javascript
// Verificar en consola:
console.log('Datos de sesión:', sessionStorage.getItem('ls_session'));
console.log('LedroitAuth:', window.ledroitAuth);
```

### Errores de archivos no encontrados
1. Verificar rutas de archivos en HTML
2. Comprobar que los archivos existan
3. Revisar permisos de archivos

### Problemas de estilos
1. Verificar que `global-header.css` esté incluido
2. Comprobar conflictos con otros CSS
3. Usar herramientas de desarrollador para debuggear

---

## 🎉 ¡Felicidades!

Si has seguido todos los pasos, ahora tienes un header global funcional en tu aplicación. El header se adaptará automáticamente a los datos de tu usuario y proporcionará una experiencia consistente en todo tu sistema.

### Próximos Pasos
- Personalizar más el diseño según tu marca
- Integrar con más funcionalidades de tu sistema
- Añadir notificaciones o badges al header
- Implementar temas claro/oscuro

### Recursos Adicionales
- Ver `ejemplo-implementacion.html` para una demo completa
- Consultar `README.md` para documentación detallada
- Revisar el código fuente para personalizaciones avanzadas