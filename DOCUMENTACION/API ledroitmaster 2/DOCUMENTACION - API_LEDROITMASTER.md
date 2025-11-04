cep# DOCUMENTACIÓN API LEDROITMASTER

## 📋 ÍNDICE DE CONTENIDO

1. [Directrices Principales](#directrices-principales)
2. [Conceptos Fundamentales de Sesiones](#-conceptos-fundamentales-de-sesiones)
3. [Estructura Estándar de Datos](#-estructura-estándar-de-datos)
4. [Endpoints de Producción](#-endpoints-de-producción)
5. [Implementaciones Específicas](#-implementaciones-específicas)
6. [Ejemplos Prácticos](#-ejemplos-prácticos-de-implementación)

---

## DIRECTRICES PRINCIPALES

### PROLEGÓMENOS
La Familia Ledroit tiene varios sistemas secundarios (aplicaciones web), varios usuarios y cada usuario puede tener varios roles.
Existe una aplicación maestra llamada https://ledroitmaster.web.app/ la cual centraliza las empresas, usuarios y roles.

**Escenarios:**
- Una empresa puede estar activa o inactiva
- Un usuario puede estar activo en la empresa o inactivo  
- Un usuario puede tener rol A1 (propietario), A2 (administrador), A3 (usuario), A4 (usuario limitado)

Cada sistema le envía información a ledroitmaster y A) devuelve negativa, o en caso de ser positiva: b) devuelve información en un json.
En caso de ser positivo el acceso, TODAVÍA PODRÍA EXISTIR OTRA CAPA: el sistema secundario podría: a) permitir el acceso, o b) analizando la información recibida, aceptar o rechazar el acceso

### 🎯 ARQUITECTURA DEL ECOSISTEMA

**LEDROITMASTER (Sistema Madre):**
- Centraliza autenticación y autorización
- Mantiene registro de usuarios, empresas y roles
- Proporciona APIs para validación de acceso
- Registra auditoría de todos los ingresos

**SISTEMAS SECUNDARIOS:**
- Consumen APIs de LedroitMaster para autenticación
- Implementan lógica de negocio específica
- Mantienen sesiones locales derivadas
- Reportan actividad de usuarios a LedroitMaster

---

## 🔐 CONCEPTOS FUNDAMENTALES DE SESIONES

### PRIMER INGRESO
El **PRIMER INGRESO** es la autenticación inicial de un usuario al sistema secundario. Representa el momento en que un usuario proporciona sus credenciales y el sistema ledroitmaster valida su identidad.

**Características del Primer Ingreso:**
- **Validación completa:** El sistema secundario envía la contraseña común (`claBComun`) del usuario
- **Verificación de estado:** El sistema secundario confirma que tanto el usuario como las empresas están activos
- **Información completa:** Se retorna toda la información del usuario y sus empresas disponibles
- **Establecimiento de sesión:** El sistema secundario crea una nueva sesión de trabajo 
- **Registro de auditoría:** Ledroitmaster documenta el evento para trazabilidad

**Cuándo ocurre un Primer Ingreso:**
- Usuario abre Excel/aplicación web y necesita autenticarse por primera vez en la sesión
- Sistema externo requiere validar la identidad de un usuario
- Cualquier situación donde se necesite validación completa de credenciales

### INGRESO DERIVADO
El **INGRESO DERIVADO** es el acceso automático entre sistemas una vez que el usuario ya está autenticado. No requiere nueva validación de credenciales, solo registra el evento para auditoría.

**Características del Ingreso Derivado:**
- **Sin reautenticación:** No se solicitan credenciales nuevamente
- **Solo auditoría:** Se registra únicamente el evento de navegación entre sistemas
- **Trazabilidad:** Permite seguir el flujo del usuario entre diferentes aplicaciones
- **Control granular:** Posibilita el control de acceso específico por empresa y sistema

**Cuándo ocurre un Ingreso Derivado:**
- Usuario autenticado en LedroitMaster accede al sistema contable
- Desde Excel se abre automáticamente una aplicación web relacionada
- Un sistema transfiere al usuario a otro sistema manteniendo la sesión
- Navegación entre módulos del ecosistema sin requerir nueva autenticación

### LÓGICA DE IMPLEMENTACIÓN

#### 1. PRIMER INGRESO - Flujo Completo

En el login, el sistema secundario debe pedir información a LEDROITMASTER para iniciar sesión:

**Paso 1: Autenticación con LedroitMaster**
- El sistema secundario envía `claBComun` (y opcionalmente otros parámetros) a la API de autenticación
- LedroitMaster valida las credenciales y retorna la información del usuario

**Paso 2: Validación Local (Opcional)**
- El sistema secundario puede implementar validaciones adicionales
- Ejemplo: verificar si el usuario tiene acceso a módulos específicos

**Paso 3: Persistencia de Respaldo**
- **OBLIGATORIO:** Guardar la respuesta exitosa en colección "ultimosIngresosSatisfactorios"
- **Estructura estandarizada:**
  - Documento con `iniciales` del usuario como ID
  - Campos: `claBComun`, `iniciales`, `sistemaOrigen`, `timestamp`, `respuestaLMaster`
  - Cada nuevo ingreso **reemplaza** el registro anterior (evita saturación)

**Paso 4: Creación de Sesión Local**
- Crear sesión en el sistema secundario usando los datos recibidos
- **IMPORTANTE:** La sesión local (`ls_session`) NO incluye `respuestaLMaster` completa
- Solo incluir datos necesarios para la operación del sistema

**Paso 5: Fallback (Solo en caso de error de conexión)**
- Si la API no responde, buscar en "ultimosIngresosSatisfactorios"
- Validar `iniciales` y `claBComun` contra el registro guardado
- Si coincide, crear sesión con datos de `respuestaLMaster/data`
- **IMPORTANTE:** El fallback NO aplica si la API responde negativamente

#### 2. INGRESO DERIVADO - Navegación entre Sistemas

**Concepto:** Una aplicación ya autenticada (SISTEMA ACTIVO) envía al usuario a otro sistema (SISTEMA PASIVO).

**Flujo SISTEMA ACTIVO:**
1. Obtener documento de "ultimosIngresosSatisfactorios" del usuario actual
2. Actualizar metainformación: `sistemaOrigen`, `timestamp`
3. Enviar `respuestaLMaster` al sistema destino usando método POST
4. Registrar el evento de envío

**Flujo SISTEMA PASIVO:**
1. Recibir `respuestaLMaster` del sistema origen
2. Validar estructura y metainformación recibida
3. Analizar datos del usuario y determinar si permite acceso
4. Si permite acceso:
   - Actualizar "ultimosIngresosSatisfactorios" con datos recibidos
   - Crear sesión local derivada
   - Notificar a LedroitMaster usando API de auditoría
5. Si no permite acceso:
   - Notificar a LedroitMaster con resultado "FALLIDO"
   - Mostrar mensaje de error apropiado

**Estados del Sistema:**
- **ACTIVO:** Cuando envía usuarios a otros sistemas
- **PASIVO:** Cuando recibe usuarios de otros sistemas  
- **ACTIVO DESPUÉS DE PASIVO:** Un sistema puede cambiar de rol dinámicamente

---

## 📊 ESTRUCTURA ESTÁNDAR DE DATOS

### 🔑 Estructura de Sesión Local (`ls_session`)

**IMPORTANTE:** Esta es la estructura ÚNICA y ESTÁNDAR que todos los sistemas deben usar para `ls_session`:

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

**⚠️ REGLAS CRÍTICAS:**
- **NUNCA incluir `respuestaLMaster` en `ls_session`** (solo va en "ultimosIngresosSatisfactorios")
- **Usar nomenclatura de LedroitMaster:** `iniciales`, `empresas`, `nombre`, `empresa_activa`
- **Mantener consistencia** en todos los sistemas del ecosistema

### 🗄️ Estructura de Respaldo (`ultimosIngresosSatisfactorios`)

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

### 🔄 Estrategia de Persistencia

**CONFIGURACIÓN OBLIGATORIA:** El asistente/programador DEBE preguntar al propietario:

**Opción A - Alta Seguridad (Recomendado para sistemas críticos):**
```javascript
// Solo sessionStorage - datos se borran al cerrar ventana/pestaña
sessionStorage.setItem('ls_session', JSON.stringify(sessionData));
```

**Opción B - Baja-Media Seguridad (Recomendado para sistemas de uso frecuente):**
```javascript  
// localStorage - datos persisten entre sesiones del navegador
localStorage.setItem('ls_session', JSON.stringify(sessionData));
```

**Diferencias clave:**
- **sessionStorage:** Más seguro, datos se borran al cerrar pestaña
- **localStorage:** Más conveniente, datos persisten hasta borrado manual

**Firestore (ultimosIngresosSatisfactorios):**
- **Propósito:** Solo respaldo para fallback, NO afecta sesión actual
- **Uso:** Cuando API no responde (error de conexión)
- **Actualización:** Cada ingreso exitoso reemplaza el anterior


## 🌐 ENDPOINTS DE PRODUCCIÓN

### URLs RECOMENDADAS (Cloud Run - Mayor Rendimiento)
- **Autenticación (Primer Ingreso):** `https://authlogin-fmunxt6pjq-uc.a.run.app`
- **Auditoría (Ingreso Derivado PASIVO):** `https://auditingresoderivado-fmunxt6pjq-uc.a.run.app`
- **Obtener Todos los Usuarios:** `https://getallusers-fmunxt6pjq-uc.a.run.app`
- **Obtener Usuario por ID/Iniciales:** `https://getuserbyid-fmunxt6pjq-uc.a.run.app`
- **Herramienta de Testing:** `https://ledroitmaster.web.app/TEST_API.html`
- **Testing APIs de Usuarios:** `https://ledroitmaster.web.app/test-users-api.html`

### URLs Alternativas (Firebase Functions)
- **Autenticación:** `https://us-central1-ledroitmaster.cloudfunctions.net/authLogin`
- **Auditoría:** `https://us-central1-ledroitmaster.cloudfunctions.net/auditIngresoDerivado`
- **Obtener Todos los Usuarios:** `https://us-central1-ledroitmaster.cloudfunctions.net/getAllUsers`
- **Obtener Usuario por ID/Iniciales:** `https://us-central1-ledroitmaster.cloudfunctions.net/getUserById`

**⚠️ RECOMENDACIÓN:** Utiliza siempre las URLs de Cloud Run para mejor rendimiento y acceso directo.

---

## 🔑 ENDPOINT DE AUTENTICACIÓN (PRIMER INGRESO)

### Información General
**URL:** `https://authlogin-fmunxt6pjq-uc.a.run.app`  
**Método:** `POST`  
**Content-Type:** `application/json`

### Parámetros de Solicitud
```json
{
  "claBComun": "password123",           // ✅ OBLIGATORIO - Contraseña común del usuario. No declararlo como contraseña en el login, para evitar que el navegador sugiera guardar contraseña.
  "iniciales": "ABC",                   // 🔶 OPCIONAL pero RECOMENDADO - Iniciales del usuario
  "empresaSolicitante": "EMPRESA SA",   // 🔶 OPCIONAL - Nombre exacto de la empresa
  "direccionIp": "192.168.1.100",       // 🔶 OPCIONAL - IP del cliente
  "sistemaOrigen": "SISTEMA_EXCEL"      // 🔶 OPCIONAL - Sistema que origina la solicitud
}
```

### Lógica de Validación

**Solicitud Simple (Solo claBComun):**
- Busca usuario por `claBComun`
- Devuelve información global completa sin validaciones adicionales
- El sistema cliente decide si otorga acceso

**Solicitud Detallada (Con parámetros adicionales):**
- Validación de Rate Limit (100 requests/minuto por IP)
- Búsqueda y validación de usuario activo
- Validación de acceso a empresa específica (si se proporciona)
- Respuesta solo si todas las validaciones pasan

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "iniciales": "ABC",                                    // ✅ Usar "iniciales" (nomenclatura estándar)
    "nombre": "Nombre Completo Usuario",                   // ✅ Usar "nombre" (nomenclatura estándar)
    "foto_url": "https://storage.googleapis.com/ledroitmaster.appspot.com/users/ABC/fotografia/timestamp_foto.jpg",
    "empresas": [                                          // ✅ Usar "empresas" (nomenclatura estándar)
      {
        "nombre": "EMPRESA SA",                            // ✅ Usar "nombre" (nomenclatura estándar)
        "empresa_activa": true,                            // ✅ Usar "empresa_activa" (nomenclatura estándar)
        "usuario_activo": true,                            // ✅ Usar "usuario_activo" (nomenclatura estándar)
        "rol": ["A1"]                                      // ✅ Array de roles (siempre array)
      }
    ]
  },
  "error": null,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Respuesta de Error (200 con success: false)
```json
{
  "success": false,
  "error": "Error en Iniciales o ClaBComun",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📊 ENDPOINT DE AUDITORÍA (INGRESO DERIVADO PASIVO)

### Información General
**URL:** `https://auditingresoderivado-fmunxt6pjq-uc.a.run.app`  
**Método:** `POST`  
**Content-Type:** `application/json`

### Parámetros de Solicitud
```json
{
  "iniciales": "ABC",                    // ✅ OBLIGATORIO - Iniciales del usuario
  "sistemaOrigen": "SISTEMA1",      // ✅ OBLIGATORIO - Sistema desde donde se origina
  "sistemaDestino": "SISTEMA2",  // ✅ OBLIGATORIO - Sistema al que se accede
  "resultado": "EXITOSO",                // ✅ OBLIGATORIO - "EXITOSO" o "FALLIDO"
  "direccionIp": "192.168.1.100"         // 🔶 OPCIONAL - IP del cliente
}
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Evento de auditoría registrado exitosamente",
  "audit": {
    "actionType": "API_INGRESO_DERIVADO_SUCCESS",
    "userInitials": "ABC",
    "sistemaOrigen": "SISTEMA1",
    "sistemaDestino": "SISTEMA2",
    "resultado": "EXITOSO",
    "responseTimeMs": 150
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 👥 ENDPOINTS DE GESTIÓN DE USUARIOS

### 📋 OBTENER TODOS LOS USUARIOS

#### Información General
**URL:** `https://getallusers-fmunxt6pjq-uc.a.run.app`  
**Método:** `GET`  
**Content-Type:** No requerido (GET request)

#### Descripción
Este endpoint permite obtener una lista completa de todos los usuarios registrados en el sistema, incluyendo su información básica y las empresas a las que tienen acceso.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "yVs3acwxhXoVr1YIKnKW",
        "name": "MANUELA CECILIA LOPEZ CASTAÑEDA",
        "initials": "CLC",
        "createdAt": "2025-09-18T21:11:40.189Z",
        "moreInfo": {
          "personalData": {
            "apellidoPaterno": "LOPEZ",
            "apellidoMaterno": "CASTAÑEDA",
            "nombres": "MANUELA CECILIA",
            "fechaNacimiento": "1990-05-15",
            "curp": "LOCM900515MVZPST02"
          },
          "fiscalData": {
            "rfc": "LOCM900515ABC",
            "regimenFiscal": "605"
          },
          "address": {
            "numero": "34",
            "colonia": "FRAACCIONES",
            "localidad": "XALAPA",
            "municipio": "XALAPA",
            "codigoPostal": "91015",
            "telefono": "2281242496"
          }
        },
        "companies": [
          {
            "companyId": "company_id_123",
            "companyName": "EMPRESA EJEMPLO SA",
            "companyStatus": "active",
            "userRole": ["A1"],
            "userStatus": "active"
          }
        ]
      }
    ],
    "totalUsers": 15,
    "timestamp": "2025-12-18T10:30:00.000Z"
  },
  "timestamp": "2025-12-18T10:30:00.000Z"
}
```

### 🔍 OBTENER USUARIO POR ID O INICIALES

#### Información General
**URL:** `https://getuserbyid-fmunxt6pjq-uc.a.run.app`  
**Método:** `GET`  
**Content-Type:** No requerido (GET request)

**📋 FUNCIONALIDAD:** Obtiene información completa de un usuario específico, incluyendo:
- Datos básicos del usuario
- Información personal, fiscal y de contacto
- Empresas asociadas
- **📄 Documentos de la subcolección "documentos"** (NUEVO)

#### Parámetros de Consulta (Query Parameters)
```
?id=yVs3acwxhXoVr1YIKnKW          // 🔶 OPCIONAL - ID del usuario
?initials=CLC                      // 🔶 OPCIONAL - Iniciales del usuario
```

**⚠️ NOTA:** Debe proporcionar al menos uno de los dos parámetros (`id` o `initials`).

#### Ejemplos de Uso
```bash
# Buscar por ID
GET https://getuserbyid-fmunxt6pjq-uc.a.run.app?id=yVs3acwxhXoVr1YIKnKW

# Buscar por iniciales
GET https://getuserbyid-fmunxt6pjq-uc.a.run.app?initials=CLC
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "yVs3acwxhXoVr1YIKnKW",
      "name": "MANUELA CECILIA LOPEZ CASTAÑEDA",
      "initials": "CLC",
      "createdAt": "2025-09-18T21:11:40.189Z",
      "moreInfo": {
        "personalData": {
          "apellidoPaterno": "LOPEZ",
          "apellidoMaterno": "CASTAÑEDA",
          "nombres": "MANUELA CECILIA",
          "fechaNacimiento": "1993-08-23",
          "curp": "LOCM930823MVZPSN04"
        },
        "fiscalData": {
          "rfc": "",
          "regimenFiscal": ""
        },
        "address": {
          "calle": "PRIVADA DE LOS PINOS",
          "numero": "34",
          "colonia": "LOMAS DEL SEMINARIO",
          "localidad": "XALAPA",
          "municipio": "XALAPA",
          "telefono": "",
          "celular": "2283609637",
          "correo": "eci_cmlk23@hotmail.com",
          "codigoPostal": "91023"
        },
        "lastUpdated": "2025-10-29T19:07:06.058Z"
      },
      "companies": [
        {
          "companyId": "ksKxR20FPddMMrPq74Ri",
          "companyName": "EDITORIAL",
          "companyStatus": "activa",
          "userRole": "A2",
          "userStatus": "activo"
        },
        {
          "companyId": "hOdYXQ9dLKWkPT3FuEPk",
          "companyName": "DECLAROFACIL",
          "companyStatus": "activa",
          "userRole": "A4",
          "userStatus": "activo"
        },
        {
          "companyId": "66gsn5ly68biqdD8JtJE",
          "companyName": "ADMINTALLER",
          "companyStatus": "activa",
          "userRole": "A2",
          "userStatus": "activo"
        },
        {
          "companyId": "WZ2MUQuHlwr1OmyzeXOj",
          "companyName": "CONTROLMASTER",
          "companyStatus": "activa",
          "userRole": "A3",
          "userStatus": "activo"
        }
      ],
      "documents": [
        {
          "id": "JSbzvjYLUAhTm43ok02J",
          "category": "fotografia",
          "fileSize": 66367,
          "originalName": "foto_cuadrada_1758826637052.jpg",
          "downloadURL": "https://firebasestorage.googleapis.com/v0/b/ledroitmaster.firebasestorage.app/o/users%2FCLC%2Ffotografia%2F2025-09-25T18-57-21-691Z_foto_cuadrada_1758826637052.jpg?alt=media&token=0de39168-1b66-4c99-a2a7-4e071faf9822",
          "storagePath": "users/CLC/fotografia/2025-09-25T18-57-21-691Z_foto_cuadrada_1758826637052.jpg",
          "mimeType": "image/jpeg",
          "userId": "yVs3acwxhXoVr1YIKnKW",
          "active": true,
          "fileName": "foto_cuadrada_1758826637052.jpg",
          "uploadDate": "2025-09-25T18:57:24.695Z"
        },
        {
          "id": "wXyGTQLA7T5OyHs1PbHi",
          "fileName": "Credencial Ceci.pdf",
          "originalName": "Credencial Ceci.pdf",
          "storagePath": "users/CLC/identificacion/2025-10-29T19-07-06-429Z_Credencial_Ceci.pdf",
          "downloadURL": "https://firebasestorage.googleapis.com/v0/b/ledroitmaster.firebasestorage.app/o/users%2FCLC%2Fidentificacion%2F2025-10-29T19-07-06-429Z_Credencial_Ceci.pdf?alt=media&token=a4c8bc90-27dd-4706-988d-7d9e71914d7d",
          "category": "identificacion",
          "userId": "yVs3acwxhXoVr1YIKnKW",
          "fileSize": 519742,
          "mimeType": "application/pdf",
          "active": true,
          "uploadDate": "2025-10-29T19:07:09.983Z"
        },
        {
          "id": "xhQa7I18Wj2cXQjSwaOr",
          "fileName": "recibo_cfe.pdf",
          "originalName": "recibo_cfe.pdf",
          "storagePath": "users/CLC/domicilio/2025-10-29T19-07-06-430Z_recibo_cfe.pdf",
          "downloadURL": "https://firebasestorage.googleapis.com/v0/b/ledroitmaster.firebasestorage.app/o/users%2FCLC%2Fdomicilio%2F2025-10-29T19-07-06-430Z_recibo_cfe.pdf?alt=media&token=f71eac84-5b07-458e-b201-9a297e8436fc",
          "category": "domicilio",
          "userId": "yVs3acwxhXoVr1YIKnKW",
          "fileSize": 302338,
          "mimeType": "application/pdf",
          "active": true,
          "uploadDate": "2025-10-29T19:07:09.931Z"
        }
      ]
    },
    "searchType": "initials",
    "searchValue": "CLC"
  },
  "timestamp": "2025-10-30T21:53:24.196Z"
}
```

#### Respuesta de Error - Usuario No Encontrado (404)
```json
{
  "success": false,
  "error": "Usuario no encontrado.",
  "timestamp": "2025-12-18T10:30:00.000Z"
}
```

#### Respuesta de Error - Parámetros Faltantes (400)
```json
{
  "success": false,
  "error": "Debe proporcionar el parámetro \"id\" o \"initials\".",
  "timestamp": "2025-12-18T10:30:00.000Z"
}
```

### 🔧 CARACTERÍSTICAS TÉCNICAS DE LAS APIS DE USUARIOS

#### Seguridad y Limitaciones
- **Rate Limiting:** 100 requests por minuto por IP
- **CORS:** Habilitado para todos los orígenes
- **Método HTTP:** GET únicamente
- **Auditoría:** Todos los eventos se registran automáticamente

#### Campos de Respuesta
| Campo | Descripción | Tipo |
|-------|-------------|------|
| `id` | ID único del usuario en Firestore | String |
| `name` | Nombre completo del usuario | String |
| `initials` | Iniciales del usuario | String |
| `createdAt` | Fecha de creación (formato ISO 8601) | String |
| `moreInfo` | Información adicional del usuario | Object |
| `moreInfo.personalData` | Datos personales (nombres, apellidos, CURP, etc.) | Object |
| `moreInfo.fiscalData` | Datos fiscales (RFC, régimen fiscal) | Object |
| `moreInfo.address` | Dirección y datos de contacto (calle, colonia, teléfono, correo, etc.) | Object |
| `moreInfo.lastUpdated` | Fecha de última actualización de la información | String |
| `companies` | Array de empresas asociadas | Array |
| `documents` | Lista de documentos del usuario (subcolección) | Array |
| `documents[].id` | ID del documento | String |
| `documents[].category` | Categoría del documento (fotografia, identificacion, domicilio) | String |
| `documents[].fileName` | Nombre del archivo | String |
| `documents[].originalName` | Nombre original del archivo | String |
| `documents[].downloadURL` | URL de descarga del archivo | String |
| `documents[].storagePath` | Ruta de almacenamiento en Firebase Storage | String |
| `documents[].fileSize` | Tamaño del archivo en bytes | Number |
| `documents[].mimeType` | Tipo MIME del archivo | String |
| `documents[].active` | Estado activo del documento | Boolean |
| `documents[].uploadDate` | Fecha de subida del documento | String |

#### Información de Empresas
| Campo | Descripción | Tipo |
|-------|-------------|------|
| `companyId` | ID único de la empresa | String |
| `companyName` | Nombre de la empresa | String |
| `companyStatus` | Estado de la empresa (activa/inactiva) | String |
| `userRole` | Rol del usuario en la empresa (A1, A2, A3, A4) | String |
| `userStatus` | Estado del usuario en la empresa (activo/inactivo) | String |

**Roles de Usuario:**
- **A1:** Propietario
- **A2:** Administrador  
- **A3:** Usuario
- **A4:** Usuario limitado

### 🧪 HERRAMIENTA DE TESTING PARA USUARIOS

Utiliza la herramienta interactiva disponible en:
`https://ledroitmaster.web.app/test-users-api.html`

**Características:**
- Probar ambos endpoints de usuarios
- Buscar por ID o iniciales
- Visualizar respuestas JSON formateadas
- Depurar problemas de integración
- Interfaz amigable para testing

---

## 🚨 CÓDIGOS DE ERROR Y MANEJO

### Códigos HTTP de Respuesta
| Código | Significado | Cuándo Ocurre | Acción Recomendada |
|--------|-------------|---------------|--------------------|
| **200** | OK | Respuesta exitosa o error controlado | Verificar campo `success` en JSON |
| **400** | Bad Request | Parámetros faltantes o inválidos | Revisar parámetros enviados |
| **405** | Method Not Allowed | Método HTTP incorrecto | Usar POST únicamente |
| **429** | Too Many Requests | Rate limit excedido | Esperar 1 minuto antes de reintentar |
| **500** | Internal Server Error | Error interno del servidor | Reintentar después de unos segundos |

### Errores Comunes de Autenticación
| Error | Causa | Solución |
|-------|-------|----------|
| "claBComun es obligatorio" | Falta parámetro obligatorio | Incluir `claBComun` en la solicitud |
| "Error en Iniciales o ClaBComun" | Usuario no encontrado | Verificar credenciales |
| "NO TIENES ACCESO A ESTA EMPRESA" | Sin permisos de empresa | Verificar permisos |
| "USUARIO INACTIVO TEMPORALMENTE" | Usuario deshabilitado | Contactar administrador |
| "LA EMPRESA NO ESTÁ ACTIVA" | Empresa deshabilitada | Contactar administrador |

---

## 💡 EJEMPLOS PRÁCTICOS DE IMPLEMENTACIÓN

### 🌐 Implementación en JavaScript (Web)

#### Ejemplo Completo de Primer Ingreso
```javascript
/**
 * FUNCIÓN ESTÁNDAR PARA PRIMER INGRESO
 * Implementa la lógica completa con fallback y persistencia
 */
async function primerIngreso(claBComun, iniciales = '', empresa = '') {
    const API_URL = 'https://authlogin-fmunxt6pjq-uc.a.run.app';
    
    try {
        // Paso 1: Intentar autenticación con LedroitMaster
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                claBComun: claBComun,
                iniciales: iniciales,
                empresaSolicitante: empresa,
                sistemaOrigen: 'SISTEMA_WEB'
            })
        });

        const data = await response.json();

        if (data.success) {
            // Paso 2: Guardar respaldo en Firestore
            await guardarRespaldoFirestore(iniciales, claBComun, data);
            
            // Paso 3: Crear sesión local con estructura estándar
            const ls_session = {
                iniciales: data.data.iniciales,                    // ✅ Nomenclatura estándar
                nombre: data.data.nombre,                          // ✅ Nomenclatura estándar
                foto_url: data.data.foto_url,
                empresas: data.data.empresas,                      // ✅ Nomenclatura estándar
                timestamp: new Date().toISOString(),
                sistemaOrigen: 'SISTEMA_WEB'
            };
            
            // Paso 4: Persistir sesión (PREGUNTAR AL PROPIETARIO)
            // Opción A - Alta Seguridad:
            sessionStorage.setItem('ls_session', JSON.stringify(ls_session));
            // Opción B - Baja-Media Seguridad:
            // localStorage.setItem('ls_session', JSON.stringify(ls_session));
            
            return { success: true, session: ls_session };
            
        } else {
            return { success: false, error: data.error };
        }
        
    } catch (error) {
        console.log('Error de conexión, intentando fallback...');
        
        // Paso 5: Fallback - buscar en respaldo local
        const fallbackResult = await intentarFallback(iniciales, claBComun);
        return fallbackResult;
    }
}

/**
 * FUNCIÓN DE RESPALDO PARA FALLBACK
 */
async function intentarFallback(iniciales, claBComun) {
    try {
        // Buscar en colección "ultimosIngresosSatisfactorios"
        const doc = await db.collection('ultimosIngresosSatisfactorios').doc(iniciales).get();
        
        if (doc.exists) {
            const respaldo = doc.data();
            
            // Validar credenciales
            if (respaldo.claBComun === claBComun) {
                // Crear sesión con datos de respaldo
                const ls_session = {
                    iniciales: respaldo.respuestaLMaster.data.iniciales,
                    nombre: respaldo.respuestaLMaster.data.nombre,
                    foto_url: respaldo.respuestaLMaster.data.foto_url,
                    empresas: respaldo.respuestaLMaster.data.empresas,
                    timestamp: new Date().toISOString(),
                    sistemaOrigen: 'SISTEMA_WEB'
                };
                
                sessionStorage.setItem('ls_session', JSON.stringify(ls_session));
                return { success: true, session: ls_session, fallback: true };
            }
        }
        
        return { success: false, error: 'No se pudo conectar y no hay respaldo válido' };
        
    } catch (error) {
        return { success: false, error: 'Error en fallback: ' + error.message };
    }
}

/**
 * FUNCIÓN PARA GUARDAR RESPALDO EN FIRESTORE
 */
async function guardarRespaldoFirestore(iniciales, claBComun, respuestaAPI) {
    try {
        const respaldoData = {
            claBComun: claBComun,
            iniciales: iniciales,
            sistemaOrigen: 'SISTEMA_WEB',
            timestamp: new Date().toISOString(),
            respuestaLMaster: respuestaAPI  // Respuesta completa para fallback
        };
        
        // Guardar/reemplazar documento (evita saturación)
        await db.collection('ultimosIngresosSatisfactorios').doc(iniciales).set(respaldoData);
        console.log('Respaldo guardado exitosamente');
        
    } catch (error) {
        console.error('Error guardando respaldo:', error);
        // No detener el flujo por error de respaldo
    }
}
```

#### Ejemplo de Ingreso Derivado - Sistema Activo
```javascript
/**
 * FUNCIÓN PARA ENVIAR USUARIO A OTRO SISTEMA (SISTEMA ACTIVO)
 */
async function enviarAOtroSistema(urlDestino, iniciales) {
    try {
        // Paso 1: Obtener respaldo del usuario actual
        const doc = await db.collection('ultimosIngresosSatisfactorios').doc(iniciales).get();
        
        if (!doc.exists) {
            throw new Error('No se encontró información de sesión');
        }
        
        const respaldoData = doc.data();
        
        // Paso 2: Actualizar metainformación
        respaldoData.sistemaOrigen = 'SISTEMA_WEB';
        respaldoData.timestamp = new Date().toISOString();
        
        // Paso 3: Enviar datos al sistema destino usando POST
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = urlDestino;
        form.target = '_blank'; // Abrir en nueva ventana
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'respuestaLMaster';
        input.value = JSON.stringify(respaldoData.respuestaLMaster);
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        console.log('Usuario enviado exitosamente a:', urlDestino);
        
    } catch (error) {
        console.error('Error enviando usuario:', error);
        alert('Error al acceder al sistema: ' + error.message);
    }
}
```

#### Ejemplo de Ingreso Derivado - Sistema Pasivo
```javascript
/**
 * FUNCIÓN PARA RECIBIR USUARIO DE OTRO SISTEMA (SISTEMA PASIVO)
 */
async function recibirUsuarioDerivado() {
    try {
        // Paso 1: Obtener datos del formulario POST
        const urlParams = new URLSearchParams(window.location.search);
        const formData = new FormData(document.forms[0]); // Si viene por POST
        
        let respuestaLMaster;
        
        // Verificar si viene por POST o GET (para compatibilidad)
        if (formData.has('respuestaLMaster')) {
            respuestaLMaster = JSON.parse(formData.get('respuestaLMaster'));
        } else if (urlParams.has('data')) {
            // Fallback para compatibilidad con sistemas antiguos (método GET)
            respuestaLMaster = JSON.parse(decodeURIComponent(urlParams.get('data')));
        } else {
            throw new Error('No se recibieron datos de sesión');
        }
        
        // Paso 2: Validar estructura recibida
        if (!respuestaLMaster.data || !respuestaLMaster.data.iniciales) {
            throw new Error('Datos de sesión inválidos');
        }
        
        // Paso 3: Verificar si el usuario tiene acceso (lógica del sistema)
        const tieneAcceso = validarAccesoUsuario(respuestaLMaster.data);
        
        if (tieneAcceso) {
            // Paso 4a: Crear sesión local derivada
            const ls_session = {
                iniciales: respuestaLMaster.data.iniciales,
                nombre: respuestaLMaster.data.nombre,
                foto_url: respuestaLMaster.data.foto_url,
                empresas: respuestaLMaster.data.empresas,
                timestamp: new Date().toISOString(),
                sistemaOrigen: 'SISTEMA_DERIVADO'
            };
            
            sessionStorage.setItem('ls_session', JSON.stringify(ls_session));
            
            // Paso 4b: Actualizar respaldo en Firestore
            await actualizarRespaldoDerivado(respuestaLMaster);
            
            // Paso 4c: Notificar a LedroitMaster (auditoría)
            await notificarIngresoDerivado(respuestaLMaster.data.iniciales, 'EXITOSO');
            
            return { success: true, session: ls_session };
            
        } else {
            // Paso 5: Acceso denegado
            await notificarIngresoDerivado(respuestaLMaster.data.iniciales, 'FALLIDO');
            throw new Error('No tienes acceso a este sistema');
        }
        
    } catch (error) {
        console.error('Error en ingreso derivado:', error);
        return { success: false, error: error.message };
    }
}

/**
 * FUNCIÓN PARA NOTIFICAR INGRESO DERIVADO A LEDROITMASTER
 */
async function notificarIngresoDerivado(iniciales, resultado) {
    try {
        const response = await fetch('https://auditingresoderivado-fmunxt6pjq-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                iniciales: iniciales,
                sistemaOrigen: 'SISTEMA_ORIGEN',
                sistemaDestino: 'SISTEMA_ACTUAL',
                resultado: resultado
            })
        });
        
        const data = await response.json();
        console.log('Auditoría registrada:', data);
        
    } catch (error) {
        console.error('Error en auditoría:', error);
        // No detener el flujo por error de auditoría
    }
}
```

#### Funciones Auxiliares Estándar
```javascript
/**
 * FUNCIÓN PARA OBTENER SESIÓN ACTUAL
 */
function obtenerSesionActual() {
    try {
        const sessionData = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
        return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
        console.error('Error obteniendo sesión:', error);
        return null;
    }
}

/**
 * FUNCIÓN PARA VALIDAR SESIÓN ACTIVA
 */
function validarSesionActiva() {
    const session = obtenerSesionActual();
    
    if (!session) {
        return false;
    }
    
    // Validar estructura mínima
    if (!session.iniciales || !session.empresas) {
        return false;
    }
    
    // Validar timestamp (opcional - sesión de 8 horas)
    const ahora = new Date();
    const timestampSesion = new Date(session.timestamp);
    const diferenciaHoras = (ahora - timestampSesion) / (1000 * 60 * 60);
    
    if (diferenciaHoras > 8) {
        cerrarSesion();
        return false;
    }
---

## 📚 RECURSOS Y PLANTILLAS DISPONIBLES

### 🗂️ Carpetas de Implementación Existentes

El ecosistema Ledroit Master incluye carpetas con implementaciones completas y funcionales que puedes usar como referencia o base para tus desarrollos:

#### 📄 **PAGINA PRUEBA-INGDERIVADO**
**Ubicación:** `/PAGINA PRUEBA-INGDERIVADO/`

**Contenido:**
- Implementación completa de página web para ingreso derivado
- Manejo de parámetros GET (método actual)
- Integración con Firebase y Firestore
- Estructura HTML, CSS y JavaScript funcional
- Ejemplo práctico de recepción de usuarios derivados

**Uso recomendado:**
- Como plantilla base para sistemas web que reciben usuarios derivados
- Referencia para implementar la lógica de ingreso derivado
- Ejemplo de integración con las APIs de LedroitMaster

#### 🎯 **GADGET INGRESOS ACTIVOS**
**Ubicación:** `/GADGET INGRESOS ACTIVOS/`

**Contenido:**
- Widget flotante para navegación entre sistemas
- Botón circular con lista desplegable de sistemas
- CSS inyectado automáticamente
- JavaScript para manejo de eventos y navegación
- Implementación de sistema ACTIVO para envío de usuarios

**Uso recomendado:**
- Integrar en sistemas existentes para permitir navegación
- Como referencia para implementar widgets flotantes
- Ejemplo de sistema ACTIVO en ingresos derivados

#### 🎨 **HEADER**
**Ubicación:** `/HEADER/`

**Contenido:**
- Header global estandarizado para el ecosistema
- Múltiples tipos de header configurables
- Integración con datos de sesión del usuario
- CSS personalizable y responsive
- JavaScript para manejo de datos de usuario

**Uso recomendado:**
- Implementar header consistente en todos los sistemas
- Como base para personalización de interfaz
- Referencia para manejo de datos de sesión en UI

### 🔧 **Cómo Usar Estas Plantillas**

1. **Examinar el código:** Revisa los archivos para entender la estructura y lógica
2. **Adaptar a tu sistema:** Modifica las configuraciones según tus necesidades
3. **Mantener consistencia:** Usa las mismas convenciones y estructuras de datos
4. **Personalizar estilos:** Ajusta CSS manteniendo la funcionalidad base

### ⚠️ **Notas Importantes sobre las Plantillas**

- **Método actual:** Las carpetas actuales usan método POST para ingresos derivados
- **Migración completada:** Ahora se usa método POST como estándar
- **Compatibilidad:** Mantén compatibilidad con ambos métodos durante la transición
- **Estructura de datos:** Todas usan la estructura estándar de `ls_session` definida en esta documentación

---

## 🔄 FLUJOS DE TRABAJO TÍPICOS

### Flujo 1: Usuario Nuevo en Sistema Web
```
1. Usuario ingresa credenciales → Primer Ingreso
2. Sistema valida con API de autenticación
3. Se crea sesión local y respaldo en Firestore
4. Usuario navega normalmente en el sistema
5. Al acceder a otro sistema → Ingreso Derivado
```

### Flujo 2: Usuario Existente con Sesión Activa
```
1. Sistema verifica sesión local existente
2. Si es válida → Continúa navegación normal
3. Si expiró → Redirige a login para Primer Ingreso
4. Al cambiar de sistema → Ingreso Derivado
```

### Flujo 3: Error de Conexión (Fallback)
```
1. Usuario intenta Primer Ingreso
2. API no responde → Activar fallback
3. Buscar en respaldo local (Firestore)
4. Si coinciden credenciales → Crear sesión
5. Si no hay respaldo → Mostrar error de conexión
```

---

## 🛡️ CARACTERÍSTICAS DE SEGURIDAD

### Validaciones Implementadas
- **Rate Limiting:** 100 requests/minuto por IP
- **Validación de estructura:** Verificación de datos obligatorios
- **Auditoría completa:** Registro de todos los eventos
- **Fallback seguro:** Solo con credenciales válidas previamente guardadas
- **Sesiones temporales:** Expiración automática configurable

### Mejores Prácticas de Seguridad
1. **No guardar contraseñas:** Solo usar para validación inmediata
2. **Usar HTTPS:** Todas las comunicaciones deben ser seguras
3. **Validar en servidor:** No confiar solo en validaciones del cliente
4. **Limpiar sesiones:** Implementar logout y limpieza automática
5. **Auditar accesos:** Registrar todos los intentos de acceso

---

## 🧪 HERRAMIENTAS DE TESTING

### Testing Interactivo
- **API General:** `https://ledroitmaster.web.app/TEST_API.html`
- **APIs de Usuarios:** `https://ledroitmaster.web.app/test-users-api.html`

### Testing Programático
```javascript
// Ejemplo de test automatizado
async function testearAutenticacion() {
    const resultado = await primerIngreso('password123', 'ABC');
    
    if (resultado.success) {
        console.log('✅ Autenticación exitosa');
        console.log('Sesión creada:', resultado.session);
    } else {
        console.log('❌ Error en autenticación:', resultado.error);
    }
}
```

---

## 📈 SISTEMA DE AUDITORÍA

### Eventos Registrados Automáticamente
- **Primer Ingreso:** Exitoso/Fallido con detalles
- **Ingreso Derivado:** Navegación entre sistemas
- **Fallback:** Uso de respaldo local
- **Errores:** Fallos de conexión y validación

### Información de Auditoría
- Timestamp preciso de cada evento
- IP del cliente (cuando disponible)
- Sistema origen y destino
- Resultado de la operación
- Tiempo de respuesta de las APIs

---

## 🚀 ESTADO ACTUAL Y PRÓXIMOS PASOS

### ✅ Funcionalidades Implementadas
- API de autenticación completa y estable
- API de auditoría para ingresos derivados
- APIs de gestión de usuarios
- Sistema de fallback robusto
- Herramientas de testing interactivas

### 🔄 En Desarrollo
- Migración de GET a POST para ingresos derivados
- Mejoras en la interfaz de testing
- Documentación adicional para casos específicos
- Optimizaciones de rendimiento

### 📋 Próximas Mejoras Planificadas
- Sistema de notificaciones en tiempo real
- Dashboard de auditoría avanzado
- APIs adicionales para gestión de empresas
- Integración con sistemas de terceros

---

## 📞 SOPORTE Y CONTACTO

### Para Desarrolladores
- **Documentación técnica:** Este documento
- **Herramientas de testing:** URLs proporcionadas en secciones anteriores
- **Ejemplos de código:** Carpetas de plantillas disponibles

### Para Administradores
- **Gestión de usuarios:** A través de LedroitMaster principal
- **Configuración de empresas:** Panel administrativo
- **Monitoreo de auditoría:** Dashboard de eventos

---

**📝 Última actualización:** Diciembre 2024  
**🔄 Versión de la documentación:** 2.0  
**✅ Estado:** Producción estable

### Implementación en JavaScript (Web)
```javascript
class LeDroitAuthenticator {
    constructor() {
        this.apiUrl = 'https://authlogin-fmunxt6pjq-uc.a.run.app';
        this.auditUrl = 'https://auditingresoderivado-fmunxt6pjq-uc.a.run.app';
    }
    
    async primerIngreso(claBComun, iniciales = '', empresaSolicitante = '') {
        const loginData = { claBComun };
        if (iniciales) loginData.iniciales = iniciales;
        if (empresaSolicitante) loginData.empresaSolicitante = empresaSolicitante;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.guardarSesion(data.data);
                return { success: true, user: data.data };
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
            return { success: false, error: error.message };
        }
    }
    
    async ingresoDerivado(iniciales, sistemaOrigen, sistemaDestino, resultado = 'EXITOSO') {
        const auditData = {
            iniciales,
            sistemaOrigen,
            sistemaDestino,
            resultado: resultado.toUpperCase()
        };
        
        try {
            const response = await fetch(this.auditUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(auditData)
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en auditoría:', error);
            return { success: false, error: error.message };
        }
    }
    
    guardarSesion(userData) {
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('userInitials', userData.iniciales);
        sessionStorage.setItem('userEmpresas', JSON.stringify(userData.empresas));
        sessionStorage.setItem('loginTimestamp', new Date().toISOString());
    }
}
```

---

## 🔄 FLUJOS DE TRABAJO TÍPICOS

### 1. Usuario de Excel (Solicitud Simple)
```javascript
// Excel envía solo claBComun
const loginData = { claBComun: "a1234" };
// API devuelve información completa sin validaciones adicionales
// Excel decide localmente si permite acceso
```

### 2. Aplicación Web (Solicitud Detallada)
```javascript
// Web envía información completa para validación
const loginData = {
    claBComun: "a1234",
    iniciales: "ABC",
    empresaSolicitante: "EMPRESA_A"
};
// API valida todo antes de responder
// Solo devuelve información si todas las validaciones pasan
```

### 3. Integración entre Sistemas (Ingreso Derivado)
```javascript
// Sistema A → Sistema B (sin reautenticación)
const auditData = {
    iniciales: "ABC",
    sistemaOrigen: "LEDROITMASTER",
    sistemaDestino: "SISTEMA_CONTABLE",
    resultado: "EXITOSO"
};
// Solo registra auditoría del acceso derivado
```

---

## 🛡️ CARACTERÍSTICAS DE SEGURIDAD

1. **Rate Limiting:** 100 requests por minuto por IP
2. **CORS:** Habilitado para todos los orígenes
3. **Auditoría Completa:** Todos los eventos se registran en AUDIT_LOGS de ledroitmaster
4. **Validación de Datos:** Validación estricta de parámetros
5. **Manejo de Errores:** Respuestas estandarizadas
6. **Trazabilidad:** Seguimiento completo de sesiones
7. **Control de Acceso:** Validación granular por empresa y rol

---

## 🔒 MEJORES PRÁCTICAS

### Seguridad de Credenciales
- ❌ NUNCA hardcodees credenciales en el código fuente
- ✅ Usa variables de entorno o configuración segura
- ✅ Usa HTTPS siempre en producción

### Manejo de Rate Limiting
```javascript
class APIClient {
    async callWithRetry(apiCall, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await apiCall();
            } catch (error) {
                if (error.message.includes('429') && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
    }
}
```

### Validación de Datos
```javascript
function validateLoginData(data) {
    const errors = [];
    
    if (!data.claBComun || data.claBComun.length < 4) {
        errors.push('claBCmun debe tener al menos 4 caracteres');
    }
    
    if (data.iniciales && data.iniciales.length < 2) {
        errors.push('Iniciales deben tener al menos 2 caracteres');
    }
    
    return errors;
}
```

---

## 📊 SISTEMA DE AUDITORÍA

Todos los eventos se registran automáticamente en la colección `AUDIT_LOGS` de ledroitmaster de Firestore:

```json
{
  "actionType": "LOGIN_SUCCESS|LOGIN_FAILED|API_INGRESO_DERIVADO_SUCCESS",
  "userId": "user_id",
  "userInitials": "ABC",
  "userName": "Nombre Usuario",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "page": "/api",
  "securityLevel": "API",
  "sessionId": "unique_session_id",
  "details": {
    "module": "API_AUTH",
    "empresaSolicitante": "EMPRESA SA",
    "sistemaOrigen": "EXCEL",
    "sistemaDestino": "WEB",
    "responseTimeMs": 150
  },
  "userAgent": "Excel/16.0",
  "ipAddress": "192.168.1.100"
}
```

---

## 🧪 HERRAMIENTA DE TESTING

### TEST_API.html
Utiliza la herramienta interactiva disponible en:
`https://ledroitmaster.web.app/TEST_API.html`

**Características:**
- Probar endpoints de forma interactiva
- Validar respuestas en tiempo real
- Simular casos de uso y errores
- Depurar problemas de integración

**Cómo usar:**
1. Abrir el archivo en un navegador
2. Completar formularios con datos de prueba
3. Hacer clic en "Probar" para enviar requests
4. Revisar respuestas JSON en tiempo real

---

## 📚 RECURSOS ADICIONALES

- **Firebase Console:** `https://console.firebase.google.com/project/ledroitmaster`
- **Logs de Auditoría:** Firestore > AUDIT_LOGS
- **Monitoreo:** Firebase Functions Dashboard
- **Repositorio:** GitHub - LedroitMaster

---

## ✅ ESTADO ACTUAL DEL SISTEMA

### APIs de Producción
- 🟢 **API de Autenticación:** Operativa y funcional
- 🟢 **API de Auditoría:** Operativa y funcional
- 🟢 **API de Usuarios (getAllUsers):** Operativa y funcional
- 🟢 **API de Usuario por ID/Iniciales (getUserById):** Operativa y funcional
- 🟢 **Sistema de Auditoría:** Registrando correctamente
- 🟢 **Mensajes de Error:** Actualizados con especificidad

### Validaciones Finales
- ✅ authLogin: Responde correctamente
- ✅ auditIngresoDerivado: Registra eventos en Firestore
- ✅ getAllUsers: Lista todos los usuarios con información completa
- ✅ getUserById: Busca usuarios por ID o iniciales
- ✅ Rate Limiting: 100 req/min implementado en todas las APIs
- ✅ CORS: Configurado para todos los orígenes
- ✅ Logs: Sistema de logging operativo
- ✅ Timestamps: Procesamiento correcto de fechas Firestore

---

## 🎯 PRÓXIMOS PASOS

1. **Implementar en Excel:** Usar VBA para consumir la API
2. **Integrar en Aplicaciones Web:** Reemplazar lógica de login actual
3. **Monitoreo:** Configurar alertas para errores y límites
4. **Testing:** Realizar pruebas exhaustivas con diferentes escenarios
5. **Documentación de Cliente:** Crear guías específicas por aplicación

---

*Documentación consolidada: Diciembre 2025*  
*Versión API: 3.0*  
*Estado: ✅ LISTO PARA PRODUCCIÓN*  
*Basado en las directrices principales de la familia Ledroit*  
*Incluye: APIs de Autenticación, Auditoría y Gestión de Usuarios*