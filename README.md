# LedroitCheck

Sistema para entidades/salidas/nomina desarrollado con Firebase.

## 🚀 Descripción

LedroitCheck es una aplicación web moderna desarrollada con Firebase que permite gestionar entidades, salidas y nóminas de manera eficiente.

## 🛠️ Tecnologías Utilizadas

- **Firebase Hosting** - Para el alojamiento web
- **Firestore Database** - Base de datos NoSQL
- **Cloud Functions** - Funciones del servidor
- **HTML/CSS/JavaScript** - Frontend

## 🌐 Aplicación en Vivo

La aplicación está desplegada en: [https://ledroitcheck.web.app](https://ledroitcheck.web.app)

## 📁 Estructura del Proyecto

```
ledroitcheck/
├── public/           # Archivos del frontend
│   └── index.html   # Página principal
├── functions/       # Cloud Functions
│   ├── index.js     # Funciones del servidor
│   └── package.json # Dependencias de las funciones
├── firestore.rules  # Reglas de seguridad de Firestore
├── firestore.indexes.json # Índices de Firestore
└── firebase.json    # Configuración de Firebase
```

## 🚀 Instalación y Desarrollo

1. Clona el repositorio:
```bash
git clone https://github.com/LedroitControl/ledroitcheck.git
cd ledroitcheck
```

2. Instala Firebase CLI:
```bash
npm install -g firebase-tools
```

3. Inicia sesión en Firebase:
```bash
firebase login
```

4. Instala las dependencias de las funciones:
```bash
cd functions
npm install
cd ..
```

5. Ejecuta el proyecto localmente:
```bash
firebase serve
```

## 📦 Deploy

Para desplegar la aplicación:

```bash
firebase deploy
```

Para desplegar solo el hosting:
```bash
firebase deploy --only hosting
```

## 👨‍💻 Autor

**LedroitControl**
- Email: ledroitcontrol@gmail.com
- Proyecto: Sistema de gestión empresarial

## 📄 Licencia

Este proyecto es privado y pertenece a LedroitControl.

---

⚡ Desarrollado con Firebase y mucho ☕
