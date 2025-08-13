// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeWrapper from '../components/ThemeWrapper';
import FloatingChatIcon from '../components/FloatingChatIcon';

export default function MainLayout({
  isSidebarOpen,
  toggleSidebar
}) {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  const handleChatSelect = (conversacion) => {
    // Si estamos en la página de chat, navegar a ella con la conversación seleccionada
    if (!isChatPage) {
      window.location.href = '/chat';
    }
    // Si estamos en la página de chat, el componente FloatingChatIcon manejará el panel desplegable
  };

  return (
    <ThemeWrapper>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <Header toggleSidebar={toggleSidebar} />
          <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto p-4 sm:p-6">
            <div className="max-w-full">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Icono flotante de chat (siempre mostrar, pero con comportamiento diferente en chat) */}
      <FloatingChatIcon onChatSelect={handleChatSelect} />
    </ThemeWrapper>
  );
}
