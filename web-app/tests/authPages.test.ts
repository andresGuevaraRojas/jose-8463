import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '../src/auth/auth-context.ts'
import { LoginPage } from '../src/pages/LoginPage.tsx'
import { RegisterPage } from '../src/pages/RegisterPage.tsx'
import { UnlockPage } from '../src/pages/UnlockPage.tsx'

const unused = async () => {}
const context: AuthContextValue = {
  state: { status: 'guest' }, register: unused, login: unused, unlock: unused,
  logout: () => {}, deposit: unused, settleBet: unused,
}

function renderPage(page: typeof LoginPage) {
  return renderToStaticMarkup(createElement(AuthContext.Provider, { value: context },
    createElement(MemoryRouter, null, createElement(page))))
}

describe('formularios de acceso', () => {
  it('login solicita correo y contraseña', () => {
    const html = renderPage(LoginPage)
    expect(html.match(/<input /g)).toHaveLength(2)
    expect(html).toContain('Correo electrónico')
    expect(html).not.toContain('Confirmar contraseña')
  })

  it('registro solicita los cuatro datos de la cuenta', () => {
    const html = renderPage(RegisterPage)
    expect(html.match(/<input /g)).toHaveLength(4)
    expect(html).toContain('Nombre completo')
    expect(html).toContain('Confirmar contraseña')
  })

  it('desbloqueo solo solicita la contraseña', () => {
    const html = renderPage(UnlockPage)
    expect(html.match(/<input /g)).toHaveLength(1)
    expect(html).not.toContain('Correo electrónico')
    expect(html).toContain('Cerrar sesión y usar otra cuenta')
  })
})
