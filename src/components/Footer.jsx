// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <span>© {new Date().getFullYear()} Portal TI. Todos los derechos reservados.</span>
        <div className="space-x-4">
          <Link to="/docs" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Documentación</Link>
          <Link to="/contact" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Contacto</Link>
          <Link to="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Política de privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
