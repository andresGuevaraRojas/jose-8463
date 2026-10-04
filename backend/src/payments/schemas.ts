import { z } from 'zod';

export const amountSchema = z.number({ error: 'El monto debe ser un número en MXN.' })
  .positive('El monto debe ser mayor que cero.')
  .refine((amount) => {
    const cents = amount * 100;
    return Number.isSafeInteger(Math.round(cents)) && /^\d+(?:\.\d{1,2})?$/.test(String(amount));
  }, 'El monto admite como máximo dos decimales.');

export const payerIdSchema = z.string().regex(/^[a-f0-9]{64}$/, 'El identificador del usuario no es válido.');
export const payerEmailSchema = z.email('El correo del usuario no es válido.').transform((email) => email.toLowerCase());

export const SIMULATION_CARD_NUMBER = '1234123412341234';
export const cardNumberSchema = z.string().regex(/^\d{16}$/, 'La tarjeta debe tener 16 dígitos sin espacios.');

export const paymentRequestSchema = z.strictObject({
  card_number: cardNumberSchema,
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'El vencimiento debe usar MM/AA.'),
  cvv: z.string().regex(/^\d{3,4}$/, 'El CVV debe tener 3 o 4 dígitos.'),
  full_name: z.string().trim().min(1, 'El nombre completo es obligatorio.'),
  transaction_amount: amountSchema,
  payer_id: payerIdSchema,
  payer_email: payerEmailSchema,
});

export const paymentResponseSchema = z.strictObject({
  id: z.uuid(),
  status: z.enum(['approved', 'rejected', 'error']),
  status_detail: z.strictObject({
    code: z.enum(['APPROVED', 'INVALID_REQUEST', 'CARD_DECLINED', 'SYSTEM_UNAVAILABLE']),
    message: z.string().min(1),
  }),
  transaction_amount: z.number().nullable(),
  date_created: z.iso.datetime(),
  authorization_code: z.string().regex(/^\d{6}$/).nullable(),
  reference: z.string().startsWith('SNP-'),
  payer_id: z.string().nullable(),
  payer_email: z.string().nullable(),
});

export type PaymentRequest = z.infer<typeof paymentRequestSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
