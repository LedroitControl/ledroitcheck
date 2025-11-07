/**
 * GLOBAL HEADER SYSTEM - LEDROITSENDER
 * Sistema de header global modular y portable
 * 
 * INSTALACIÓN EN OTROS SISTEMAS:
 * 1. Copiar: global-header.js, global-header.css, global-header-template.html
 * 2. Incluir en HTML: <script src="./assets/global-header.js"></script>
 * 3. Agregar atributo: <html data-include-header="true">
 * 
 * CONFIGURACIÓN POR PÁGINA:
 * - data-include-header="true" = Header completo
 * - data-include-header="minimal" = Header mínimo (solo brand)
 * - data-include-header="brand-only" = Solo logo y nombre
 * - Sin atributo = Sin header
 */

class GlobalHeaderSystem {
    constructor() {
        this.config = {
            templatePath: './assets/global-header-template.html',
            cssPath: './assets/global-header.css',
            logoPath: './assets/logo-ledroitcheck.svg',
            appName: 'LedroitCheck'
        };
        
        this.session = null;
        this.empresaSeleccionada = null;
        this.headerElement = null;
        this.headerType = null;
        
        this.init();
    }

    async init() {
        // Verificar si la página debe incluir header
        const htmlElement = document.documentElement;
        const includeHeader = htmlElement.getAttribute('data-include-header');
        
        if (!includeHeader) {
            console.log('GlobalHeader: Página sin header configurado');
            return;
        }

        this.headerType = includeHeader;
        console.log(`GlobalHeader: Inicializando header tipo "${this.headerType}"`);

        // Cargar CSS del header
        await this.loadHeaderCSS();
        
        // Cargar template HTML
        await this.loadHeaderTemplate();
        
        // Obtener sesión si está disponible (ahora es asíncrono)
        await this.getSession();
        
        // Crear el header
        this.createHeader();
        
        // Configurar eventos globales
        this.setupGlobalEvents();
    }

    async loadHeaderCSS() {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (document.querySelector('link[href*="global-header.css"]')) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.config.cssPath + '?v=' + Date.now();
            link.onload = () => {
                console.log('GlobalHeader: CSS cargado');
                resolve();
            };
            link.onerror = () => {
                console.warn('GlobalHeader: Error cargando CSS, usando estilos inline');
                this.injectInlineCSS();
                resolve();
            };
            
            document.head.appendChild(link);
        });
    }

    async loadHeaderTemplate() {
        try {
            const response = await fetch(this.config.templatePath + '?v=' + Date.now());
            if (!response.ok) {
                throw new Error('Template no encontrado');
            }
            
            this.templateHTML = await response.text();
            console.log('GlobalHeader: Template HTML cargado');
        } catch (error) {
            console.warn('GlobalHeader: Error cargando template, usando template inline');
            this.templateHTML = this.getInlineTemplate();
        }
    }

    async getSession() {
        // 1) Intentar obtener sesión desde window.ledroitAuth (estructura usada en este proyecto)
        if (window.ledroitAuth) {
            const auth = window.ledroitAuth || {};
            const user = auth.user || {};
            this.session = {
                nombre: user.nombre || auth.nombre || null,
                iniciales: auth.iniciales || user.iniciales || null, // Solo "iniciales" según guía
                foto_url: user.foto_url || auth.foto_url || auth.avatar || null,
                empresas: user.empresas || auth.empresas || []
            };
        }
        // 2) Si no, intentar desde almacenamiento local "ls_session" (estructura de la guía)
        else if (sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session')) {
            try {
                const raw = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
                const ses = raw ? JSON.parse(raw) : null;
                if (ses) {
                    this.session = {
                        nombre: ses.nombre || null,
                        iniciales: ses.iniciales || null, // Solo "iniciales" según guía
                        foto_url: ses.foto_url || null,
                        empresas: Array.isArray(ses.empresas) ? ses.empresas : []
                    };
                }
            } catch (error) {
                console.warn('GlobalHeader: Error parseando sesión de ls_session');
            }
        }
        
        // Si tenemos sesión, intentar obtener datos actualizados desde Firebase
        if (this.session && this.session.iniciales) {
            await this.loadUserDataFromFirebase(this.session.iniciales);
        }
        
        if (this.session) {
            console.log('GlobalHeader: Sesión encontrada para', this.session.iniciales || 'usuario');
            console.log('GlobalHeader: Empresas disponibles:', this.session.empresas?.length || 0);
            this.loadEmpresaSeleccionadaFromStorage();
        } else {
            console.log('GlobalHeader: Sin sesión activa');
        }
    }

    async loadUserDataFromFirebase(iniciales) {
        try {
            // Esperar a que Firebase esté listo
            if (window.authReady) {
                await window.authReady;
            }
            
            if (!window.db) {
                console.warn('GlobalHeader: Firebase no disponible, manteniendo datos de sesión local');
                return;
            }

            console.log('GlobalHeader: Obteniendo datos actualizados desde Firebase para', iniciales);
            
            const docRef = window.db.collection('ultimosIngresosSatisfactorios').doc(iniciales);
            const doc = await docRef.get();
            
            if (doc.exists) {
                const documentoEstandarizado = doc.data();
                const respuestaLMaster = documentoEstandarizado.respuestaLMaster;
                
                if (respuestaLMaster && respuestaLMaster.success && respuestaLMaster.data) {
                    // Actualizar datos de la sesión con información de Firebase
                    this.session.user = respuestaLMaster.data;
                    this.session.empresas = respuestaLMaster.data.empresas || [];
                    
                    console.log('GlobalHeader: Datos actualizados desde Firebase:', this.session.empresas.length, 'empresas');
                } else {
                    console.warn('GlobalHeader: Respuesta de Firebase no válida');
                }
            } else {
                console.warn('GlobalHeader: No se encontró documento en Firebase para', iniciales);
            }
        } catch (error) {
            console.error('GlobalHeader: Error obteniendo datos de Firebase:', error);
        }
    }

    createHeader() {
        // Buscar o crear contenedor del header
        this.headerElement = document.querySelector('.global-header-container');
        
        if (!this.headerElement) {
            this.headerElement = document.createElement('div');
            this.headerElement.className = 'global-header-container';
            
            // Insertar al inicio del body
            if (document.body.firstChild) {
                document.body.insertBefore(this.headerElement, document.body.firstChild);
            } else {
                document.body.appendChild(this.headerElement);
            }
        }

        // Limpiar contenido previo
        this.headerElement.innerHTML = '';

        // Crear header según el tipo
        switch (this.headerType) {
            case 'minimal':
                this.createMinimalHeader();
                break;
            case 'brand-only':
                this.createBrandOnlyHeader();
                break;
            case 'true':
            case 'full':
            default:
                this.createFullHeader();
                break;
        }
    }

    createFullHeader() {
        const template = document.createElement('div');
        template.innerHTML = this.templateHTML;
        
        const header = template.querySelector('.global-header');
        if (!header) {
            console.error('GlobalHeader: Template inválido');
            return;
        }

        // Configurar brand section
        this.setupBrandSection(header);
        
        // Configurar user section si hay sesión
        if (this.session) {
            this.setupUserSection(header);
        } else {
            // Ocultar sección de usuario si no hay sesión
            const userSection = header.querySelector('.header-user-section');
            if (userSection) {
                userSection.style.display = 'none';
            }
        }

        this.headerElement.appendChild(header);

        // Renderizar/actualizar barra flotante de empresa seleccionada
        this.renderFloatingCompanyBar();
    }

    createBrandOnlyHeader() {
        const header = document.createElement('header');
        header.className = 'global-header global-header-brand-only';
        
        header.innerHTML = `
            <div class="header-brand-section">
                <img src="${this.config.logoPath}" alt="${this.config.appName}" class="brand-logo" />
                <div class="brand-info">
                    <span class="brand-name">${this.config.appName}</span>
                    <span class="brand-subtitle">Sistema de nómina</span>
                </div>
            </div>
        `;

        this.headerElement.appendChild(header);
    }

    setupBrandSection(header) {
        const brandLogo = header.querySelector('.brand-logo');
        const brandName = header.querySelector('.brand-name');
        
        if (brandLogo) {
            brandLogo.src = this.config.logoPath;
            brandLogo.alt = this.config.appName;
        }
        
        if (brandName) {
            brandName.textContent = this.config.appName;
        }
    }

    setupUserSection(header) {
        const userSection = header.querySelector('.header-user-section');
        if (!userSection) {
            console.warn('GlobalHeader: No se encontró .header-user-section');
            return;
        }

        const user = this.session.user || {};
        const iniciales = this.session.iniciales || 'NN'; // ✅ Usar "iniciales"
        const userName = this.session.nombre || user.nombre || `Usuario ${iniciales}`;
        const fotoUrl = this.session.foto_url || user.foto_url;

        console.log('GlobalHeader: Configurando sección de usuario para', userName);
        console.log('GlobalHeader: Datos de sesión:', {
            iniciales: this.session.iniciales, // ✅ Usar "iniciales"
            nombre: this.session.nombre,
            user: this.session.user,
            foto_url: this.session.foto_url,
            empresas: this.session.empresas?.length
        });

        // Configurar avatar
        const avatar = userSection.querySelector('.user-avatar');
        if (avatar) {
            this.setupUserAvatar(avatar, fotoUrl, iniciales, userName); // ✅ Usar "iniciales"
        }

        // Configurar información del usuario
        const userInfo = userSection.querySelector('.user-info');
        if (userInfo) {
            const nameElement = userInfo.querySelector('.user-name');
            const initialsElement = userInfo.querySelector('.user-initials');
            
            if (nameElement) nameElement.textContent = userName;
            if (initialsElement) initialsElement.textContent = `(${iniciales})`; // ✅ Usar "iniciales"
        }

        // La empresa seleccionada se muestra en una barra flotante persistente

        // Configurar botón de logout
        const logoutBtn = userSection.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    setupUserAvatar(avatar, fotoUrl, iniciales, userName) { // ✅ Usar "iniciales"
        avatar.title = userName;
        
        if (fotoUrl) {
            // Limpiar URL del avatar
            const cleanUrl = this.cleanAvatarUrl(fotoUrl);
            
            if (cleanUrl && cleanUrl.startsWith('http')) {
                const img = document.createElement('img');
                img.src = cleanUrl;
                img.alt = userName;
                img.className = 'avatar-image';
                
                img.onerror = () => {
                    avatar.innerHTML = '';
                    avatar.textContent = iniciales; // ✅ Usar "iniciales"
                    avatar.className += ' avatar-initials';
                };
                
                avatar.appendChild(img);
            } else {
                avatar.textContent = iniciales; // ✅ Usar "iniciales"
                avatar.className += ' avatar-initials';
            }
        } else {
            avatar.textContent = iniciales; // ✅ Usar "iniciales"
            avatar.className += ' avatar-initials';
        }
    }

    setupCompaniesSection(companiesSection) {
        const companiesList = companiesSection.querySelector('.companies-list');
        if (!companiesList) {
            console.warn('GlobalHeader: No se encontró .companies-list en companiesSection');
            return;
        }

        companiesList.innerHTML = '';
        
        const empresas = this.session.empresas || [];
        console.log('GlobalHeader: Configurando sección de empresas con', empresas.length, 'empresas');
        
        if (empresas.length === 0) {
            console.warn('GlobalHeader: No hay empresas para mostrar');
            return;
        }
        // Render como selector: todas las empresas clicables
        empresas.forEach(empresa => {
            const companyItem = this.createCompanyItem(empresa);
            companyItem.addEventListener('click', () => this.selectCompany(empresa));
            companiesList.appendChild(companyItem);
        });

        console.log('GlobalHeader: Selector de empresas preparado');

        // Abrir/cerrar el selector al hacer clic en el botón
        const changeBtn = this.headerElement.querySelector('.change-company-btn');
        if (changeBtn) {
            changeBtn.onclick = () => {
                const isVisible = companiesSection.style.display !== 'none';
                companiesSection.style.display = isVisible ? 'none' : 'flex';
            };
        }
    }

    createCompanyItem(empresa) {
        const item = document.createElement('div');
        
        // Estructura según la API de Ledroitmaster
        const nombre = empresa.nombre || 'Sin nombre';
        const empresaActiva = empresa.empresa_activa !== false;
        const usuarioActivo = empresa.usuario_activo !== false;
        const roles = empresa.rol || []; // En la API viene como 'rol', no 'roles'
        
        const statusEmpresa = empresaActiva ? 'activa' : 'inactiva';
        const statusUsuario = usuarioActivo ? 'activo' : 'inactivo';
        
        // Formatear roles
        let rolesText = 'Sin roles';
        if (Array.isArray(roles) && roles.length > 0) {
            rolesText = roles.join(', ');
        } else if (typeof roles === 'string' && roles.trim()) {
            rolesText = roles;
        }
        
        const inactiveClass = (!empresaActiva || !usuarioActivo) ? 'gh-company-inactive' : '';
        item.className = `gh-company-line ${inactiveClass}`;
        
        // Crear elementos internos para mejor estructura
        const companyName = document.createElement('span');
        companyName.className = 'gh-company-name';
        companyName.textContent = nombre;
        
        const companyStatus = document.createElement('span');
        companyStatus.className = `gh-company-status ${empresaActiva ? 'active' : 'inactive'}`;
        companyStatus.textContent = statusEmpresa;
        
        const companyRoles = document.createElement('span');
        companyRoles.className = 'gh-company-roles';
        companyRoles.textContent = rolesText;
        
        const userStatus = document.createElement('span');
        userStatus.className = `gh-user-status ${usuarioActivo ? 'active' : 'inactive'}`;
        userStatus.textContent = statusUsuario;
        
        // Ensamblar el texto completo
        item.appendChild(companyName);
        item.appendChild(document.createTextNode(' ('));
        item.appendChild(companyStatus);
        item.appendChild(document.createTextNode(') - '));
        item.appendChild(companyRoles);
        item.appendChild(document.createTextNode(' - '));
        item.appendChild(userStatus);

        // Deshabilitar selección si inactiva
        if (!empresaActiva || !usuarioActivo) {
            item.style.opacity = '0.6';
            item.style.cursor = 'not-allowed';
        }

        return item;
    }

    toggleCompanies(button) {
        const hiddenCompanies = this.headerElement.querySelector('.gh-hidden-companies');
        const companiesSection = this.headerElement.querySelector('.header-companies-section');
        
        if (!hiddenCompanies) return;
        
        const isExpanded = hiddenCompanies.style.display !== 'none';
        
        if (isExpanded) {
            hiddenCompanies.style.display = 'none';
            const hiddenCount = hiddenCompanies.children.length;
            button.textContent = `Ver ${hiddenCount} más`;
            if (companiesSection) companiesSection.classList.remove('gh-expanded');
        } else {
            hiddenCompanies.style.display = 'block';
            button.textContent = 'Ver menos';
            if (companiesSection) companiesSection.classList.add('gh-expanded');
        }
    }

    cleanAvatarUrl(fotoUrl) {
        if (!fotoUrl) return null;
        
        return fotoUrl.toString()
            .trim()
            .replace(/^[\s`'\"]+/g, '')
            .replace(/[\s`'\"]+$/g, '')
            .replace(/`/g, '')
            .replace(/'/g, '')
            .replace(/"/g, '')
            .replace(/\s+/g, '')
            .trim();
    }

    handleLogout() {
        if (!confirm('¿Está seguro que desea cerrar sesión?')) return;

        try {
            // 1) Cerrar sesión en Firebase si está disponible
            const firebaseAuth = (window.firebase && window.firebase.auth) ? window.firebase.auth() : null;
            const auth = window.auth || null;
            if (firebaseAuth && typeof firebaseAuth.signOut === 'function') {
                firebaseAuth.signOut().catch(() => {});
            }
            if (auth && typeof auth.signOut === 'function') {
                try { auth.signOut(); } catch (e) {}
            }

            // 2) Intentar método de logout propio si existe
            if (window.ledroitAuth && typeof window.ledroitAuth.logout === 'function') {
                try { window.ledroitAuth.logout(); } catch (e) {}
            }

            // 3) Limpiar todas las claves de sesión comunes
            try { sessionStorage.removeItem('ls_session'); } catch {}
            try { localStorage.removeItem('ls_session'); } catch {}
            try { sessionStorage.removeItem('ledroitAuth'); } catch {}
            try { localStorage.removeItem('ledroitAuth'); } catch {}

            // 4) Limpiar variable global
            try { window.ledroitAuth = null; } catch {}

            // 5) Notificar y redirigir a login
            window.dispatchEvent(new CustomEvent('sessionChanged', { detail: null }));
            window.location.replace('login.html');
        } catch (error) {
            console.warn('GlobalHeader: Error durante el cierre de sesión', error);
            window.location.replace('login.html');
        }
    }

    setupGlobalEvents() {
        // Evento para refrescar el header
        window.addEventListener('globalHeaderRefresh', async () => {
            await this.getSession();
            this.createHeader();
        });

        // Evento cuando cambia la sesión
        window.addEventListener('sessionChanged', async () => {
            await this.getSession();
            this.createHeader();
        });

        // Cambio de empresa seleccionada
        window.addEventListener('empresaSeleccionadaChanged', async (ev) => {
            console.log('GlobalHeader: empresaSeleccionadaChanged', ev.detail);
            await this.getSession();
            this.createHeader();
        });
    }

    // Método público para refrescar el header
    async refresh() {
        await this.getSession();
        this.createHeader();
    }

    // Template HTML inline como fallback
    getInlineTemplate() {
        return `
            <header class="global-header">
                <div class="header-brand-section">
                    <img src="" alt="" class="brand-logo" />
                    <span class="brand-name"></span>
                </div>
                <div class="header-user-section">
                    <div class="user-avatar"></div>
                    <div class="user-info">
                        <div class="user-name"></div>
                        <div class="user-initials"></div>
                    </div>
                    <button class="logout-btn">Cerrar Sesión</button>
                </div>
            </header>
        `;
    }

    // CSS inline como fallback
    injectInlineCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .global-header-container {
                position: sticky;
                top: 0;
                z-index: 1000;
            }
            .global-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 24px;
                background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9));
                border-bottom: 1px solid rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
            }
            .header-brand-section {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .brand-logo {
                width: 40px;
                height: 40px;
            }
            .brand-name {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
            }
            .header-user-section {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #3b82f6;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
            }
            .avatar-image {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
            }
            .logout-btn {
                padding: 6px 12px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Funciones globales para compatibilidad
window.GlobalHeaderSystem = GlobalHeaderSystem;

window.refreshGlobalHeader = function() {
    if (window.globalHeaderInstance) {
        window.globalHeaderInstance.refresh();
    }
};

window.dispatchHeaderRefresh = function() {
    window.dispatchEvent(new CustomEvent('globalHeaderRefresh'));
};

// Utilidades para empresa seleccionada
GlobalHeaderSystem.prototype.loadEmpresaSeleccionadaFromStorage = function() {
    try {
        const raw = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
        const ses = raw ? JSON.parse(raw) : null;
        this.empresaSeleccionada = ses && ses.empresaSeleccionada ? ses.empresaSeleccionada : null;
    } catch {}
};

GlobalHeaderSystem.prototype.renderFloatingCompanyBar = function() {
    // Actualizar estado local desde storage
    this.loadEmpresaSeleccionadaFromStorage();

    const barId = 'company-floating-bar';
    let bar = document.getElementById(barId);

    if (!this.empresaSeleccionada || !this.empresaSeleccionada.nombre) {
        // No hay empresa seleccionada: remover barra si existe
        if (bar) { try { bar.remove(); } catch {} }
        return;
    }

    // Construir contenido
    const nombre = this.empresaSeleccionada.nombre || '—';
    let rolTexto = '';
    const rol = this.empresaSeleccionada.rol;
    if (Array.isArray(rol)) rolTexto = rol.join(', ');
    else if (typeof rol === 'string') rolTexto = rol;

    const inner = `
        <span class="cfb-label">Empresa:</span>
        <span class="cfb-name">${nombre}</span>
        ${rolTexto ? `<span class="cfb-role">rol: ${rolTexto}</span>` : ''}
        <button class="cfb-change" type="button">Cambiar</button>
    `;

    if (!bar) {
        bar = document.createElement('div');
        bar.id = barId;
        bar.className = 'company-floating-bar';
        bar.innerHTML = inner;
        // Insertar al inicio del body (después del header container)
        try {
            if (this.headerElement && this.headerElement.parentNode) {
                this.headerElement.parentNode.insertBefore(bar, this.headerElement.nextSibling);
            } else {
                document.body.insertBefore(bar, document.body.firstChild);
            }
        } catch {
            document.body.appendChild(bar);
        }
    } else {
        bar.innerHTML = inner;
    }

    // Hook del botón Cambiar
    const btn = bar.querySelector('.cfb-change');
    if (btn) {
        btn.onclick = () => this.handleChangeCompany();
    }
};

GlobalHeaderSystem.prototype.handleChangeCompany = function() {
    console.log('GlobalHeader: Botón "Cambiar" presionado. Reiniciando selección de empresa...');
    try {
        const raw = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
        const ses = raw ? JSON.parse(raw) : null;
        if (ses) {
            delete ses.empresaSeleccionada;
            sessionStorage.setItem('ls_session', JSON.stringify(ses));
        }
    } catch (e) {
        console.warn('GlobalHeader: No se pudo limpiar empresaSeleccionada del storage', e);
    }

    // Notificar cambio
    try { window.dispatchEvent(new CustomEvent('empresaSeleccionadaChanged', { detail: null })); } catch {}

    // Feedback opcional
    try { if (typeof window.showToast === 'function') window.showToast('Seleccione una empresa en BIENVENIDA'); } catch {}

    // Redirigir a menú para reiniciar flujo BIENVENIDA
    try { window.location.href = 'menu.html'; } catch {}
};

GlobalHeaderSystem.prototype.selectCompany = function(empresa) {
    if (!empresa || empresa.empresa_activa === false || empresa.usuario_activo === false) return;
    const selected = {
        nombre: empresa.nombre || '—',
        rol: empresa.rol || []
    };
    try {
        const raw = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
        const ses = raw ? JSON.parse(raw) : null;
        if (ses) {
            ses.empresaSeleccionada = selected;
            sessionStorage.setItem('ls_session', JSON.stringify(ses));
            // Notificar cambio
            window.dispatchEvent(new CustomEvent('empresaSeleccionadaChanged', { detail: selected }));
        }
    } catch {}

    // Cerrar selector si abierto
    const companiesSection = this.headerElement.querySelector('.header-companies-section');
    if (companiesSection) companiesSection.style.display = 'none';

    // Redirigir a menú para reiniciar el flujo BIENVENIDA
    try { window.location.href = 'menu.html'; } catch {}
};

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que otros scripts estén cargados
    setTimeout(() => {
        window.globalHeaderInstance = new GlobalHeaderSystem();
    }, 100);
});

// Inicialización inmediata si el DOM ya está listo
if (document.readyState === 'loading') {
    // DOM aún cargando, usar DOMContentLoaded
} else {
    // DOM ya está listo
    setTimeout(() => {
        if (!window.globalHeaderInstance) {
            window.globalHeaderInstance = new GlobalHeaderSystem();
        }
    }, 100);
}