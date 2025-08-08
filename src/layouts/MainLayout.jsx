// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeWrapper from '../components/ThemeWrapper';

export default function MainLayout({
  isSidebarOpen,
  toggleSidebar
}) {
  return (
    <ThemeWrapper>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header toggleSidebar={toggleSidebar} />
          <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto p-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </ThemeWrapper>
  );
}
