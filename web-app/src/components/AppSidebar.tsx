import { NavLink } from 'react-router'
import { Brand } from './Brand'
import { Icon, type IconName } from './Icon'

const destinations: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Resumen del día', icon: 'chart' },
  { to: '/races', label: 'Carreras', icon: 'flag' },
  { to: '/bets', label: 'Mis apuestas', icon: 'ticket' },
]

export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  return <aside className="hidden w-[250px] shrink-0 flex-col bg-forest px-5 py-8 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start lg:overflow-y-auto">
    <div className="px-2"><Brand light /></div>
    <nav aria-label="Navegación principal" className="mt-20">
      <p className="px-3 text-[10px] font-bold tracking-[1.6px] text-[#90b99a]">TU ESPACIO</p>
      {destinations.map(({ to, label, icon }, index) => <NavLink key={to} to={to} end className={({ isActive }) => `flex h-11 items-center gap-3 rounded-[10px] px-4 text-[13px] font-bold ${index === 0 ? 'mt-4' : 'mt-2'} ${isActive ? 'bg-forest-2 text-white' : 'text-[#c7ddca] hover:bg-forest-2 hover:text-white'}`}>
        <Icon name={icon} size={18} /> {label}
      </NavLink>)}
    </nav>
    <div className="mt-auto">
      <div className="rounded-[13px] border border-[#386a50] bg-forest-2 p-4"><span className="text-xl text-lime">✳</span><strong className="mt-1 block text-xs">Sin prisa, con emoción.</strong><small className="mt-2 block text-[11px] leading-relaxed text-[#b4d0ba]">Tus resultados aparecen aquí al terminar cada carrera.</small></div>
      <button type="button" onClick={onLogout} className="mt-6 flex items-center gap-3 px-3 py-2 text-[13px] text-[#c7ddca] hover:text-white"><Icon name="logout" size={18} /> Cerrar sesión</button>
    </div>
  </aside>
}
