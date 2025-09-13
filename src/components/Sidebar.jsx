// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUserSubroles } from '../hooks/useUserSubroles';
import PazYSalvoDropdown from './PazYSalvoDropdown';
import {
  Menu,
  HardDrive,
  Clipboard,
  Users,
  BarChart2,
  Shield,
  FileText,
  BadgeCheck,
  Settings
} from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { hasSubrole, getActiveSubroles } = useUserSubroles();


  // Overlay para móviles cuando el sidebar está abierto
  const overlay = (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden ${isOpen ? 'block' : 'hidden'
        }`}
      onClick={toggleSidebar}
    />
  );

  // Define aquí tus enlaces base según el rol
  let links = [];

  if (user?.role === 'admin') {
    // Enlaces para administradores
    links = [
      { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { to: '/usuarios', icon: Users, label: 'Usuarios' },
      { to: '/activos', icon: HardDrive, label: 'Activos' },
      { to: '/tickets', icon: Clipboard, label: 'Tickets' },
      { to: '/gestion-actas', icon: FileText, label: 'Gestión Actas' },
      { to: '/reportes', icon: BarChart2, label: 'Reportes' },
      { to: '/configuracion', icon: Shield, label: 'Configuración Admin' }
    ];
  } else if (user?.role === 'soporte') {
    // Enlaces para soporte técnico
    links = [
      { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { to: '/usuarios', icon: Users, label: 'Usuarios' },
      { to: '/activos', icon: HardDrive, label: 'Activos' },
      { to: '/tickets', icon: Clipboard, label: 'Tickets' },
      { to: '/gestion-actas', icon: FileText, label: 'Gestión Actas' }
      // Paz y Salvo se maneja con subroles más abajo
    ];
  } else if (user?.role === 'jefe_directo') {
    // Enlaces para jefe directo
    links = [
      { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { to: '/mis-activos', icon: HardDrive, label: 'Mis Activos' },
      { to: '/actas', icon: FileText, label: 'Actas' },
      { to: '/mis-tickets', icon: Clipboard, label: 'Mis Tickets' },
      { to: '/pazysalvo/jefe-directo', icon: BadgeCheck, label: 'Paz y Salvo' }
    ];
  } else if (user?.role === 'rrhh') {
    // Enlaces para RRHH
    links = [
      { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { to: '/mis-activos', icon: HardDrive, label: 'Mis Activos' },
      { to: '/actas', icon: FileText, label: 'Actas' },
      { to: '/mis-tickets', icon: Clipboard, label: 'Mis Tickets' },
      { to: '/pazysalvo-admin', icon: BadgeCheck, label: 'Paz y Salvo' }
    ];
  } else if (user?.role === 'ti') {
    // Enlaces para TI
    links = [
      { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { to: '/mis-activos', icon: HardDrive, label: 'Mis Activos' },
      { to: '/actas', icon: FileText, label: 'Actas' },
      { to: '/mis-tickets', icon: Clipboard, label: 'Mis Tickets' },
      { to: '/pazysalvo/ti', icon: BadgeCheck, label: 'Paz y Salvo' }
    ];
  } else if (user?.role === 'contabilidad') {
    // Enlaces para Contabilidad
    links = [
      { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { to: '/mis-activos', icon: HardDrive, label: 'Mis Activos' },
      { to: '/actas', icon: FileText, label: 'Actas' },
      { to: '/mis-tickets', icon: Clipboard, label: 'Mis Tickets' },
      { to: '/pazysalvo/contabilidad', icon: BadgeCheck, label: 'Paz y Salvo' }
    ];
  } else if (user?.role === 'gerencia_finanzas') {
    // Enlaces para Gerencia de Finanzas
    links = [
      { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { to: '/mis-activos', icon: HardDrive, label: 'Mis Activos' },
      { to: '/actas', icon: FileText, label: 'Actas' },
      { to: '/mis-tickets', icon: Clipboard, label: 'Mis Tickets' },
      { to: '/pazysalvo/gerencia-finanzas', icon: BadgeCheck, label: 'Paz y Salvo' }
    ];
  } else {
    // Enlaces para usuarios regulares (SIN Dashboard)
    links = [
      { to: '/mis-activos', icon: HardDrive, label: 'Mis Activos' },
      { to: '/actas', icon: FileText, label: 'Actas' },
      { to: '/mis-tickets', icon: Clipboard, label: 'Mis Tickets' }
    ];
  }

  // Agregar enlaces de subroles de Paz y Salvo dinámicamente (solo para usuarios no-admin)
  const activeSubroles = getActiveSubroles();
  if (user?.role !== 'admin' && activeSubroles && activeSubroles.length > 0) {
    activeSubroles.forEach(subrole => {
      let pazySalvoRoute = '';
      let pazySalvoLabel = 'Paz y Salvo';

      switch (subrole.rol) {
        case 'JefeInmediato':
          pazySalvoRoute = '/pazysalvo/jefe-directo';
          pazySalvoLabel = 'Paz y Salvo - Jefatura';
          break;
        case 'RRHH':
          pazySalvoRoute = '/pazysalvo';
          pazySalvoLabel = 'Paz y Salvo - Gestión';
          break;
        case 'Informatica':
          pazySalvoRoute = '/pazysalvo/ti';
          pazySalvoLabel = 'Paz y Salvo - TI';
          break;
        case 'Contabilidad':
          pazySalvoRoute = '/pazysalvo/contabilidad';
          pazySalvoLabel = 'Paz y Salvo - Contabilidad';
          break;
        case 'GerenciaFinanzas':
          pazySalvoRoute = '/pazysalvo/gerencia-finanzas';
          pazySalvoLabel = 'Paz y Salvo - Finanzas';
          break;
        default:
          return; // No agregar si no es un rol reconocido
      }

      // Verificar que no exista ya el enlace (evitar duplicados)
      if (!links.find(link => link.to === pazySalvoRoute)) {
        links.push({
          to: pazySalvoRoute,
          icon: BadgeCheck,
          label: pazySalvoLabel
        });
      }
    });
  }

  return (
    <>
      {overlay}
      <div
        className={`
           fixed sm:relative z-40 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
           ${isOpen ? (settings.interfaceSettings.compactSidebar ? 'w-48' : 'w-64') : 'w-16'} transition-all duration-200
           h-full max-h-screen overflow-hidden
           ${isOpen ? 'flex' : 'hidden sm:flex'}
           lg:${isOpen ? 'w-64' : 'w-16'} md:${isOpen ? 'w-48' : 'w-16'} sm:${isOpen ? 'w-48' : 'w-16'}
         `}
      >
        {/* Toggle */}
        <button
          onClick={toggleSidebar}
          className={`
            absolute -right-3 top-1/2 transform -translate-y-1/2
            bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1 shadow-md 
            hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors
            ${isOpen ? 'block' : 'hidden sm:block'}
            z-10
          `}
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Logo - Fijo arriba */}
        <div className="mt-4 flex justify-center flex-shrink-0">
          <img
            src="/logo.png"
            alt="Portal TI Logo"
            className="h-26 w-auto"
          />
        </div>

        {/* Navegación con scroll - Área flexible */}
        <nav className="mt-6 flex-1 space-y-2 px-2 overflow-y-auto scrollbar-hide min-h-0">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg transition-colors
              hover:bg-gray-100 dark:hover:bg-gray-700 
              text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white
              ${isActive ? 'bg-gray-200 dark:bg-gray-600 font-semibold text-gray-900 dark:text-white' : ''}
              ${!isOpen ? 'justify-center' : ''}`
              }
            >
              <Icon className="w-5 h-5" />
              {isOpen && <span className="ml-3">{label}</span>}
            </NavLink>
          ))}
          
          {/* Dropdown de Paz y Salvo solo para admin */}
          {user?.role === 'admin' && isOpen && (
            <div className="px-2 py-2">
              <PazYSalvoDropdown />
            </div>
          )}
        </nav>

        {/* Avatar - Fijo abajo */}
        <div className="p-4 flex justify-center flex-shrink-0">
          <img
            src="/avatar.png"
            alt="User Avatar"
            className={`rounded-full transition-all duration-200 ${isOpen ? 'w-10 h-10' : 'w-8 h-8'
              }`}
          />
        </div>
      </div>
    </>
  );
}
