# Aplicación web

Aplicación React con registro, inicio de sesión, panel de control, carreras simuladas y recargas mediante la API de SnailPay. Las recargas y carreras no mueven dinero real.

## Ejecutar

```sh
npm install
npm run dev
```

Inicia también el proyecto hermano `backend` con `npm run dev` (Node 22 o superior). En desarrollo, Vite redirige `/api/pay` a `http://localhost:3000`. En producción, configura el servidor web para enrutar `/api/pay` a SnailPay en el mismo origen que la aplicación.

Para verificar el proyecto:

```sh
npm run build
npm test
npm run lint
```

## Estructura

- `src/pages`: acceso y dashboard.
- `src/components`: formularios, botones, modal y gráficas.
- `src/services`: instancia de autenticación y esquemas Zod para registro, acceso y recargas.
- `src/auth`: cuentas y datos locales cifrados.
- `src/data`: formato de moneda.
- `src/types`: modelos de la aplicación.

## Funcionamiento

Al registrar una cuenta se inicia sesión con saldo de $0.00 MXN y sin depósitos. Se precargan seis apuestas simuladas ya resueltas para ilustrar el dashboard; todas tienen importe y pago de $0, por lo que no afectan el saldo. Las apuestas nuevas requieren que el usuario escriba un importe válido. Tras recargar la página, la sesión sigue activa, pero se solicita de nuevo la contraseña para desbloquear los datos cifrados. Cerrar sesión conserva la cuenta y el saldo para el siguiente inicio de sesión.

React Router gestiona `/login`, `/register`, `/unlock`, `/dashboard`, `/races` y `/bets`. Las pantallas privadas redirigen al acceso o al desbloqueo cuando la sesión no permite mostrar los datos. El sidebar compartido enlaza el resumen, las carreras y el historial de apuestas.

`AuthProvider` concentra la sesión, el perfil y los datos cifrados del usuario. Los layouts de rutas públicas, desbloqueo y rutas protegidas aplican las redirecciones; `App.tsx` solo declara el árbol de rutas.

SnailPay solo aprueba la tarjeta de prueba `1234 1234 1234 1234`, con vencimiento `12/26` y CVV `543`. El nombre puede ser cualquier cadena no vacía y el monto debe ser positivo, en MXN, con hasta dos decimales. La web acredita el saldo local solo después de una aprobación válida y guarda el ID y la fecha del recibo para evitar duplicados. Los datos de tarjeta no se almacenan.

Para probar el error interno desde la web, visita `http://localhost:5173/dashboard?snailpayError=system`, recarga la página y envía una recarga con los datos de aprobación. La web añade `X-SnailPay-Simulate-System-Error: true` a esa solicitud y muestra el error `503` sin acreditar saldo. El parámetro se conserva al pasar por login o desbloqueo y por los enlaces internos; elimínalo de la URL para volver a probar la aprobación normal. No agregues datos de tarjeta a la URL.

La autenticación, el saldo visible y el historial viven en `localStorage` de este navegador. La API de SnailPay mantiene su propio saldo en memoria, no permite consultarlo y lo pierde al reiniciar. No hay sincronización entre dispositivos ni reconciliación automática si se pierde la respuesta de un pago.
