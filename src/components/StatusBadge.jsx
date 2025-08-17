import React from 'react';

const STATUS_MAP = {
  pendiente: { text: 'Pendiente', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  pendiente_de_aprobacion: { text: 'Pendiente de aprobación', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  firmada: { text: 'Firmada', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  aprobada: { text: 'Aprobada', classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rechazada: { text: 'Rechazada', classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  anulada: { text: 'Anulada', classes: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
};

export default function StatusBadge({ estado }) {
  if (!estado) return null;
  const key = String(estado).toLowerCase();
  const normalizedKey = key.replace(/\s+/g, '_');
  const conf = STATUS_MAP[normalizedKey] || STATUS_MAP[key] || { text: estado, classes: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${conf.classes}`}>
      {conf.text}
    </span>
  );
}


