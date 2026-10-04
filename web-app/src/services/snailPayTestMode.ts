const parameter = 'snailpayError'

export function simulateSnailPaySystemError(search: string): boolean {
  return new URLSearchParams(search).get(parameter) === 'system'
}

export function preserveSnailPayTestMode(path: string, search: string): string {
  return simulateSnailPaySystemError(search) ? `${path}?${parameter}=system` : path
}
