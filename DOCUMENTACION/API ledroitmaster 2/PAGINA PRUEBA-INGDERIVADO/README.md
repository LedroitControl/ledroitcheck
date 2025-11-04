# 📋 Documentación - Página Prueba Ingreso Derivado

## 🎯 Descripción General

La **Página Prueba Ingreso Derivado** es una herramienta de desarrollo y testing que permite probar los dos modos de ingreso derivado entre sistemas Ledroit:

- **Modo ACTIVO**: Envía usuarios desde tu sistema hacia otros sistemas Ledroit
- **Modo PASIVO**: Simula la recepción de usuarios desde otros sistemas Ledroit

Esta página es esencial para validar la integración correcta del sistema de ingreso derivado antes de implementarlo en producción.

## 📁 Archivos Incluidos

```
DOCUMENTACION PAGINA PRUEBA-INGDERIVADO/
├── 📄 README.md                    # Este archivo - Documentación principal
├── 📄 GUIA-PASO-A-PASO.md         # Guía detallada de implementación
├── 📄 prueba-ingderivado.html      # Página principal (copia del original)
├── 📄 firebase-init-template.js    # Template de configuración Firebase
├── 📄 config-template.js           # Archivo de configuración adaptable
└── 📄 ejemplo-implementacion.html  # Ejemplo completo de implementación
```

## ⚡ Características Principales

### 🔄 Modo ACTIVO
- ✅ Envío de usuarios a otros sistemas Ledroit
- ✅ Visualización de información de sesión actual
- ✅ Configuración de URL y nombre del sistema destino
- ✅ Generación automática de JSON de envío
- ✅ Opciones avanzadas de envío
- ✅ Copia automática de datos al portapapeles

### 🔄 Modo PASIVO
- ✅ Simulación de recepción de usuarios
- ✅ Área para pegar JSON de prueba
- ✅ Actualización automática de timestamp
- ✅ Validación completa de estructura de datos
- ✅ Envío directo a página de ingreso derivado
- ✅ Testing de diferentes escenarios

### 🛠️ Características Adicionales
- ✅ Sistema de pestañas intuitivo
- ✅ Notificaciones toast informativas
- ✅ Sistema de logs detallado
- ✅ Diseño responsive y moderno
- ✅ Validación de sesión automática
- ✅ Manejo de errores robusto

## 🔧 Dependencias Requeridas

### Externas
- **Firebase SDK v8.10.1** (incluido automáticamente)
  - `firebase-app.js`
  - `firebase-firestore.js`
  - `firebase-auth.js`
  - `firebase-storage.js`

### Internas
- **firebase-init.js** - Configuración de Firebase
- **Sesión activa** - En sessionStorage con estructura específica
- **Páginas relacionadas**:
  - `index.html` (página de login)
  - `ingreso-derivado` (endpoint POST obligatorio)
  - `ingreso-derivado.html` (página de procesamiento GET)

Nota importante sobre el flujo:
- Abrir directamente `ingreso-derivado.html` en el navegador mostrará un error, ya que esa página solo procesa solicitudes válidas que llegan con token (desde el POST a `/ingreso-derivado`) o con parámetros en la URL. Para probar correctamente, envía por POST al endpoint `/ingreso-derivado` o usa esta página de pruebas.

## 📊 Estructura de Sesión Requerida

La página requiere una sesión activa en `sessionStorage` con la siguiente estructura:

```javascript
{
  "initials": "AB",                    // Iniciales del usuario
  "user": "usuario@ejemplo.com",       // Email del usuario
  "companies": [                       // Array de empresas activas
    {
      "id": "123",
      "name": "Empresa Ejemplo",
      "active": true
    }
  ],
  "timestamp": 1703123456789,          // Timestamp de la sesión
  "ledroitMasterResponse": {           // Respuesta de Ledroit Master
    "success": true,
    "data": { /* datos adicionales */ }
  }
}
```

## 🚀 Implementación Rápida

### 1. Preparación de Archivos
```bash
# Crear estructura de carpetas
mkdir assets
mkdir pages

# Copiar archivos necesarios
cp prueba-ingderivado.html ./pages/
cp firebase-init-template.js ./assets/firebase-init.js
cp config-template.js ./assets/
```

### 2. Configuración Firebase
Editar `./assets/firebase-init.js`:
```javascript
const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    // ... resto de configuración
};
```

### 3. Personalización del Sistema
Editar `./assets/config-template.js`:
```javascript
window.PRUEBA_INGDERIVADO_CONFIG = {
    sistema: {
        nombre: "Mi Sistema Derivado",
        version: "1.0.0"
    },
    urls: {
        login: "index.html",
        ingresoDerivado: "ingreso-derivado.html",         // Página de procesamiento
        ingresoDerivadoEndpoint: "ingreso-derivado"        // Endpoint POST estandarizado
    }
    // ... resto de configuración
};

Ejemplo de envío estándar por POST desde el navegador:
```html
<form method="POST" action="/ingreso-derivado" target="_blank">
  <input type="hidden" name="respuestaLMaster" value='{"success":true,"data":{"iniciales":"AB","empresas":[{"nombre":"DECLAROFACIL","empresa_activa":true,"usuario_activo":true,"rol":["A1"]}]},"sistemaOrigen":"SISTEMA_X","timestamp":"2025-01-01T12:00:00Z"}'>
  <button type="submit">Enviar por POST</button>
 </form>
```
```

### 4. Integración en HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>Prueba Ingreso Derivado</title>
</head>
<body>
    <!-- Incluir configuración -->
    <script src="./assets/config-template.js"></script>
    
    <!-- Incluir Firebase -->
    <script src="./assets/firebase-init.js"></script>
    
    <!-- Incluir página principal -->
    <!-- El contenido de prueba-ingderivado.html va aquí -->
</body>
</html>
```

## ⚙️ Configuraciones Adaptables

### Sistema
- **Nombre del sistema**: Personalizar identificación
- **Versión**: Control de versiones
- **Descripción**: Información adicional

### URLs y Navegación
- **Página de login**: Ruta personalizable
- **Página de ingreso derivado**: Ruta personalizable
- **Dashboard**: Página principal (opcional)
- **Ayuda**: Documentación (opcional)

### Sesión y Seguridad
- **Clave de sessionStorage**: Personalizable
- **Timeout de sesión**: Configurable en horas
- **Timeout de timestamp**: Configurable en minutos
- **Validación de estructura**: Habilitación opcional

### Interfaz de Usuario
- **Título de página**: Personalizable
- **Colores**: Primario y secundario
- **Tema**: Claro u oscuro
- **Logo**: Mostrar/ocultar

### Funcionalidades
- **Modo activo**: Habilitar/deshabilitar
- **Modo pasivo**: Habilitar/deshabilitar
- **Sistema de logs**: Configurable
- **Modo debug**: Para desarrollo

## 🔍 Validaciones Implementadas

### Sesión
- ✅ Existencia de sesión en sessionStorage
- ✅ Validez del timestamp (no expirado)
- ✅ Estructura correcta de datos
- ✅ Presencia de empresas activas
- ✅ Formato correcto de iniciales y usuario

### Modo ACTIVO
- ✅ URL destino válida
- ✅ Nombre de sistema no vacío
- ✅ Datos de sesión completos
- ✅ Generación correcta de JSON

### Modo PASIVO
- ✅ JSON válido y parseable
- ✅ Estructura de datos correcta
- ✅ Timestamp actualizado
- ✅ Empresas activas presentes

## 🎨 Personalización de UI

### Colores CSS Variables
```css
:root {
    --color-primario: #007bff;
    --color-secundario: #6c757d;
    --color-exito: #28a745;
    --color-advertencia: #ffc107;
    --color-error: #dc3545;
}
```

### Clases CSS Principales
- `.container` - Contenedor principal
- `.tab-container` - Contenedor de pestañas
- `.tab-content` - Contenido de pestañas
- `.form-group` - Grupos de formulario
- `.btn` - Botones
- `.toast` - Notificaciones
- `.log-area` - Área de logs

## 🔒 Consideraciones de Seguridad

### Datos Sensibles
- ❌ **NO** incluir configuraciones reales en repositorios públicos
- ✅ Usar variables de entorno en producción
- ✅ Configurar reglas de seguridad en Firebase
- ✅ Validar datos de entrada siempre

### Sesión
- ✅ Validar timestamp para evitar sesiones expiradas
- ✅ Verificar estructura de datos antes de usar
- ✅ Limpiar datos sensibles al cerrar sesión
- ✅ Implementar timeouts apropiados

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

### Dispositivos
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (320px - 767px)

### Tecnologías
- ✅ HTML5
- ✅ CSS3 (Grid, Flexbox)
- ✅ JavaScript ES6+
- ✅ Firebase SDK v8.10.1

## 🐛 Solución de Problemas

### Error: "Firebase no inicializado"
```javascript
// Verificar configuración en firebase-init.js
console.log(firebase.apps.length); // Debe ser > 0
```

### Error: "Sesión no encontrada"
```javascript
// Verificar sessionStorage
console.log(sessionStorage.getItem('ls_session'));
```

### Error: "Timestamp expirado"
```javascript
// Verificar configuración de timeout
const config = getConfig('sesion');
console.log('Timeout configurado:', config.timeoutHoras);
```

### Error: "Empresas no activas"
```javascript
// Verificar estructura de empresas
const sesion = JSON.parse(sessionStorage.getItem('ls_session'));
console.log('Empresas:', sesion.companies);
```

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre la implementación:

1. **Revisar** la guía paso a paso: `GUIA-PASO-A-PASO.md`
2. **Consultar** el ejemplo de implementación: `ejemplo-implementacion.html`
3. **Verificar** configuraciones en archivos template
4. **Revisar** logs del navegador para errores específicos

## 📄 Licencia y Uso

Esta documentación y archivos son parte del ecosistema **Ledroit Master** y están destinados para uso en sistemas derivados autorizados.

- ✅ Uso permitido en sistemas derivados de Ledroit
- ✅ Modificación y adaptación permitida
- ❌ Redistribución sin autorización
- ❌ Uso comercial independiente

---

**Versión de Documentación**: 1.0.0  
**Última Actualización**: Diciembre 2024  
**Compatibilidad**: Ledroit Master API v2.0+