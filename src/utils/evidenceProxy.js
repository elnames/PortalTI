// src/utils/evidenceProxy.js
import api from '../services/api';

/**
 * Obtiene una evidencia como blob usando la API autenticada
 * @param {string} evidenceUrl - URL de la evidencia
 * @returns {Promise<Blob>} Blob de la imagen
 */
export const getEvidenceAsBlob = async (evidenceUrl) => {
    if (!evidenceUrl) throw new Error('URL de evidencia no proporcionada');

    // Extraer el nombre del archivo de la URL
    const fileName = evidenceUrl.split('/').pop();
    if (!fileName) throw new Error('No se pudo extraer el nombre del archivo');

    try {
        // Usar el endpoint de preview que ya existe
        const response = await api.get(`/securefile/preview/evidence/${fileName}`, {
            responseType: 'blob'
        });

        return response.data;
    } catch (error) {
        console.error('Error al obtener evidencia:', error);
        throw error;
    }
};

/**
 * Crea una URL de objeto para una evidencia
 * @param {string} evidenceUrl - URL de la evidencia
 * @returns {Promise<string>} URL del objeto blob
 */
export const createEvidenceObjectUrl = async (evidenceUrl) => {
    try {
        const blob = await getEvidenceAsBlob(evidenceUrl);
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error al crear URL de objeto:', error);
        throw error;
    }
};

/**
 * Descarga una evidencia usando la API autenticada
 * @param {string} evidenceUrl - URL de la evidencia
 * @param {string} filename - Nombre del archivo para descarga
 */
export const downloadEvidenceViaAPI = async (evidenceUrl, filename = 'evidencia') => {
    try {
        const blob = await getEvidenceAsBlob(evidenceUrl);
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Limpiar el objeto URL
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al descargar evidencia:', error);
        throw error;
    }
};
