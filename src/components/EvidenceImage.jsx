import React, { useState, useEffect } from 'react';
import { createEvidenceObjectUrl } from '../utils/evidenceProxy';

export default function EvidenceImage({
    evidenceUrl,
    alt = 'Evidencia',
    className = '',
    onClick = null,
    onError = null
}) {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!evidenceUrl) {
            setLoading(false);
            return;
        }

        const loadImage = async () => {
            try {
                setLoading(true);
                setError(null);

                // Crear URL de objeto usando la API autenticada
                const objectUrl = await createEvidenceObjectUrl(evidenceUrl);
                setImageUrl(objectUrl);
            } catch (err) {
                console.error('Error al cargar evidencia:', err);
                setError(err.message);
                if (onError) onError(err);
            } finally {
                setLoading(false);
            }
        };

        loadImage();

        // Cleanup: revocar la URL del objeto cuando el componente se desmonte
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [evidenceUrl, onError]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg ${className}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 ${className}`}>
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs text-center">Error al cargar</div>
            </div>
        );
    }

    if (!imageUrl) {
        return null;
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            className={className}
            onClick={onClick}
        />
    );
}
