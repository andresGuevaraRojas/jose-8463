# Simulador de apuestas

Proyecto de simulación de apuestas que integra una aplicación web desarrollada con React y una API construida con Express.js. Incluye flujos de apuestas y pagos simulados; no procesa dinero real.

## Estructura

- [`web-app/`](web-app/): interfaz para crear una cuenta, consultar el saldo y participar en apuestas simuladas. Consulta su [README](web-app/README.md).
- [`backend/`](backend/): API en Express.js que procesa los pagos simulados. Consulta su [README](backend/README.md).

Cada proyecto tiene su propio `package.json` y sus propias instrucciones. El [diseño de la interfaz está disponible en Figma](https://www.figma.com/design/kP1HhkGoFmKys7fyd65OpC/Untitled?node-id=0-1&p=f&t=XzgH2jV0jpoMEIvK-0).

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

## Probar los pagos simulados

Inicia sesión y abre **Cargar saldo**. Para obtener un pago aprobado, utiliza estos datos de prueba:

- Tarjeta: `1234 1234 1234 1234`
- Vencimiento: `12/26`
- CVV: `543`
- Nombre: cualquier valor no vacío
- Monto: cualquier cantidad válida mayor que `0` MXN

Para simular un fallo del servicio desde la web, abre [el dashboard con `?snailpayError=system`](http://localhost:5173/dashboard?snailpayError=system) y envía una recarga con los mismos datos. Se mostrará el error sin acreditar saldo. Quita el parámetro de la URL para volver al comportamiento normal.

Si pruebas la API directamente, envía el encabezado `X-SnailPay-Simulate-System-Error: true` a `POST /api/pay`. El [README del backend](backend/README.md) contiene ejemplos de solicitudes y respuestas.

## Datos locales

La autenticación y los datos de usuario de la aplicación web se guardan en `localStorage` del navegador. Las cuentas y el saldo no se sincronizan entre dispositivos o navegadores.
