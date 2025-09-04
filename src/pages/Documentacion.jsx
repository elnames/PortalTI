import React from 'react';
import { ArrowLeft, BookOpen, FileText, Shield, Users, HardDrive, MessageCircle, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Documentacion() {
  const navigate = useNavigate();

  const documentacionSections = [
    {
      title: 'Guía de Usuario',
      description: 'Aprende a usar todas las funcionalidades del sistema',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      items: [
        'Cómo crear y gestionar usuarios',
        'Gestión de activos tecnológicos',
        'Sistema de tickets de soporte',
        'Chat en tiempo real',
        'Generación de actas',
        'Reportes y estadísticas'
      ]
    },
    {
      title: 'Documentación Técnica',
      description: 'Información técnica para desarrolladores',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      items: [
        'Arquitectura del sistema',
        'API endpoints',
        'Base de datos',
        'Configuración del servidor',
        'Despliegue y mantenimiento',
        'Troubleshooting'
      ]
    },
    {
      title: 'Políticas de Seguridad',
      description: 'Medidas de seguridad y privacidad',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      items: [
        'Autenticación y autorización',
        'Protección de datos',
        'Cumplimiento normativo',
        'Auditoría y logs',
        'Backup y recuperación',
        'Política de privacidad'
      ]
    }
  ];

  const quickLinks = [
    { name: 'Dashboard', icon: BarChart2, path: '/dashboard' },
    { name: 'Usuarios', icon: Users, path: '/usuarios' },
    { name: 'Activos', icon: HardDrive, path: '/activos' },
    { name: 'Chat Soporte', icon: MessageCircle, path: '/chat' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            📚 Documentación - PortalTI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-3xl">
            Encuentra toda la información que necesitas para usar y administrar el sistema PortalTI de manera eficiente.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
        </div>

        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Enlaces Rápidos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <link.icon className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{link.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Documentación Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {documentacionSections.map((section, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className={`h-2 bg-gradient-to-r ${section.color}`}></div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${section.color} text-white mr-4`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {section.description}
                </p>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* External Documentation */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Documentación Externa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                GitHub Repository
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Código fuente y documentación técnica completa
              </p>
              <a
                href="https://github.com/elnames/PortalTI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Ver en GitHub
              </a>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Documentación Online
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Documentación completa con ejemplos y guías
              </p>
              <a
                href="https://elnames.github.io/PortalTI/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Ver Documentación
              </a>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            ¿No encuentras lo que buscas?
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Contactar Soporte
          </button>
        </div>
      </div>
    </div>
  );
}
