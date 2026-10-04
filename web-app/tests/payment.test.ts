import { describe, expect, it, vi } from 'vitest'
import { creditApprovedPayment, processPayment, validatePayment } from '../src/services/paymentService.ts'
import type { PaymentInput } from '../src/types/app.ts'

const input: PaymentInput = { cardNumber: '1234 1234 1234 1234', expiry: '12/26', cvv: '543', cardholder: 'Ana', amount: '10.25' }
const payer = { id: 'a'.repeat(64), email: 'Ana@Example.com' }
const approved = {
  id: 'aabbb89a-ed34-47b6-aabe-e9a5dbadff90', status: 'approved',
  status_detail: { code: 'APPROVED', message: 'Recarga aprobada.' },
  transaction_amount: 10.25, date_created: '2026-10-03T12:00:00.000Z',
  authorization_code: '483210', reference: 'SNP-aabbb89a-ed34-47b6-aabe-e9a5dbadff90',
  payer_id: payer.id, payer_email: 'ana@example.com',
}
const respond = (status: number, body: object) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as typeof fetch

describe('SnailPay', () => {
  it('valida el formato que acepta la API, incluida la fecha fija de prueba', () => {
    expect(validatePayment(input)).toBe(1025)
    expect(() => validatePayment({ ...input, cardNumber: '1234' })).toThrow('16 dígitos')
    expect(() => validatePayment({ ...input, expiry: '13/26' })).toThrow('MM/AA')
    expect(() => validatePayment({ ...input, amount: '10.001' })).toThrow('dos decimales')
    expect(() => validatePayment({ ...input, amount: '0' })).toThrow('mayor que $0')
  })

  it('envía el contrato correcto y acredita un recibo aprobado una sola vez', async () => {
    const request = respond(201, approved)
    const receipt = await processPayment(input, payer, request)
    expect(request).toHaveBeenCalledOnce()
    const [url, options] = vi.mocked(request).mock.calls[0]
    expect(url).toBe('/api/pay')
    expect(options?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(String(options?.body))).toEqual({
      card_number: '1234123412341234', expiry: '12/26', cvv: '543', full_name: 'Ana',
      transaction_amount: 10.25, payer_id: payer.id, payer_email: 'ana@example.com',
    })
    const initial = { balanceCents: 0, deposits: [], bets: [] }
    const credited = creditApprovedPayment(initial, receipt)
    expect(credited).toEqual({ balanceCents: 1025, deposits: [{ id: approved.id, amountCents: 1025, createdAt: approved.date_created }], bets: [] })
    expect(creditApprovedPayment(credited, receipt)).toBe(credited)
    expect(JSON.stringify(credited)).not.toContain(input.cardNumber.replaceAll(' ', ''))
  })

  it.each([
    [400, 'INVALID_REQUEST', 'Datos inválidos.'],
    [402, 'CARD_DECLINED', 'Tarjeta rechazada.'],
    [503, 'SYSTEM_UNAVAILABLE', 'Servicio no disponible.'],
  ])('muestra el mensaje y no entrega recibo ante HTTP %i', async (status, code, message) => {
    await expect(processPayment(input, payer, respond(status, {
      ...approved, status: status === 503 ? 'error' : 'rejected',
      status_detail: { code, message }, authorization_code: null,
    }))).rejects.toThrow(message)
  })

  it('no acredita una respuesta aprobada para otro usuario o monto', async () => {
    await expect(processPayment(input, payer, respond(201, { ...approved, payer_id: 'b'.repeat(64) }))).rejects.toThrow('respuesta inesperada')
    await expect(processPayment(input, payer, respond(201, { ...approved, transaction_amount: 20 }))).rejects.toThrow('respuesta inesperada')
  })

  it('trata el fallo de red como resultado incierto sin reintento automático', async () => {
    const request = vi.fn(async () => { throw new Error('Network error') }) as typeof fetch
    await expect(processPayment(input, payer, request)).rejects.toThrow('No se pudo confirmar')
    expect(request).toHaveBeenCalledOnce()
  })

})
