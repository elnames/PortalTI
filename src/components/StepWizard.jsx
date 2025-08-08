// src/components/StepWizard.jsx

// Aquí defines tus pasos  
const STEPS = [
  { id: 1, title: 'Datos básicos' },
  { id: 2, title: 'Detalles específicos' },
  { id: 3, title: 'Revisión y envío' },
];

export default function StepWizard({ current }) {
  return (
    <div className="flex items-center space-x-4 mb-8">
      {STEPS.map((step) => (
        <div key={step.id} className="flex-1">
          <div className={`
            text-center py-2 rounded-full border 
            ${step.id === current
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-500 border-gray-300'}
          `}>
            {step.id}. {step.title}
          </div>
        </div>
      ))}
    </div>
  );
}
