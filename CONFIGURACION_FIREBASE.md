# CONFIGURACIÓN DE FIREBASE - LEDROITCHECK

## 📋 PASOS PARA OBTENER LA CONFIGURACIÓN

### 1. Acceder a la Consola de Firebase
- Ir a: https://console.firebase.google.com/
- Seleccionar el proyecto `ledroitcheck`

### 2. Obtener Configuración Web
1. En el panel izquierdo, hacer clic en **⚙️ Configuración del proyecto**
2. Desplazarse hacia abajo hasta **Tus aplicaciones**
3. Hacer clic en **Aplicación web** (ícono `</>`
4. Si no existe, crear una nueva aplicación web:
   - Nombre: `LEDROITCHECK`
   - ✅ Marcar "También configura Firebase Hosting para esta aplicación"
   - Hacer clic en **Registrar aplicación**

### 3. Copiar Configuración
Copiar el objeto `firebaseConfig` que aparece:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key-aqui",
  authDomain: "ledroitcheck.firebaseapp.com",
  projectId: "ledroitcheck",
  storageBucket: "ledroitcheck.appspot.com",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
};
```

### 4. Actualizar Archivo de Configuración
Reemplazar el contenido en `public/firebase-config.js`:

```javascript
// CONFIGURACIÓN REAL DE FIREBASE
const firebaseConfig = {
  // PEGAR AQUÍ LA CONFIGURACIÓN OBTENIDA
  apiKey: "tu-api-key-real",
  authDomain: "ledroitcheck.firebaseapp.com",
  projectId: "ledroitcheck",
  storageBucket: "ledroitcheck.appspot.com",
  messagingSenderId: "tu-sender-id-real",
  appId: "tu-app-id-real"
};
```

## 🔧 CONFIGURACIONES ADICIONALES

### Habilitar Firestore
1. En la consola de Firebase, ir a **Firestore Database**
2. Hacer clic en **Crear base de datos**
3. Seleccionar **Modo de prueba** (las reglas ya están configuradas)
4. Elegir ubicación (recomendado: `us-central1`)

### Configurar Authentication (Opcional)
Si se requiere autenticación adicional:
1. Ir a **Authentication**
2. Hacer clic en **Comenzar**
3. Configurar métodos de acceso según necesidades

### Configurar Hosting
1. En la consola, ir a **Hosting**
2. Hacer clic en **Comenzar**
3. Seguir los pasos (ya están configurados en el proyecto)

## 🚀 COMANDOS DE DEPLOY

Una vez configurado Firebase:

```bash
# Instalar Firebase CLI (si no está instalado)
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Verificar configuración
firebase projects:list

# Deploy completo
firebase deploy

# Deploy solo hosting
firebase deploy --only hosting

# Deploy solo Firestore rules
firebase deploy --only firestore:rules

# Deploy solo functions
firebase deploy --only functions
```

## ✅ VERIFICACIÓN

Después del deploy, verificar:

1. **Hosting**: https://ledroitcheck.web.app/
2. **Firestore**: Consola de Firebase > Firestore Database
3. **Functions**: Consola de Firebase > Functions (si se usan)

## 🔒 SEGURIDAD

- ✅ Las reglas de Firestore están configuradas
- ✅ Solo dominios autorizados pueden usar la configuración
- ✅ Las claves API están restringidas por dominio

## 📞 SOPORTE

Si hay problemas con la configuración:
1. Verificar que el proyecto existe en Firebase
2. Confirmar que el usuario tiene permisos de administrador
3. Revisar la consola del navegador para errores
4. Verificar que las reglas de Firestore están activas

---

**IMPORTANTE**: Una vez obtenida la configuración real, eliminar este archivo por seguridad.