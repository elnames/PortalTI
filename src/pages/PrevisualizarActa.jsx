// src/pages/PrevisualizarActa.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye } from 'lucide-react';
import { actasAPI } from '../services/api';

export default function PrevisualizarActa() {
    const { actaId } = useParams();
    const navigate = useNavigate();
    const [popupBlocked, setPopupBlocked] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    useEffect(() => {
        const previsualizarActa = async () => {
            try {
                const response = await actasAPI.previsualizarActaFirmado(actaId);

                // Crear blob del PDF
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);

                // Guardar la URL para uso posterior
                setPdfUrl(url);

                // Intentar abrir el PDF en una nueva ventana
                const popup = window.open(url, '_blank');

                if (popup) {
                    // Si se abrió correctamente, limpiar y regresar
                    setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                        navigate(-1);
                    }, 2000);
                } else {
                    // Si el popup fue bloqueado, mostrar mensaje y mantener en la página
                    setPopupBlocked(true);
                    console.log('Popup bloqueado por el navegador');
                }

            } catch (error) {
                console.error('Error al previsualizar el acta:', error);
                // No regresar automáticamente en caso de error
            }
        };

        if (actaId) {
            previsualizarActa();
        }

        // Cleanup: limpiar URL cuando el componente se desmonte
        return () => {
            if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [actaId, navigate]);

    return (
        <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Previsualizando Acta
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {popupBlocked
                            ? 'El navegador bloqueó la ventana automática. Usa los botones de abajo.'
                            : 'Abriendo el acta en una nueva ventana...'
                        }
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center">
                    <Eye className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Previsualizando Acta #{actaId}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        El acta se está abriendo en una nueva ventana. Si no se abre automáticamente,
                        puedes hacer clic en el botón de abajo.
                    </p>

                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => {
                                if (pdfUrl) {
                                    window.open(pdfUrl, '_blank');
                                } else {
                                    alert('El acta no está disponible. Por favor, intenta descargarlo.');
                                }
                            }}
                            disabled={!pdfUrl}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${pdfUrl
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                }`}
                        >
                            <Eye className="h-4 w-4" />
                            <span>Abrir Acta</span>
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    // Si ya tenemos el PDF cargado, usarlo directamente
                                    if (pdfUrl) {
                                        const a = document.createElement('a');
                                        a.href = pdfUrl;
                                        a.download = `acta-${actaId}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    } else {
                                        // Si no tenemos el PDF, descargarlo del servidor
                                        const response = await actasAPI.descargarActa(actaId);
                                        const blob = new Blob([response.data], { type: 'application/pdf' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `acta-${actaId}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                    }
                                } catch (error) {
                                    console.error('Error al descargar el acta:', error);
                                    alert('Error al descargar el acta. Por favor, intenta nuevamente.');
                                }
                            }}
                            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            <span>Descargar</span>
                        </button>

                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Volver</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
