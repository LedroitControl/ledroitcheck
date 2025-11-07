# GUÍA COMPLETA - GADGET INGRESOS ACTIVOS

## DESCRIPCIÓN GENERAL

El **Gadget de Ingresos Activos** es un widget flotante que permite a los usuarios acceder rápidamente a sistemas secundarios configurados. Este gadget es **OBLIGATORIO** en todos los sistemas secundarios y debe implementarse **EXACTAMENTE** como se especifica en esta guía.

## CARACTERÍSTICAS PRINCIPALES

- **Botón flotante circular** con flecha blanca curva de envío
- **Lista desplegable** de sistemas disponibles hacia arriba
- **Gestión completa de permisos** por empresa (LEDROIT/CLIENTE) y rol (A1/A2/A3/A4)
- **Configuración dinámica** de sistemas con modales
- **Transferencia segura** de datos de sesión mediante método POST con autenticación estándar ledroitmaster
 - **Transferencia segura** de datos de sesión mediante método POST con autenticación estándar ledroitmaster
   - Endpoint estandarizado de recepción: `ingreso-derivado` (POST)
   - Página de procesamiento visual: `ingreso-derivado.html` (GET)
- **Animaciones suaves** con cubic-bezier y diseño consistente
- **Notificaciones toast** para feedback del usuario

### Comportamiento de "Abrir en nueva ventana" y cierre de sesión

El gadget permite elegir si el sistema pasivo se abre en una nueva pestaña/ventana o en la misma ventana. Esta preferencia afecta la sesión del sistema actual:

- Activado: se abre en una nueva pestaña y no se cierra la sesión actual.
- Desactivado: se abre en la misma ventana y se cierra la sesión de este sistema justo después de enviar los datos.

Notas de implementación:
- El valor `abrirNuevaVentana` se guarda y se respeta al cargar los sistemas desde Firestore/localStorage.
- El cierre de sesión se realiza mediante `window.SessionManager.logout(false)` si está disponible; de lo contrario, se limpian las claves `ledroitAuth` y `ls_session` en sessionStorage/localStorage.

## PÁGINAS DONDE SE IMPLEMENTA

El gadget **SOLO** aparece las paginas que indique el propietario (depes preguntarle):

**⚠️ IMPORTANTE:** NO implementar en todas las páginas sin consultar previamente.

## IMPLEMENTACIÓN COMPLETA

### 1. INCLUSIÓN EN HTML

Agregar la siguiente línea en el `<head>` de cada página donde debe aparecer:

```html
<!-- Gadget Ingresos Activos - OBLIGATORIO -->
<script src="js/ingresos-activos.js"></script>
```

**NOTA IMPORTANTE:** El gadget se auto-inicializa cuando el DOM está listo y verifica automáticamente si debe aparecer en la página actual. Y DEBES IMPLEMENTARLO EXACTAMENTE COMO SE SPECIFICA EN ESTA GUÍA. No similar, ni parecido:

### 2. ESTRUCTURA HTML GENERADA DINÁMICAMENTE

El gadget genera automáticamente la siguiente estructura HTML:

#### A) BOTÓN FLOTANTE PRINCIPAL
```html
<button id="ingresos-activos-btn">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17l9.2-9.2M17 17V7H7"/>
        <path d="M17 7l-10 10"/>
    </svg>
</button>
```

**ESPECIFICACIONES DEL BOTÓN:**
- **Posición:** Fixed, bottom: 30px, right: 30px
- **Tamaño:** 60px × 60px (circular perfecto)
- **Gradiente:** linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- **Sombra:** 0 4px 20px rgba(102, 126, 234, 0.4)
- **Z-index:** 9999 (siempre visible)
- **Icono:** Flecha curva blanca de envío (stroke: white, stroke-width: 2.5)

#### B) LISTA DESPLEGABLE
```html
<div id="ingresos-activos-list">
    <div class="list-header">
        <span>INGRESOS ACTIVOS</span>
        <div class="header-buttons">
            <!-- Botones solo para usuarios A1/A2 -->
            <button class="header-btn" id="add-sistema-btn" title="Agregar Sistema">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <button class="header-btn" id="config-btn" title="Configuración">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <!-- SVG de configuración -->
                </svg>
            </button>
        </div>
    </div>
    <div id="sistemas-container">
        <!-- Sistemas se cargan dinámicamente aquí -->
    </div>
</div>
```

**ESPECIFICACIONES DE LA LISTA:**
- **Posición:** Fixed, bottom: 100px, right: 30px
- **Tamaño:** min-width: 280px, max-width: 320px, max-height: 400px
- **Animación:** Aparece hacia arriba con scale y translateY
- **Sombra:** 0 8px 32px rgba(0, 0, 0, 0.15)
- **Border-radius:** 12px
- **Z-index:** 9998

#### C) ESTRUCTURA DE CADA SISTEMA
```html
<div class="sistema-item" onclick="enviarUsuarioASistema(...)">
    <div class="sistema-icon">
        <!-- Inicial del sistema -->
    </div>
    <div class="sistema-info">
        <div class="sistema-nombre">Nombre del Sistema</div>
        <div class="sistema-url">URL del sistema</div>
    </div>
</div>
```

### 3. ESTILOS CSS COMPLETOS (INYECTADOS AUTOMÁTICAMENTE)

El gadget inyecta automáticamente todos los estilos necesarios. Aquí están **TODOS** los estilos CSS exactos:

```css
/* BOTÓN FLOTANTE PRINCIPAL */
#ingresos-activos-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

#ingresos-activos-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

#ingresos-activos-btn svg {
    width: 24px;
    height: 24px;
    stroke: white;
    fill: none;
    transition: transform 0.3s ease;
}

#ingresos-activos-btn.open svg {
    transform: rotate(180deg);
}

/* LISTA DESPLEGABLE */
#ingresos-activos-list {
    position: fixed;
    bottom: 100px;
    right: 30px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    min-width: 280px;
    max-width: 320px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 9998;
    opacity: 0;
    transform: translateY(20px) scale(0.9);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    border: 1px solid #e1e5e9;
}

#ingresos-activos-list.show {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: all;
}

/* HEADER DE LA LISTA */
.list-header {
    padding: 16px;
    border-bottom: 1px solid #e1e5e9;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-buttons {
    display: flex;
    gap: 8px;
}

.header-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 6px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: white;
}

.header-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
}

.header-btn svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
}

/* ITEMS DE SISTEMAS */
.sistema-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 10px;
}

.sistema-item:hover {
    background-color: #f8f9fa;
}

.sistema-item:last-child {
    border-bottom: none;
}

.sistema-icon {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: bold;
}

.sistema-info {
    flex: 1;
}

.sistema-nombre {
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
    margin-bottom: 2px;
}

.sistema-url {
    color: #7f8c8d;
    font-size: 12px;
    word-break: break-all;
}

.no-sistemas {
    padding: 20px;
    text-align: center;
    color: #7f8c8d;
    font-size: 14px;
}

/* ESTILOS PARA MODALES */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e1e5e9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.modal-close {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
}

.modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
}

.modal-body {
    padding: 24px;
}

/* FORMULARIOS */
.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.form-group select[multiple] {
    min-height: 100px;
}

/* FOOTER DE MODALES */
.modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #e1e5e9;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.btn-cancel,
.btn-save {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel {
    background: #f8f9fa;
    color: #666;
}

.btn-cancel:hover {
    background: #e9ecef;
}

.btn-save {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-save:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* SECCIONES DE CONFIGURACIÓN */
.config-section {
    margin-bottom: 24px;
}

.config-section h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #333;
}

.config-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    margin-bottom: 8px;
}

.config-actions {
    display: flex;
    gap: 8px;
}

.btn-edit,
.btn-delete {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-edit {
    background: #007bff;
    color: white;
}

.btn-edit:hover:not(:disabled) {
    background: #0056b3;
}

.btn-delete {
    background: #dc3545;
    color: white;
}

.btn-delete:hover:not(:disabled) {
    background: #c82333;
}

.btn-edit:disabled,
.btn-delete:disabled {
    background: #6c757d;
    color: #ffffff;
    cursor: not-allowed;
    opacity: 0.6;
}
```

### 4. ANIMACIONES Y TRANSICIONES EXACTAS

**ANIMACIONES DEL BOTÓN:**
- **Hover:** `transform: scale(1.1)` + sombra aumentada
- **Active:** Sin animación específica (usa la transición base)
- **Transición:** `all 0.3s ease`

**ANIMACIONES DE LA LISTA:**
- **Aparición:** `opacity: 0 → 1` + `translateY(20px) → 0` + `scale(0.9) → 1`
- **Desaparición:** Reversa de la aparición
- **Transición:** `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

**ANIMACIONES DE ITEMS:**
- **Hover sistemas:** `background-color: #f8f9fa`
- **Hover botones header:** `scale(1.05)` + background más opaco
- **Transición:** `all 0.2s ease`

### 5. COLORES EXACTOS UTILIZADOS

**GRADIENTES PRINCIPALES:**
- **Botón y headers:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

**COLORES DE TEXTO:**
- **Títulos principales:** `#2c3e50`
- **Texto secundario:** `#7f8c8d`
- **Texto normal:** `#333`
- **Texto deshabilitado:** `#666`

**COLORES DE FONDO:**
- **Hover items:** `#f8f9fa`
- **Bordes:** `#e1e5e9`, `#f0f0f0`, `#ddd`
- **Sombras:** `rgba(102, 126, 234, 0.4)`, `rgba(0, 0, 0, 0.15)`

**COLORES DE BOTONES:**
- **Editar:** `#007bff` (hover: `#0056b3`)
- **Eliminar:** `#dc3545` (hover: `#c82333`)
- **Cancelar:** `#f8f9fa` (hover: `#e9ecef`)

### 6. ICONOS SVG EXACTOS

**ICONO DEL BOTÓN PRINCIPAL (Flecha curva de envío):**
```svg
<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 17l9.2-9.2M17 17V7H7"/>
    <path d="M17 7l-10 10"/>
</svg>
```

**ICONO AGREGAR (+):**
```svg
<svg viewBox="0 0 24 24" width="16" height="16">
    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
```

**ICONO CONFIGURACIÓN (Engranaje):**
```svg
<svg viewBox="0 0 24 24" width="16" height="16">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>
```

### 7. DISEÑO RESPONSIVE

**BREAKPOINT MÓVIL (max-width: 768px):**
```css
@media (max-width: 768px) {
    #ingresos-activos-list {
        width: calc(100vw - 40px);
        right: 20px;
    }
    
    .modal-content {
        width: 95%;
        margin: 20px;
    }
}
```

### 8. FUNCIONALIDAD JAVASCRIPT (EXPLICACIÓN GENERAL)

El archivo JavaScript completo maneja:

**INICIALIZACIÓN:**
- Verificación automática de permisos de usuario
- Detección de página actual vs páginas permitidas
- Inyección automática de estilos CSS
- Creación dinámica del HTML del gadget

**GESTIÓN DE PERMISOS:**
- Sistema de roles: A1 (admin total), A2 (configurador), A3 (usuario), A4 (limitado)
- Sistema de empresas: LEDROIT, DECLAROFACTUR, CLIENTE_EXTERNO
- Verificación de acceso por sistema individual

**FUNCIONALIDADES PRINCIPALES:**
- Carga de sistemas desde Firestore (principal) o localStorage (fallback)
- Renderizado dinámico de sistemas según permisos
- Modales para agregar/editar/configurar sistemas
- Transferencia segura de datos mediante método POST con autenticación estándar ledroitmaster
- Sistema de notificaciones toast
- Validaciones de formularios

**EVENTOS Y ANIMACIONES:**
- Toggle de lista con animaciones suaves
- Cierre automático al hacer clic fuera
- Hover effects en todos los elementos interactivos
- Rotación del icono al abrir/cerrar

---

## 🚨 CÓDIGO JAVASCRIPT COMPLETO

**INSTRUCCIONES:** Copiar y pegar **TODO** el contenido del archivo `ingresos-activos.js` anexo en la carpeta de documentación.



---

## VALIDACIONES Y REGLAS OBLIGATORIAS

### ✅ **VALIDACIONES DE IMPLEMENTACIÓN:**
1. **Archivo JS:** Debe incluirse en el `<head>` de cada página permitida
2. **Auto-inicialización:** El gadget se inicializa automáticamente
3. **Verificación de página:** Solo aparece en páginas específicas
4. **Permisos de usuario:** Verifica roles antes de mostrar funciones
5. **Estilos automáticos:** CSS se inyecta automáticamente

### ✅ **REGLAS DE DISEÑO:**
1. **Posición fija:** Siempre bottom: 30px, right: 30px
2. **Z-index:** Botón 9999, lista 9998, modales 10000+
3. **Gradiente exacto:** #667eea → #764ba2 (135deg)
4. **Animaciones suaves:** cubic-bezier(0.4, 0, 0.2, 1)
5. **Responsive:** Adaptación automática en móviles

### ✅ **REGLAS DE FUNCIONALIDAD:**
1. **Autenticación estándar:** Uso de sesión ledroitAuth con iniciales
2. **Firestore primario:** localStorage como fallback
3. **Permisos estrictos:** Verificación por empresa y rol
4. **Validaciones:** Campos obligatorios en formularios
5. **Notificaciones:** Toast para feedback del usuario
6. **Conversión automática:** Campos específicos se convierten a mayúsculas
7. **Jerarquía de roles:** Selección automática de roles superiores

### 🔤 **CONVERSIÓN AUTOMÁTICA A MAYÚSCULAS:**
Los siguientes campos se convierten automáticamente a mayúsculas mediante `style="text-transform: uppercase;"`:
- **NOMBRE DEL SISTEMA RECEPTOR**
- **SISTEMA DE ORIGEN** 
- **EMPRESA SOLICITANTE**

### 📊 **JERARQUÍA DE ROLES (A1 > A2 > A3 > A4):**
**REGLA PRINCIPAL:** A1 es el rol superior, A4 es el rol inferior.

**COMPORTAMIENTO AUTOMÁTICO:**
- Si selecciono **A2** → Se selecciona automáticamente **A1**
- Si selecciono **A3** → Se seleccionan automáticamente **A1** y **A2**  
- Si selecciono **A4** → Se seleccionan automáticamente **A1**, **A2** y **A3**

**COMPORTAMIENTO AL DESMARCAR:**
- Si desmarco **A1** → Se desmarcan automáticamente **A2**, **A3** y **A4**
- Si desmarco **A2** → Se desmarcan automáticamente **A3** y **A4** (A1 permanece)
- Si desmarco **A3** → Se desmarca automáticamente **A4** (A1 y A2 permanecen)

**APLICACIÓN:**
- ✅ **Modal Agregar Sistema:** Jerarquía activa
- ✅ **Modal Editar Sistema:** Jerarquía activa
- ✅ **Todas las empresas:** Jerarquía independiente por empresa

### ⚠️ **ADVERTENCIAS IMPORTANTES:**
- **NO modificar** los estilos CSS inyectados
- **NO cambiar** las dimensiones del botón (60px × 60px)
- **NO alterar** el gradiente de colores
- **NO implementar** en páginas no autorizadas
- **USAR SIEMPRE** método POST con autenticación estándar ledroitmaster e iniciales

## CONCLUSIÓN

Esta guía contiene **TODOS** los detalles de HTML y CSS necesarios para implementar el gadget exactamente igual al original. El código JavaScript completo debe copiarse del archivo `ingresos-activos.js` en la sección indicada para garantizar funcionalidad idéntica.