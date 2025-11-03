# DOCUMENTACIÓN API LEDROITMASTER

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

---

## 🔐 CONCEPTOS FUNDAMENTALES DE SESIONES

### PRIMER INGRESO
El **PRIMER INGRESO** es la autenticación inicial de un usuario al sistema secundario. Representa el momento en que un usuario proporciona sus credenciales y el sistema ledroitmaster valida su identidad.

**Características del Primer Ingreso:**
- **Validación completa:** El sistema secundario envia  la contraseña común (`claBComun`) del usuario
- **Verificación de estado:** El sistema secundario confirma que tanto el usuario como las empresas están activos
- **Información completa:** Se retorna toda la información del usuario y sus empresas disponibles
- **Establecimiento de sesión:** El sistema secundario crea una nueva sesión de trabajo 
- **Registro de auditoría:** Ledroitmaster documenta el evento para trazabilidad

**Cuándo ocurre un Primer Ingreso:**
- Usuario abre Excel/aplicacion web y necesita autenticarse por primera vez en la sesión
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

1.- (PRIMER INGRESO) En el login, el sistema secundario debe pedir información a LEDROITMASTER para iniciar sesion. 

-El sistema secundario debe guardar la respuesta (si fue satisfactoria), para usarlo posteriormente.
-El sistema secundario debe crear una colección (llamarla: "ultimosIngresosSatisfactorios") con estructura estandarizada donde:
     -Dentro de esa colección se creará un documento con las iniciales del usuario como nombre del documento.
     -Cada documento contendrá: claBComun, iniciales, sistemaOrigen, timestamp, y respuestaLMaster (array con la respuesta JSON completa de la API tal como viene).
     -Para evitar multiples registros y evitar saturación de la base de datos, cada registro sustituirá al registro anterior. EJEMPLO: Si el usuario con iniciales "ABC" ingresó correctamente hoy, se creará su documento ABC y ahí se guardará la información. Si mañana ingresa correctamente, entonces se borrará la información registrada anteriormente y se quedará solo la de hoy.
     -Esto lleva el objetivo de usarse como fallback, es decir: para el caso de que la api no responda, entonces el sistema buscará dentro de la colección "ultimosIngresosSatisfactorios" las iniciales y claBComun que están fuera de "respuestaLMaster", y si es correcto, creará la sesión con la información que está en respuestaLMaster/data. EL FALLBACK NO APLICA SI LA API RESPONDE NEGATIVAMENTE.


2.- PARA IMPLEMENTAR EL INGRESO DERIVADO, debes considerar:
-Ingreso derivado se refiere a que una aplicación que ya está logueada con PRIMER INGRESO (llamemosle SISTEMA1), intenta ingresar (por ejemplo, con un boton) a otro sistema de la familia ledroit (llamemosle SISTEMA2)
-El flujo es el siguiente: 1.- el SISTEMA1 (llamemosle "ACTIVO") obtiene el documento estandarizado de "ultimosIngresosSatisfactorios", modifica la metainformación (sistemaOrigen, timestamp) y envía respuestaLMaster al SISTEMA2. 2.- El sistema2 (llamemosle "PASIVO") recibe respuestaLMaster, analiza la metainformación y valida el nodo data, y si permite el acceso, actualiza "ultimosIngresosSatisfactorios" con la respuestaLMaster recibida.
-Esto lleva la intención de poder navegar entre sistemas sin tener que pasar por tantos logins
-A su vez el sistema2 se convertirá en ACTIVO cuando éste intente ingresar a un sistema3, el cual ahora será el PASIVO.
-Cuando un sistema es PASIVO, entonces se usa la api de INGRESODERIVADO para notificarle a ledroitmaster que hubo un ingreso (ya que ledroimaster lleva auditoria sobre todos los ingresos)
-Dado lo anterior, debes aplicar la lógica necesaria para que varios escenearios, es decir, cuando un sistema sea:
a) ACTIVO
b) PASIVO
c) ACTIVO DESPUÉS DE HABER SIDO PASIVO


## 🌐 ENDPOINTS DE PRODUCCIÓN

### URLs RECOMENDADAS (Cloud Run - Mayor Rendimiento)
- **Autenticación (Primer Ingreso):** `https://authlogin-fmunxt6pjq-uc.a.run.app`
- **Auditoría (Ingreso Derivado PASIVO):** `https://auditingresoderivado-fmunxt6pjq-uc.a.run.app`
- **Herramienta de Testing:** `https://ledroitmaster.web.app/TEST_API.html`

### URLs Alternativas (Firebase Functions)
- **Autenticación:** `https://us-central1-ledroitmaster.cloudfunctions.net/authLogin`
- **Auditoría:** `https://us-central1-ledroitmaster.cloudfunctions.net/auditIngresoDerivado`

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
    "iniciales": "ABC",
    "nombre": "Nombre Completo Usuario",
    "foto_url": "https://storage.googleapis.com/ledroitmaster.appspot.com/users/ABC/fotografia/timestamp_foto.jpg",
    "empresas": [
      {
        "nombre": "EMPRESA SA",
        "empresa_activa": true,
        "usuario_activo": true,
        "rol": ["A1"]
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

### Implementación en Excel (VBA)
```vba
Public Function AutenticarUsuario(claBComun As String, Optional iniciales As String = "", Optional empresa As String = "") As Boolean
    Dim http As Object
    Dim url As String
    Dim jsonData As String
    Dim response As String
    
    Set http = CreateObject("MSXML2.XMLHTTP")
    url = "https://authlogin-fmunxt6pjq-uc.a.run.app"
    
    ' Preparar datos JSON
    jsonData = "{""claBComun"":""" & claBComun & """"
    If iniciales <> "" Then jsonData = jsonData & ",""iniciales"":""" & iniciales & """"
    If empresa <> "" Then jsonData = jsonData & ",""empresaSolicitante"":""" & empresa & """"
    jsonData = jsonData & "}"
    
    ' Realizar petición
    http.Open "POST", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonData
    
    ' Procesar respuesta
    If http.Status = 200 Then
        response = http.responseText
        If InStr(response, """success"":true") > 0 Then
            AutenticarUsuario = True
            Call GuardarSesion(response)
        Else
            AutenticarUsuario = False
            MsgBox "Error: " & ExtraerError(response)
        End If
    Else
        AutenticarUsuario = False
        MsgBox "Error de conexión: " & http.Status
    End If
    
    Set http = Nothing
End Function
```

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
- 🟢 **Sistema de Auditoría:** Registrando correctamente
- 🟢 **Mensajes de Error:** Actualizados con especificidad

### Validaciones Finales
- ✅ authLogin: Responde correctamente
- ✅ auditIngresoDerivado: Registra eventos en Firestore
- ✅ Rate Limiting: 100 req/min implementado
- ✅ CORS: Configurado para todos los orígenes
- ✅ Logs: Sistema de logging operativo

---

## 🎯 PRÓXIMOS PASOS

1. **Implementar en Excel:** Usar VBA para consumir la API
2. **Integrar en Aplicaciones Web:** Reemplazar lógica de login actual
3. **Monitoreo:** Configurar alertas para errores y límites
4. **Testing:** Realizar pruebas exhaustivas con diferentes escenarios
5. **Documentación de Cliente:** Crear guías específicas por aplicación

---

*Documentación consolidada: Octubre 2025*  
*Versión API: 2.0*  
*Estado: ✅ LISTO PARA PRODUCCIÓN*  
*Basado en las directrices principales de la familia Ledroit*