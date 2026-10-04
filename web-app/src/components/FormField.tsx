import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function FormField({ label, hint, id, className = '', ...props }: FormFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\W+/g, '-')
  return <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
    <label htmlFor={inputId} className="text-xs font-bold text-ink">{label}</label>
    <input {...props} id={inputId} className="h-12 w-full rounded-[10px] border border-line bg-white px-3.5 text-[13px] text-ink outline-none transition-shadow placeholder:text-[#9aab9f] focus:border-[#86b476] focus:ring-3 focus:ring-lime/40" />
    {hint && <p className="text-[11px] text-muted">{hint}</p>}
  </div>
}
