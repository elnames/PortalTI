// src/utils/evidenceUtils.js
import api from '../services/api';

/**
 * Convierte una URL relativa de evidencia a una URL absoluta
 * @param {string} evidenceUrl - URL de la evidencia (puede ser relativa o absoluta)
 * @returns {string} URL absoluta de la evidencia
 */
export const getAbsoluteEvidenceUrl = (evidenceUrl) => {
    if (!evidenceUrl) return '';

    // Si ya es una URL absoluta, devolverla tal como está
    if (evidenceUrl.startsWith('http')) {
        return evidenceUrl;
    }

    // Construir URL absoluta
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5266/api';
    const apiBaseUrl = baseURL.replace('/api', '');

    return `${apiBaseUrl}${evidenceUrl}`;
};

/**
 * Obtiene la URL de evidencia con autenticación incluida
 * @param {string} evidenceUrl - URL de la evidencia
 * @returns {string} URL con token de autenticación
 */
export const getAuthenticatedEvidenceUrl = (evidenceUrl) => {
    if (!evidenceUrl) return '';

    const absoluteUrl = getAbsoluteEvidenceUrl(evidenceUrl);
    if (!absoluteUrl) return '';

    // Si ya tiene parámetros de query, agregar el token
    const separator = absoluteUrl.includes('?') ? '&' : '?';
    const token = localStorage.getItem('token');

    if (token) {
        return `${absoluteUrl}${separator}access_token=${token}`;
    }

    return absoluteUrl;
};

/**
 * Abre una evidencia en una nueva pestaña
 * @param {string} evidenceUrl - URL de la evidencia
 */
export const openEvidenceInNewTab = (evidenceUrl) => {
    const authenticatedUrl = getAuthenticatedEvidenceUrl(evidenceUrl);
    if (authenticatedUrl) {
        window.open(authenticatedUrl, '_blank');
    }
};

/**
 * Descarga una evidencia usando fetch con autenticación
 * @param {string} evidenceUrl - URL de la evidencia
 * @param {string} filename - Nombre del archivo para descarga
 */
export const downloadEvidence = async (evidenceUrl, filename = 'evidencia') => {
    if (!evidenceUrl) return;

    try {
        // Usar fetch con autenticación para descargar
        const token = localStorage.getItem('token');
        const absoluteUrl = getAbsoluteEvidenceUrl(evidenceUrl);

        const response = await fetch(absoluteUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Limpiar el objeto URL
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al descargar evidencia:', error);

        // Fallback: abrir en nueva pestaña con URL autenticada
        try {
            const authenticatedUrl = getAuthenticatedEvidenceUrl(evidenceUrl);
            window.open(authenticatedUrl, '_blank');
        } catch (fallbackError) {
            console.error('Error en fallback de descarga:', fallbackError);
        }
    }
};
