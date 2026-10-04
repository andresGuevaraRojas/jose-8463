# Autenticación local

Este módulo registra usuarios en el navegador, permite iniciar y cerrar sesión y guarda un perfil junto con datos propios de la aplicación. El perfil y esos datos se cifran con una clave derivada de la contraseña. 

La entrada pública es [`index.ts`](index.ts). Todos los datos persistentes se guardan en `localStorage` del origen actual; no se sincronizan entre dispositivos ni se envían a un servidor.

## Empezar

Cree una instancia compartida. El tipo genérico define la forma de los datos adicionales de cada usuario:

```ts
// src/auth-client.ts
import { createAuthService } from './auth';

type CartItem = { sku: string; quantity: number };
type AppUserData = {
  cart: CartItem[];
  preferences: { theme: 'light' | 'dark' };
};

export const auth = createAuthService<AppUserData>({
  initialData: () => ({
    cart: [],
    preferences: { theme: 'light' },
  }),
});
```

`initialData` se cifra al registrar a cada usuario. Puede ser un valor o una función que devuelva un valor nuevo. Use datos compatibles con JSON.

Con esa instancia, el registro **crea la cuenta, pero no inicia sesión**. Para acceder a los datos, inicie sesión después:

```ts
await auth.register({
  fullName: 'Alex Rivera',
  email: 'alex@example.com',
  password: 'password123',
  passwordConfirmation: 'password123',
});

const session = await auth.login({
  email: 'alex@example.com',
  password: 'password123',
});

const profile = await auth.getCurrentUser(); // { fullName, email }
const data = await auth.getUserData();        // AppUserData
```

El correo se normaliza al registrar y al iniciar sesión. Por ejemplo, ` Alex@Example.com ` y `alex@example.com` identifican a la misma cuenta. `register` rechaza un correo duplicado, un nombre vacío, un correo inválido, una contraseña demasiado corta o una confirmación distinta. La longitud mínima predeterminada es de 8 caracteres.

## Sesión después de recargar

La sesión y el acceso a los datos cifrados son estados distintos:

| Estado | `isAuthenticated()` | `hasUnlockedVault()` | Acceso a perfil y datos |
| --- | --- | --- | --- |
| Sin sesión | `false` | `false` | No; se lanza `NoActiveSessionError` |
| Después de `login` | `true` | `true` | Sí |
| Después de recargar la página | `true` | `false` | No; se lanza `VaultLockedError` |
| Después de `unlock(password)` | `true` | `true` | Sí |
| Después de `logout` | `false` | `false` | No |

`getSession()` devuelve la sesión almacenada o `null`. Después de una recarga, la contraseña debe solicitarse de nuevo para desbloquear el vault; el módulo no guarda la contraseña ni la clave de cifrado:

```ts
if (auth.getSession() && !auth.hasUnlockedVault()) {
  // Obtain the password from your application's existing input flow.
  await auth.unlock(password);
}

const profile = await auth.getCurrentUser();
```

`unlock` comprueba la contraseña contra el registro cifrado y no crea una sesión nueva. `logout()` elimina `auth:session` y descarta la clave en memoria; la cuenta y sus datos cifrados permanecen para futuros inicios de sesión.

## Leer y modificar datos

`getUserData()` devuelve `AppUserData`. `setUserData(data)` reemplaza el valor completo. `updateUserData(updater)` recibe el valor actual y guarda el que devuelva; el callback debe ser sincrónico.

```ts
await auth.updateUserData((current) => ({
  ...current,
  cart: [...current.cart, { sku: 'A1', quantity: 1 }],
}));

await auth.updateUserData((current) => ({
  ...current,
  cart: current.cart.map((item) =>
    item.sku === 'A1' ? { ...item, quantity: 2 } : item
  ),
}));

await auth.updateUserData((current) => ({
  ...current,
  cart: current.cart.filter((item) => item.sku !== 'A1'),
}));
```

`updateFullName(name)` cambia solo el nombre. `updateUserPayload(updater)` permite cambiar perfil y datos en una sola operación, pero rechaza cambios de correo. El correo determina la clave de búsqueda del usuario y esta versión no implementa su migración.

Cada lectura descifra el registro. Cada escritura descifra, aplica el cambio, genera un IV nuevo, cifra el payload completo y reemplaza el registro en `localStorage`. Las escrituras de una misma instancia se ejecutan en orden. Si varias pestañas o instancias escriben a la vez, una puede sobrescribir los cambios de otra.

## API y errores

| Método | Resultado |
| --- | --- |
| `register(input)` | Guarda una cuenta cifrada; no inicia sesión. |
| `login(input)` | Valida credenciales, devuelve `AuthSession` y desbloquea esta instancia. |
| `unlock(password)` | Recupera acceso a los datos de la sesión persistida. |
| `logout()` | Elimina la sesión y la clave en memoria. |
| `getSession()` / `isAuthenticated()` | Consultan la sesión local; no descifran datos. |
| `hasUnlockedVault()` | Indica si esta instancia conserva la clave de la sesión actual. |
| `getCurrentUser()` / `getUserData()` | Devuelven el perfil o los datos descifrados. |
| `setUserData(data)` / `updateUserData(updater)` | Reemplazan o modifican los datos adicionales. |
| `updateUserPayload(updater)` / `updateFullName(name)` | Modifican el payload completo o solo el nombre. |

Los errores se exportan desde [`index.ts`](index.ts) y pueden distinguirse con `instanceof` o con su propiedad `code`:

| Error | Cuándo ocurre |
| --- | --- |
| `ValidationError` | Entrada inválida o intento de cambiar el correo mediante `updateUserPayload`. |
| `UserAlreadyExistsError` | Ya existe una cuenta para el correo normalizado. |
| `InvalidCredentialsError` | Usuario inexistente, contraseña incorrecta o datos que no se pueden descifrar. Su mensaje es `Invalid credentials` en todos esos casos. |
| `NoActiveSessionError` | Una operación requiere sesión y no hay una válida. |
| `VaultLockedError` | Hay sesión, pero esta instancia no conserva la clave. |
| `StorageError` | Falló una operación de lectura o escritura del almacenamiento. |

```ts
import { VaultLockedError } from './auth';
import { auth } from './auth-client';

try {
  await auth.getUserData();
} catch (error) {
  if (error instanceof VaultLockedError) {
    // Ask the user for their password, then call auth.unlock(password).
  } else {
    throw error;
  }
}
```

## Qué se guarda en el navegador

`user:<SHA-256 del correo normalizado>` contiene `version`, `id`, `iterations`, `salt`, `iv` y `encryptedData`. El nombre, el correo real y los datos de la aplicación están dentro de `encryptedData`. `auth:session` contiene `sessionId`, `userId` y `createdAt` en texto legible. La sesión no tiene caducidad automática.

PBKDF2 con SHA-256 deriva una clave AES-256 a partir de la contraseña y un salt aleatorio de 16 bytes. AES-GCM cifra el payload con un IV aleatorio de 12 bytes en cada escritura. El número de iteraciones predeterminado es **310 000** y puede ajustarse con `pbkdf2Iterations` en `createAuthService`; cada registro conserva el valor usado para poder descifrarse aunque cambie la configuración. `minPasswordLength` cambia la longitud mínima de la contraseña. La clave derivada permanece solo en memoria y no es exportable.

El acceso a `localStorage` está centralizado en `LocalStorageAdapter`. La opción `storage` permite inyectar otro `StorageAdapter` al probar el módulo.

## Alcance y límites

La sesión identifica una cuenta **solo dentro de este navegador**. Su estructura y la presencia del registro se comprueban al consultarla, pero `localStorage` se puede alterar desde DevTools: esa comprobación no equivale a autenticación de servidor. El hash del correo facilita la búsqueda, pero no oculta un correo fácil de adivinar. Un XSS puede capturar la contraseña, la clave en memoria o datos descifrados. Si se pierde la contraseña, puede ser imposible recuperar el contenido cifrado. Este módulo no sustituye un sistema de autenticación productivo con backend.

## Archivos y verificación

[`auth.service.ts`](auth.service.ts) coordina la API; [`crypto.service.ts`](crypto.service.ts) contiene las operaciones criptográficas; [`session.service.ts`](session.service.ts) gestiona `auth:session`; [`storage.service.ts`](storage.service.ts) implementa el adaptador; [`types.ts`](types.ts) define los contratos y [`errors.ts`](errors.ts), los errores. Las pruebas están en [`tests/auth.test.ts`](../../tests/auth.test.ts).

Desde la raíz del proyecto:

```sh
npm test
npm run build
npm run lint
```

Las pruebas se ejecutan con Vitest y usan la configuración de Vite. `npm run test:watch` las deja en modo de observación durante el desarrollo.
