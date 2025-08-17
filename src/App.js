// src/App.js
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import MainLayout from './layouts/MainLayout';
import { useResponsiveSidebar } from './hooks/useResponsiveSidebar';


import Login from './pages/Login';
import AccessDenied from './pages/AccessDenied';
import Dashboard from './pages/Dashboard';
import Activos from './pages/Activos';
import ActivosForm from './pages/ActivosForm';
import ActivoDetail from './pages/ActivoDetail';
import MisActivos from './pages/MisActivos';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import MisTickets from './pages/MisTickets';
import CrearTicket from './pages/CrearTicket';
import CrearTicketAdmin from './pages/CrearTicketAdmin';
import Usuarios from './pages/Usuarios';
import UsuariosForm from './pages/UsuariosForm';
import UsuarioDetail from './pages/UsuarioDetail';
import Reportes from './pages/Reportes';
import ConfiguracionAdmin from './pages/ConfiguracionAdmin';
import Perfil from './pages/Perfil';
import Ajustes from './pages/Ajustes';
import Actas from './pages/Actas';

import GestionActas from './pages/GestionActas';
import ActaDetail from './pages/ActaDetail';
import Chat from './pages/Chat';
import PrevisualizarActa from './pages/PrevisualizarActa';
import PazYSalvo from './pages/PazYSalvo';

export default function App() {
  const { isSidebarOpen, toggleSidebar } = useResponsiveSidebar();

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="/crear-ticket" element={<CrearTicket />} />

      {/* Redirección de la ruta raíz al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Privadas */}
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <MainLayout
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
            />
          }
        >
          {/* Dashboard - Solo admin y soporte */}
          <Route
            path="/dashboard"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <Dashboard />
              </RequireRole>
            }
          />

          {/* Activos - Solo admin y soporte */}
          <Route
            path="activos"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <Activos />
              </RequireRole>
            }
          />
          <Route
            path="activos/nuevo"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <ActivosForm />
              </RequireRole>
            }
          />
          <Route
            path="activos/:id"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <ActivoDetail />
              </RequireRole>
            }
          />
          <Route
            path="activos/:id/editar"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <ActivosForm edit={true} />
              </RequireRole>
            }
          />

          {/* Mis Activos - Todos los usuarios */}
          <Route path="mis-activos" element={<MisActivos />} />

          {/* Usuarios - Solo admin y soporte */}
          <Route
            path="usuarios"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <Usuarios />
              </RequireRole>
            }
          />
          <Route
            path="usuarios/nuevo"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <UsuariosForm />
              </RequireRole>
            }
          />
          <Route
            path="usuarios/:id/editar"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <UsuariosForm edit={true} />
              </RequireRole>
            }
          />
          <Route
            path="usuarios/:id"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <UsuarioDetail />
              </RequireRole>
            }
          />

          {/* Tickets - Solo admin y soporte */}
          <Route
            path="tickets"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <Tickets />
              </RequireRole>
            }
          />
          <Route path="tickets/:id" element={<TicketDetail />} />

          {/* Crear Ticket Admin - Solo admin y soporte */}
          <Route
            path="crear-ticket-admin"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <CrearTicketAdmin />
              </RequireRole>
            }
          />

          {/* Mis Tickets - Todos los usuarios */}
          <Route path="mis-tickets" element={<MisTickets />} />

          {/* Actas - Todos los usuarios */}
          <Route path="actas" element={<Actas />} />
          <Route path="actas/previsualizar-firmado/:actaId" element={<PrevisualizarActa />} />



          {/* Gestión de Actas - Solo admin y soporte */}
          <Route
            path="gestion-actas"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <GestionActas />
              </RequireRole>
            }
          />
          <Route
            path="gestion-actas/:id"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <ActaDetail />
              </RequireRole>
            }
          />

          {/* Paz y Salvo - Solo admin y soporte */}
          <Route
            path="pazysalvo"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <PazYSalvo />
              </RequireRole>
            }
          />

          {/* Chat - Todos los usuarios */}
          <Route path="chat" element={<Chat />} />

          {/* Páginas de usuario */}
          <Route path="perfil" element={<Perfil />} />
          <Route path="ajustes" element={<Ajustes />} />

          {/* Solo ADMIN */}
          <Route
            path="reportes"
            element={
              <RequireRole roles={['admin']}>
                <Reportes />
              </RequireRole>
            }
          />
          <Route
            path="configuracion"
            element={
              <RequireRole roles={['admin', 'soporte']}>
                <ConfiguracionAdmin />
              </RequireRole>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
