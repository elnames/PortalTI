import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MessageCircle, X, Clock, CheckCircle, AlertCircle, Send, Maximize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useLocation } from 'react-router-dom';
import useChatSignalR from '../hooks/useChatSignalR';

const FloatingChatIcon = ({ onChatSelect }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();
    const isChatPage = location.pathname === '/chat';
    const { onMessageReceived, onConversationReceived } = useChatSignalR();

    const [isOpen, setIsOpen] = useState(false);
    const [conversaciones, setConversaciones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatActivo, setChatActivo] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [cargandoMensajes, setCargandoMensajes] = useState(false);
    const mensajesRef = useRef(null);
    const bottomRef = useRef(null);
    const isNearBottomRef = useRef(true);

    // Cargar conversaciones al montar el componente y mantener actualizado
    useEffect(() => {
        cargarConversaciones();
    }, []);

    // Recargar conversaciones cuando se abre el panel
    useEffect(() => {
        if (isOpen) {
            cargarConversaciones();
        }
    }, [isOpen]);

    // Actualizar mensajes cuando cambia el chat activo
    useEffect(() => {
        if (chatActivo) {
            cargarMensajes(chatActivo.id);
        }
    }, [chatActivo]);

    // Limpiar chat activo cuando se navega a la página de chat
    useEffect(() => {
        if (isChatPage) {
            setChatActivo(null);
            setMensajes([]);
            setNuevoMensaje('');
        }
    }, [isChatPage]);

    // Mantener auto-stick al fondo
    useEffect(() => {
        const el = mensajesRef.current;
        if (!el) return;
        const onScroll = () => {
            const distance = el.scrollHeight - el.clientHeight - el.scrollTop;
            isNearBottomRef.current = distance < 120;
        };
        el.addEventListener('scroll', onScroll);
        onScroll();
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const el = mensajesRef.current;
        if (!el) return;
        if (isNearBottomRef.current) {
            if (bottomRef.current) bottomRef.current.scrollIntoView({ block: 'end' });
            else el.scrollTop = el.scrollHeight;
        }
    }, [mensajes]);

    // Configurar SignalR para mensajes en tiempo real
    useEffect(() => {
        if (chatActivo) {
            const unsubscribe = onMessageReceived(chatActivo.id, (nuevoMensaje) => {
                console.log('FloatingChatIcon: Nuevo mensaje recibido:', nuevoMensaje);
                setMensajes(prev => {
                    // Verificar si el mensaje ya existe para evitar duplicados
                    const mensajeExiste = prev.some(m => m.id === nuevoMensaje.id);
                    if (mensajeExiste) {
                        return prev;
                    }
                    return [...prev, nuevoMensaje];
                });

                // Recargar conversaciones para actualizar el contador de mensajes no leídos
                cargarConversaciones();
            });

            return unsubscribe;
        }
    }, [chatActivo, onMessageReceived]);

    // Actualizar conversaciones cuando se reciben nuevos mensajes del chat activo
    useEffect(() => {
        if (chatActivo) {
            const unsubscribe = onMessageReceived(chatActivo.id, (nuevoMensaje) => {
                // Recargar conversaciones para actualizar el contador
                cargarConversaciones();
            });

            return unsubscribe;
        }
    }, [chatActivo, onMessageReceived]);

    // Configurar SignalR para nuevas conversaciones
    useEffect(() => {
        const unsubscribe = onConversationReceived((nuevaConversacion) => {
            console.log('FloatingChatIcon: Nueva conversación recibida:', nuevaConversacion);
            // Recargar todas las conversaciones para obtener el contador actualizado
            cargarConversaciones();
        });

        return unsubscribe;
    }, [onConversationReceived]);

    // Escuchar mensajes de cualquier conversación para actualizar el contador
    useEffect(() => {
        const handleAnyMessage = (mensaje) => {
            console.log('FloatingChatIcon: Mensaje recibido de cualquier conversación:', mensaje);
            // Actualizar conversaciones para reflejar el nuevo mensaje
            cargarConversaciones();
        };

        if (window.chatHubConnection) {
            window.chatHubConnection.on('ReceiveChatMessage', handleAnyMessage);
        }

        return () => {
            if (window.chatHubConnection) {
                window.chatHubConnection.off('ReceiveChatMessage', handleAnyMessage);
            }
        };
    }, []);

    // Calcular total de mensajes no leídos
    const totalNoLeidos = Array.isArray(conversaciones) ? conversaciones.reduce((total, conv) => total + (conv.mensajesNoLeidos || 0), 0) : 0;

    // Recargar conversaciones periódicamente para mantener el contador actualizado
    useEffect(() => {
        const interval = setInterval(() => {
            cargarConversaciones();
        }, 3000); // Recargar cada 3 segundos

        return () => clearInterval(interval);
    }, []);

    // Recargar conversaciones cuando la ventana vuelve a estar activa
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                cargarConversaciones();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const cargarConversaciones = async () => {
        try {
            setIsLoading(true);
            const response = await chatAPI.getConversaciones();
            // Asegurar que siempre sea un array
            const conversacionesData = Array.isArray(response.data) ? response.data : [];
            // Solo mostrar las últimas 5 conversaciones
            setConversaciones(conversacionesData.slice(0, 5));
        } catch (error) {
            console.error('Error al cargar conversaciones:', error);
            showToast('Error al cargar las conversaciones', 'error');
            // En caso de error, establecer array vacío
            setConversaciones([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatSelect = async (conversacion) => {
        setChatActivo(conversacion);
        setIsOpen(false);
        await cargarMensajes(conversacion.id);

        // Marcar mensajes como leídos cuando se selecciona el chat
        try {
            await chatAPI.marcarMensajesComoLeidos(conversacion.id);
            // Recargar conversaciones para actualizar el contador
            cargarConversaciones();
        } catch (error) {
            console.error('Error al marcar mensajes como leídos:', error);
        }
    };

    const cargarMensajes = async (conversacionId) => {
        try {
            setCargandoMensajes(true);
            const response = await chatAPI.getMensajes(conversacionId);
            setMensajes(response.data);
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
            showToast('Error al cargar los mensajes', 'error');
        } finally {
            setCargandoMensajes(false);
        }
    };

    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim() || !chatActivo) return;

        try {
            const response = await chatAPI.enviarMensaje(chatActivo.id, {
                contenido: nuevoMensaje,
                esInterno: false
            });

            // El mensaje será agregado vía SignalR; evitamos duplicados por carrera
            setNuevoMensaje('');

            // Recargar conversaciones para actualizar el último mensaje
            cargarConversaciones();
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            showToast('Error al enviar el mensaje', 'error');
        }
    };

    const cerrarChat = () => {
        setChatActivo(null);
        setMensajes([]);
        setNuevoMensaje('');
        // Recargar conversaciones para actualizar el contador después de cerrar
        cargarConversaciones();
    };

    const irAChatCompleto = () => {
        if (chatActivo) {
            if (isChatPage) {
                // Si ya estamos en la página de chat, solo cerrar el panel
                cerrarChat();
            } else {
                // Si no estamos en la página de chat, navegar a ella
                onChatSelect(chatActivo);
            }
        }
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatearFechaMensaje = (fecha) => {
        return new Date(fecha).toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEstadoIcon = (estado) => {
        switch (estado) {
            case 'Activa':
                return <CheckCircle className="w-3 h-3 text-green-500" />;
            case 'Pendiente':
                return <Clock className="w-3 h-3 text-yellow-500" />;
            case 'Cerrada':
                return <X className="w-3 h-3 text-gray-500" />;
            default:
                return <AlertCircle className="w-3 h-3 text-gray-500" />;
        }
    };

    return (
        <>
            {/* Icono flotante */}
            <div className="fixed bottom-16 right-6 z-[9999]">
                <button
                    onClick={() => {
                        if (chatActivo) {
                            // Si hay un chat activo, cerrarlo
                            cerrarChat();
                        } else {
                            // Si no hay chat activo, alternar el panel de chats recientes
                            setIsOpen(!isOpen);
                        }
                    }}
                    className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
                    title={chatActivo ? "Cerrar chat" : "Ver chats recientes"}
                >
                    <MessageCircle className="w-6 h-6" />
                    {totalNoLeidos > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                            {totalNoLeidos > 9 ? '9+' : totalNoLeidos}
                        </span>
                    )}
                </button>
            </div>

            {/* Panel de chat desplegable */}
            {chatActivo && !isChatPage && (
                <div className="fixed bottom-6 right-24 md:right-20 lg:right-20 z-50 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
                    {/* Header del chat */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                    {chatActivo.titulo}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {chatActivo.usuario?.username || 'Usuario'} • {chatActivo.estado}
                                </p>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={irAChatCompleto}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    title="Abrir chat completo"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={cerrarChat}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    title="Cerrar chat"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mensajes */}
                    <div ref={mensajesRef} className="flex-1 p-3 overflow-y-auto space-y-2">
                        {cargandoMensajes ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        ) : mensajes.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm">No hay mensajes</p>
                            </div>
                        ) : (
                            <>
                                {mensajes.map((mensaje) => (
                                    <div
                                        key={mensaje.id}
                                        className={`flex ${mensaje.creadoPor.id === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[280px] px-3 py-2 rounded-lg text-sm ${mensaje.creadoPor.id === user?.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-xs font-medium opacity-75">
                                                    {mensaje.creadoPor?.username || 'Usuario'}
                                                </span>
                                                <span className="text-xs opacity-75">
                                                    {formatearFechaMensaje(mensaje.fechaCreacion)}
                                                </span>
                                            </div>
                                            <p className="text-sm break-words">{mensaje.contenido}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </>
                        )}
                    </div>

                    {/* Input de mensaje */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <form onSubmit={enviarMensaje} className="flex space-x-2">
                            <input
                                type="text"
                                value={nuevoMensaje}
                                onChange={(e) => setNuevoMensaje(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!nuevoMensaje.trim()}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Panel de chats recientes */}
            {isOpen && (
                <div className="fixed bottom-20 right-24 md:right-20 lg:right-20 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Chats Recientes
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        ) : conversaciones.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                <p>No hay conversaciones recientes</p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {conversaciones.map((conversacion) => (
                                    <div
                                        key={conversacion.id}
                                        onClick={() => handleChatSelect(conversacion)}
                                        className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                                {conversacion.titulo}
                                            </h4>
                                            {getEstadoIcon(conversacion.estado)}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
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
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                // Navegar a la página de chat completa
                                window.location.href = '/chat';
                            }}
                            className="w-full text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                            Ver todos los chats
                        </button>
                    </div>
                </div>
            )}

            {/* Overlay para cerrar al hacer clic fuera */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsOpen(false)}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        className="absolute bottom-16 right-6 w-14 h-14"
                        style={{ pointerEvents: 'auto' }}
                    />
                </div>
            )}
        </>
    );
};

export default FloatingChatIcon;
