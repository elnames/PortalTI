// src/components/StepWizard.jsx
import { Check, Settings, FileText, CheckCircle } from 'lucide-react';

// Aquí defines tus pasos con iconos
const STEPS = [
  { id: 1, title: 'Datos básicos', icon: Settings, description: 'Información general del activo' },
  { id: 2, title: 'Detalles específicos', icon: FileText, description: 'Especificaciones técnicas' },
  { id: 3, title: 'Revisión y envío', icon: CheckCircle, description: 'Confirmar y guardar' },
];

const USER_STEPS = [
  { id: 1, title: 'Datos básicos', icon: Settings, description: 'Información del usuario' },
  { id: 2, title: 'Detalles específicos', icon: FileText, description: 'Configuración de acceso' },
  { id: 3, title: 'Revisión y envío', icon: CheckCircle, description: 'Confirmar y guardar' },
];

export default function StepWizard({ current, type = 'activo' }) {
  const steps = type === 'usuario' ? USER_STEPS : STEPS;
  
  return (
    <div className="mb-8 pt-6">
      <div className="flex items-start justify-between relative">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1 relative">
            {/* Step Circle */}
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mb-3 z-10
              ${step.id < current
                ? 'bg-green-500 text-white shadow-lg'
                : step.id === current
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }
            `}>
              {step.id < current ? (
                <Check className="w-6 h-6" />
              ) : (
                <step.icon className="w-6 h-6" />
              )}
            </div>

            {/* Step Info */}
            <div className="text-center w-full">
              <div className={`
                text-sm font-semibold transition-colors duration-300
                ${step.id <= current
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
                }
              `}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                {step.description}
              </div>
            </div>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700">
                <div className={`
                  h-full transition-all duration-300
                  ${step.id < current ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                `} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-8">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
