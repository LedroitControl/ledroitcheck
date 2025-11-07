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
            logoPath: './assets/logo-ledroitsender.svg',
            appName: 'Ledroitsender'
        };
        
        this.session = null;
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
        // Intentar obtener sesión de window.ledroitAuth primero
        if (window.ledroitAuth && window.ledroitAuth.user) {
            this.session = {
                nombre: window.ledroitAuth.user.nombre || window.ledroitAuth.user.usuario,
                iniciales: window.ledroitAuth.user.iniciales, // ✅ Usar "iniciales"
                foto_url: window.ledroitAuth.user.foto_url || window.ledroitAuth.user.avatar,
                empresas: window.ledroitAuth.user.empresas || []
            };
        }
        // Si no, intentar desde sessionStorage
        else if (sessionStorage.getItem('ledroitAuth')) {
            try {
                const sessionData = JSON.parse(sessionStorage.getItem('ledroitAuth'));
                this.session = {
                    nombre: sessionData.nombre || sessionData.user?.nombre || sessionData.usuario,
                    iniciales: sessionData.iniciales || sessionData.initials, // ✅ Priorizar "iniciales"
                    foto_url: sessionData.foto_url || sessionData.user?.foto_url || sessionData.avatar,
                    empresas: sessionData.empresas || []
                };
            } catch (error) {
                console.warn('GlobalHeader: Error parseando sesión de sessionStorage');
            }
        }
        
        // Si tenemos sesión, intentar obtener datos actualizados desde Firebase
        if (this.session && this.session.iniciales) {
            await this.loadUserDataFromFirebase(this.session.iniciales);
        }
        
        if (this.session) {
            console.log('GlobalHeader: Sesión encontrada para', this.session.iniciales || 'usuario');
            console.log('GlobalHeader: Empresas disponibles:', this.session.empresas?.length || 0);
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
    }

    createMinimalHeader() {
        const header = document.createElement('header');
        header.className = 'global-header global-header-minimal';
        
        header.innerHTML = `
            <div class="header-brand-section">
                <img src="${this.config.logoPath}" alt="${this.config.appName}" class="brand-logo" />
                <span class="brand-name">${this.config.appName}</span>
            </div>
        `;

        this.headerElement.appendChild(header);
    }

    createBrandOnlyHeader() {
        const header = document.createElement('header');
        header.className = 'global-header global-header-brand-only';
        
        header.innerHTML = `
            <div class="header-brand-section">
                <img src="${this.config.logoPath}" alt="${this.config.appName}" class="brand-logo" />
                <div class="brand-info">
                    <span class="brand-name">${this.config.appName}</span>
                    <span class="brand-subtitle">Sistema de envío</span>
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

        // Configurar empresas - buscar en el header completo, no solo en userSection
        const companiesSection = header.querySelector('.header-companies-section');
        if (companiesSection) {
            console.log('GlobalHeader: Encontrada sección de empresas, configurando...');
            this.setupCompaniesSection(companiesSection);
        } else {
            console.warn('GlobalHeader: No se encontró .header-companies-section en el header');
        }

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
        
        const maxVisible = 2;
        const isCollapsed = empresas.length > maxVisible;
        
        // Contenedor para empresas visibles
        const visibleContainer = document.createElement('div');
        visibleContainer.className = 'gh-visible-companies';
        empresas.slice(0, maxVisible).forEach(empresa => {
            const companyItem = this.createCompanyItem(empresa);
            visibleContainer.appendChild(companyItem);
        });
        companiesList.appendChild(visibleContainer);
        
        // Contenedor para empresas ocultas
        if (isCollapsed) {
            const hiddenContainer = document.createElement('div');
            hiddenContainer.className = 'gh-hidden-companies';
            hiddenContainer.style.display = 'none';
            empresas.slice(maxVisible).forEach(empresa => {
                const companyItem = this.createCompanyItem(empresa);
                hiddenContainer.appendChild(companyItem);
            });
            companiesList.appendChild(hiddenContainer);
            
            // Botón "Ver X más"
            const remainingCount = empresas.length - maxVisible;
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'gh-companies-toggle-btn';
            toggleBtn.textContent = `Ver ${remainingCount} más`;
            toggleBtn.addEventListener('click', () => this.toggleCompanies(toggleBtn));
            companiesList.appendChild(toggleBtn);
        }
        
        console.log('GlobalHeader: Sección de empresas configurada correctamente');
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
            .replace(/^[\s`'"]+/g, '')
            .replace(/[\s`'"]+$/g, '')
            .replace(/`/g, '')
            .replace(/'/g, '')
            .replace(/"/g, '')
            .replace(/\s+/g, '')
            .trim();
    }

    handleLogout() {
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            // Intentar logout con diferentes métodos
            if (window.ledroitAuth && typeof window.ledroitAuth.logout === 'function') {
                window.ledroitAuth.logout();
            } else {
                // Limpiar sesión manualmente
                sessionStorage.removeItem('ls_session');
                localStorage.removeItem('ls_session');
            }
            
            // Redirigir al login
            window.location.href = 'index.html';
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
                    <div class="header-companies-section">
                        <div class="companies-list"></div>
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