import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue, type AuthState } from '../src/auth/auth-context.ts'
import { GuestLayout, ProtectedLayout, UnlockLayout } from '../src/routes/AppRoutes.tsx'

function renderRoute(state: AuthState, layout: typeof ProtectedLayout, path: string) {
  const unused = async () => {}
  const value: AuthContextValue = {
    state, register: unused, login: unused, unlock: unused,
    logout: () => {}, deposit: unused, settleBet: unused,
  }
  return renderToStaticMarkup(createElement(AuthContext.Provider, { value },
    createElement(MemoryRouter, { initialEntries: [path] },
      createElement(Routes, null,
        createElement(Route, { element: createElement(layout) },
          createElement(Route, { path, element: createElement('span', null, 'contenido permitido') })),
      ))))
}

describe('layouts de acceso', () => {
  const ready: AuthState = { status: 'ready', profile: { fullName: 'Ana', email: 'ana@example.com' }, data: { balanceCents: 0, deposits: [], bets: [] }, payerId: 'a'.repeat(64) }

  it('solo muestra rutas privadas con la bóveda desbloqueada', () => {
    expect(renderRoute(ready, ProtectedLayout, '/races')).toContain('contenido permitido')
    expect(renderRoute({ status: 'guest' }, ProtectedLayout, '/races')).not.toContain('contenido permitido')
    expect(renderRoute({ status: 'locked' }, ProtectedLayout, '/races')).not.toContain('contenido permitido')
  })

  it('separa registro e inicio de sesión del desbloqueo', () => {
    expect(renderRoute({ status: 'guest' }, GuestLayout, '/register')).toContain('contenido permitido')
    expect(renderRoute({ status: 'locked' }, GuestLayout, '/register')).not.toContain('contenido permitido')
    expect(renderRoute({ status: 'locked' }, UnlockLayout, '/unlock')).toContain('contenido permitido')
    expect(renderRoute(ready, UnlockLayout, '/unlock')).not.toContain('contenido permitido')
  })
})
