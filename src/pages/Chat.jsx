import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Users, Ticket, Send, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import GenerarTicketModal from '../components/GenerarTicketModal';
import RemoteControlButton from '../components/RemoteControlButton';
import RustDeskModal from '../components/RustDeskModal';
import useChatSignalR from '../hooks/useChatSignalR';

const Chat = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { onMessageReceived, onConversationReceived, isConnected } = useChatSignalR();
    const [conversaciones, setConversaciones] = useState([]);
    const [conversacionesArchivadas, setConversacionesArchivadas] = useState([]);
    const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingArchivadas, setIsLoadingArchivadas] = useState(false);
    const [showNuevaConversacion, setShowNuevaConversacion] = useState(false);
    const [showGenerarTicketModal, setShowGenerarTicketModal] = useState(false);
    const [showRustDeskModal, setShowRustDeskModal] = useState(false);
    const [activeTab, setActiveTab] = useState('activas'); // 'activas' o 'archivadas'
    const [conversacionArchivada, setConversacionArchivada] = useState(false);
    const [nuevaConversacion, setNuevaConversacion] = useState({
        mensajeInicial: '',
        soporteId: null
    });
    const [soporteDisponible, setSoporteDisponible] = useState([]);
    const [activosAsignados, setActivosAsignados] = useState([]);

    const isAdminOrSoporte = user?.role === 'admin' || user?.role === 'soporte';

    useEffect(() => {
        cargarConversaciones();
        if (!isAdminOrSoporte) {
            cargarSoporteDisponible();
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'archivadas') {
            cargarConversacionesArchivadas();
        }
    }, [activeTab]);

    // Detectar si la conversación seleccionada está archivada
    useEffect(() => {
        if (conversacionSeleccionada) {
            // Si estamos en la pestaña de archivadas, la conversación está archivada
            if (activeTab === 'archivadas') {
                setConversacionArchivada(true);
            } else {
                // Si estamos en la pestaña de activas, verificar si está en la lista de archivadas
                const estaArchivada = conversacionesArchivadas.some(c => c.id === conversacionSeleccionada.id);
                setConversacionArchivada(estaArchivada);
            }
        } else {
            setConversacionArchivada(false);
        }
    }, [conversacionSeleccionada, activeTab, conversacionesArchivadas]);

    useEffect(() => {
        if (conversacionSeleccionada) {
            cargarMensajes(conversacionSeleccionada.id);
            cargarActivosUsuario(conversacionSeleccionada.id);
            // Marcar mensajes como leídos cuando se selecciona la conversación
            marcarMensajesComoLeidos(conversacionSeleccionada.id);
        }
    }, [conversacionSeleccionada]);

    // Configurar SignalR para mensajes en tiempo real
    useEffect(() => {
        if (conversacionSeleccionada) {
            const unsubscribe = onMessageReceived(conversacionSeleccionada.id, (nuevoMensaje) => {
                console.log('Nuevo mensaje recibido en tiempo real:', nuevoMensaje);
                setMensajes(prev => {
                    // Verificar si el mensaje ya existe para evitar duplicados
                    const mensajeExiste = prev.some(m => m.id === nuevoMensaje.id);
                    if (mensajeExiste) {
                        return prev;
                    }
                    return [...prev, nuevoMensaje];
                });
            });

            return unsubscribe;
        }
    }, [conversacionSeleccionada, onMessageReceived]);

    // Configurar SignalR para nuevas conversaciones
    useEffect(() => {
        const unsubscribe = onConversationReceived((nuevaConversacion) => {
            console.log('Nueva conversación recibida en tiempo real:', nuevaConversacion);
            setConversaciones(prev => {
                // Verificar si la conversación ya existe
                const conversacionExiste = prev.some(c => c.id === nuevaConversacion.id);
                if (conversacionExiste) {
                    // Actualizar la conversación existente
                    return prev.map(c => c.id === nuevaConversacion.id ? nuevaConversacion : c);
                } else {
                    // Agregar la nueva conversación al inicio
                    return [nuevaConversacion, ...prev];
                }
            });
        });

        return unsubscribe;
    }, [onConversationReceived]);

    const cargarConversaciones = async () => {
        try {
            setIsLoading(true);
            const response = await chatAPI.getConversaciones();
            setConversaciones(response.data);
        } catch (error) {
            console.error('Error al cargar conversaciones:', error);
            showToast('Error al cargar las conversaciones', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const cargarConversacionesArchivadas = async () => {
        try {
            setIsLoadingArchivadas(true);
            const response = await chatAPI.getConversacionesArchivadas();
            setConversacionesArchivadas(response.data);
        } catch (error) {
            console.error('Error al cargar conversaciones archivadas:', error);
            showToast('Error al cargar las conversaciones archivadas', 'error');
        } finally {
            setIsLoadingArchivadas(false);
        }
    };

    const cargarSoporteDisponible = async () => {
        try {
            const response = await chatAPI.getSoporteDisponible();
            setSoporteDisponible(response.data);
        } catch (error) {
            console.error('Error al cargar soporte disponible:', error);
            showToast('Error al cargar la lista de soporte', 'error');
        }
    };

    const cargarActivosUsuario = async (conversacionId) => {
        try {
            const response = await chatAPI.getActivosUsuario(conversacionId);
            setActivosAsignados(response.data.activosAsignados || []);
        } catch (error) {
            console.error('Error al cargar activos del usuario:', error);
            setActivosAsignados([]);
        }
    };

    const cargarMensajes = async (conversacionId) => {
        try {
            const response = await chatAPI.getMensajes(conversacionId);
            setMensajes(response.data);
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
            showToast('Error al cargar los mensajes', 'error');
        }
    };

    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim() || !conversacionSeleccionada) return;

        try {
            await chatAPI.enviarMensaje(conversacionSeleccionada.id, {
                contenido: nuevoMensaje,
                esInterno: false
            });

            // El mensaje se agregará automáticamente a través de SignalR
            setNuevoMensaje('');

            // Recargar conversaciones para actualizar el último mensaje
            cargarConversaciones();
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            showToast('Error al enviar el mensaje', 'error');
        }
    };

    const crearConversacion = async (e) => {
        e.preventDefault();
        if (!nuevaConversacion.soporteId) {
            showToast('Debes seleccionar un soporte', 'error');
            return;
        }

        try {
            const response = await chatAPI.crearConversacion(nuevaConversacion);
            setConversaciones(prev => [response.data, ...prev]);
            setConversacionSeleccionada(response.data);
            setShowNuevaConversacion(false);
            setNuevaConversacion({ mensajeInicial: '', soporteId: null });
            showToast('Conversación creada exitosamente', 'success');
        } catch (error) {
            console.error('Error al crear conversación:', error);
            showToast('Error al crear la conversación', 'error');
        }
    };

    const cerrarConversacion = async () => {
        if (!conversacionSeleccionada) return;

        try {
            await chatAPI.cerrarConversacion(conversacionSeleccionada.id);
            setConversacionSeleccionada(null);
            setMensajes([]);
            cargarConversaciones();
            showToast('Conversación cerrada exitosamente', 'success');
        } catch (error) {
            console.error('Error al cerrar conversación:', error);
            showToast('Error al cerrar la conversación', 'error');
        }
    };

    const generarTicket = () => {
        if (!conversacionSeleccionada) return;
        setShowGenerarTicketModal(true);
    };

    const handleTicketGenerado = (ticket) => {
        showToast(`Ticket #${ticket.id} generado exitosamente`, 'success');
        // Opcional: recargar conversaciones o redirigir al ticket
    };

    // Funciones para gestión de chats y mensajes
    const archivarConversacion = async () => {
        if (!conversacionSeleccionada) return;

        try {
            await chatAPI.archivarConversacion(conversacionSeleccionada.id);
            showToast('Conversación archivada exitosamente', 'success');
            cargarConversaciones();
            cargarConversacionesArchivadas();
            // Cerrar la conversación automáticamente
            setConversacionSeleccionada(null);
            setMensajes([]);
        } catch (error) {
            console.error('Error al archivar conversación:', error);
            showToast('Error al archivar la conversación', 'error');
        }
    };

    const desarchivarConversacion = async (conversacionId) => {
        try {
            await chatAPI.desarchivarConversacion(conversacionId);
            showToast('Conversación desarchivada exitosamente', 'success');
            cargarConversaciones();
            cargarConversacionesArchivadas();
            // Cerrar la conversación automáticamente
            setConversacionSeleccionada(null);
            setMensajes([]);
        } catch (error) {
            console.error('Error al desarchivar conversación:', error);
            showToast('Error al desarchivar la conversación', 'error');
        }
    };

    const eliminarConversacion = async () => {
        if (!conversacionSeleccionada) return;

        if (!window.confirm('¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await chatAPI.eliminarConversacion(conversacionSeleccionada.id);
            showToast('Conversación eliminada exitosamente', 'success');
            cargarConversaciones();
            setConversacionSeleccionada(null);
        } catch (error) {
            console.error('Error al eliminar conversación:', error);
            showToast('Error al eliminar la conversación', 'error');
        }
    };

    const eliminarMensaje = async (mensajeId) => {
        // Solo admin y soporte pueden eliminar mensajes
        if (!isAdminOrSoporte) {
            showToast('No tienes permisos para eliminar mensajes', 'error');
            return;
        }

        if (!window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
            return;
        }

        try {
            await chatAPI.eliminarMensaje(mensajeId);
            showToast('Mensaje eliminado exitosamente', 'success');
            cargarMensajes(conversacionSeleccionada.id);
        } catch (error) {
            console.error('Error al eliminar mensaje:', error);
            showToast('Error al eliminar el mensaje', 'error');
        }
    };

    const marcarMensajesComoLeidos = async (conversacionId) => {
        try {
            await chatAPI.marcarMensajesComoLeidos(conversacionId);
            // Actualizar la lista de conversaciones para reflejar los cambios
            cargarConversaciones();
        } catch (error) {
            console.error('Error al marcar mensajes como leídos:', error);
        }
    };

    const handleChatSelect = (conversacion) => {
        setConversacionSeleccionada(conversacion);
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEstadoIcon = (estado) => {
        switch (estado) {
            case 'Activa':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'Pendiente':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'Cerrada':
                return <X className="w-4 h-4 text-gray-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Chat con Soporte
                    </h1>
                </div>
                {!isAdminOrSoporte && (
                    <button
                        onClick={() => setShowNuevaConversacion(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Conversación</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Lista de conversaciones */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                    {/* Pestañas */}
                    <div className="flex space-x-1 mb-4">
                        <button
                            onClick={() => setActiveTab('activas')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'activas'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Activas
                        </button>
                        <button
                            onClick={() => setActiveTab('archivadas')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'archivadas'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Archivadas
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {activeTab === 'activas' ? (
                            // Conversaciones activas
                            conversaciones.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No hay conversaciones activas
                                </p>
                            ) : (
                                conversaciones.map((conversacion) => (
                                    <div
                                        key={conversacion.id}
                                        onClick={() => setConversacionSeleccionada(conversacion)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${conversacionSeleccionada?.id === conversacion.id
                                            ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600'
                                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {conversacion.titulo}
                                            </h3>
                                            {getEstadoIcon(conversacion.estado)}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {conversacion.ultimoMensaje?.contenido || 'Sin mensajes'}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>{conversacion.usuario?.username || 'Usuario'}</span>
                                            <span>{formatearFecha(conversacion.fechaCreacion)}</span>
                                        </div>
                                        {conversacion.mensajesNoLeidos > 0 && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                                    {conversacion.mensajesNoLeidos} nuevo(s)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        ) : (
                            // Conversaciones archivadas
                            isLoadingArchivadas ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            ) : conversacionesArchivadas.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No hay conversaciones archivadas
                                </p>
                            ) : (
                                conversacionesArchivadas.map((conversacion) => (
                                    <div
                                        key={conversacion.id}
                                        onClick={() => setConversacionSeleccionada(conversacion)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${conversacionSeleccionada?.id === conversacion.id
                                            ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600'
                                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {conversacion.titulo}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                {getEstadoIcon(conversacion.estado)}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        desarchivarConversacion(conversacion.id);
                                                    }}
                                                    className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="Desarchivar"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {conversacion.ultimoMensaje?.contenido || 'Sin mensajes'}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>{conversacion.usuario?.username || 'Usuario'}</span>
                                            <span>{formatearFecha(conversacion.fechaCreacion)}</span>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* Chat */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col">
                    {conversacionSeleccionada ? (
                        <>
                            {/* Header del chat */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {conversacionSeleccionada.titulo}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {conversacionSeleccionada.usuario?.username || 'Usuario'} • {conversacionSeleccionada.estado}
                                            </p>
                                            <div className="flex items-center space-x-1">
                                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {isConnected ? 'En línea' : 'Desconectado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                                        {isAdminOrSoporte && (
                                            <>
                                                <RemoteControlButton
                                                    conversacion={conversacionSeleccionada}
                                                    activosAsignados={activosAsignados}
                                                />
                                                <button
                                                    onClick={generarTicket}
                                                    className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-medium hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg transform-gpu"
                                                >
                                                    <Ticket className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Generar Ticket</span>
                                                    <span className="sm:hidden">Ticket</span>
                                                </button>
                                            </>
                                        )}

                                        {/* Botones de gestión de conversación */}
                                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                                            {conversacionArchivada ? (
                                                <button
                                                    onClick={() => desarchivarConversacion(conversacionSeleccionada.id)}
                                                    className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg transform-gpu"
                                                    title="Desarchivar conversación"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                                                    </svg>
                                                    <span className="hidden sm:inline">Desarchivar</span>
                                                    <span className="sm:hidden">Desarch</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={archivarConversacion}
                                                    className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg text-sm font-medium hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg transform-gpu"
                                                    title="Archivar conversación"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
                                                    </svg>
                                                    <span className="hidden sm:inline">Archivar</span>
                                                    <span className="sm:hidden">Archivar</span>
                                                </button>
                                            )}

                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={eliminarConversacion}
                                                    className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg transform-gpu"
                                                    title="Eliminar conversación"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    <span className="hidden sm:inline">Eliminar</span>
                                                    <span className="sm:hidden">Elim</span>
                                                </button>
                                            )}

                                            <button
                                                onClick={cerrarConversacion}
                                                className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg text-sm font-medium hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg transform-gpu"
                                            >
                                                <X className="w-4 h-4" />
                                                <span className="hidden sm:inline">Cerrar</span>
                                                <span className="sm:hidden">Cerrar</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mensajes */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                {mensajes.length === 0 ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                        <p>No hay mensajes en esta conversación</p>
                                    </div>
                                ) : (
                                    mensajes.map((mensaje) => (
                                        <div
                                            key={mensaje.id}
                                            className={`flex ${mensaje.creadoPor.id === user?.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${mensaje.creadoPor.id === user?.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs font-medium">
                                                            {mensaje.creadoPor?.username || 'Usuario'}
                                                        </span>
                                                        <span className="text-xs opacity-75">
                                                            {formatearFecha(mensaje.fechaCreacion)}
                                                        </span>
                                                    </div>

                                                    {/* Botón eliminar mensaje - solo visible para admin/soporte */}
                                                    {isAdminOrSoporte && (
                                                        <button
                                                            onClick={() => eliminarMensaje(mensaje.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs p-1 rounded hover:bg-red-500 hover:text-white"
                                                            title="Eliminar mensaje"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-sm">
                                                    {mensaje.contenido.includes('[CONFIGURAR_RUSTDESK_MODAL]') ? (
                                                        <div>
                                                            <p className="mb-3">
                                                                {mensaje.contenido.replace('[CONFIGURAR_RUSTDESK_MODAL]', '')}
                                                            </p>
                                                            <button
                                                                onClick={() => setShowRustDeskModal(true)}
                                                                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                                            >
                                                                🔧 Ver Instrucciones de Configuración
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p>{mensaje.contenido}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input de mensaje */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <form onSubmit={enviarMensaje} className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!nuevoMensaje.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-lg">Selecciona una conversación para comenzar</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para nueva conversación */}
            {showNuevaConversacion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Nueva Conversación
                            </h2>
                            <button
                                onClick={() => setShowNuevaConversacion(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={crearConversacion}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Seleccionar Soporte *
                                    </label>
                                    <select
                                        value={nuevaConversacion.soporteId || ''}
                                        onChange={(e) => setNuevaConversacion(prev => ({ ...prev, soporteId: e.target.value ? parseInt(e.target.value) : null }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                    >
                                        <option value="">Seleccionar soporte...</option>
                                        {soporteDisponible.map((soporte) => (
                                            <option key={soporte.id} value={soporte.id}>
                                                {soporte.username} ({soporte.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Mensaje inicial (opcional)
                                    </label>
                                    <textarea
                                        value={nuevaConversacion.mensajeInicial}
                                        onChange={(e) => setNuevaConversacion(prev => ({ ...prev, mensajeInicial: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Escribe tu mensaje inicial..."
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowNuevaConversacion(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Crear Conversación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para generar ticket */}
            <GenerarTicketModal
                isOpen={showGenerarTicketModal}
                onClose={() => setShowGenerarTicketModal(false)}
                conversacion={conversacionSeleccionada}
                onTicketGenerado={handleTicketGenerado}
            />

            {/* Modal de configuración de RustDesk */}
            <RustDeskModal
                isOpen={showRustDeskModal}
                onClose={() => setShowRustDeskModal(false)}
                conversacionId={conversacionSeleccionada?.id}
                onCredencialesEnviadas={(credenciales) => {
                    console.log('Credenciales enviadas:', credenciales);
                    // Recargar mensajes para mostrar las credenciales
                    if (conversacionSeleccionada) {
                        cargarMensajes(conversacionSeleccionada.id);
                    }
                }}
            />
        </div>
    );
};

export default Chat;
