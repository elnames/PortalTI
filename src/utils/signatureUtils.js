// src/utils/signatureUtils.js
import React from 'react';
import api from '../services/api';

/**
 * Obtiene una firma como blob usando la API autenticada
 * @param {string} signaturePath - Ruta de la firma (ej: /storage/signatures/signature_123.png)
 * @returns {Promise<Blob>} Blob de la imagen de la firma
 */
export const getSignatureAsBlob = async (signaturePath) => {
    if (!signaturePath) throw new Error('Ruta de firma no proporcionada');

    // Extraer el nombre del archivo de la ruta
    const fileName = signaturePath.split('/').pop();
    if (!fileName) throw new Error('No se pudo extraer el nombre del archivo de la firma');

    try {
        // Usar el endpoint de preview que ya existe para archivos seguros
        const response = await api.get(`/securefile/preview/signatures/${fileName}`, {
            responseType: 'blob'
        });

        return response.data;
    } catch (error) {
        console.error('Error al obtener firma:', error);
        throw error;
    }
};

/**
 * Crea una URL de objeto para una firma
 * @param {string} signaturePath - Ruta de la firma
 * @returns {Promise<string>} URL del objeto blob
 */
export const getSignatureObjectUrl = async (signaturePath) => {
    try {
        const blob = await getSignatureAsBlob(signaturePath);
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error al crear URL de objeto para firma:', error);
        throw error;
    }
};

/**
 * Obtiene la URL absoluta de una firma para mostrar en img src
 * @param {string} signaturePath - Ruta de la firma
 * @returns {string} URL absoluta de la firma
 */
export const getAbsoluteSignatureUrl = (signaturePath) => {
    if (!signaturePath) return null;
    
    // Si ya es una URL completa, devolverla tal como está
    if (signaturePath.startsWith('http')) {
        return signaturePath;
    }
    
    // Si es una ruta relativa, construir la URL completa
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5266/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    
    // Asegurar que la ruta comience con /
    const normalizedPath = signaturePath.startsWith('/') ? signaturePath : `/${signaturePath}`;
    
    return `${baseUrl}${normalizedPath}`;
};

/**
 * Componente de imagen de firma que maneja errores automáticamente
 * @param {Object} props - Propiedades del componente
 * @param {string} props.signaturePath - Ruta de la firma
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.className - Clases CSS
 * @param {Function} props.onError - Callback de error
 * @returns {JSX.Element} Elemento de imagen
 */
export const SignatureImage = ({ signaturePath, alt = "Firma", className = "", onError, ...props }) => {
    const [imageUrl, setImageUrl] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
        if (!signaturePath) {
            setIsLoading(false);
            return;
        }

        const loadSignature = async () => {
            try {
                setIsLoading(true);
                setHasError(false);
                
                // Intentar cargar la firma usando el sistema seguro
                const url = await getSignatureObjectUrl(signaturePath);
                setImageUrl(url);
            } catch (error) {
                console.error('Error cargando firma:', error);
                setHasError(true);
                if (onError) onError(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSignature();

        // Cleanup: revocar URL del objeto cuando el componente se desmonte
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [signaturePath, onError]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (hasError || !imageUrl) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`}>
                <span className="text-sm">Firma no disponible</span>
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            className={className}
            onError={() => {
                setHasError(true);
                if (onError) onError(new Error('Error cargando imagen'));
            }}
            {...props}
        />
    );
};
