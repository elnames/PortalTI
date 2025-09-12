// src/hooks/usePazYSalvoNotifications.js
import { useEffect, useCallback } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import useNotifications from './useNotifications';

export const usePazYSalvoNotifications = () => {
    const {
        notifyPazYSalvoCreated,
        notifyPazYSalvoEnviadoAFirma,
        notifyPazYSalvoFirmado,
        notifyPazYSalvoAprobado,
        notifyPazYSalvoRechazado,
        notifyPazYSalvoCerrado,
        notifyPazYSalvoObservado,
        notifyPazYSalvoExcepcionCreada
    } = useNotificationContext();

    const { user } = useAuth();
    const { connection } = useNotifications();

    // Función para manejar notificaciones de Paz y Salvo
    const handlePazYSalvoNotification = useCallback((notification) => {
        console.log('Paz y Salvo notification received:', notification);

        switch (notification.type) {
            case 'PazYSalvoCreated':
                notifyPazYSalvoCreated(notification.data);
                break;
            case 'PazYSalvoEnviadoAFirma':
                notifyPazYSalvoEnviadoAFirma(notification.data);
                break;
            case 'PazYSalvoFirmado':
                notifyPazYSalvoFirmado(notification.data.pazYSalvo, notification.data.firmante);
                break;
            case 'PazYSalvoAprobado':
                notifyPazYSalvoAprobado(notification.data);
                break;
            case 'PazYSalvoRechazado':
                notifyPazYSalvoRechazado(notification.data.pazYSalvo, notification.data.motivo);
                break;
            case 'PazYSalvoCerrado':
                notifyPazYSalvoCerrado(notification.data);
                break;
            case 'PazYSalvoObservado':
                notifyPazYSalvoObservado(notification.data.pazYSalvo, notification.data.observacion);
                break;
            case 'PazYSalvoExcepcionCreada':
                notifyPazYSalvoExcepcionCreada(notification.data.pazYSalvo, notification.data.excepcion);
                break;
            default:
                console.log('Unknown Paz y Salvo notification type:', notification.type);
        }
    }, [
        notifyPazYSalvoCreated,
        notifyPazYSalvoEnviadoAFirma,
        notifyPazYSalvoFirmado,
        notifyPazYSalvoAprobado,
        notifyPazYSalvoRechazado,
        notifyPazYSalvoCerrado,
        notifyPazYSalvoObservado,
        notifyPazYSalvoExcepcionCreada
    ]);

    // Suscribirse automáticamente a notificaciones de Paz y Salvo cuando la conexión esté disponible
    useEffect(() => {
        if (!connection || !user) return;

        console.log('Setting up Paz y Salvo notifications for user:', user.id, 'role:', user.role);

        // Suscribirse a notificaciones generales de Paz y Salvo
        connection.on('PazYSalvoNotification', handlePazYSalvoNotification);

        // Suscribirse a notificaciones específicas por rol
        if (user.role === 'admin' || user.role === 'rrhh') {
            connection.on('PazYSalvoCreated', (data) => {
                handlePazYSalvoNotification({ type: 'PazYSalvoCreated', data });
            });
        }

        if (user.role === 'admin' || user.role === 'ti' || user.role === 'rrhh') {
            connection.on('PazYSalvoEnviadoAFirma', (data) => {
                handlePazYSalvoNotification({ type: 'PazYSalvoEnviadoAFirma', data });
            });
        }

        if (user.role === 'admin' || user.role === 'ti' || user.role === 'rrhh') {
            connection.on('PazYSalvoFirmado', (data) => {
                handlePazYSalvoNotification({ type: 'PazYSalvoFirmado', data });
            });
        }

        if (user.role === 'admin' || user.role === 'rrhh') {
            connection.on('PazYSalvoAprobado', (data) => {
                handlePazYSalvoNotification({ type: 'PazYSalvoAprobado', data });
            });
        }

        if (user.role === 'admin' || user.role === 'rrhh') {
            connection.on('PazYSalvoRechazado', (data) => {
                handlePazYSalvoNotification({ type: 'PazYSalvoRechazado', data });
            });
        }

        if (user.role === 'admin' || user.role === 'rrhh') {
            connection.on('PazYSalvoCerrado', (data) => {
                handlePazYSalvoNotification({ type: 'PazYSalvoCerrado', data });
            });
        }

        if (user.role === 'admin' || user.role === 'ti' || user.role === 'rrhh') {
            connection.on('PazYSalvoObservado', (data) => {
                handlePazYSalvoNotification({ type: 'PazYSalvoObservado', data });
            });
        }

        if (user.role === 'admin' || user.role === 'rrhh') {
            connection.on('PazYSalvoExcepcionCreada', (data) => {
                handlePazYSalvoNotification({ type: 'PazYSalvoExcepcionCreada', data });
            });
        }

        return () => {
            // Limpiar listeners al desmontar
            connection.off('PazYSalvoNotification');
            connection.off('PazYSalvoCreated');
            connection.off('PazYSalvoEnviadoAFirma');
            connection.off('PazYSalvoFirmado');
            connection.off('PazYSalvoAprobado');
            connection.off('PazYSalvoRechazado');
            connection.off('PazYSalvoCerrado');
            connection.off('PazYSalvoObservado');
            connection.off('PazYSalvoExcepcionCreada');
        };
    }, [connection, user, handlePazYSalvoNotification]);

    return {
        handlePazYSalvoNotification
    };
};
