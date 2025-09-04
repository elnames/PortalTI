import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Database, Users, FileText, AlertTriangle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacidad() {
  const navigate = useNavigate();

  const privacySections = [
    {
      title: 'Recopilación de Información',
      icon: Database,
      color: 'from-blue-500 to-blue-600',
      content: [
        'Recopilamos información personal que nos proporcionas directamente, como nombre, email, departamento y ubicación.',
        'Almacenamos datos de uso del sistema para mejorar nuestros servicios y proporcionar soporte técnico.',
        'Recopilamos información de dispositivos y navegadores para garantizar la seguridad y funcionalidad del sistema.',
        'Los datos de tickets y conversaciones de chat se almacenan para proporcionar soporte continuo.'
      ]
    },
    {
      title: 'Uso de la Información',
      icon: Users,
      color: 'from-green-500 to-green-600',
      content: [
        'Utilizamos tu información para proporcionar y mantener el servicio PortalTI.',
        'Procesamos datos para gestionar activos tecnológicos y asignaciones de usuarios.',
        'Utilizamos la información para generar reportes y estadísticas del sistema.',
        'Procesamos tickets y consultas de soporte para brindarte asistencia técnica.'
      ]
    },
    {
      title: 'Protección de Datos',
      icon: Lock,
      color: 'from-red-500 to-red-600',
      content: [
        'Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos.',
        'Utilizamos encriptación para proteger la información sensible en tránsito y en reposo.',
        'Limitamos el acceso a datos personales solo al personal autorizado.',
        'Realizamos auditorías regulares de seguridad y cumplimiento.'
      ]
    },
    {
      title: 'Compartir Información',
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      content: [
        'No vendemos, alquilamos ni compartimos tu información personal con terceros.',
        'Compartimos datos solo cuando es necesario para el funcionamiento del sistema.',
        'Podemos divulgar información si es requerido por ley o para proteger nuestros derechos.',
        'Los datos se comparten únicamente con proveedores de servicios confiables bajo acuerdos de confidencialidad.'
      ]
    },
    {
      title: 'Tus Derechos',
      icon: Eye,
      color: 'from-orange-500 to-orange-600',
      content: [
        'Tienes derecho a acceder a tus datos personales almacenados en el sistema.',
        'Puedes solicitar la corrección de información inexacta o incompleta.',
        'Tienes derecho a solicitar la eliminación de tus datos personales.',
        'Puedes retirar tu consentimiento en cualquier momento contactando al administrador.'
      ]
    },
    {
      title: 'Retención de Datos',
      icon: FileText,
      color: 'from-indigo-500 to-indigo-600',
      content: [
        'Conservamos tus datos personales solo durante el tiempo necesario para cumplir con los propósitos descritos.',
        'Los datos de tickets y conversaciones se mantienen por un período de 2 años.',
        'Los datos de usuarios activos se conservan mientras mantengan una cuenta activa.',
        'Algunos datos pueden conservarse por períodos más largos por razones legales o de seguridad.'
      ]
    }
  ];

  const contactInfo = [
    {
      title: 'Administrador del Sistema',
      description: 'Para consultas sobre privacidad y datos personales',
      contact: 'admin@portalti.com'
    },
    {
      title: 'Soporte Técnico',
      description: 'Para problemas técnicos y acceso a datos',
      contact: 'soporte@portalti.com'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            🔒 Política de Privacidad - PortalTI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-3xl">
            Esta política describe cómo recopilamos, usamos y protegemos tu información personal en el sistema PortalTI.
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </span>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
          </div>
        </div>

        {/* Aviso Importante */}
        <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Aviso Importante
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                Al usar PortalTI, aceptas esta política de privacidad. Si no estás de acuerdo con alguna parte de esta política, 
                no uses nuestro servicio. Te recomendamos revisar esta política periódicamente para estar informado sobre cómo protegemos tu información.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {privacySections.map((section, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${section.color}`}></div>
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className={`p-4 rounded-lg bg-gradient-to-r ${section.color} text-white mr-6`}>
                    <section.icon className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-4">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {item}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Contacto para Asuntos de Privacidad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {info.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {info.description}
                </p>
                <a
                  href={`mailto:${info.contact}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {info.contact}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Information */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Información Legal
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Responsable del Tratamiento:</strong> PortalTI - Sistema de Gestión Tecnológica
            </p>
            <p>
              <strong>Base Legal:</strong> Consentimiento del usuario y cumplimiento de obligaciones contractuales
            </p>
            <p>
              <strong>Autoridad de Control:</strong> Agencia de Protección de Datos Personales (Chile)
            </p>
            <p>
              <strong>Derechos del Usuario:</strong> Acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ¿Tienes preguntas sobre esta política de privacidad?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              Contactar Soporte
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Shield className="w-5 h-5 mr-2" />
              Ver Documentación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
