# GUÍA HTML/JAVASCRIPT - PLANTILLAS PARA SISTEMAS SECUNDARIOS - VERSIÓN 2.1

**PLANTILLAS Y CÓDIGO LISTO PARA COPIAR/PEGAR**

---

## 🎯 INTRODUCCIÓN

Esta guía contiene plantillas HTML/JavaScript listas para usar en sistemas secundarios de la Familia Ledroit. Todas las plantillas siguen los estándares establecidos en la **Guía para Desarrolladores v2.1**.

**CAMBIOS EN VERSIÓN 2.1:**
- ✅ **Método URL:** Cambio de POST a GET con parámetros URL
- ✅ **Limpieza de Avatar:** Función robusta para limpiar foto_url
- ✅ **Logs en Página:** Sistema de logs visible en lugar de solo consola
- ✅ **Mejoras de UX:** Toasts mejorados y mejor feedback visual

---

## 📄 PLANTILLA: PÁGINA DE PRUEBA INGRESO DERIVADO

### Archivo: `prueba-ingderivado.html`

**OBLIGATORIO:** Todo sistema secundario debe implementar esta página para desarrollo y testing.

#### 🖼️ FUNCIÓN DE LIMPIEZA DE AVATAR (CRÍTICA)

```javascript
// FUNCIÓN CRÍTICA: Limpieza robusta de foto_url
function limpiarFotoUrl(fotoUrl) {
    if (!fotoUrl) return null;
    
    // Limpieza robusta de la URL del avatar
    return fotoUrl
        .replace(/^[\s`'"]+|[\s`'"]+$/g, '') // Eliminar espacios, backticks y comillas del inicio y final
        .replace(/[`\s]/g, ''); // Eliminar todos los backticks y espacios internos
}

// Uso en el componente de avatar
function crearAvatar(fotoUrl, iniciales) {
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    
    if (fotoUrl) {
        const fotoUrlLimpia = limpiarFotoUrl(fotoUrl);
        if (fotoUrlLimpia && fotoUrlLimpia.startsWith('http')) {
            const img = document.createElement('img');
            img.src = fotoUrlLimpia;
            img.alt = 'Avatar';
            img.onerror = () => {
                avatar.innerHTML = '';
                avatar.textContent = iniciales;
            };
            avatar.appendChild(img);
        } else {
            avatar.textContent = iniciales;
        }
    } else {
        avatar.textContent = iniciales;
    }
    
    return avatar;
}
```

#### 📝 SISTEMA DE LOGS EN PÁGINA (OBLIGATORIO)

```javascript
// Sistema de logs visible en la página (NO solo consola)
function log(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLogs() {
    const container = document.getElementById('logContainer');
    container.innerHTML = '<div class="log-entry info">[INFO] Logs limpiados</div>';
    showToast('Logs limpiados', 'success');
}

// Ejemplos de uso en envío activo:
function enviarIngresoDerivado() {
    log('ENVÍO ACTIVO - Iniciando envío de usuario', 'info');
    log(`ENVÍO ACTIVO - Sistema destino: ${sistemaDestino}`, 'info');
    log(`ENVÍO ACTIVO - URL destino: ${urlDestino}`, 'info');
    log(`ENVÍO ACTIVO - Datos enviados: ${JSON.stringify(respuestaLMaster).substring(0, 200)}...`, 'info');
    
    // Realizar envío...
    
    log('ENVÍO ACTIVO - Usuario enviado exitosamente', 'success');
}

// Ejemplos de uso en envío pasivo:
function testIngresoDerivadoPasivo() {
    log('ENVÍO PASIVO - Procesando datos de prueba', 'info');
    log(`ENVÍO PASIVO - Datos recibidos: ${JSON.stringify(respuestaLMaster).substring(0, 200)}...`, 'info');
    
    // Procesar datos...
    
    log('ENVÍO PASIVO - Datos procesados correctamente', 'success');
}
```

#### 🌐 FUNCIÓN DE ENVÍO POR URL (ACTUALIZADA)

```javascript
// MÉTODO OBLIGATORIO: Envío por parámetros URL (NO POST)
function enviarPorURL(urlDestino, respuestaLMaster) {
    const urlCompleta = `${urlDestino}?respuestaLMaster=${encodeURIComponent(JSON.stringify(respuestaLMaster))}`;
    
    // Log en página de actividad
    log(`ENVÍO - URL completa generada (${urlCompleta.length} caracteres)`, 'info');
    
    window.open(urlCompleta, '_blank');
    
    showToast('Usuario enviado correctamente', 'success');
    log('ENVÍO - Ventana abierta exitosamente', 'success');
}

// Función de envío activo actualizada
function enviarIngresoDerivado() {
    const urlDestino = document.getElementById('urlDestino').value;
    const sistemaDestino = document.getElementById('sistemaDestino').value;
    
    if (!urlDestino || !sistemaDestino) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    const respuestaLMaster = obtenerDatosParaEnvio();
    if (!respuestaLMaster) {
        showToast('Error obteniendo datos de sesión', 'error');
        return;
    }
    
    // Logs detallados en página
    log(`ENVÍO ACTIVO - Enviando usuario a ${sistemaDestino}`, 'info');
    log(`ENVÍO ACTIVO - URL destino: ${urlDestino}`, 'info');
    log(`ENVÍO ACTIVO - Datos enviados: ${JSON.stringify(respuestaLMaster).substring(0, 200)}...`, 'info');
    
    // Enviar por URL
    enviarPorURL(urlDestino, respuestaLMaster);
}
```

---

## 📄 PLANTILLA: PÁGINA DE PRUEBA INGRESO DERIVADO

### Archivo: `prueba-ingderivado.html`

**OBLIGATORIO:** Todo sistema secundario debe implementar esta página para desarrollo y testing.

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba Ingreso Derivado - {{NOMBRE_SISTEMA}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 2px solid #e9ecef;
        }

        .tabs button {
            flex: 1;
            padding: 15px 20px;
            border: none;
            background: transparent;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #6c757d;
        }

        .tabs button.active {
            background: #007bff;
            color: white;
        }

        .tabs button:hover:not(.active) {
            background: #e9ecef;
            color: #495057;
        }

        .content {
            padding: 30px;
        }

        .section {
            display: none;
        }

        .section.active {
            display: block;
        }

        .section h2 {
            color: #343a40;
            margin-bottom: 20px;
            font-size: 24px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #495057;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #007bff;
        }

        .form-group textarea {
            min-height: 120px;
            resize: vertical;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-right: 10px;
            margin-bottom: 10px;
        }

        .btn-primary {
            background: #007bff;
            color: white;
        }

        .btn-primary:hover {
            background: #0056b3;
        }

        .btn-success {
            background: #28a745;
            color: white;
        }

        .btn-success:hover {
            background: #1e7e34;
        }

        .btn-warning {
            background: #ffc107;
            color: #212529;
        }

        .btn-warning:hover {
            background: #e0a800;
        }

        .btn-danger {
            background: #dc3545;
            color: white;
        }

        .btn-danger:hover {
            background: #c82333;
        }

        .json-area {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .json-area h3 {
            margin-bottom: 15px;
            color: #495057;
        }

        .json-area textarea {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: #ffffff;
            border: 1px solid #dee2e6;
        }

        .log-area {
            margin-top: 30px;
            padding: 20px;
            background: #343a40;
            border-radius: 8px;
            color: white;
        }

        .log-area h3 {
            margin-bottom: 15px;
            color: #ffffff;
        }

        .log-container {
            max-height: 300px;
            overflow-y: auto;
            background: #212529;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
        }

        .log-entry {
            margin-bottom: 5px;
            padding: 5px;
            border-radius: 3px;
        }

        .log-entry.info {
            color: #17a2b8;
        }

        .log-entry.success {
            color: #28a745;
        }

        .log-entry.error {
            color: #dc3545;
        }

        .log-entry.warning {
            color: #ffc107;
        }

        .session-info {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }

        .session-info h3 {
            color: #0056b3;
            margin-bottom: 15px;
        }

        .session-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }

        .session-item {
            background: white;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
        }

        .session-item strong {
            color: #495057;
            display: block;
            margin-bottom: 5px;
        }

        /* Sistema de Toasts */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 350px;
        }

        .toast {
            background: #333;
            color: white;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            animation: slideIn 0.3s ease;
        }

        .toast.success {
            background: #28a745;
        }

        .toast.error {
            background: #dc3545;
        }

        .toast.warning {
            background: #ffc107;
            color: #212529;
        }

        .toast.info {
            background: #17a2b8;
        }

        .toast-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 18px;
            cursor: pointer;
            margin-left: 10px;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 10px;
            }

            .content {
                padding: 20px;
            }

            .tabs button {
                padding: 12px 15px;
                font-size: 14px;
            }

            .session-details {
                grid-template-columns: 1fr;
            }

            .toast-container {
                left: 20px;
                right: 20px;
                max-width: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="tabs">
            <button class="active" onclick="switchTab('activo')">🚀 ACTIVO</button>
            <button onclick="switchTab('pasivo')">📥 PASIVO</button>
            <button onclick="switchTab('info')">📋 INFORMACIÓN</button>
        </div>

        <div class="content">
            <!-- MODO ACTIVO -->
            <div id="activo" class="section active">
                <h2>🚀 Modo ACTIVO - Enviar a otro sistema</h2>
                
                <div class="form-group">
                    <label for="sistemaDestino">Sistema Destino:</label>
                    <input type="text" id="sistemaDestino" placeholder="Ej: DECLAROFACIL" required>
                </div>
                
                <div class="form-group">
                    <label for="urlDestino">URL Destino:</label>
                    <input type="url" id="urlDestino" placeholder="https://ejemplo.com/ingreso-derivado" required>
                </div>
                
                <div class="form-group">
                    <label><strong>Método de envío:</strong> GET con parámetros URL (Obligatorio)</label>
                    <p style="color: #6c757d; font-size: 14px; margin-top: 5px;">
                        ✅ Solo se permite método GET con parámetros URL<br>
                        ❌ No se permite envío por POST
                    </p>
                </div>
                
                <button class="btn btn-primary" onclick="enviarIngresoDerivado()">
                    Enviar Usuario
                </button>
                
                <div class="json-area">
                    <h3>JSON a enviar:</h3>
                    <textarea id="jsonPreview" readonly placeholder="Haz clic en 'Generar JSON' para ver el contenido..."></textarea>
                    <div style="margin-top: 15px;">
                        <button class="btn btn-success" onclick="generarJSON()">Generar JSON</button>
                        <button class="btn btn-warning" onclick="copiarJSON()">Copiar JSON</button>
                    </div>
                </div>
            </div>

            <!-- MODO PASIVO -->
            <div id="pasivo" class="section">
                <h2>📥 Modo PASIVO - Recibir de otro sistema</h2>
                
                <div class="form-group">
                    <label for="jsonInput">JSON de prueba:</label>
                    <textarea id="jsonInput" placeholder="Pegar aquí el JSON de respuestaLMaster para probar..."></textarea>
                </div>
                
                <button class="btn btn-primary" onclick="testIngresoDerivadoPasivo()">
                    Procesar Ingreso
                </button>
                
                <div class="form-group" style="margin-top: 20px;">
                    <button class="btn btn-success" onclick="actualizarTimestamp()">
                        Actualizar Timestamp
                    </button>
                    <button class="btn btn-warning" onclick="validarJSON()">
                        Validar JSON
                    </button>
                </div>
            </div>

            <!-- INFORMACIÓN -->
            <div id="info" class="section">
                <h2>📋 Información del Sistema</h2>
                
                <div class="session-info">
                    <h3>SESIÓN ACTUAL</h3>
                    <div id="sessionDetails" class="session-details">
                        <div class="session-item">
                            <strong>Estado:</strong>
                            <span id="sessionStatus">Verificando...</span>
                        </div>
                        <div class="session-item">
                            <strong>Iniciales:</strong>
                            <span id="sessionInitials">-</span>
                        </div>
                        <div class="session-item">
                            <strong>Tipo de Sesión:</strong>
                            <span id="sessionType">-</span>
                        </div>
                        <div class="session-item">
                            <strong>Timestamp:</strong>
                            <span id="sessionTimestamp">-</span>
                        </div>
                        <div class="session-item">
                            <strong>Empresas:</strong>
                            <span id="sessionEmpresas">-</span>
                        </div>
                        <div class="session-item">
                            <strong>Sistema Origen:</strong>
                            <span id="sessionSistemaOrigen">-</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <h3>Acciones de Sesión</h3>
                    <button class="btn btn-success" onclick="cargarInfoSesion()">
                        Recargar Información
                    </button>
                    <button class="btn btn-danger" onclick="limpiarSesion()">
                        Limpiar Sesión
                    </button>
                </div>
            </div>

            <!-- LOGS -->
            <div class="log-area">
                <h3>📝 Logs del Sistema</h3>
                <div id="logContainer" class="log-container">
                    <div class="log-entry info">[INFO] Sistema iniciado correctamente</div>
                </div>
                <div style="margin-top: 15px;">
                    <button class="btn btn-danger" onclick="clearLogs()">Limpiar Logs</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Contenedor de toasts -->
    <div class="toast-container" id="toastContainer"></div>

    <script>
        // ==========================================
        // VARIABLES GLOBALES
        // ==========================================
        let currentTab = 'activo';
        let sessionData = null;

        // ==========================================
        // SISTEMA DE NOTIFICACIONES TOAST
        // ==========================================
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const messageSpan = document.createElement('span');
            messageSpan.textContent = message;
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => closeToast(toast);
            
            toast.appendChild(messageSpan);
            toast.appendChild(closeBtn);
            container.appendChild(toast);
            
            // Auto-cerrar después de 5 segundos
            setTimeout(() => {
                if (toast.parentNode) {
                    closeToast(toast);
                }
            }, 5000);
        }

        function closeToast(toast) {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }

        // ==========================================
        // SISTEMA DE LOGS
        // ==========================================
        function addLog(message, type = 'info') {
            const container = document.getElementById('logContainer');
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
            
            container.appendChild(logEntry);
            container.scrollTop = container.scrollHeight;
        }

        function clearLogs() {
            const container = document.getElementById('logContainer');
            container.innerHTML = '<div class="log-entry info">[INFO] Logs limpiados</div>';
            showToast('Logs limpiados', 'success');
        }

        // ==========================================
        // NAVEGACIÓN DE PESTAÑAS
        // ==========================================
        function switchTab(tabName) {
            // Ocultar todas las secciones
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Desactivar todos los botones
            const buttons = document.querySelectorAll('.tabs button');
            buttons.forEach(button => button.classList.remove('active'));
            
            // Mostrar sección seleccionada
            document.getElementById(tabName).classList.add('active');
            
            // Activar botón seleccionado
            event.target.classList.add('active');
            
            currentTab = tabName;
            addLog(`Cambiado a pestaña: ${tabName.toUpperCase()}`);
        }

        // ==========================================
        // MODO ACTIVO - ENVIAR A OTRO SISTEMA
        // ==========================================
        function enviarIngresoDerivado() {
            const sistemaDestino = document.getElementById('sistemaDestino').value;
            const urlDestino = document.getElementById('urlDestino').value;
            
            if (!sistemaDestino || !urlDestino) {
                showToast('Completa todos los campos requeridos', 'error');
                return;
            }
            
            // Verificar sesión activa
            const iniciales = sessionStorage.getItem('userInitials');
            if (!iniciales) {
                showToast('No hay sesión activa. Inicia sesión primero.', 'error');
                addLog('Error: No hay sesión activa', 'error');
                return;
            }
            
            // Obtener datos de ultimosIngresosSatisfactorios
            const ultimoIngreso = localStorage.getItem(`ultimosIngresosSatisfactorios_${iniciales}`);
            if (!ultimoIngreso) {
                showToast('No se encontraron datos de último ingreso', 'error');
                addLog('Error: No se encontraron datos de último ingreso', 'error');
                return;
            }
            
            try {
                const documentoEstandarizado = JSON.parse(ultimoIngreso);
                
                // Preparar respuestaLMaster modificada
                const respuestaLMasterModificada = {
                    ...documentoEstandarizado.respuestaLMaster,
                    sistemaOrigen: 'TU_SISTEMA_NOMBRE', // CAMBIAR POR EL NOMBRE DE TU SISTEMA
                    timestamp: new Date().toISOString()
                };
                
                // Enviar por GET con parámetros URL (OBLIGATORIO)
                enviarPorURL(urlDestino, respuestaLMasterModificada);
                
                showToast(`Usuario enviado a ${sistemaDestino}`, 'success');
                addLog(`Usuario enviado a ${sistemaDestino} (${urlDestino})`, 'success');
                
            } catch (error) {
                showToast('Error procesando datos de sesión', 'error');
                addLog(`Error: ${error.message}`, 'error');
            }
        }

        // Función de envío por URL (reemplaza enviarPorPOST)
        function enviarPorURL(urlDestino, respuestaLMaster) {
            const urlCompleta = `${urlDestino}?respuestaLMaster=${encodeURIComponent(JSON.stringify(respuestaLMaster))}`;
            
            window.open(urlCompleta, '_blank');
            
            showToast('Usuario enviado correctamente', 'success');
        }

        function generarJSON() {
            const iniciales = sessionStorage.getItem('userInitials');
            if (!iniciales) {
                showToast('No hay sesión activa', 'error');
                return;
            }
            
            const ultimoIngreso = localStorage.getItem(`ultimosIngresosSatisfactorios_${iniciales}`);
            if (!ultimoIngreso) {
                showToast('No se encontraron datos de último ingreso', 'error');
                return;
            }
            
            try {
                const documentoEstandarizado = JSON.parse(ultimoIngreso);
                const respuestaLMasterModificada = {
                    ...documentoEstandarizado.respuestaLMaster,
                    sistemaOrigen: 'TU_SISTEMA_NOMBRE', // CAMBIAR POR EL NOMBRE DE TU SISTEMA
                    timestamp: new Date().toISOString()
                };
                
                document.getElementById('jsonPreview').value = JSON.stringify(respuestaLMasterModificada, null, 2);
                showToast('JSON generado correctamente', 'success');
                addLog('JSON generado para envío', 'info');
                
            } catch (error) {
                showToast('Error generando JSON', 'error');
                addLog(`Error generando JSON: ${error.message}`, 'error');
            }
        }

        function copiarJSON() {
            const textarea = document.getElementById('jsonPreview');
            if (!textarea.value) {
                showToast('Primero genera el JSON', 'warning');
                return;
            }
            
            textarea.select();
            document.execCommand('copy');
            showToast('JSON copiado al portapapeles', 'success');
            addLog('JSON copiado al portapapeles', 'info');
        }

        // ==========================================
        // MODO PASIVO - RECIBIR DE OTRO SISTEMA
        // ==========================================
        function testIngresoDerivadoPasivo() {
            const jsonInput = document.getElementById('jsonInput').value;
            
            if (!jsonInput.trim()) {
                showToast('Pega un JSON de prueba primero', 'warning');
                return;
            }
            
            try {
                const respuestaLMaster = JSON.parse(jsonInput);
                
                // Validar estructura básica
                if (!respuestaLMaster.data || !respuestaLMaster.data.iniciales) {
                    showToast('JSON inválido: falta estructura data.iniciales', 'error');
                    return;
                }
                
                // Procesar ingreso derivado
                procesarIngresoDerivadoPasivo(respuestaLMaster);
                
            } catch (error) {
                showToast('JSON inválido: ' + error.message, 'error');
                addLog(`Error parseando JSON: ${error.message}`, 'error');
            }
        }

        function procesarIngresoDerivadoPasivo(respuestaLMaster) {
            try {
                const metaInfo = {
                    sistemaOrigen: respuestaLMaster.sistemaOrigen || 'SISTEMA_DESCONOCIDO',
                    timestamp: respuestaLMaster.timestamp,
                    iniciales: respuestaLMaster.data.iniciales
                };
                
                const datosUsuario = respuestaLMaster.data;
                
                // Validar metainformación
                const metaInfoValida = validarMetaInformacion(metaInfo);
                const datosValidos = validarDatosUsuario(datosUsuario);
                
                if (metaInfoValida && datosValidos) {
                    // Actualizar ultimosIngresosSatisfactorios
                    actualizarUltimoIngresoSatisfactorio(respuestaLMaster, metaInfo.iniciales);
                    
                    // Crear sesión derivada
                    crearSesionDerivada(datosUsuario, metaInfo);
                    
                    showToast('Ingreso derivado procesado exitosamente', 'success');
                    addLog(`Ingreso derivado exitoso para ${metaInfo.iniciales} desde ${metaInfo.sistemaOrigen}`, 'success');
                    
                    // Recargar información de sesión
                    cargarInfoSesion();
                    
                } else {
                    showToast('Acceso rechazado: datos inválidos', 'error');
                    addLog('Acceso rechazado por validación', 'error');
                }
                
            } catch (error) {
                showToast('Error procesando ingreso derivado', 'error');
                addLog(`Error procesando: ${error.message}`, 'error');
            }
        }

        function validarMetaInformacion(metaInfo) {
            if (!metaInfo.sistemaOrigen || !metaInfo.iniciales) {
                return false;
            }
            
            // Verificar timestamp no muy antiguo (máximo 1 hora)
            if (metaInfo.timestamp) {
                const timestamp = new Date(metaInfo.timestamp);
                const ahora = new Date();
                const horasTranscurridas = (ahora - timestamp) / (1000 * 60 * 60);
                
                if (horasTranscurridas > 1) {
                    addLog(`Timestamp muy antiguo: ${horasTranscurridas.toFixed(2)} horas`, 'warning');
                    return false;
                }
            }
            
            return true;
        }

        function validarDatosUsuario(datosUsuario) {
            if (!datosUsuario.iniciales || !datosUsuario.empresas) {
                return false;
            }
            
            // Verificar que tenga al menos una empresa activa
            const empresasActivas = datosUsuario.empresas.filter(emp => 
                emp.empresa_activa && emp.usuario_activo
            );
            
            return empresasActivas.length > 0;
        }

        function actualizarUltimoIngresoSatisfactorio(respuestaLMaster, iniciales) {
            const documentoKey = iniciales;
            
            const documentoEstandarizado = {
                claBComun: respuestaLMaster.claBComun || '',
                iniciales: iniciales,
                sistemaOrigen: respuestaLMaster.sistemaOrigen || 'SISTEMA_DERIVADO',
                timestamp: respuestaLMaster.timestamp || new Date().toISOString(),
                respuestaLMaster: respuestaLMaster
            };
            
            localStorage.setItem(`ultimosIngresosSatisfactorios_${documentoKey}`, JSON.stringify(documentoEstandarizado));
            addLog(`Actualizado ultimosIngresosSatisfactorios para ${iniciales}`, 'info');
        }

        function crearSesionDerivada(datosUsuario, metaInfo) {
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('userInitials', datosUsuario.iniciales);
            sessionStorage.setItem('userEmpresas', JSON.stringify(datosUsuario.empresas));
            sessionStorage.setItem('loginTimestamp', new Date().toISOString());
            sessionStorage.setItem('sessionType', 'DERIVADO_PASIVO');
            sessionStorage.setItem('sistemaOrigen', metaInfo.sistemaOrigen);
            
            addLog(`Sesión derivada creada para ${datosUsuario.iniciales}`, 'success');
        }

        function actualizarTimestamp() {
            const jsonInput = document.getElementById('jsonInput');
            if (!jsonInput.value.trim()) {
                showToast('No hay JSON para actualizar', 'warning');
                return;
            }
            
            try {
                const json = JSON.parse(jsonInput.value);
                json.timestamp = new Date().toISOString();
                jsonInput.value = JSON.stringify(json, null, 2);
                showToast('Timestamp actualizado', 'success');
                addLog('Timestamp actualizado en JSON de prueba', 'info');
            } catch (error) {
                showToast('Error actualizando timestamp', 'error');
            }
        }

        function validarJSON() {
            const jsonInput = document.getElementById('jsonInput').value;
            if (!jsonInput.trim()) {
                showToast('No hay JSON para validar', 'warning');
                return;
            }
            
            try {
                const json = JSON.parse(jsonInput);
                let errores = [];
                
                if (!json.data) errores.push('Falta nodo "data"');
                if (!json.data?.iniciales) errores.push('Falta "data.iniciales"');
                if (!json.data?.empresas) errores.push('Falta "data.empresas"');
                if (!json.timestamp) errores.push('Falta "timestamp"');
                
                if (errores.length === 0) {
                    showToast('JSON válido ✅', 'success');
                    addLog('JSON validado correctamente', 'success');
                } else {
                    showToast(`JSON inválido: ${errores.join(', ')}`, 'error');
                    addLog(`Errores de validación: ${errores.join(', ')}`, 'error');
                }
                
            } catch (error) {
                showToast('JSON malformado', 'error');
                addLog(`Error de sintaxis JSON: ${error.message}`, 'error');
            }
        }

        // ==========================================
        // INFORMACIÓN DE SESIÓN
        // ==========================================
        function cargarInfoSesion() {
            const isAuthenticated = sessionStorage.getItem('isAuthenticated');
            const userInitials = sessionStorage.getItem('userInitials');
            const sessionType = sessionStorage.getItem('sessionType');
            const loginTimestamp = sessionStorage.getItem('loginTimestamp');
            const userEmpresas = sessionStorage.getItem('userEmpresas');
            const sistemaOrigen = sessionStorage.getItem('sistemaOrigen');
            
            document.getElementById('sessionStatus').textContent = isAuthenticated === 'true' ? '✅ Activa' : '❌ Inactiva';
            document.getElementById('sessionInitials').textContent = userInitials || '-';
            document.getElementById('sessionType').textContent = sessionType || '-';
            document.getElementById('sessionTimestamp').textContent = loginTimestamp ? new Date(loginTimestamp).toLocaleString() : '-';
            document.getElementById('sessionSistemaOrigen').textContent = sistemaOrigen || '-';
            
            if (userEmpresas) {
                try {
                    const empresas = JSON.parse(userEmpresas);
                    const empresasActivas = empresas.filter(emp => emp.empresa_activa && emp.usuario_activo);
                    document.getElementById('sessionEmpresas').textContent = empresasActivas.map(emp => emp.nombre).join(', ') || 'Ninguna activa';
                } catch (error) {
                    document.getElementById('sessionEmpresas').textContent = 'Error parseando empresas';
                }
            } else {
                document.getElementById('sessionEmpresas').textContent = '-';
            }
            
            addLog('Información de sesión recargada', 'info');
        }

        function limpiarSesion() {
            sessionStorage.clear();
            cargarInfoSesion();
            showToast('Sesión limpiada', 'success');
            addLog('Sesión limpiada completamente', 'warning');
        }

        // ==========================================
        // VERIFICACIÓN INICIAL
        // ==========================================
        function verificarIngresoDerivado() {
            // Verificar si hay datos POST
            const urlParams = new URLSearchParams(window.location.search);
            const respuestaLMasterURL = urlParams.get('respuestaLMaster');
            
            if (respuestaLMasterURL) {
                try {
                    const respuestaLMaster = JSON.parse(respuestaLMasterURL);
                    document.getElementById('jsonInput').value = JSON.stringify(respuestaLMaster, null, 2);
                    showToast('Datos de ingreso derivado detectados en URL', 'info');
                    addLog('Datos de ingreso derivado cargados desde URL', 'info');
                    
                    // Cambiar a pestaña pasivo
                    switchTab('pasivo');
                } catch (error) {
                    showToast('Error procesando datos de URL', 'error');
                    addLog(`Error procesando URL: ${error.message}`, 'error');
                }
            }
        }

        // ==========================================
        // INICIALIZACIÓN
        // ==========================================
        window.addEventListener('DOMContentLoaded', function() {
            addLog('Sistema de pruebas iniciado', 'success');
            cargarInfoSesion();
            verificarIngresoDerivado();
        });
    </script>
</body>
</html>
```

---

## 📋 INSTRUCCIONES DE PERSONALIZACIÓN

### 1. Cambios Obligatorios
Antes de usar la plantilla, debes realizar estos cambios:

```javascript
// Línea ~580: Cambiar nombre del sistema
sistemaOrigen: 'TU_SISTEMA_NOMBRE', // CAMBIAR POR EL NOMBRE DE TU SISTEMA

// Línea ~620: Cambiar nombre del sistema
sistemaOrigen: 'TU_SISTEMA_NOMBRE', // CAMBIAR POR EL NOMBRE DE TU SISTEMA

// Línea 15: Cambiar título
<title>Prueba Ingreso Derivado - {{NOMBRE_SISTEMA}}</title>
```

### 2. Configuraciones Opcionales
```javascript
// Timeout de toasts (línea ~470)
setTimeout(() => {
    if (toast.parentNode) {
        closeToast(toast);
    }
}, 5000); // Cambiar 5000 por los milisegundos deseados

// Timeout de timestamp (línea ~650)
if (horasTranscurridas > 1) { // Cambiar 1 por las horas deseadas
```

### 3. Estilos Personalizables
```css
/* Colores principales */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Fondo */
background: #007bff; /* Color primario */
background: #28a745; /* Color éxito */
background: #dc3545; /* Color error */
background: #ffc107; /* Color advertencia */
```

---

## 🔧 FUNCIONES PRINCIPALES

### Sistema de Toasts
```javascript
showToast(message, type); // type: 'info', 'success', 'error', 'warning'
```

### Sistema de Logs
```javascript
addLog(message, type); // type: 'info', 'success', 'error', 'warning'
clearLogs();
```

### Navegación
```javascript
switchTab(tabName); // tabName: 'activo', 'pasivo', 'info'
```

### Modo Activo
```javascript
enviarIngresoDerivado(); // Envía usuario a otro sistema
generarJSON(); // Genera JSON para previsualización
copiarJSON(); // Copia JSON al portapapeles
```

### Modo Pasivo
```javascript
testIngresoDerivadoPasivo(); // Procesa JSON de prueba
actualizarTimestamp(); // Actualiza timestamp del JSON
validarJSON(); // Valida estructura del JSON
```

### Información de Sesión
```javascript
cargarInfoSesion(); // Recarga información de sesión
limpiarSesion(); // Limpia toda la sesión
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Cambiar `TU_SISTEMA_NOMBRE` por el nombre real del sistema
- [ ] Cambiar `{{NOMBRE_SISTEMA}}` en el título
- [ ] Probar sistema de toasts
- [ ] Probar modo ACTIVO con datos reales
- [ ] Probar modo PASIVO con JSON de prueba
- [ ] Verificar logs funcionan correctamente
- [ ] Probar en dispositivos móviles (responsive)
- [ ] Validar que NO se usen `alert()` en ningún lugar
- [ ] Confirmar que solo se usa método GET con parámetros URL

---

**Esta plantilla está lista para copiar/pegar y usar inmediatamente siguiendo los estándares de la Familia Ledroit v2.1**