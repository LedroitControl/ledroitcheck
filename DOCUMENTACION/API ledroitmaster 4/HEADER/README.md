# 🎯 Sistema de Header Global - Ledroitsender

Sistema modular y portable de header global que puede integrarse fácilmente en otros sistemas secundarios.

## 📋 Descripción

Este sistema proporciona un header unificado que muestra:
- **Logo y nombre de la aplicación**
- **Información del usuario logueado** (nombre, avatar, iniciales)
- **Lista de empresas** asociadas al usuario con sus estados
- **Botón de cerrar sesión**
- **Diseño responsive** que se adapta a diferentes tamaños de pantalla

## 🚀 Instalación Rápida

### 1. Copiar Archivos
Copia estos archivos a tu proyecto:

```
assets/
├── global-header.css          # Estilos del header
├── global-header.js           # Lógica principal
├── global-header-template.html # Template HTML
├── firebase-init.js           # Configuración Firebase (opcional)
└── ledroitmaster-auth.js      # Sistema de autenticación (opcional)
```

### 2. Incluir en HTML
```html
<!DOCTYPE html>
<html lang="es" data-include-header="true">
<head>
    <!-- Incluir CSS -->
    <link rel="stylesheet" href="./assets/global-header.css">
    
    <!-- Incluir JavaScript -->
    <script src="./assets/firebase-init.js"></script>
    <script src="./assets/ledroitmaster-auth.js"></script>
    <script src="./assets/global-header.js"></script>
</head>
<body>
    <!-- El header se insertará automáticamente aquí -->
</body>
</html>
```

### 3. Configurar Sesión
```javascript
// Estructura mínima de datos de sesión
const sessionData = {
    user: {
        nombre: "Nombre del Usuario",
        foto_url: "URL_del_avatar", // opcional
        empresas: [
            {
                nombre: "Empresa 1",
                empresa_activa: true,
                usuario_activo: true,
                rol: ["admin", "user"]
            }
        ]
    },
    iniciales: "AB" // ✅ Usar "iniciales" (nomenclatura estándar)
};

// Guardar en sessionStorage
sessionStorage.setItem('ls_session', JSON.stringify(sessionData));
window.ledroitAuth = sessionData;
```

## ⚙️ Tipos de Header

### Header Completo
```html
<html data-include-header="true">
```
- Muestra toda la información: logo, usuario, empresas, logout

### Header Mínimo
```html
<html data-include-header="minimal">
```
- Solo logo y nombre de la aplicación

### Solo Brand
```html
<html data-include-header="brand-only">
```
- Logo, nombre y subtítulo de la aplicación

### Sin Header
```html
<html>
<!-- Sin atributo data-include-header -->
```
- No se muestra header

## 🔧 Personalización

### Configurar Logo y Nombre
Edita `global-header.js` líneas 15-20:

```javascript
this.config = {
    templatePath: './assets/global-header-template.html',
    cssPath: './assets/global-header.css',
    logoPath: './assets/tu-logo.svg',        // ← Cambiar aquí
    appName: 'Tu Aplicación'                 // ← Cambiar aquí
};
```

### Adaptar Colores y Estilos
Modifica `global-header.css` para cambiar:
- Colores del header
- Tipografía
- Espaciados
- Efectos visuales

### Configurar Autenticación
Si usas un sistema de autenticación diferente, modifica `ledroitmaster-auth.js`:

```javascript
constructor() {
    this.apiUrl = 'https://tu-api.com/login';    // ← Tu API
    this.sistemaOrigen = 'TU_SISTEMA';           // ← Tu sistema
    this.sessionKey = 'tu_session_key';          // ← Tu clave de sesión
}
```

## 🎮 Control Programático

### Refrescar Header
```javascript
// Método 1: Función global
window.refreshGlobalHeader();

// Método 2: Evento personalizado
window.dispatchEvent(new CustomEvent('globalHeaderRefresh'));

// Método 3: Instancia directa
window.globalHeaderInstance.refresh();
```

### Eventos Disponibles
```javascript
// Escuchar cambios de sesión
window.addEventListener('sessionChanged', (event) => {
    console.log('Sesión actualizada:', event.detail);
});

// Escuchar logout
window.addEventListener('userLogout', () => {
    console.log('Usuario cerró sesión');
    // Redirigir al login, limpiar datos, etc.
});
```

### Actualizar Datos de Usuario
```javascript
// Cambiar datos del usuario
const newUserData = {
    user: {
        nombre: "Nuevo Nombre",
        foto_url: "nueva-url.jpg",
        empresas: [/* nuevas empresas */]
    },
    iniciales: "NN" // ✅ Usar "iniciales" (nomenclatura estándar)
};

sessionStorage.setItem('ls_session', JSON.stringify(newUserData));
window.ledroitAuth = newUserData;
window.dispatchEvent(new CustomEvent('sessionChanged', { detail: newUserData }));
```

## 📊 Estructura de Datos

### Sesión de Usuario
```javascript
{
    user: {
        nombre: "Nombre Completo del Usuario",
        foto_url: "https://ejemplo.com/avatar.jpg", // opcional
        empresas: [
            {
                nombre: "Nombre de la Empresa",
                empresa_activa: true,    // Estado de la empresa
                usuario_activo: true,    // Estado del usuario en la empresa
                rol: ["admin", "user"]   // Roles del usuario
            }
        ]
    },
    iniciales: "AB",             // ✅ Iniciales del usuario (nomenclatura estándar)
    timestamp: 1234567890,       // Timestamp de la sesión
    sistema: "NOMBRE_SISTEMA"    // Identificador del sistema
}
```

### Estados de Empresa
- **empresa_activa**: `true/false` - Si la empresa está activa
- **usuario_activo**: `true/false` - Si el usuario está activo en la empresa
- **rol**: `Array` - Lista de roles del usuario en la empresa

## 🔄 Integración con Firebase (Opcional)

Si tu sistema usa Firebase, el header puede obtener datos actualizados automáticamente:

### Configurar Firebase
Edita `firebase-init.js`:

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

### Estructura de Colección
El header busca datos en la colección `ultimosIngresosSatisfactorios`:

```javascript
// Documento: {iniciales_usuario}
{
    respuestaLMaster: {
        success: true,
        data: {
            nombre: "Nombre Usuario",
            foto_url: "URL_avatar",
            empresas: [
                {
                    nombre: "Empresa",
                    empresa_activa: true,
                    usuario_activo: true,
                    rol: ["admin"]
                }
            ]
        }
    }
}
```

## 🎨 Características del Diseño

### Responsive
- Se adapta automáticamente a diferentes tamaños de pantalla
- En móviles, las empresas se muestran en formato compacto
- El header mantiene su funcionalidad en todos los dispositivos

### Accesibilidad
- Textos alternativos en imágenes
- Contraste adecuado de colores
- Navegación por teclado
- Tooltips informativos

### Performance
- Carga asíncrona de recursos
- Cache de datos de Firebase
- Fallbacks para recursos no disponibles
- Optimización de re-renders

## 🛠️ Solución de Problemas

### El header no aparece
1. Verificar que el HTML tenga `data-include-header="true"`
2. Comprobar que los archivos CSS y JS estén incluidos
3. Revisar la consola del navegador por errores

### Los datos del usuario no se muestran
1. Verificar que `sessionStorage` contenga `ls_session`
2. Comprobar la estructura de datos de la sesión
3. Revisar que `window.ledroitAuth` esté definido

### Las empresas no se cargan
1. Verificar que el array `empresas` exista en los datos de sesión
2. Comprobar que las empresas tengan la estructura correcta
3. Revisar logs en la consola del navegador

### Problemas con Firebase
1. Verificar la configuración en `firebase-init.js`
2. Comprobar que la colección `ultimosIngresosSatisfactorios` exista
3. Verificar permisos de lectura en Firestore

## 📝 Ejemplo Completo

Ver `ejemplo-implementacion.html` para una demostración completa con:
- Implementación básica
- Controles de prueba
- Diferentes configuraciones
- Eventos en tiempo real

## 🔒 Seguridad

### Buenas Prácticas
- No exponer credenciales en el código cliente
- Validar datos de sesión antes de usarlos
- Implementar timeout de inactividad
- Limpiar datos sensibles al cerrar sesión

### Configuración de Seguridad
```javascript
// Timeout de inactividad (1 hora por defecto)
this.inactivityTimeout = 60 * 60 * 1000;

// Eventos monitoreados para actividad
const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
```

## 📞 Soporte

Para dudas o problemas con la implementación:
1. Revisar esta documentación
2. Consultar `ejemplo-implementacion.html`
3. Revisar logs en la consola del navegador
4. Verificar la estructura de datos de sesión

---

**Versión:** 1.0  
**Última actualización:** Diciembre 2024  
**Compatibilidad:** Navegadores modernos (Chrome 70+, Firefox 65+, Safari 12+, Edge 79+)