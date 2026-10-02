import { useEffect, useState, type FormEvent } from 'react'
import { processMockPayment } from '../services/paymentService'
import type { PaymentInput } from '../types/app'
import { FormField } from './FormField'
import { Icon } from './Icon'
import { PrimaryButton } from './PrimaryButton'

interface PaymentModalProps {
  onClose: () => void
  onSuccess: (amountCents: number) => Promise<void>
}

const emptyPayment: PaymentInput = {
  cardNumber: '', expiry: '', cvv: '', cardholder: '', amount: '',
}

export function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const [payment, setPayment] = useState<PaymentInput>(emptyPayment)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !processing) onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, processing])

  function update<Key extends keyof PaymentInput>(key: Key, value: PaymentInput[Key]) {
    setPayment((current) => ({ ...current, [key]: value }))
    setError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setProcessing(true)
    try {
      const amountCents = await processMockPayment(payment)
      await onSuccess(amountCents)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo procesar la recarga.')
    } finally {
      setProcessing(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-forest/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !processing) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="payment-title" className="my-auto w-full max-w-[560px] overflow-hidden rounded-[19px] bg-white shadow-2xl">
      <header className="flex h-16 items-center justify-between border-b border-line px-7">
        <div className="text-xl font-extrabold text-forest"><span aria-hidden="true">🐌 </span>Snail<span className="text-[#6a994d]">Pay</span></div>
        <button type="button" onClick={onClose} disabled={processing} aria-label="Cerrar SnailPay" className="grid size-8 place-items-center rounded-lg bg-cream text-muted hover:text-ink"><Icon name="close" size={18} /></button>
      </header>
      <div className="px-7 py-6 sm:px-9">
        <p className="text-[10px] font-bold tracking-[1.7px] text-forest-2">RECARGA SEGURA · SIMULADA</p>
        <h2 id="payment-title" className="mt-2 text-[30px] leading-tight font-extrabold tracking-tight">Carga tu saldo</h2>
        <p className="mt-2 text-xs text-muted">Completa los datos para agregar fondos a tu cuenta.</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-3.5">
          <FormField label="Número de tarjeta" id="card-number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" required value={payment.cardNumber} onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, 19)
            update('cardNumber', digits.replace(/(\d{4})(?=\d)/g, '$1 '))
          }} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fecha de vencimiento" id="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" required value={payment.expiry} onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
              update('expiry', digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
            }} />
            <FormField label="CVV" id="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="•••" required value={payment.cvv} onChange={(event) => update('cvv', event.target.value.replace(/\D/g, '').slice(0, 4))} />
          </div>
          <FormField label="Nombre completo" id="cardholder" autoComplete="cc-name" placeholder="Como aparece en tu tarjeta" required value={payment.cardholder} onChange={(event) => update('cardholder', event.target.value)} />
          <FormField label="Monto de la recarga (MXN)" id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" required value={payment.amount} onKeyDown={(event) => {
            if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault()
          }} onChange={(event) => update('amount', event.target.value)} />
          {error && <p role="alert" className="rounded-lg bg-[#fff0e9] px-3 py-2 text-xs font-semibold text-[#9f482e]">{error}</p>}
          <PrimaryButton type="submit" disabled={processing} className="w-full">{processing ? 'Procesando...' : 'Confirmar recarga'}</PrimaryButton>
        </form>
        <div className="mt-4 border-t border-line pt-3 text-[10px] leading-relaxed text-muted">Pago de demostración: cualquier número de tarjeta se procesa si el formulario es válido.</div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted"><Icon name="shield" size={15} /> Pago simulado. Los datos de tarjeta no se guardan.</div>
      </div>
    </section>
  </div>
}
