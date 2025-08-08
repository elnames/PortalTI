import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Users, Ticket, Send, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import GenerarTicketModal from '../components/GenerarTicketModal';

const Chat = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [conversaciones, setConversaciones] = useState([]);
    const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showNuevaConversacion, setShowNuevaConversacion] = useState(false);
    const [showGenerarTicketModal, setShowGenerarTicketModal] = useState(false);
    const [nuevaConversacion, setNuevaConversacion] = useState({
        titulo: '',
        descripcion: '',
        mensajeInicial: '',
        soporteId: null
    });
    const [soporteDisponible, setSoporteDisponible] = useState([]);

    const isAdminOrSoporte = user?.role === 'admin' || user?.role === 'soporte';

    useEffect(() => {
        cargarConversaciones();
        if (!isAdminOrSoporte) {
            cargarSoporteDisponible();
        }
    }, []);

    useEffect(() => {
        if (conversacionSeleccionada) {
            cargarMensajes(conversacionSeleccionada.id);
        }
    }, [conversacionSeleccionada]);

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

    const cargarSoporteDisponible = async () => {
        try {
            const response = await chatAPI.getSoporteDisponible();
            setSoporteDisponible(response.data);
        } catch (error) {
            console.error('Error al cargar soporte disponible:', error);
            showToast('Error al cargar la lista de soporte', 'error');
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
            const response = await chatAPI.enviarMensaje(conversacionSeleccionada.id, {
                contenido: nuevoMensaje,
                esInterno: false
            });

            setMensajes(prev => [...prev, response.data]);
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
        if (!nuevaConversacion.titulo.trim() || !nuevaConversacion.soporteId) return;

        try {
            const response = await chatAPI.crearConversacion(nuevaConversacion);
            setConversaciones(prev => [response.data, ...prev]);
            setConversacionSeleccionada(response.data);
            setShowNuevaConversacion(false);
            setNuevaConversacion({ titulo: '', descripcion: '', mensajeInicial: '', soporteId: null });
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
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Conversaciones
                    </h2>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {conversaciones.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                No hay conversaciones
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
                        )}
                    </div>
                </div>

                {/* Chat */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col">
                    {conversacionSeleccionada ? (
                        <>
                            {/* Header del chat */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {conversacionSeleccionada.titulo}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {conversacionSeleccionada.usuario?.username || 'Usuario'} • {conversacionSeleccionada.estado}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {isAdminOrSoporte && (
                                            <button
                                                onClick={generarTicket}
                                                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                            >
                                                <Ticket className="w-4 h-4" />
                                                <span>Generar Ticket</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={cerrarConversacion}
                                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Cerrar</span>
                                        </button>
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
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${mensaje.creadoPor.id === user?.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="text-xs font-medium">
                                                        {mensaje.creadoPor?.username || 'Usuario'}
                                                    </span>
                                                    <span className="text-xs opacity-75">
                                                        {formatearFecha(mensaje.fechaCreacion)}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{mensaje.contenido}</p>
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
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        value={nuevaConversacion.titulo}
                                        onChange={(e) => setNuevaConversacion(prev => ({ ...prev, titulo: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Asunto de la conversación"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={nuevaConversacion.descripcion}
                                        onChange={(e) => setNuevaConversacion(prev => ({ ...prev, descripcion: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Descripción del problema"
                                        rows="3"
                                    />
                                </div>
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
                                        Mensaje inicial
                                    </label>
                                    <textarea
                                        value={nuevaConversacion.mensajeInicial}
                                        onChange={(e) => setNuevaConversacion(prev => ({ ...prev, mensajeInicial: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Mensaje inicial (opcional)"
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
        </div>
    );
};

export default Chat;
