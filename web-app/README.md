# Aplicación web

Aplicación React con registro, inicio de sesión, panel de control, saldo y recargas simuladas. Las gráficas muestran datos ficticios y no ejecutan operaciones reales.

## Ejecutar

```sh
npm install
npm run dev
```

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
- `src/data`: datos ficticios para las gráficas.
- `src/types`: modelos de la aplicación.

## Funcionamiento

Al registrar una cuenta se inicia sesión con saldo de $0.00 MXN. Tras recargar la página, la sesión sigue activa, pero se solicita de nuevo la contraseña para desbloquear los datos cifrados. Cerrar sesión conserva la cuenta y el saldo para el siguiente inicio de sesión.

React Router gestiona `/login`, `/register`, `/unlock` y `/dashboard`. El dashboard redirige al acceso o al desbloqueo cuando la sesión no permite mostrar los datos.

La recarga simulada no cobra ni guarda datos de tarjeta. Cualquier número se procesa si el formulario es válido. Se requiere una fecha futura, un CVV de 3 o 4 dígitos y un monto positivo con hasta dos decimales; no hay límite de recarga configurado.

La autenticación y el saldo viven solo en `localStorage` de este navegador. Para un uso productivo se requiere un backend de autenticación y pagos.
