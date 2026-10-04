# Simulador de apuestas

Proyecto de simulación de apuestas que integra una aplicación web desarrollada con React y una API construida con Express.js. Incluye flujos de apuestas y pagos simulados; no procesa dinero real.

## Estructura

- `web-app/`: interfaz web para crear una cuenta, consultar el saldo y participar en las apuestas simuladas.
- `backend/`: API en Express.js que procesa los pagos simulados.

Cada carpeta tiene su propio `package.json`, por lo que debes instalar las dependencias en ambas.

## Requisitos

- Node.js 22 o superior
- npm

## Ejecutar en local

Desde la raíz del repositorio, instala las dependencias e inicia la API en una terminal:

```sh
cd backend
npm ci
npm run dev
```

En otra terminal, instala las dependencias e inicia la aplicación web:

```sh
cd web-app
npm ci
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador. La API se ejecuta en `http://localhost:3000`.

## Datos locales

La autenticación y los datos de usuario de la aplicación web se guardan en `localStorage` del navegador. Las cuentas y el saldo no se sincronizan entre dispositivos o navegadores.
