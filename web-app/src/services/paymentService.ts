import { z } from 'zod'
import type { AppUserData, PaymentInput } from '../types/app.ts'
import { simulateSnailPaySystemError } from './snailPayTestMode.ts'
import { createPaymentSchema } from './validationSchemas.ts'

export class PaymentValidationError extends Error {}

const paymentResponseSchema = z.object({
  id: z.uuid(),
  status: z.enum(['approved', 'rejected', 'error']),
  status_detail: z.object({
    code: z.enum(['APPROVED', 'INVALID_REQUEST', 'CARD_DECLINED', 'SYSTEM_UNAVAILABLE']),
    message: z.string().min(1),
  }),
  transaction_amount: z.number().nullable(),
  date_created: z.iso.datetime(),
  authorization_code: z.string().regex(/^\d{6}$/).nullable(),
  reference: z.string().startsWith('SNP-'),
  payer_id: z.string().nullable(),
  payer_email: z.string().nullable(),
})

export interface PaymentReceipt {
  id: string
  amountCents: number
  createdAt: string
  payerId: string
}

export interface PaymentPayer {
  id: string
  email: string
}

export function creditApprovedPayment(current: AppUserData, receipt: PaymentReceipt): AppUserData {
  if ((current.deposits ?? []).some((deposit) => deposit.id === receipt.id)) return current
  const balanceCents = current.balanceCents + receipt.amountCents
  if (!Number.isSafeInteger(balanceCents)) throw new Error('No se pudo guardar el saldo de la recarga.')
  return {
    ...current,
    balanceCents,
    deposits: [{ id: receipt.id, amountCents: receipt.amountCents, createdAt: receipt.createdAt }, ...(current.deposits ?? [])],
    bets: current.bets ?? [],
  }
}

export function validatePayment(input: PaymentInput): number {
  const result = createPaymentSchema().safeParse(input)
  if (!result.success) throw new PaymentValidationError(result.error.issues[0].message)
  return result.data.amount
}

export async function processPayment(
  input: PaymentInput,
  payer: PaymentPayer,
  request: typeof fetch = fetch,
  search = typeof window === 'undefined' ? '' : window.location.search,
): Promise<PaymentReceipt> {
  const amountCents = validatePayment(input)
  const normalizedEmail = payer.email.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(payer.id) || !normalizedEmail) {
    throw new PaymentValidationError('Tu sesión no es válida. Vuelve a iniciar sesión.')
  }

  let response: Response
  try {
    response = await request('/api/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(simulateSnailPaySystemError(search) ? { 'X-SnailPay-Simulate-System-Error': 'true' } : {}),
      },
      body: JSON.stringify({
        card_number: input.cardNumber.replace(/\s/g, ''),
        expiry: input.expiry.trim(),
        cvv: input.cvv.trim(),
        full_name: input.cardholder.trim(),
        transaction_amount: amountCents / 100,
        payer_id: payer.id,
        payer_email: normalizedEmail,
      }),
    })
  } catch {
    throw new Error('No se pudo confirmar el resultado con SnailPay. Consulta tu saldo antes de intentar otra recarga.')
  }

  let raw: unknown
  try {
    raw = await response.json()
  } catch {
    throw new Error('SnailPay devolvió una respuesta inesperada. Consulta tu saldo antes de intentar otra recarga.')
  }
  const parsed = paymentResponseSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('SnailPay devolvió una respuesta inesperada. Consulta tu saldo antes de intentar otra recarga.')
  }
  const result = parsed.data
  if (response.status === 201 && result.status === 'approved' && result.status_detail.code === 'APPROVED'
    && result.authorization_code && result.reference === `SNP-${result.id}` && result.payer_id === payer.id
    && result.payer_email === normalizedEmail && result.transaction_amount !== null
    && Math.round(result.transaction_amount * 100) === amountCents) {
    return { id: result.id, amountCents, createdAt: result.date_created, payerId: payer.id }
  }
  if ((response.status === 400 || response.status === 402 || response.status === 503) && result.status !== 'approved') {
    throw new Error(result.status_detail.message)
  }
  throw new Error('SnailPay devolvió una respuesta inesperada. Consulta tu saldo antes de intentar otra recarga.')
}
