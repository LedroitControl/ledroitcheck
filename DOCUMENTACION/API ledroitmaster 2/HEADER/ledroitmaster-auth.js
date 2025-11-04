/**
 * LEDROITMASTER AUTH - SISTEMA DE AUTENTICACIÓN
 * Sistema de autenticación simplificado para el header global
 * 
 * IMPORTANTE: Este archivo debe adaptarse a cada proyecto específico
 * - Cambiar apiUrl por la URL del sistema de autenticación destino
 * - Adaptar la estructura de datos según el sistema
 * - Modificar la lógica de sesión según las necesidades
 */

class LedroitMasterAuth {
    constructor() {
        // CAMBIAR POR LA URL DEL SISTEMA DE AUTENTICACIÓN DESTINO
        this.apiUrl = 'https://tu-sistema-auth.com/api/login';
        this.sistemaOrigen = 'TU_SISTEMA';
        this.sessionKey = 'ls_session';
        this.inactivityTimeout = 60 * 60 * 1000; // 1 hora
        
        this.initInactivityMonitor();
    }

    // Monitor de inactividad
    initInactivityMonitor() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const resetTimer = () => {
            this.lastActivity = Date.now();
            if (this.inactivityTimer) {
                clearTimeout(this.inactivityTimer);
            }
            
            this.inactivityTimer = setTimeout(() => {
                this.handleInactivity();
            }, this.inactivityTimeout);
        };

        events.forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });

        resetTimer();
    }

    // Manejar inactividad
    handleInactivity() {
        console.log('Sesión expirada por inactividad');
        this.logout();
        window.location.href = 'index.html';
    }

    // Autenticación principal - ADAPTAR SEGÚN TU SISTEMA
    async authenticate(usuario, password) {
        const payload = {
            usuario,
            password,
            sistema: this.sistemaOrigen
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                // Guardar sesión
                await this.saveSession(result, usuario);
                return { success: true, data: result };
            } else {
                return { success: false, error: result.message || 'Error de autenticación' };
            }
        } catch (error) {
            console.error('Error en autenticación:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Guardar sesión - ADAPTAR ESTRUCTURA SEGÚN TU SISTEMA
    async saveSession(authResult, usuario) {
        const sessionData = {
            user: {
                nombre: authResult.data?.nombre || usuario,
                foto_url: authResult.data?.avatar || null,
                empresas: authResult.data?.empresas || []
            },
            iniciales: authResult.data?.iniciales || usuario.substring(0, 2).toUpperCase(), // ✅ Usar "iniciales"
            timestamp: Date.now(),
            sistema: this.sistemaOrigen
        };

        // Guardar en sessionStorage y localStorage
        sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

        // Guardar en window.ledroitAuth para acceso global
        window.ledroitAuth = sessionData;

        // Disparar evento de cambio de sesión
        window.dispatchEvent(new CustomEvent('sessionChanged', { detail: sessionData }));

        console.log('Sesión guardada:', sessionData);
    }

    // Obtener sesión actual
    getSession() {
        try {
            const sessionData = sessionStorage.getItem(this.sessionKey) || localStorage.getItem(this.sessionKey);
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                window.ledroitAuth = parsed;
                return parsed;
            }
        } catch (error) {
            console.error('Error obteniendo sesión:', error);
        }
        return null;
    }

    // Verificar si hay sesión válida
    isAuthenticated() {
        const session = this.getSession();
        return session && session.user && session.iniciales; // ✅ Usar "iniciales"
    }

    // Cerrar sesión
    logout() {
        // Limpiar storage
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.sessionKey);
        
        // Limpiar variable global
        window.ledroitAuth = null;
        
        // Limpiar timer de inactividad
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        // Disparar evento de logout
        window.dispatchEvent(new CustomEvent('userLogout'));
        
        console.log('Sesión cerrada');
    }

    // Refrescar datos del usuario desde el servidor
    async refreshUserData() {
        const session = this.getSession();
        if (!session || !session.iniciales) { // ✅ Usar "iniciales"
            return false;
        }

        try {
            // ADAPTAR SEGÚN TU API DE REFRESH
            const response = await fetch(`${this.apiUrl}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    iniciales: session.iniciales, // ✅ Usar "iniciales"
                    sistema: this.sistemaOrigen 
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.saveSession(result, session.iniciales); // ✅ Usar "iniciales"
                return true;
            }
        } catch (error) {
            console.error('Error refrescando datos de usuario:', error);
        }
        
        return false;
    }
}

// Inicialización global
window.LedroitMasterAuth = LedroitMasterAuth;

// Instancia global
window.ledroitAuth = null;

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new LedroitMasterAuth();
    
    // Verificar sesión existente
    const existingSession = window.authSystem.getSession();
    if (existingSession) {
        console.log('Sesión existente encontrada');
        window.ledroitAuth = existingSession;
    }
});

/**
 * ESTRUCTURA DE DATOS ESPERADA PARA EL HEADER:
 * 
 * window.ledroitAuth = {
 *   user: {
 *     nombre: "Nombre del Usuario",
 *     foto_url: "URL_del_avatar",
 *     empresas: [
 *       {
 *         nombre: "Nombre Empresa",
 *         empresa_activa: true,
 *         usuario_activo: true,
 *         rol: ["admin", "user"]
 *       }
 *     ]
 *   },
 *   iniciales: "AB", // ✅ Usar "iniciales"
 *   timestamp: 1234567890,
 *   sistema: "TU_SISTEMA"
 * }
 * 
 * EVENTOS DISPONIBLES:
 * - 'sessionChanged': Se dispara cuando cambia la sesión
 * - 'userLogout': Se dispara cuando el usuario cierra sesión
 * 
 * MÉTODOS PÚBLICOS:
 * - authenticate(usuario, password): Autenticar usuario
 * - getSession(): Obtener sesión actual
 * - isAuthenticated(): Verificar si hay sesión válida
 * - logout(): Cerrar sesión
 * - refreshUserData(): Refrescar datos del usuario
 */