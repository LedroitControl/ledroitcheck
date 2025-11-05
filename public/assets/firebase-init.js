// Inicialización simplificada para la página de prueba de ingreso derivado
// Basada en GUIA-PASO-A-PASO.md (sección 2.2)

// Configuración de Firebase del proyecto LEDROITCHECK
const firebaseConfig = {
  apiKey: "AIzaSyBI8wP7mGBKmK0Gej_4irGR_HgwK0gvO6",
  authDomain: "ledroitcheck.firebaseapp.com",
  projectId: "ledroitcheck",
  storageBucket: "ledroitcheck.firebasestorage.app",
  messagingSenderId: "262599097567",
  appId: "1:262599097567:web:81f272f7b1cd5c6be33d6a"
};

try {
  // Evitar doble inicialización si ya existe
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado (prueba-ingderivado)");
  } else {
    console.log("Firebase ya estaba inicializado (prueba-ingderivado)");
  }
} catch (e) {
  console.error("Error inicializando Firebase en prueba-ingderivado:", e);
}

// Variables globales esperadas por documentación
window.SISTEMA_NOMBRE = "LEDROITCHECK";
window.LOGIN_URL = "index.html";
window.INGRESO_DERIVADO_URL = "ingreso-derivado.html";
window.INGRESO_DERIVADO_ENDPOINT = "ingreso-derivado"; // Endpoint POST estándar

console.log("🔧 Configuración Firebase (prueba-ingderivado):", firebaseConfig.projectId);
console.log("🏢 Sistema:", window.SISTEMA_NOMBRE);