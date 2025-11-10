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

        // Aplicar color de barra según empresa seleccionada (dinámico por nombre)
        this.applyHeaderCompanyColor(header);

        // Renderizar estado central de jornada
        this.renderCenterStatus(header);
        // Suscripción en tiempo real a cambios de jornada
        this.setupRealtimeJornadaWatcher();

        // Renderizar empresa seleccionada dentro del header
        this.renderSelectedCompany(header);
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

        // Renderizar/actualizar barra flotante de empresa seleccionada
        this.renderFloatingCompanyBar();

        // Renderizar estado central de jornada
        this.renderCenterStatus(header);
        // Suscripción en tiempo real a cambios de jornada
        this.setupRealtimeJornadaWatcher();
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

    // Paleta de colores determinística basada en nombre de empresa (variedad mejorada)
    getCompanyPalette(nombre) {
        const name = String(nombre || '').trim();
        let hash = 2166136261; // FNV-like seed
        for (let i = 0; i < name.length; i++) {
            hash ^= name.charCodeAt(i);
            hash = (hash * 16777619) >>> 0;
        }
        // Mezcla adicional para distribuir mejor los tonos
        let mixed = hash ^ (hash >>> 16);
        mixed = (mixed * 0x45d9f3b) >>> 0;
        mixed ^= (mixed >>> 13);
        // Hue pseudoaleatorio en [0,360)
        let hue = Math.floor(((Math.sin(mixed) * 10000) % 1 + 1) % 1 * 360);
        // Evitar concentración en rangos verdosos (90-150)
        if (hue >= 90 && hue <= 150) {
            hue = (hue + (mixed % 2 ? 60 : 100)) % 360;
        }
        // Saturación y ligereza con mayor diversidad
        const sat = 60 + (mixed % 36); // 60-96
        const baseLight = 38 + ((mixed >>> 8) % 12); // 38-50
        const primary = `hsl(${hue} ${sat}% ${baseLight}%)`;
        const primaryDark = `hsl(${hue} ${sat}% ${Math.max(20, baseLight-16)}%)`;
        const primaryLight = `hsl(${hue} ${sat}% ${Math.min(64, baseLight+18)}%)`;
        const surfaceLight = 88 - (mixed % 8); // 80-88
        const surfaceSat = Math.max(25, sat - 30);
        const surface = `hsl(${hue} ${surfaceSat}% ${surfaceLight}%)`;
        const border = `hsl(${hue} ${Math.min(95, sat)}% ${Math.min(58, baseLight+18)}%)`;
        const text = '#ffffff';
        return { primary, primaryDark, primaryLight, surface, border, text, hue };
    }

    applyHeaderCompanyColor(header) {
        try {
            this.loadEmpresaSeleccionadaFromStorage();
            const sel = this.empresaSeleccionada;
            if (!sel || !sel.nombre) {
                // Fondo negro sólido cuando NO hay empresa seleccionada
                header.style.background = '#000000';
                header.style.borderBottomColor = 'rgba(255,255,255,0.15)';
                const brandName = header.querySelector('.brand-name');
                if (brandName) brandName.style.color = '#ffffff';
                const brandSubtitle = header.querySelector('.brand-subtitle');
                if (brandSubtitle) brandSubtitle.style.color = 'rgba(255,255,255,0.8)';
                return;
            }
            const palette = this.getCompanyPalette(sel.nombre);
            // Fondo del header fuerte
            header.style.background = `linear-gradient(180deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`;
            header.style.borderBottomColor = palette.border;
            // Texto del brand en blanco para legibilidad
            const brandName = header.querySelector('.brand-name');
            if (brandName) brandName.style.color = palette.text;
            const brandSubtitle = header.querySelector('.brand-subtitle');
            if (brandSubtitle) brandSubtitle.style.color = 'rgba(255,255,255,0.8)';
            // Tarjeta de empresa seleccionada igual al header
            const selCard = header.querySelector('#headerSelectedCompany');
            if (selCard) {
                selCard.style.background = palette.primary;
                selCard.style.borderColor = palette.border;
                selCard.style.color = palette.text;
                const roleEl = selCard.querySelector('.selected-role');
                if (roleEl) {
                    roleEl.style.background = 'rgba(255,255,255,0.18)';
                    roleEl.style.color = '#ffffff';
                    roleEl.style.border = '1px solid rgba(255,255,255,0.35)';
                }
                const changeBtn = selCard.querySelector('.change-company-btn');
                if (changeBtn) {
                    changeBtn.style.background = 'rgba(255,255,255,0.20)';
                    changeBtn.style.color = '#ffffff';
                    changeBtn.style.border = '1px solid rgba(255,255,255,0.35)';
                }
                const label = selCard.querySelector('.selected-label');
                if (label) label.style.color = 'rgba(255,255,255,0.85)';
                const nameEl = selCard.querySelector('.selected-name');
                if (nameEl) nameEl.style.color = '#ffffff';
            }
        } catch {}
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

        // Configurar avatar (dos ubicaciones: sección usuario y bajo la marca)
        const avatar = userSection.querySelector('.user-avatar');
        if (avatar) {
            this.setupUserAvatar(avatar, fotoUrl, iniciales, userName); // ✅ Usar "iniciales"
        }
        const brandAvatar = header.querySelector('.brand-avatar');
        if (brandAvatar) {
            this.setupUserAvatar(brandAvatar, fotoUrl, iniciales, userName);
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
        // (ahora integrada en el header)

        // Render de empresa seleccionada dentro del header
        this.renderSelectedCompany(header);

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

        // Botón cambiar: abrir flujo BIENVENIDA en lugar de desplegar lista inline
        const changeBtn = this.headerElement.querySelector('.change-company-btn');
        if (changeBtn) {
            changeBtn.onclick = () => this.handleChangeCompany();
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

        // Cambios de jornada (open/close) notificados por Firebase-config
        window.addEventListener('jornadaChanged', async (ev) => {
            try {
                // Re-render rápido sin reconstruir todo el header
                await this.renderCenterStatus(this.headerElement.querySelector('.global-header'));
            } catch (e) {
                // Si algo falla, reconstruir
                await this.getSession();
                this.createHeader();
            }
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
    // MODO LEGACY: mantenido para compatibilidad pero ya no se usa
    // La empresa seleccionada ahora se muestra dentro del header.
    // Si desea reactivar la barra flotante, quite la llamada a
    // renderSelectedCompany y vuelva a invocar este método desde createHeader.
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

    const empresasActivas = (this.session?.empresas || []).filter(e => e && e.empresa_activa !== false && e.usuario_activo !== false);
    const showChange = empresasActivas.length > 1;
    const inner = `
        <span class="cfb-label">Empresa:</span>
        <span class="cfb-name">${nombre}</span>
        ${rolTexto ? `<span class="cfb-role">rol: ${rolTexto}</span>` : ''}
        ${showChange ? `<button class="cfb-change" type="button">Cambiar</button>` : ''}
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

GlobalHeaderSystem.prototype.handleChangeCompany = async function() {
    console.log('GlobalHeader: Botón "Cambiar" presionado. Abriendo BIENVENIDA…');
    try {
        const raw = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
        const ses = raw ? JSON.parse(raw) : null;
        if (!ses) { try { window.location.href = 'menu.html?mode=selector'; } catch {} return; }
        // Empresas activas
        const activas = (ses.empresas || []).filter(e => e && e.empresa_activa !== false && e.usuario_activo !== false);

        // Crear o reutilizar el backdrop de BIENVENIDA
        if (typeof window.crearBackdrop === 'function' && typeof window.renderBienvenida === 'function') {
            const backdrop = window._welcomeBackdrop || window.crearBackdrop();
            window._welcomeBackdrop = backdrop;
            // Forzar modo selector para evitar que el refresco en background cambie a "jornada abierta"
            try { backdrop.dataset.forceSelector = '1'; } catch {}
            // Limpiar selección previa si hay varias
            if (activas.length > 1) {
                try { ses.empresaSeleccionada = null; sessionStorage.setItem('ls_session', JSON.stringify(ses)); } catch {}
                window.renderBienvenida(backdrop, ses, { modo:'selector' });
                // Cargar última jornada para mostrar en el selector
                try {
                    if (window.firestoreManager && typeof window.firestoreManager.getUltimaJornada === 'function'){
                        const ultima = await window.firestoreManager.getUltimaJornada(ses.iniciales);
                        if (ultima && (backdrop.dataset.mode === 'selector' || backdrop.dataset.forceSelector === '1')) {
                            window.renderBienvenida(backdrop, ses, { modo:'selector', ultima });
                        }
                    }
                } catch {}
            } else {
                const unica = activas[0];
                try { ses.empresaSeleccionada = { nombre: unica?.nombre || '—', rol: unica?.rol || [] }; sessionStorage.setItem('ls_session', JSON.stringify(ses)); } catch {}
                // Si solo hay una empresa activa, no forzamos el selector
                try { delete backdrop.dataset.forceSelector; } catch {}
                window.renderBienvenida(backdrop, ses, { modo:'cerrada' });
                // Mostrar última jornada
                try {
                    if (window.firestoreManager && typeof window.firestoreManager.getUltimaJornada === 'function'){
                        const ultima = await window.firestoreManager.getUltimaJornada(ses.iniciales);
                        if (ultima && backdrop.dataset.mode === 'cerrada') {
                            window.renderBienvenida(backdrop, ses, { modo:'cerrada', ultima });
                        }
                    }
                } catch {}
            }
            try { window.showToast && window.showToast('Seleccione empresa o abra/cierre su jornada según corresponda', 'info'); } catch {}
        } else {
            // Fallback si BIENVENIDA no está disponible
            try { window.location.href = 'menu.html?mode=selector'; } catch {}
        }
    } catch (e) {
        console.warn('GlobalHeader: Error al manejar Cambio de Empresa', e);
        try { window.location.href = 'menu.html?mode=selector'; } catch {}
    }
};

// Render del estado central de jornada en el header
GlobalHeaderSystem.prototype.renderCenterStatus = async function(header) {
    try {
        const cont = header.querySelector('.header-center-status');
        if (!cont) return;

        // Limpiar timer previo
        if (this._centerTimerId) { try { clearInterval(this._centerTimerId); } catch {} this._centerTimerId = null; }

        if (!this.session || !this.session.iniciales) {
            cont.innerHTML = '';
            return;
        }

        const fm = window.firestoreManager;
        let openInfo = null;
        if (fm && typeof fm.getJornadaAbierta === 'function') {
            try { openInfo = await fm.getJornadaAbierta(this.session.iniciales); } catch {}
        }

        if (openInfo && openInfo.empresaNombre) {
            const empresa = openInfo.empresaNombre;
            const ts = openInfo.horaEntrada;
            let inicioMs = Date.now();
            if (ts && typeof ts.toDate === 'function') { inicioMs = ts.toDate().getTime(); }

            const fmt = (ms) => {
                const s = Math.floor(ms/1000);
                const hh = String(Math.floor(s/3600)).padStart(2,'0');
                const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
                const ss = String(s%60).padStart(2,'0');
                return `${hh}:${mm}:${ss}`;
            };

            // Paleta por nombre de empresa abierta
            const pal = this.getCompanyPalette(empresa);
            cont.innerHTML = `
                <div class="jornada-card" style="background:${pal.surface}; border-color:${pal.border}">
                  <div class="jornada-row">
                    <span class="status-dot"></span>
                    <span class="jornada-label">Jornada abierta</span>
                  </div>
                  <div class="jornada-empresa">${empresa}</div>
                  <div class="jornada-timer">00:00:00</div>
                  <button class="close-shift-btn" type="button">Cerrar jornada</button>
                </div>
            `;
            const timerEl = cont.querySelector('.jornada-timer');
            const tick = () => { timerEl.textContent = fmt(Date.now() - inicioMs); };
            tick();
            this._centerTimerId = setInterval(tick, 1000);

            // Hook botón cerrar jornada: delegar a la función global unificada
            const closeBtn = cont.querySelector('.close-shift-btn');
            if (closeBtn) {
                closeBtn.onclick = async () => {
                    if (typeof window.handleCloseJornada === 'function') {
                        await window.handleCloseJornada({ confirm: true });
                    } else {
                        // Fallback: mantener comportamiento previo
                        const ok = await this.confirmModal({
                            title: 'Cerrar jornada',
                            content: '¿Deseas cerrar tu jornada ahora?',
                            okText: 'Sí, cerrar',
                            cancelText: 'Cancelar'
                        });
                        if (!ok) return;
                        try {
                            const res = await window.closeJornada();
                            if (!res?.success) {
                                try { window.showToast && window.showToast('No se pudo cerrar la jornada', 'error'); } catch {}
                            } else {
                                try { window.showToast && window.showToast('Jornada cerrada', 'success'); } catch {}
                            }
                        } catch (e) { console.warn('GlobalHeader: Error cerrando jornada', e); }
                    }
                };
            }
        } else {
            cont.innerHTML = `
                <div class="jornada-row">
                  <span class="status-dot inactive"></span>
                  <span class="jornada-label">Jornada cerrada</span>
                </div>
            `;
        }
    } catch (e) {
        console.warn('GlobalHeader: No se pudo renderizar estado de jornada en header', e);
    }
};

// Suscripción en tiempo real a jornadas_open para el usuario actual
GlobalHeaderSystem.prototype.setupRealtimeJornadaWatcher = function() {
    try {
        // Limpiar suscripción previa
        if (this._jornadaUnsub) { try { this._jornadaUnsub(); } catch {} this._jornadaUnsub = null; }
        if (!window.db || !this.session || !this.session.iniciales) return;
        const userKey = String(this.session.iniciales).replace(/[a-zA-Z]/g, (l) => l.toUpperCase());
        const docRef = window.db.collection('jornadas_open').doc(userKey);
        this._jornadaUnsub = docRef.onSnapshot(async (snap) => {
            try {
                const header = this.headerElement.querySelector('.global-header');
                if (!header) return;
                const cont = header.querySelector('.header-center-status');
                if (!cont) return;
                // Limpiar timer previo
                if (this._centerTimerId) { try { clearInterval(this._centerTimerId); } catch {} this._centerTimerId = null; }
                if (snap.exists) {
                    const data = snap.data();
                    const empresa = data?.empresaNombre || '—';
                    const ts = data?.horaEntrada;
                    let inicioMs = Date.now();
                    if (ts && typeof ts.toDate === 'function') { inicioMs = ts.toDate().getTime(); }
                    const fmt = (ms) => {
                        const s = Math.floor(ms/1000);
                        const hh = String(Math.floor(s/3600)).padStart(2,'0');
                        const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
                        const ss = String(s%60).padStart(2,'0');
                        return `${hh}:${mm}:${ss}`;
                    };
                    const pal = this.getCompanyPalette(empresa);
                    cont.innerHTML = `
                        <div class="jornada-card" style="background:${pal.surface}; border-color:${pal.border}">
                          <div class="jornada-row">
                            <span class="status-dot"></span>
                            <span class="jornada-label">Jornada abierta</span>
                          </div>
                          <div class="jornada-empresa">${empresa}</div>
                          <div class="jornada-timer">00:00:00</div>
                          <button class="close-shift-btn" type="button">Cerrar jornada</button>
                        </div>
                    `;
                    const timerEl = cont.querySelector('.jornada-timer');
                    const tick = () => { timerEl.textContent = fmt(Date.now() - inicioMs); };
                    tick();
                    this._centerTimerId = setInterval(tick, 1000);

                    const closeBtn = cont.querySelector('.close-shift-btn');
                    if (closeBtn) {
                        closeBtn.onclick = async () => {
                            if (typeof window.handleCloseJornada === 'function') {
                                await window.handleCloseJornada({ confirm: true });
                            } else {
                                const ok = await this.confirmModal({
                                    title: 'Cerrar jornada',
                                    content: '¿Deseas cerrar tu jornada ahora?',
                                    okText: 'Sí, cerrar',
                                    cancelText: 'Cancelar'
                                });
                                if (!ok) return;
                                try {
                                    const res = await window.closeJornada();
                                    if (!res?.success) {
                                        try { window.showToast && window.showToast('No se pudo cerrar la jornada', 'error'); } catch {}
                                    } else {
                                        try { window.showToast && window.showToast('Jornada cerrada', 'success'); } catch {}
                                    }
                                } catch (e) { console.warn('GlobalHeader: Error cerrando jornada', e); }
                            }
                        };
                    }
                } else {
                    cont.innerHTML = `
                        <div class="jornada-row">
                          <span class="status-dot inactive"></span>
                          <span class="jornada-label">Jornada cerrada</span>
                        </div>
                    `;
                }
            } catch (e) { console.warn('GlobalHeader: onSnapshot error', e); }
        });
    } catch (e) {
        console.warn('GlobalHeader: No se pudo suscribir a jornadas_open', e);
    }
};

// Modal de confirmación simple (sin dependencias)
GlobalHeaderSystem.prototype.confirmModal = function({ title = 'Confirmación', content = '', okText = 'Aceptar', cancelText = 'Cancelar' } = {}) {
    return new Promise((resolve) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'gh-modal-backdrop';
        backdrop.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true">
              <h3>${title}</h3>
              <div class="modal-body">${content}</div>
              <div class="modal-footer">
                <button class="btn secondary" id="btnCancel">${cancelText}</button>
                <button class="btn" id="btnOk" autofocus>${okText}</button>
              </div>
            </div>
        `;
        document.body.appendChild(backdrop);
        setTimeout(() => {
            backdrop.classList.add('show');
            // Enfocar el botón principal para que ENTER confirme
            const okBtn = backdrop.querySelector('#btnOk');
            if (okBtn) { try { okBtn.focus(); } catch {} }
        }, 20);
        const dispose = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 140); };
        backdrop.querySelector('#btnCancel').addEventListener('click', () => { dispose(); resolve(false); });
        backdrop.querySelector('#btnOk').addEventListener('click', () => { dispose(); resolve(true); });
        // Permitir confirmar con Enter desde cualquier parte del modal
        backdrop.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                ev.preventDefault();
                const okBtn = backdrop.querySelector('#btnOk');
                if (okBtn) okBtn.click();
            }
        });
    });
};

// Función global unificada para cerrar jornada utilizada por header y modal
if (typeof window.handleCloseJornada !== 'function') {
    window.handleCloseJornada = async function({ confirm = true } = {}) {
        try {
            // Confirmación previa
            if (confirm) {
                let ok = true;
                try {
                    if (window.globalHeaderInstance && typeof window.globalHeaderInstance.confirmModal === 'function') {
                        ok = await window.globalHeaderInstance.confirmModal({
                            title: 'Cerrar jornada',
                            content: '¿Deseas cerrar tu jornada ahora?',
                            okText: 'Sí, cerrar',
                            cancelText: 'Cancelar'
                        });
                    } else {
                        ok = window.confirm('¿Deseas cerrar tu jornada ahora?');
                    }
                } catch { ok = window.confirm('¿Deseas cerrar tu jornada ahora?'); }
                if (!ok) return false;
            }

            // Loader ligero
            const loader = (() => {
                const bd = document.createElement('div');
                bd.className = 'gh-modal-backdrop';
                bd.innerHTML = `
                  <div class="modal" role="dialog" aria-modal="true" style="max-width:420px">
                    <h3>Cerrando jornada…</h3>
                    <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
                      <div class="spinner" style="width:24px;height:24px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 0.9s linear infinite"></div>
                      <div class="muted">Por favor espera…</div>
                    </div>
                  </div>`;
                document.body.appendChild(bd);
                setTimeout(() => bd.classList.add('show'), 20);
                return { close(){ bd.classList.remove('show'); setTimeout(()=>bd.remove(),140); } };
            })();

            const res = await window.closeJornada();
            loader.close();
            if (!res?.success) {
                try { window.showToast && window.showToast('No se pudo cerrar la jornada', 'error'); } catch {}
                return false;
            }
            try { window.showToast && window.showToast('Jornada cerrada', 'success'); } catch {}

            // Notificar cambio para que BIENVENIDA se actualice
            try { window.dispatchEvent(new CustomEvent('jornadaChanged', { detail: { status: 'closed' } })); } catch {}

            // Actualizar flujo BIENVENIDA según cantidad de empresas activas y mostrar "última jornada"
            try {
                const raw = sessionStorage.getItem('ls_session') || localStorage.getItem('ls_session');
                const ses = raw ? JSON.parse(raw) : null;
                const activas = (ses?.empresas || []).filter(e => e && e.empresa_activa !== false && e.usuario_activo !== false);
                if (activas.length > 1) {
                    // Limpiar empresa seleccionada para forzar selector
                    try { ses.empresaSeleccionada = null; sessionStorage.setItem('ls_session', JSON.stringify(ses)); } catch {}
                    if (typeof window.crearBackdrop === 'function' && typeof window.renderBienvenida === 'function') {
                        const backdrop = window._welcomeBackdrop || window.crearBackdrop();
                        window._welcomeBackdrop = backdrop;
                        window.renderBienvenida(backdrop, ses, { modo:'selector' });
                        // Cargar última jornada
                        try {
                            if (window.firestoreManager && typeof window.firestoreManager.getUltimaJornada === 'function'){
                                const ultima = await window.firestoreManager.getUltimaJornada(ses.iniciales);
                                if (ultima && backdrop.dataset.mode === 'selector') {
                                    window.renderBienvenida(backdrop, ses, { modo:'selector', ultima });
                                }
                            }
                        } catch {}
                    } else {
                        // Fallback: redirigir a menú con selector
                        const url = new URL(window.location.href);
                        url.pathname = (url.pathname.endsWith('menu.html') ? url.pathname : '/menu.html');
                        url.searchParams.set('mode','selector');
                        window.location.href = url.toString();
                    }
                } else {
                    const unica = activas[0];
                    if (unica && ses) {
                        try { ses.empresaSeleccionada = { nombre: unica.nombre || '—', rol: unica.rol || [] }; sessionStorage.setItem('ls_session', JSON.stringify(ses)); } catch {}
                    }
                    if (typeof window.crearBackdrop === 'function' && typeof window.renderBienvenida === 'function') {
                        const backdrop = window._welcomeBackdrop || window.crearBackdrop();
                        window._welcomeBackdrop = backdrop;
                        window.renderBienvenida(backdrop, ses, { modo:'cerrada' });
                        try {
                            if (window.firestoreManager && typeof window.firestoreManager.getUltimaJornada === 'function'){
                                const ultima = await window.firestoreManager.getUltimaJornada(ses.iniciales);
                                if (ultima && backdrop.dataset.mode === 'cerrada') {
                                    window.renderBienvenida(backdrop, ses, { modo:'cerrada', ultima });
                                }
                            }
                        } catch {}
                    }
                }
            } catch {}

            return true;
        } catch (e) {
            console.warn('handleCloseJornada: error', e);
            try { window.showToast && window.showToast('Error al cerrar jornada', 'error'); } catch {}
            return false;
        }
    };
}

// Render de la empresa seleccionada dentro del header (parte del header)
    GlobalHeaderSystem.prototype.renderSelectedCompany = function(header) {
        try {
            this.loadEmpresaSeleccionadaFromStorage();
            const cont = header.querySelector('#headerSelectedCompany');
            if (!cont) return;

        const sel = this.empresaSeleccionada;
        if (!sel || !sel.nombre) {
            cont.style.display = 'none';
            return;
        }

        cont.style.display = 'flex';
        const nameEl = cont.querySelector('.selected-name');
        const roleEl = cont.querySelector('.selected-actions .selected-role');
        const btn = cont.querySelector('.selected-actions .change-company-btn');

        if (nameEl) nameEl.textContent = sel.nombre || '—';

        let rolTexto = '';
        const rol = sel.rol;
        if (Array.isArray(rol)) rolTexto = rol.join(', ');
        else if (typeof rol === 'string') rolTexto = rol;
        if (roleEl) {
            roleEl.textContent = rolTexto ? `rol: ${rolTexto}` : '';
            roleEl.style.display = rolTexto ? 'inline-block' : 'none';
        }

        if (btn) {
            // Ocultar el botón si el usuario solo pertenece a una empresa activa
            try {
                const empresas = (this.session.empresas || []).filter(e => e && e.empresa_activa !== false && e.usuario_activo !== false);
                if (empresas.length <= 1) {
                    btn.style.display = 'none';
                } else {
                    btn.style.display = 'inline-block';
                    btn.onclick = () => this.handleChangeCompany();
                }
            } catch { btn.onclick = () => this.handleChangeCompany(); }
        }

        // Aplicar color de la barra del header según empresa seleccionada
        try { this.applyHeaderCompanyColor(header); } catch {}
    } catch (e) {
        console.warn('GlobalHeader: No se pudo renderizar empresa seleccionada en header', e);
    }
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