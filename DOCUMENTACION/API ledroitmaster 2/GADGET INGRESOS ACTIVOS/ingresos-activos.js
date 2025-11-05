// Widget de Ingresos Activos - Botón Circular Simple
class IngresosActivosWidget {
    constructor() {
        this.isOpen = false;
        this.sistemas = [];
        // Referencia a Firestore si está disponible
        this.db = (typeof window !== 'undefined' && window.db) ? window.db : undefined;
        // Definir empresas y roles para los modales
        this.empresas = ['LEDROIT', 'DECLAROFACTUR', 'CLIENTE_EXTERNO'];
        this.roles = ['A1', 'A2', 'A3', 'A4'];
        this.init();
    }

    init() {
        if (!this.checkUserRole()) {
            console.log('Usuario sin permisos para ver Ingresos Activos');
            return;
        }
        this.injectStyles();
        this.createButton();
        // No cargar sistemas al inicializar, solo cuando se abra la lista
    }

    checkUserRole() {
        try {
            // Usar lógica basada en ls_session/ledroitAuth estandarizada
            const userEmpresas = this.getEmpresasFromSession();
            console.log('Empresas del usuario (estándar):', userEmpresas);

            if (!Array.isArray(userEmpresas) || userEmpresas.length === 0) {
                console.log('❌ No hay empresas en la sesión activa (ls_session/ledroitAuth)');
                return false;
            }

            // Autorizar si el usuario tiene rol A1, A2 o A3 en cualquier empresa
            for (const empresa of userEmpresas) {
                if (empresa && empresa.rol) {
                    const rol = Array.isArray(empresa.rol) ? empresa.rol[0] : empresa.rol;
                    if (typeof rol === 'string') {
                        const roleMatch = rol.match(/A[1-4]/);
                        const userRole = roleMatch ? roleMatch[0] : 'A4';
                        console.log(`Rol detectado en "${empresa.nombre}":`, userRole);
                        if (userRole === 'A1' || userRole === 'A2' || userRole === 'A3') {
                            console.log('✅ Usuario autorizado para ver Ingresos Activos');
                            return true;
                        }
                    }
                }
            }

            console.log('❌ Usuario sin permisos A1/A2/A3 en sus empresas');
            return false;
        } catch (error) {
            console.error('Error obteniendo rol del usuario:', error);
            return false;
        }
    }

    // Normalizador de sesión al estándar LedroitMaster (ES)
    // Apegado a la guía: usar SIEMPRE nomenclatura en español dentro de ls_session
    normalizeSession(session) {
        if (!session || typeof session !== 'object') return null;
        const s = { ...session };
        // Iniciales y nombre solo en español
        s.iniciales = s.iniciales || (s.user && s.user.iniciales) || null;
        s.nombre = s.nombre || (s.user && s.user.nombre) || null;
        // Empresas en español
        s.empresas = Array.isArray(s.empresas)
            ? s.empresas
            : (s.user && Array.isArray(s.user.empresas) ? s.user.empresas : []);
        // Homologar estructura de empresas (si ya usan estándar, se conserva)
        s.empresas = s.empresas.map(e => ({
            id: e.id,
            nombre: e.nombre,
            empresa_activa: typeof e.empresa_activa === 'boolean' ? e.empresa_activa : true,
            usuario_activo: typeof e.usuario_activo === 'boolean' ? e.usuario_activo : true,
            rol: Array.isArray(e.rol) ? e.rol : []
        }));
        return s;
    }

    // Obtener empresas del usuario desde la sesión estandarizada (ls_session / ledroitAuth)
    getEmpresasFromSession() {
        try {
            const raw = sessionStorage.getItem('ledroitAuth') || sessionStorage.getItem('ls_session');
            if (!raw) return [];
            const s = this.normalizeSession(JSON.parse(raw));
            return Array.isArray(s?.empresas) ? s.empresas : [];
        } catch (e) {
            console.warn('No se pudo leer empresas desde la sesión:', e);
            return [];
        }
    }

    // Nueva función para verificar si el usuario puede configurar (solo A1 y A2)
    canUserConfigure() {
        try {
            const userEmpresas = this.getEmpresasFromSession();
            
            // Verificar si el usuario tiene rol A1 o A2 en al menos una empresa
            const hasConfigPermission = userEmpresas.some(empresa => {
                if (empresa.rol) {
                    const rol = Array.isArray(empresa.rol) ? empresa.rol[0] : empresa.rol;
                    if (typeof rol === 'string') {
                        const roleMatch = rol.match(/A[1-4]/);
                        const userRole = roleMatch ? roleMatch[0] : 'A4';
                        return userRole === 'A1' || userRole === 'A2';
                    }
                }
                return false;
            });
            
            console.log('¿Usuario puede configurar?', hasConfigPermission);
            return hasConfigPermission;
        } catch (error) {
            console.error('Error verificando permisos de configuración:', error);
            return false;
        }
    }

    // Nueva función para verificar si el usuario puede editar/eliminar un sistema específico
    canUserEditSystem(sistema) {
        try {
            const userEmpresas = this.getEmpresasFromSession();
            
            // Verificar si el usuario coincide con alguna empresa/rol del sistema
            const hasSystemAccess = sistema.permisos.some(permiso => {
                const userEmpresa = userEmpresas.find(emp => emp.nombre === permiso.empresa);
                if (userEmpresa && userEmpresa.rol) {
                    const userRol = Array.isArray(userEmpresa.rol) ? userEmpresa.rol[0] : userEmpresa.rol;
                    if (typeof userRol === 'string') {
                        const userRoleMatch = userRol.match(/A[1-4]/);
                        const userRole = userRoleMatch ? userRoleMatch[0] : 'A4';
                        
                        // Verificar si el rol del usuario coincide con el rol del permiso
                        if (userRol.includes(permiso.rol)) {
                            // Además, verificar que sea A1 o A2 para poder editar/eliminar
                            return userRole === 'A1' || userRole === 'A2';
                        }
                    }
                }
                return false;
            });
            
            console.log(`¿Usuario puede editar sistema ${sistema.nombre}?`, hasSystemAccess);
            return hasSystemAccess;
        } catch (error) {
            console.error('Error verificando permisos de edición:', error);
            return false;
        }
    }

    injectStyles() {
        if (document.getElementById('ingresos-activos-styles')) return;

        const style = document.createElement('style');
        style.id = 'ingresos-activos-styles';
        style.textContent = `
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

            .list-header {
                padding: 15px 20px;
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
                font-weight: 500;
                font-size: 13px;
                color: #333;
                margin-bottom: 2px;
            }

            .sistema-url {
                font-size: 11px;
                color: #666;
            }

            .no-sistemas {
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 13px;
            }

            /* Estilos para modales */
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

            .list-header {
                padding: 16px;
                border-bottom: 1px solid #e1e5e9;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px 12px 0 0;
                font-weight: 600;
                font-size: 14px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    createButton() {
        console.log('Creando botón de Ingresos Activos...');
        
        // Crear botón circular con flecha curva de envío
        const button = document.createElement('button');
        button.id = 'ingresos-activos-btn';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17l9.2-9.2M17 17V7H7"/>
                <path d="M17 7l-10 10"/>
            </svg>
        `;

        // Verificar permisos del usuario para mostrar botones
        const canConfigure = this.canUserConfigure();
        
        // Crear lista desplegable con header mejorado
        const list = document.createElement('div');
        list.id = 'ingresos-activos-list';
        list.innerHTML = `
            <div class="list-header">
                <span>INGRESOS ACTIVOS</span>
                <div class="header-buttons">
                    ${canConfigure ? `
                    <button class="header-btn" id="add-sistema-btn" title="Agregar Sistema">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <button class="header-btn" id="config-btn" title="Configuración">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    ` : ''}
                </div>
            </div>
            <div id="sistemas-container">
                <div class="no-sistemas">Cargando sistemas...</div>
            </div>
        `;

        // Agregar al DOM
        document.body.appendChild(button);
        document.body.appendChild(list);
        
        console.log('Botón creado y agregado al DOM');

        // Event listeners
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleList();
        });

        // Event listeners para botones del header (solo si existen)
        if (canConfigure) {
            const addBtn = document.getElementById('add-sistema-btn');
            const configBtn = document.getElementById('config-btn');
            
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showAddSystemModal();
                });
            }
            
            if (configBtn) {
                configBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showConfigModal();
                });
            }
        }

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!button.contains(e.target) && !list.contains(e.target)) {
                this.closeList();
            }
        });
    }

    toggleList() {
        const button = document.getElementById('ingresos-activos-btn');
        const list = document.getElementById('ingresos-activos-list');
        
        if (this.isOpen) {
            this.closeList();
        } else {
            this.openList();
        }
    }

    openList() {
        const button = document.getElementById('ingresos-activos-btn');
        const list = document.getElementById('ingresos-activos-list');
        
        this.isOpen = true;
        button.classList.add('open');
        list.classList.add('show');
        
        // Cargar sistemas solo cuando se abre la lista por primera vez
        this.loadSistemas();
    }

    closeList() {
        const button = document.getElementById('ingresos-activos-btn');
        const list = document.getElementById('ingresos-activos-list');
        
        this.isOpen = false;
        button.classList.remove('open');
        list.classList.remove('show');
    }

    async loadSistemas() {
        console.log('Cargando sistemas...');
        try {
            // Obtener empresas del usuario logueado
            const userEmpresas = this.getEmpresasFromSession();
            console.log('Empresas del usuario (estándar):', userEmpresas);
            
            // Intentar cargar desde Firestore
            if (this.db) {
                console.log('Intentando cargar desde Firestore...');
                try {
                    const snapshot = await this.db.collection('configIngActivos').get();
                    this.sistemas = [];
                    
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        // Filtrar por permisos de empresa/rol
                        if (this.canAccessSystem(userEmpresas, data.permisos)) {
                            this.sistemas.push({
                                id: doc.id,
                                nombre: data.nombre,
                                url: data.url,
                                descripcion: data.descripcion || '',
                                sistemaOrigen: data.sistemaOrigen || 'DECLAROFACTUR',
                                empresaSolicitante: data.empresaSolicitante || '',
                                permisos: data.permisos || [],
                                abrirNuevaVentana: !!data.abrirNuevaVentana
                            });
                        }
                    });
                    console.log('Sistemas cargados desde Firestore:', this.sistemas);

                    // Migración automática desde localStorage → Firestore (una sola vez)
                    try {
                        const yaMigrado = localStorage.getItem('ingActivosMigrado') === '1';
                        const localesRaw = localStorage.getItem('ingresosActivosSistemas');
                        const locales = localesRaw ? JSON.parse(localesRaw) : [];
                        if (!yaMigrado && Array.isArray(locales) && locales.length > 0) {
                            console.log('Detectados sistemas locales, iniciando migración a Firestore...');
                            for (const s of locales) {
                                // Evitar duplicados si ya existe con mismo nombre+url
                                const yaExiste = this.sistemas.some(x => x.nombre === s.nombre && x.url === s.url);
                                if (yaExiste) continue;
                                const docRef = await this.db.collection('configIngActivos').add({
                                    nombre: s.nombre,
                                    url: s.url,
                                    descripcion: s.descripcion || '',
                                    sistemaOrigen: s.sistemaOrigen || 'DECLAROFACTUR',
                                    empresaSolicitante: s.empresaSolicitante || '',
                                    permisos: s.permisos || [],
                                    abrirNuevaVentana: !!s.abrirNuevaVentana
                                });
                                this.sistemas.push({ ...s, id: docRef.id });
                            }
                            localStorage.setItem('ingActivosMigrado', '1');
                            this.showToast('Sistemas locales migrados a Firestore', 'info');
                            console.log('Migración completa.');
                        }
                    } catch (migErr) {
                        console.warn('Error en migración automática:', migErr);
                    }
                } catch (firestoreError) {
                    console.warn('Error de Firestore:', firestoreError);
                    this.sistemas = []; // Lista vacía si no hay datos
                }
            } else {
                console.log('Firestore no disponible, usando localStorage...');
                // Fallback a localStorage
                const stored = localStorage.getItem('ingresosActivosSistemas');
                if (stored) {
                    const allSistemas = JSON.parse(stored);
                    this.sistemas = allSistemas.filter(sistema => 
                        this.canAccessSystem(userEmpresas, sistema.permisos)
                    );
                } else {
                    this.sistemas = []; // Lista vacía si no hay datos guardados
                }
            }
            
            console.log('Sistemas finales:', this.sistemas);
            this.renderSistemas();
        } catch (error) {
            console.error('Error general cargando sistemas:', error);
            // Usar datos de ejemplo como último recurso
            this.sistemas = [
                {
                    id: 'ejemplo1',
                    nombre: 'Sistema Ejemplo',
                    url: 'https://ejemplo.com',
                    descripcion: 'Sistema de ejemplo'
                }
            ];
            this.renderSistemas();
        }
    }

    canAccessSystem(userEmpresas, sistemaPermisos) {
        if (!sistemaPermisos || sistemaPermisos.length === 0) {
            return false; // Sin permisos definidos, no se puede acceder
        }
        
        console.log('🔍 Verificando acceso al sistema:');
        console.log('Empresas del usuario:', userEmpresas);
        console.log('Permisos del sistema:', sistemaPermisos);
        
        // Jerarquía de roles: A1 > A2 > A3 > A4 (A1 es el rol superior)
        const roleHierarchy = {
            'A1': ['A1', 'A2', 'A3', 'A4'],
            'A2': ['A2', 'A3', 'A4'],
            'A3': ['A3', 'A4'],
            'A4': ['A4']
        };
        
        // Verificar si el usuario tiene acceso en alguna empresa
        for (const userEmpresa of userEmpresas) {
            console.log(`Verificando empresa: ${userEmpresa.nombre}`);
            
            // Extraer el rol del usuario (puede ser string o array)
            let userRoles = userEmpresa.rol || [];
            if (typeof userRoles === 'string') {
                // Si es string, extraer el rol principal (A1, A2, A3, A4)
                const roleMatch = userRoles.match(/A[1-4]/);
                userRoles = roleMatch ? [roleMatch[0]] : [];
            } else if (!Array.isArray(userRoles)) {
                userRoles = [];
            }
            
            console.log(`Roles del usuario en ${userEmpresa.nombre}:`, userRoles);
            
            for (const userRole of userRoles) {
                const allowedRoles = roleHierarchy[userRole] || [];
                console.log(`Roles permitidos para ${userRole}:`, allowedRoles);
                
                // Verificar si hay coincidencia con los permisos del sistema
                for (const permiso of sistemaPermisos) {
                    console.log(`Verificando permiso: ${permiso.empresa}-${permiso.rol}`);
                    
                    if (permiso.empresa === userEmpresa.nombre && 
                        allowedRoles.includes(permiso.rol)) {
                        console.log('✅ ACCESO CONCEDIDO');
                        return true;
                    }
                }
            }
        }
        
        console.log('❌ ACCESO DENEGADO');
        return false;
    }

    renderSistemas() {
        const container = document.getElementById('sistemas-container');
        if (!container) return;

        if (this.sistemas.length === 0) {
            container.innerHTML = `
                <div class="no-sistemas">
                    <div style="text-align: center; padding: 20px; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📋</div>
                        <div style="font-size: 14px; margin-bottom: 8px;">No hay sistemas configurados</div>
                        <div style="font-size: 12px; color: #999;">Usa el botón "+" para agregar un nuevo sistema</div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.sistemas.map(sistema => `
            <div class="sistema-item" data-sistema-id="${sistema.id}" data-sistema-url="${sistema.url}" data-sistema-origen="${sistema.sistemaOrigen || 'DECLAROFACTUR'}" data-empresa-solicitante="${sistema.empresaSolicitante || ''}" data-abrir-nueva-ventana="${sistema.abrirNuevaVentana || false}">
                <div class="sistema-icon">${sistema.nombre.charAt(0).toUpperCase()}</div>
                <div class="sistema-info">
                    <div class="sistema-nombre">${sistema.nombre}</div>
                    <div class="sistema-url">${sistema.url}</div>
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners para cada sistema
        container.querySelectorAll('.sistema-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sistemaUrl = item.dataset.sistemaUrl;
                const sistemaOrigen = item.dataset.sistemaOrigen;
                const empresaSolicitante = item.dataset.empresaSolicitante;
                const abrirNuevaVentana = item.dataset.abrirNuevaVentana === 'true';
                this.enviarUsuarioASistema(sistemaUrl, sistemaOrigen, empresaSolicitante, abrirNuevaVentana);
            });
        });
    }

    showAddSystemModal() {
        console.log('Abriendo modal para agregar sistema...');
        
        // Obtener empresas del usuario
        const userEmpresas = this.getEmpresasFromSession();
        console.log('Empresas del usuario para modal (estándar):', userEmpresas);
        
        // Crear tabla de empresas con checkboxes
        const empresasTable = userEmpresas.map(empresa => {
            return `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 500;">${empresa.nombre}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                        <input type="checkbox" name="empresa_${empresa.nombre}_A1" value="A1" data-empresa="${empresa.nombre}" data-rol="A1">
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                        <input type="checkbox" name="empresa_${empresa.nombre}_A2" value="A2" data-empresa="${empresa.nombre}" data-rol="A2">
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                        <input type="checkbox" name="empresa_${empresa.nombre}_A3" value="A3" data-empresa="${empresa.nombre}" data-rol="A3">
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                        <input type="checkbox" name="empresa_${empresa.nombre}_A4" value="A4" data-empresa="${empresa.nombre}" data-rol="A4">
                    </td>
                </tr>
            `;
        }).join('');
        
        // Crear modal
        const modal = document.createElement('div');
        modal.id = 'add-system-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Agregar Nuevo Sistema</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Nombre del Sistema: <span style="color: red;">*</span></label>
                            <input type="text" id="sistema-nombre" placeholder="NOMBRE DEL SISTEMA RECEPTOR" required style="text-transform: uppercase;">
                        </div>
                        <div class="form-group">
                            <label>URL del Sistema: <span style="color: red;">*</span></label>
                            <input type="url" id="sistema-url" placeholder="https://ejemplo.com" required>
                        </div>
                        <div class="form-group">
                            <label>Descripción:</label>
                            <textarea id="sistema-descripcion" placeholder="Descripción del sistema"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Sistema de Origen: <span style="color: red;">*</span></label>
                            <input type="text" id="sistema-origen" placeholder="Ej: MI_SISTEMA" required>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                Nombre del sistema que enviará usuarios a este sistema
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Empresa Solicitante:</label>
                            <select id="empresa-solicitante">
                                <option value="">Selecciona una empresa (opcional)</option>
                                ${userEmpresas.map(empresa => `
                                    <option value="${empresa.nombre}">${empresa.nombre}</option>
                                `).join('')}
                            </select>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                Empresa que solicita el registro del sistema (opcional)
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Permisos por Empresa y Rol: <span style="color: red;">*</span></label>
                            <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                Selecciona al menos una empresa/rol. Los roles superiores incluyen automáticamente los inferiores.
                            </div>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                    <thead>
                                        <tr style="background: #f8f9fa;">
                                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Empresa</th>
                                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">A1</th>
                                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">A2</th>
                                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">A3</th>
                                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">A4</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${empresasTable}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; justify-content: space-between; margin: 0; cursor: pointer;">
                                <span>Abrir en nueva ventana</span>
                                <input type="checkbox" id="abrir-nueva-ventana" style="margin: 0; width: 18px; height: 18px;">
                            </label>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                Si está activado, el sistema se abrirá en una nueva pestaña del navegador y no cerrará la sesión actual.
                                Si está desactivado, se abrirá en esta misma ventana y se cerrará la sesión de este sistema.
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel">Cancelar</button>
                        <button class="btn-save">Guardar Sistema</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Lógica de jerarquía de roles: A1 es superior, A4 es inferior
        const setupRoleHierarchy = () => {
            const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const empresa = e.target.dataset.empresa;
                    const rol = e.target.dataset.rol;
                    const isChecked = e.target.checked;
                    
                    if (isChecked) {
                        // Si se marca un rol, marcar automáticamente los roles superiores
                        const roleOrder = ['A1', 'A2', 'A3', 'A4'];
                        const currentIndex = roleOrder.indexOf(rol);
                        
                        // Marcar todos los roles superiores (índices menores)
                        for (let i = 0; i < currentIndex; i++) {
                            const higherRoleCheckbox = modal.querySelector(`input[data-empresa="${empresa}"][data-rol="${roleOrder[i]}"]`);
                            if (higherRoleCheckbox) {
                                higherRoleCheckbox.checked = true;
                            }
                        }
                    } else {
                        // Si se desmarca un rol, desmarcar automáticamente los roles inferiores
                        const roleOrder = ['A1', 'A2', 'A3', 'A4'];
                        const currentIndex = roleOrder.indexOf(rol);
                        
                        // Desmarcar todos los roles inferiores (índices mayores)
                        for (let i = currentIndex + 1; i < roleOrder.length; i++) {
                            const lowerRoleCheckbox = modal.querySelector(`input[data-empresa="${empresa}"][data-rol="${roleOrder[i]}"]`);
                            if (lowerRoleCheckbox) {
                                lowerRoleCheckbox.checked = false;
                            }
                        }
                    }
                });
            });
        };

        setupRoleHierarchy();

        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.btn-save').addEventListener('click', () => {
            this.saveNewSystem(modal);
        });

        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.modal-overlay')) {
                document.body.removeChild(modal);
            }
        });
    }

    showConfigModal() {
        console.log('Abriendo modal de configuración...');
        
        const modal = document.createElement('div');
        modal.id = 'config-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Configuración de Ingresos Activos</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="config-section">
                            <h4>Sistemas Configurados</h4>
                            <div id="sistemas-config-list">
                                ${this.sistemas.map(sistema => {
                                    const canEdit = this.canUserEditSystem(sistema);
                                    return `
                                        <div class="config-item">
                                            <span>${sistema.nombre}</span>
                                            <div class="config-actions">
                                                <button class="btn-edit" data-id="${sistema.id}" ${!canEdit ? 'disabled' : ''}>Editar</button>
                                                <button class="btn-delete" data-id="${sistema.id}" ${!canEdit ? 'disabled' : ''}>Eliminar</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Event listeners para botones de editar y eliminar
        modal.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sistemaId = e.target.dataset.id;
                this.editarSistema(sistemaId);
                document.body.removeChild(modal);
            });
        });

        modal.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sistemaId = e.target.dataset.id;
                this.eliminarSistema(sistemaId);
                document.body.removeChild(modal);
            });
        });

        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.modal-overlay')) {
                document.body.removeChild(modal);
            }
        });
    }

    saveNewSystem(modal) {
        const nombre = modal.querySelector('#sistema-nombre').value.trim();
        const url = modal.querySelector('#sistema-url').value.trim();
        const descripcion = modal.querySelector('#sistema-descripcion').value.trim();
        const sistemaOrigen = modal.querySelector('#sistema-origen').value.trim();
        const empresaSolicitante = modal.querySelector('#empresa-solicitante').value.trim();
        const abrirNuevaVentana = modal.querySelector('#abrir-nueva-ventana').checked;
        
        // Validar campos obligatorios
        if (!nombre) {
            this.showToast('El nombre del sistema es obligatorio', 'error');
            return;
        }
        
        if (!url) {
            this.showToast('La URL del sistema es obligatoria', 'error');
            return;
        }
        
        if (!sistemaOrigen) {
            this.showToast('El sistema de origen es obligatorio', 'error');
            return;
        }
        
        // Empresa solicitante es opcional, no validar como obligatorio
        
        // Recopilar permisos seleccionados
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked:not(#abrir-nueva-ventana)');
        const permisos = [];
        
        checkboxes.forEach(checkbox => {
            if (checkbox.dataset.empresa && checkbox.dataset.rol) {
                permisos.push({
                    empresa: checkbox.dataset.empresa,
                    rol: checkbox.dataset.rol
                });
            }
        });
        
        if (permisos.length === 0) {
            this.showToast('Debe seleccionar al menos una empresa/rol', 'error');
            return;
        }
        
        console.log('Guardando sistema:', { nombre, url, descripcion, sistemaOrigen, empresaSolicitante, permisos, abrirNuevaVentana });
        
        // Crear objeto del sistema
        const nuevoSistema = {
            id: Date.now().toString(),
            nombre,
            url,
            descripcion,
            sistemaOrigen,
            empresaSolicitante,
            permisos,
            abrirNuevaVentana,
            fechaCreacion: new Date().toISOString()
        };
        
        // Intentar guardar en Firestore
        if (this.db) {
            this.db.collection('configIngActivos').add(nuevoSistema)
                .then((docRef) => {
                    console.log('Sistema guardado en Firestore con ID:', docRef.id);
                    nuevoSistema.id = docRef.id;
                    this.sistemas.push(nuevoSistema);
                    this.renderSistemas();
                    this.showToast('Sistema agregado exitosamente (Firestore)', 'success');
                    document.body.removeChild(modal);
                })
                .catch((error) => {
                    console.error('Error guardando en Firestore:', error);
                    // Fallback a localStorage
                    this.saveToLocalStorage(nuevoSistema);
                    this.showToast('Sistema agregado (guardado localmente)', 'info');
                    document.body.removeChild(modal);
                });
        } else {
            // Guardar en localStorage
            this.saveToLocalStorage(nuevoSistema);
            this.showToast('Sistema agregado (guardado localmente)', 'info');
            document.body.removeChild(modal);
        }
    }
    
    saveToLocalStorage(sistema) {
        const stored = localStorage.getItem('ingresosActivosSistemas');
        const sistemas = stored ? JSON.parse(stored) : [];
        sistemas.push(sistema);
        localStorage.setItem('ingresosActivosSistemas', JSON.stringify(sistemas));
        this.sistemas.push(sistema);
        this.renderSistemas();
    }

    showToast(message, type = 'success') {
        // Crear el elemento toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
                </div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        // Agregar estilos si no existen
        if (!document.querySelector('#toast-styles')) {
            const toastStyles = document.createElement('style');
            toastStyles.id = 'toast-styles';
            toastStyles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 10001;
                    min-width: 300px;
                    max-width: 400px;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                }

                .toast.show {
                    opacity: 1;
                    transform: translateX(0);
                }

                .toast-success {
                    border-left: 4px solid #28a745;
                }

                .toast-error {
                    border-left: 4px solid #dc3545;
                }

                .toast-info {
                    border-left: 4px solid #17a2b8;
                }

                .toast-content {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    gap: 12px;
                }

                .toast-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    font-size: 14px;
                }

                .toast-success .toast-icon {
                    background: #28a745;
                }

                .toast-error .toast-icon {
                    background: #dc3545;
                }

                .toast-info .toast-icon {
                    background: #17a2b8;
                }

                .toast-message {
                    flex: 1;
                    font-size: 14px;
                    color: #333;
                    line-height: 1.4;
                }
            `;
            document.head.appendChild(toastStyles);
        }

        // Agregar al DOM
        document.body.appendChild(toast);

        // Mostrar con animación
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Remover después de 4 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
    
    // Función para enviar usuario a otro sistema con información de sesión
    async enviarUsuarioASistema(urlDestino, sistemaOrigen, empresaSolicitante, abrirNuevaVentana = true) {
        console.log('Enviando usuario a sistema:', { urlDestino, sistemaOrigen, empresaSolicitante, abrirNuevaVentana });
        
        // Verificar sesión activa usando el estándar ledroitAuth
        const sessionData = sessionStorage.getItem('ledroitAuth')
            || sessionStorage.getItem('ls_session');
        if (!sessionData) {
            this.showToast('No hay sesión activa. Inicia sesión primero.', 'error');
            console.log('Error: No hay sesión activa', 'error');
            return;
        }
        
        let iniciales;
        try {
            const rawSession = JSON.parse(sessionData);
            // Normalizar a estándar ES
            const session = this.normalizeSession(rawSession);
            iniciales = session?.iniciales || null;
            if (!iniciales) {
                this.showToast('Sesión inválida: faltan iniciales del usuario.', 'error');
                console.log('Error: Sesión inválida - faltan iniciales', 'error');
                return;
            }
        } catch (error) {
            this.showToast('Error al leer datos de sesión.', 'error');
            console.log('Error: Datos de sesión corruptos', 'error');
            return;
        }
        
        // Obtener datos de ultimosIngresosSatisfactorios
        let ultimoIngreso = localStorage.getItem(`ultimosIngresosSatisfactorios_${iniciales}`);
        if (!ultimoIngreso && typeof obtenerUltimoIngreso === 'function') {
            try {
                const registro = await obtenerUltimoIngreso(iniciales);
                if (registro && registro.respuestaLMaster) {
                    ultimoIngreso = JSON.stringify(registro);
                }
            } catch (e) {
                console.warn('No se pudo obtener último ingreso desde Firestore:', e);
            }
        }
        if (!ultimoIngreso) {
            this.showToast('No se encontraron datos de último ingreso', 'error');
            console.log('Error: No se encontraron datos de último ingreso', 'error');
            return;
        }

        try {
            const documentoEstandarizado = JSON.parse(ultimoIngreso);
            
            // Preparar respuestaLMaster modificada con información del sistema
            const respuestaLMasterModificada = {
                ...documentoEstandarizado.respuestaLMaster,
                sistemaOrigen: sistemaOrigen,
                empresaSolicitante: empresaSolicitante,
                timestamp: new Date().toISOString()
            };
            
            // Logs detallados
            console.log(`ENVÍO ACTIVO - Enviando usuario a sistema`, 'info');
            console.log(`ENVÍO ACTIVO - URL destino: ${urlDestino}`, 'info');
            console.log(`ENVÍO ACTIVO - Sistema origen: ${sistemaOrigen}`, 'info');
            console.log(`ENVÍO ACTIVO - Empresa solicitante: ${empresaSolicitante}`, 'info');
            console.log(`ENVÍO ACTIVO - Abrir en nueva ventana: ${abrirNuevaVentana}`, 'info');
            console.log(`ENVÍO ACTIVO - Datos enviados: ${JSON.stringify(respuestaLMasterModificada).substring(0, 200)}...`, 'info');
            
            // Enviar por POST con formulario
            this.enviarPorURL(urlDestino, respuestaLMasterModificada, abrirNuevaVentana);
            
            this.showToast(`Usuario enviado al sistema`, 'success');
            console.log(`ENVÍO ACTIVO - Usuario enviado exitosamente`, 'success');
            
        } catch (error) {
            this.showToast('Error procesando datos de sesión', 'error');
            console.log(`Error: ${error.message}`, 'error');
        }
    }
    
    // Función de envío por POST (ESTÁNDAR) - usa endpoint /ingreso-derivado
    enviarPorURL(urlDestino, respuestaLMaster, abrirNuevaVentana = true) {
        console.log(`ENVÍO - Preparando datos POST para: ${urlDestino}`, 'info');

        // Normalizar: si apunta a ingreso-derivado.html ⇒ enviar al endpoint /ingreso-derivado
        let destinoNormalizado = urlDestino;
        try {
            const u = new URL(urlDestino, window.location.origin);
            if (/\/?ingreso-derivado\.html$/i.test(u.pathname)) {
                u.pathname = u.pathname.replace(/ingreso-derivado\.html$/i, 'ingreso-derivado');
            }
            destinoNormalizado = u.toString();
        } catch (e) {
            destinoNormalizado = urlDestino.replace(/ingreso-derivado\.html$/i, 'ingreso-derivado');
        }

        // Crear formulario temporal para envío POST
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = destinoNormalizado;
        form.style.display = 'none';
        
        if (abrirNuevaVentana) {
            form.target = '_blank';
        }
        
        // Crear campo oculto con los datos
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'respuestaLMaster';
        input.value = JSON.stringify(respuestaLMaster);
        
        form.appendChild(input);
        document.body.appendChild(form);
        
        // Enviar formulario
        form.submit();
        
        // Limpiar formulario temporal
        document.body.removeChild(form);
        
        this.showToast('Usuario enviado correctamente por POST', 'success');
        console.log('ENVÍO - Formulario POST enviado exitosamente (endpoint /ingreso-derivado si aplica)', 'success');

        // Cerrar sesión en LEDROITCHECK solo si NO se abre en nueva ventana
        try {
            if (!abrirNuevaVentana) {
                if (window.SessionManager) {
                    // Cerrar sesión sin redireccionar, porque la navegación ocurre a la misma ventana
                    window.SessionManager.logout('activeIngreso', false);
                } else {
                    // Fallback simple
                    try { sessionStorage.removeItem('ls_session'); } catch {}
                    try { sessionStorage.removeItem('ledroitAuth'); } catch {}
                }
            }
        } catch (e) { /* ignore */ }
    }
     
     // Función para editar un sistema
    editarSistema(sistemaId) {
        const sistema = this.sistemas.find(s => s.id === sistemaId);
        if (!sistema) {
            this.showToast('Sistema no encontrado', 'error');
            return;
        }
        
        this.mostrarModalEdicion(sistema);
    }
    
    // Función para mostrar modal de edición
    mostrarModalEdicion(sistema) {
        // Obtener empresas del usuario para la tabla
        const userEmpresas = this.getEmpresasFromSession();
        
        // Crear tabla de empresas igual que en agregar sistema
        const empresasTable = userEmpresas.map(empresa => {
            return `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 500;">${empresa.nombre}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                        <input type="checkbox" name="empresa_${empresa.nombre}_A1" value="A1" data-empresa="${empresa.nombre}" data-rol="A1">
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                        <input type="checkbox" name="empresa_${empresa.nombre}_A2" value="A2" data-empresa="${empresa.nombre}" data-rol="A2">
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                        <input type="checkbox" name="empresa_${empresa.nombre}_A3" value="A3" data-empresa="${empresa.nombre}" data-rol="A3">
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
                        <input type="checkbox" name="empresa_${empresa.nombre}_A4" value="A4" data-empresa="${empresa.nombre}" data-rol="A4">
                    </td>
                </tr>
            `;
        }).join('');
        
        const modalHTML = `
            <div class="modal-overlay" id="edit-modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Editar Sistema</h3>
                        <button class="modal-close" id="edit-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="edit-nombre">NOMBRE DEL SISTEMA RECEPTOR <span style="color: red;">*</span></label>
                            <input type="text" id="edit-nombre" placeholder="NOMBRE DEL SISTEMA RECEPTOR" 
                                   value="${sistema.nombre}" style="text-transform: uppercase;" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-url">URL del Sistema <span style="color: red;">*</span></label>
                            <input type="url" id="edit-url" placeholder="https://ejemplo.com" 
                                   value="${sistema.url}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-descripcion">Descripción</label>
                            <textarea id="edit-descripcion" placeholder="Descripción del sistema">${sistema.descripcion || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-sistema-origen">SISTEMA DE ORIGEN <span style="color: red;">*</span></label>
                            <input type="text" id="edit-sistema-origen" placeholder="Ej: MI_SISTEMA" 
                                   value="${sistema.sistemaOrigen || ''}" required>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                Nombre del sistema que enviará usuarios a este sistema
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="edit-empresa-solicitante">EMPRESA SOLICITANTE</label>
                            <input type="text" id="edit-empresa-solicitante" placeholder="Nombre de la empresa (opcional)" 
                                   value="${sistema.empresaSolicitante || ''}">
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                Empresa que solicita el registro del sistema (opcional)
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Permisos por Empresa y Rol <span style="color: red;">*</span></label>
                            <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                Selecciona al menos una empresa/rol. Los roles superiores incluyen automáticamente los inferiores.
                            </div>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                    <thead>
                                        <tr style="background: #f8f9fa;">
                                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Empresa</th>
                                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">A1</th>
                                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">A2</th>
                                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">A3</th>
                                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">A4</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${empresasTable}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; justify-content: space-between; margin: 0; cursor: pointer;">
                                <span>Abrir en nueva ventana</span>
                                <input type="checkbox" id="edit-abrir-nueva-ventana" style="margin: 0; width: 18px; height: 18px;">
                            </label>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                Si está activado, el sistema se abrirá en una nueva pestaña del navegador y no cerrará la sesión actual.
                                Si está desactivado, se abrirá en esta misma ventana y se cerrará la sesión de este sistema.
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" id="edit-btn-cancel">Cancelar</button>
                        <button class="btn-save" id="edit-btn-save">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('edit-modal-overlay');
        
        // Marcar los checkboxes según los permisos actuales del sistema
        if (sistema.permisos && sistema.permisos.length > 0) {
            sistema.permisos.forEach(permiso => {
                const checkbox = modal.querySelector(`input[data-empresa="${permiso.empresa}"][data-rol="${permiso.rol}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
        
        // Configurar checkbox "Abrir en nueva ventana"
        const abrirNuevaVentanaCheckbox = modal.querySelector('#edit-abrir-nueva-ventana');
        if (abrirNuevaVentanaCheckbox) {
            abrirNuevaVentanaCheckbox.checked = sistema.abrirNuevaVentana || false;
        }
        
        // Configurar jerarquía de roles para edición (igual que en agregar sistema)
        this.setupEditRoleHierarchy(modal);
        
        // Event listeners
        modal.querySelector('#edit-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#edit-btn-cancel').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        modal.querySelector('#edit-btn-save').addEventListener('click', () => {
            this.guardarCambiosSistema(sistema.id, modal);
        });
    }
    
    // Configurar jerarquía de roles para modal de edición
    setupEditRoleHierarchy(modal) {
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const empresa = e.target.dataset.empresa;
                const rol = e.target.dataset.rol;
                const isChecked = e.target.checked;
                
                if (isChecked) {
                    // Si se marca un rol, marcar todos los roles inferiores
                    this.marcarRolesInferiores(modal, empresa, rol);
                } else {
                    // Si se desmarca un rol, desmarcar todos los roles superiores
                    this.desmarcarRolesSuperiores(modal, empresa, rol);
                }
            });
        });
    }
    
    // Marcar roles inferiores en modal de edición (A1 > A2 > A3 > A4)
    marcarRolesInferiores(modal, empresa, rolSeleccionado) {
        const jerarquia = ['A1', 'A2', 'A3', 'A4'];
        const indiceSeleccionado = jerarquia.indexOf(rolSeleccionado);
        
        // Marcar el rol seleccionado y todos los inferiores
        for (let i = indiceSeleccionado; i < jerarquia.length; i++) {
            const checkbox = modal.querySelector(`input[data-empresa="${empresa}"][data-rol="${jerarquia[i]}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        }
    }
    
    // Desmarcar roles superiores en modal de edición
    desmarcarRolesSuperiores(modal, empresa, rolSeleccionado) {
        const jerarquia = ['A1', 'A2', 'A3', 'A4'];
        const indiceSeleccionado = jerarquia.indexOf(rolSeleccionado);
        
        // Desmarcar el rol seleccionado y todos los superiores
        for (let i = 0; i <= indiceSeleccionado; i++) {
            const checkbox = modal.querySelector(`input[data-empresa="${empresa}"][data-rol="${jerarquia[i]}"]`);
            if (checkbox) {
                checkbox.checked = false;
            }
        }
    }
    
    // Función para guardar cambios del sistema editado
    guardarCambiosSistema(sistemaId, modal) {
        const nombre = modal.querySelector('#edit-nombre').value.trim().toUpperCase();
        const url = modal.querySelector('#edit-url').value.trim();
        const descripcion = modal.querySelector('#edit-descripcion').value.trim();
        const sistemaOrigen = modal.querySelector('#edit-sistema-origen').value;
        const empresaSolicitante = modal.querySelector('#edit-empresa-solicitante').value;
        const abrirNuevaVentana = modal.querySelector('#edit-abrir-nueva-ventana').checked;
        
        // Validaciones
        if (!nombre) {
            this.showToast('El nombre del sistema es obligatorio', 'error');
            return;
        }
        
        if (!url) {
            this.showToast('La URL del sistema es obligatoria', 'error');
            return;
        }
        
        if (!sistemaOrigen) {
            this.showToast('El sistema de origen es obligatorio', 'error');
            return;
        }
        
        // Recopilar permisos seleccionados
        const permisosSeleccionados = [];
        const checkboxesSeleccionados = modal.querySelectorAll('input[type="checkbox"]:checked:not(#edit-abrir-nueva-ventana)');
        
        checkboxesSeleccionados.forEach(checkbox => {
            if (checkbox.dataset.empresa && checkbox.dataset.rol) {
                permisosSeleccionados.push({
                    empresa: checkbox.dataset.empresa,
                    rol: checkbox.dataset.rol
                });
            }
        });
        
        if (permisosSeleccionados.length === 0) {
            this.showToast('Debe seleccionar al menos un permiso', 'error');
            return;
        }
        
        // Crear objeto con los cambios
        const sistemaActualizado = {
            id: sistemaId,
            nombre: nombre,
            url: url,
            descripcion: descripcion,
            sistemaOrigen: sistemaOrigen,
            empresaSolicitante: empresaSolicitante,
            permisos: permisosSeleccionados,
            abrirNuevaVentana: abrirNuevaVentana,
            fechaModificacion: new Date().toISOString()
        };
        
        // Actualizar en Firestore o localStorage
        if (this.db) {
            this.db.collection('configIngActivos').doc(sistemaId).update(sistemaActualizado)
                .then(() => {
                    this.showToast(`Sistema "${nombre}" actualizado correctamente (Firestore)`, 'success');
                    this.actualizarSistemaLocal(sistemaActualizado);
                    modal.remove();
                    this.renderSistemas();
                })
                .catch((error) => {
                    console.error('Error al actualizar sistema:', error);
                    this.showToast('Error al actualizar el sistema', 'error');
                });
        } else {
            // Actualizar en localStorage
            this.actualizarSistemaEnLocalStorage(sistemaActualizado);
            this.showToast(`Sistema "${nombre}" actualizado (local)`, 'info');
            modal.remove();
            this.renderSistemas();
        }
    }
    
    // Actualizar sistema en el array local
    actualizarSistemaLocal(sistemaActualizado) {
        const index = this.sistemas.findIndex(s => s.id === sistemaActualizado.id);
        if (index !== -1) {
            this.sistemas[index] = { ...this.sistemas[index], ...sistemaActualizado };
        }
    }
    
    // Actualizar sistema en localStorage
    actualizarSistemaEnLocalStorage(sistemaActualizado) {
        const stored = localStorage.getItem('ingresosActivosSistemas');
        if (stored) {
            const sistemas = JSON.parse(stored);
            const index = sistemas.findIndex(s => s.id === sistemaActualizado.id);
            if (index !== -1) {
                sistemas[index] = { ...sistemas[index], ...sistemaActualizado };
                localStorage.setItem('ingresosActivosSistemas', JSON.stringify(sistemas));
            }
        }
        
        // Actualizar también en el array local
        this.actualizarSistemaLocal(sistemaActualizado);
    }
     
     // Función para eliminar un sistema
     eliminarSistema(sistemaId) {
         if (!confirm('¿Estás seguro de que deseas eliminar este sistema?')) {
             return;
         }
         
         const sistemaIndex = this.sistemas.findIndex(s => s.id === sistemaId);
         if (sistemaIndex === -1) {
             this.showToast('Sistema no encontrado', 'error');
             return;
         }
         
         const sistemaNombre = this.sistemas[sistemaIndex].nombre;
         
         // Eliminar de Firestore si está disponible
         if (this.db) {
             this.db.collection('configIngActivos').doc(sistemaId).delete()
                 .then(() => {
                     console.log('Sistema eliminado de Firestore');
                     this.sistemas.splice(sistemaIndex, 1);
                     this.renderSistemas();
                     this.showToast(`Sistema "${sistemaNombre}" eliminado`, 'success');
                 })
                 .catch((error) => {
                     console.error('Error eliminando de Firestore:', error);
                     // Fallback a localStorage
                     this.eliminarDeLocalStorage(sistemaId);
                     this.showToast(`Sistema "${sistemaNombre}" eliminado (local)`, 'info');
                 });
         } else {
             // Eliminar de localStorage
             this.eliminarDeLocalStorage(sistemaId);
             this.showToast(`Sistema "${sistemaNombre}" eliminado (local)`, 'info');
         }
     }
     
     // Función auxiliar para eliminar de localStorage
     eliminarDeLocalStorage(sistemaId) {
         const stored = localStorage.getItem('ingresosActivosSistemas');
         if (stored) {
             const sistemas = JSON.parse(stored);
             const filteredSistemas = sistemas.filter(s => s.id !== sistemaId);
             localStorage.setItem('ingresosActivosSistemas', JSON.stringify(filteredSistemas));
         }
         
         const sistemaIndex = this.sistemas.findIndex(s => s.id === sistemaId);
         if (sistemaIndex !== -1) {
             this.sistemas.splice(sistemaIndex, 1);
             this.renderSistemas();
         }
     }
 }

// Inicializar el widget cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const currentPage = window.location.pathname.split('/').pop() || 'menu.html';
        const allowedPages = ['menu.html'];
        
        if (allowedPages.includes(currentPage)) {
            new IngresosActivosWidget();
        }
    });
} else {
    const currentPage = window.location.pathname.split('/').pop() || 'menu.html';
    const allowedPages = ['menu.html'];
    
    if (allowedPages.includes(currentPage)) {
        new IngresosActivosWidget();
    }
}