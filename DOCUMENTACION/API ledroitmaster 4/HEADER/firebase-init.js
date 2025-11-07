/**
 * FIREBASE INITIALIZATION - LEDROITSENDER
 * Configuración básica de Firebase para el sistema de header global
 * 
 * IMPORTANTE: Este archivo debe adaptarse a cada proyecto específico
 * - Cambiar firebaseConfig por la configuración del proyecto destino
 * - Verificar que las colecciones necesarias existan
 * - Adaptar la lógica de autenticación según el sistema
 */

// Firebase configuration - CAMBIAR POR LA CONFIGURACIÓN DEL PROYECTO DESTINO
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
window.db = firebase.firestore();

// Initialize Auth
window.auth = firebase.auth();

// Initialize Storage (opcional)
window.storage = firebase.storage();

// Autenticación anónima (opcional - adaptar según necesidades)
auth.signInAnonymously().catch(function(error){
  console.error('Error en auth anónimo:', error);
});

// Promise que se resuelve cuando Firebase está listo
window.authReady = new Promise((resolve) => {
  auth.onAuthStateChanged((user) => {
    console.log('Firebase Auth Ready');
    resolve(user);
  });
});

/**
 * COLECCIONES NECESARIAS PARA EL HEADER:
 * 
 * 1. ultimosIngresosSatisfactorios
 *    - Documento por usuario (ID = iniciales del usuario)
 *    - Estructura:
 *      {
 *        respuestaLMaster: {
 *          success: true,
 *          data: {
 *            nombre: "Nombre Usuario",
 *            foto_url: "URL_del_avatar",
 *            empresas: [
 *              {
 *                nombre: "Nombre Empresa",
 *                empresa_activa: true,
 *                usuario_activo: true,
 *                rol: ["admin", "user"]
 *              }
 *            ]
 *          }
 *        }
 *      }
 * 
 * ADAPTACIÓN PARA OTROS SISTEMAS:
 * - Cambiar el nombre de la colección según tu estructura
 * - Adaptar la estructura de datos en global-header.js
 * - Modificar la lógica de búsqueda de usuarios
 */

console.log('Firebase inicializado para sistema de header global');