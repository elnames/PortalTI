import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function ChatInternoModal({ isOpen, onClose, ticket }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('soporte');
  const [mensajes, setMensajes] = useState([]);
  const [mensajesInternos, setMensajesInternos] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const messagesEndRef = useRef(null);

  const isAdminOrSoporte = user?.role === 'admin' || user?.role === 'soporte';

  // Función para hacer scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && ticket) {
      cargarMensajes();

      // Configurar polling para actualización en tiempo real
      const interval = setInterval(() => {
        cargarMensajes();
      }, 5000); // Actualizar cada 5 segundos para reducir parpadeo

      return () => clearInterval(interval);
    }
  }, [isOpen, ticket, activeTab]);

  useEffect(() => {
    // Solo hacer scroll automático si el usuario está cerca del final
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom) {
        // Usar setTimeout para evitar conflictos con el renderizado
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }
  }, [mensajes, mensajesInternos]);

  const cargarMensajes = async () => {
    if (!ticket) return;

    try {
      // Cargar mensajes de chat usando el nuevo endpoint
      const response = await api.get(`/tickets/${ticket.id}/mensajes`);
      const mensajesChat = response.data;

      if (activeTab === 'soporte') {
        // Filtrar mensajes no internos
        const mensajesSoporte = mensajesChat.filter(m => !m.esInterno);
        setMensajes(mensajesSoporte);
      } else {
        // Filtrar mensajes internos
        const mensajesInternos = mensajesChat.filter(m => m.esInterno);
        setMensajesInternos(mensajesInternos);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !ticket) return;

    try {
      const mensajeData = {
        contenido: nuevoMensaje,
        esInterno: activeTab === 'interno'
      };

      const response = await api.post(`/tickets/${ticket.id}/mensajes`, mensajeData);

      // Agregar el nuevo mensaje a la lista correspondiente inmediatamente
      if (activeTab === 'soporte') {
        setMensajes(prev => [...prev, response.data]);
      } else {
        setMensajesInternos(prev => [...prev, response.data]);
      }

      setNuevoMensaje('');

      // Hacer scroll al final después de agregar el mensaje
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat - Ticket #{ticket?.id}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {ticket?.titulo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('soporte')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'soporte'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat con Soporte</span>
          </button>

          {isAdminOrSoporte && (
            <button
              onClick={() => setActiveTab('interno')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'interno'
                ? 'text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>Chat Interno</span>
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'soporte' ? (
                mensajes.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No hay mensajes en el chat con soporte</p>
                  </div>
                ) : (
                  mensajes.map((mensaje, index) => (
                    <div
                      key={mensaje.id || index}
                      className={`flex ${mensaje.creadoPor?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${mensaje.creadoPor?.id === user?.id
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
                )
              ) : (
                mensajesInternos.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No hay mensajes en el chat interno</p>
                  </div>
                ) : (
                  mensajesInternos.map((mensaje, index) => (
                    <div
                      key={mensaje.id || index}
                      className={`flex ${mensaje.creadoPor?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${mensaje.creadoPor?.id === user?.id
                          ? 'bg-purple-600 text-white'
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
                )
              )}
              <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={enviarMensaje} className="flex space-x-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder={`Escribe un mensaje en el chat ${activeTab === 'interno' ? 'interno' : 'con soporte'}...`}
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
      </div>
    </div>
  );
} 