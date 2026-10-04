# SnailPay: API de pagos simulados

Este servicio **no realiza cargos reales**. Requiere Node 22. Instala las dependencias con `npm ci`, inicia el servidor con `npm run dev` y ejecuta las pruebas con `npm test`. El servidor escucha en `http://localhost:3000`.

Para probarlo manualmente desde un cliente compatible con archivos `.http`, abre las solicitudes de [`http/`](http/): aprobación, tarjeta rechazada, datos inválidos y fallo interno. Inicia el servidor antes de enviarlas; cada archivo indica el código HTTP esperado.

## `POST /api/pay`

Envía JSON con estos campos:

| Campo | Formato |
| --- | --- |
| `card_number` | Cadena de 16 dígitos, sin espacios |
| `expiry` | Cadena `MM/AA`, con mes de `01` a `12` |
| `cvv` | Cadena de 3 o 4 dígitos |
| `full_name` | Cadena no vacía después de quitar espacios exteriores |
| `transaction_amount` | Número en MXN, mayor que cero y con hasta dos decimales |
| `payer_id` | Identificador de 64 caracteres hexadecimales minúsculos; la web actual usa el SHA-256 del correo normalizado |
| `payer_email` | Correo válido; se normaliza a minúsculas |

Ejemplo de aprobación:

```http
POST /api/pay HTTP/1.1
Content-Type: application/json

{
  "card_number": "1234123412341234",
  "expiry": "12/26",
  "cvv": "543",
  "full_name": "Ana",
  "transaction_amount": 10.25,
  "payer_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "payer_email": "ana@example.com"
}
```

La combinación exacta de tarjeta, vencimiento y CVV del ejemplo aprueba cualquier nombre no vacío y monto válido. Solo se comprueba que el número tenga 16 dígitos: la tarjeta de prueba requerida no pasa Luhn, por lo que no se usa `z.creditCard()`. `12/26` es un dato fijo de simulación: se acepta aunque pase esa fecha. Otra tarjeta de 16 dígitos, u otro vencimiento o CVV con formato válido, produce un rechazo. No se envían ni almacenan datos de tarjeta fuera del procesamiento de la solicitud.

## Respuesta

Todos los resultados incluyen los mismos campos. Ejemplo de una aprobación (`201`):

```json
{
  "id": "aabbb89a-ed34-47b6-aabe-e9a5dbadff90",
  "status": "approved",
  "status_detail": { "code": "APPROVED", "message": "Recarga aprobada." },
  "transaction_amount": 10.25,
  "date_created": "2026-10-03T12:00:00.000Z",
  "authorization_code": "483210",
  "reference": "SNP-aabbb89a-ed34-47b6-aabe-e9a5dbadff90",
  "payer_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "payer_email": "ana@example.com"
}
```

`id` es un UUID, `date_created` usa ISO 8601 UTC, `authorization_code` tiene seis dígitos solo en aprobaciones y `reference` es `SNP-` seguido del ID. `transaction_amount` está expresado en MXN; el saldo interno se guarda en centavos.

| HTTP | `status` | `status_detail.code` | Resultado |
| --- | --- | --- | --- |
| `201` | `approved` | `APPROVED` | Se registra la operación y se acredita el monto. |
| `400` | `rejected` | `INVALID_REQUEST` | Datos inválidos o JSON malformado; el mensaje explica el primer error. |
| `402` | `rejected` | `CARD_DECLINED` | Los datos de tarjeta tienen formato válido, pero no coinciden con los de aprobación. |
| `503` | `error` | `SYSTEM_UNAVAILABLE` | No se registra ni acredita ninguna operación. |

En cualquier resultado no aprobado, `authorization_code` es `null`. Si un campo solicitado no se puede recuperar de una entrada inválida, su valor es `null`. `status_detail.message` es un mensaje en español para mostrar al usuario.

## Simular un fallo interno de SnailPay

Envía el **mismo JSON de un pago aprobado** a `POST /api/pay` y añade el encabezado `X-SnailPay-Simulate-System-Error: true`. El indicador del fallo va en el encabezado HTTP, **no** dentro del JSON. Así se comprueba que incluso un pago que normalmente se aprobaría falla cuando SnailPay no está disponible:

```http
POST /api/pay HTTP/1.1
Content-Type: application/json
X-SnailPay-Simulate-System-Error: true

{
  "card_number": "1234123412341234",
  "expiry": "12/26",
  "cvv": "543",
  "full_name": "Ana",
  "transaction_amount": 10.25,
  "payer_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "payer_email": "ana@example.com"
}
```

La respuesta será HTTP `503` con esta estructura (los valores de `id`, `reference` y `date_created` cambian en cada solicitud):

```json
{
  "id": "65e23df9-bf8f-49e3-9d25-e6f0bbf97da4",
  "status": "error",
  "status_detail": {
    "code": "SYSTEM_UNAVAILABLE",
    "message": "SnailPay no puede procesar la solicitud en este momento. Inténtalo más tarde."
  },
  "transaction_amount": 10.25,
  "date_created": "2026-10-03T12:00:00.000Z",
  "authorization_code": null,
  "reference": "SNP-65e23df9-bf8f-49e3-9d25-e6f0bbf97da4",
  "payer_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "payer_email": "ana@example.com"
}
```

Esta simulación no guarda la operación ni modifica el saldo. Para volver al comportamiento normal, envía la solicitud sin ese encabezado. Si el JSON está malformado, los campos que no se puedan leer en la respuesta serán `null`.

## Persistencia y alcance

El repositorio en memoria guarda operaciones rechazadas y aprobadas, y saldo por `payer_id`. Solo `approveAndCredit` registra y acredita una aprobación; una futura implementación con base de datos deberá realizar ambos pasos en una transacción. Los datos se pierden al reiniciar el servidor. No existe todavía un endpoint público para consultar el saldo.

El backend no verifica que `payer_id` y `payer_email` pertenezcan a una sesión registrada: la autenticación y el saldo de `web-app` siguen en el navegador y la pantalla de recarga aún no consume esta API. Los clientes deben mostrar `status_detail.message` y acreditar su saldo local únicamente tras recibir `status: "approved"`.
