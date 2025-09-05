import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { downloadEvidenceViaAPI, createEvidenceObjectUrl } from '../utils/evidenceProxy';

export default function EvidenceModal({ isOpen, onClose, evidenceUrl, evidenceName = 'evidencia' }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !evidenceUrl) {
            setImageUrl(null);
            setError(null);
            return;
        }

        const loadImage = async () => {
            try {
                setLoading(true);
                setError(null);
                const objectUrl = await createEvidenceObjectUrl(evidenceUrl);
                setImageUrl(objectUrl);
            } catch (err) {
                console.error('Error al cargar evidencia:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadImage();

        // Cleanup
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [isOpen, evidenceUrl]);

    if (!isOpen || !evidenceUrl) return null;

    const handleDownload = () => {
        downloadEvidenceViaAPI(evidenceUrl, evidenceName);
    };

    const handleOpenInNewTab = () => {
        if (imageUrl) {
            window.open(imageUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-[90vh] w-full">
                {/* Header del modal */}
                <div className="absolute top-4 right-4 z-10 flex space-x-2">
                    <button
                        onClick={handleDownload}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Descargar imagen"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleOpenInNewTab}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Abrir en nueva pestaña"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Imagen */}
                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                    {loading && (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <div className="text-6xl mb-4">📷</div>
                            <h3 className="text-lg font-semibold mb-2">Error al cargar la imagen</h3>
                            <p className="text-sm">No se pudo cargar la evidencia. Verifica que el archivo exista.</p>
                            <p className="text-xs mt-2 text-red-500">{error}</p>
                        </div>
                    )}

                    {imageUrl && !loading && !error && (
                        <img
                            src={imageUrl}
                            alt={evidenceName}
                            className="max-w-full max-h-[80vh] object-contain mx-auto block"
                        />
                    )}
                </div>

                {/* Footer con información */}
                <div className="mt-4 text-center">
                    <p className="text-white text-sm opacity-75">
                        {evidenceName} • Haz clic en los botones para descargar o abrir en nueva pestaña
                    </p>
                </div>
            </div>
        </div>
    );
}
