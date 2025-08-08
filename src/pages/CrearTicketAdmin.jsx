// src/pages/CrearTicketAdmin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import LocationSelector from '../components/LocationSelector';
import api, { checkApiHealth } from '../services/api';

export default function CrearTicketAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifyTicketCreated, notifySuccess, notifyError } = useNotifications();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    nombreSolicitante: '',
    emailSolicitante: '',
    telefonoSolicitante: '',
    empresa: '',
    ubicacion: '',
    categoria: '',
    prioridad: 'Media',
    activoId: null,
    evidencia: null
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [apiAvailable, setApiAvailable] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [activosAsignados, setActivosAsignados] = useState([]);
  const [cargandoActivos, setCargandoActivos] = useState(false);

  const empresas = ['Vicsa', 'Tecnoboga', 'B2B', 'Bunzl'];
  const categorias = ['Hardware', 'Software', 'Red', 'Otros'];
  const prioridades = ['Baja', 'Media', 'Alta', 'Crítica'];

  useEffect(() => {
    (async () => {
      try {
        const isAvailable = await checkApiHealth();
        setApiAvailable(isAvailable);
      } catch {
        setApiAvailable(false);
      }
    })();
  }, []);

  // Cargar usuarios para el selector
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const response = await api.get('/auth/usuarios');
        setUsuarios(response.data);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        notifyError('Error al cargar la lista de usuarios');
      } finally {
        setCargandoUsuarios(false);
      }
    };

    cargarUsuarios();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleUsuarioChange = e => {
    const usuarioId = e.target.value;
    const usuario = usuarios.find(u => u.id.toString() === usuarioId);

    if (usuario) {
      setFormData(prev => ({
        ...prev,
        nombreSolicitante: usuario.nombre && usuario.apellido
          ? `${usuario.nombre} ${usuario.apellido}`
          : usuario.username || '',
        emailSolicitante: usuario.username || '',
        empresa: usuario.empresa || 'Vicsa',
        ubicacion: usuario.ubicacion || '',
        activoId: null // Reset activo seleccionado
      }));

      // Cargar activos asignados al usuario seleccionado
      cargarActivosAsignados(usuario.username);
    } else {
      setActivosAsignados([]);
      setFormData(prev => ({ ...prev, activoId: null }));
    }
  };

  const cargarActivosAsignados = async (email) => {
    if (!email) return;

    try {
      setCargandoActivos(true);
      const response = await api.get(`/activos/usuarios/${encodeURIComponent(email)}/activos`);
      setActivosAsignados(response.data);
    } catch (error) {
      console.error('Error al cargar activos asignados:', error);
      setActivosAsignados([]);
    } finally {
      setCargandoActivos(false);
    }
  };

  const handleActivoChange = e => {
    const activoId = e.target.value;
    setFormData(prev => ({ ...prev, activoId: activoId ? parseInt(activoId) : null }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo (imágenes y PDFs)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos PDF o imágenes (JPG, PNG, GIF)');
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, evidencia: file }));
      setError('');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!apiAvailable) {
      const errorMsg = 'El servicio no está disponible en este momento. Por favor, inténtelo más tarde.';
      setError(errorMsg);
      notifyError(errorMsg);
      setLoading(false);
      return;
    }

    // Validaciones
    const {
      nombreSolicitante,
      emailSolicitante,
      empresa,
      ubicacion,
      titulo,
      descripcion,
      categoria,
      prioridad
    } = formData;

    if (
      !nombreSolicitante.trim() ||
      !emailSolicitante.trim() ||
      !empresa.trim() ||
      !ubicacion.trim() ||
      !titulo.trim() ||
      !descripcion.trim() ||
      !categoria.trim() ||
      !prioridad.trim()
    ) {
      const errorMsg = 'Por favor, complete todos los campos obligatorios.';
      setError(errorMsg);
      notifyError(errorMsg);
      setLoading(false);
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailSolicitante)) {
      const errorMsg = 'Ingrese un email válido.';
      setError(errorMsg);
      notifyError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/tickets', formData);
      notifyTicketCreated(response.data);
      notifySuccess('Ticket creado correctamente');
      setSuccess(true);
      setFormData({
        titulo: '',
        descripcion: '',
        nombreSolicitante: '',
        emailSolicitante: '',
        telefonoSolicitante: '',
        empresa: '',
        ubicacion: '',
        categoria: '',
        prioridad: 'Media'
      });
    } catch (err) {
      let errorMsg = 'Error al procesar la solicitud. Por favor, inténtelo de nuevo.';

      if (err.response) {
        const msg = err.response.data?.message || err.response.data?.error || 'Error del servidor';
        errorMsg = `Error: ${msg}`;
      } else if (err.request) {
        errorMsg = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
      }

      setError(errorMsg);
      notifyError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800">
        <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-center animate-fade-in">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            ¡Ticket Creado Exitosamente!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            El ticket ha sido registrado en el sistema.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              navigate('/tickets');
            }}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Volver a Mis Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 p-4">
      <div className="w-full max-w-md md:max-w-4xl p-6 rounded-2xl shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md animate-fade-in">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Crear Ticket por Usuario</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Complete el formulario para generar un ticket en nombre de otro usuario
          </p>
        </div>

        {!apiAvailable && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded mb-4 text-center">
            ⚠️ El servicio puede estar temporalmente no disponible. Contacte al administrador.
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Solicitante */}
          <h3 className="col-span-1 md:col-span-2 text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Información del Solicitante
          </h3>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Seleccionar Usuario *</label>
            <select
              name="usuarioId"
              onChange={handleUsuarioChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={cargandoUsuarios}
            >
              <option value="">Seleccione un usuario</option>
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre && usuario.apellido
                    ? `${usuario.nombre} ${usuario.apellido}`
                    : usuario.username} - {usuario.empresa || 'Sin empresa'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Nombre *</label>
            <input
              name="nombreSolicitante"
              value={formData.nombreSolicitante}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Email *</label>
            <input
              type="email"
              name="emailSolicitante"
              value={formData.emailSolicitante}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Teléfono (Opcional)</label>
            <input
              name="telefonoSolicitante"
              value={formData.telefonoSolicitante}
              onChange={handleChange}
              placeholder="Ej: +56 9 1234 5678"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Empresa *</label>
            <input
              name="empresa"
              value={formData.empresa}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Se llena automáticamente con los datos del usuario seleccionado
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Ubicación *</label>
            <input
              name="ubicacion"
              value={formData.ubicacion}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Se llena automáticamente con los datos del usuario seleccionado
            </p>
          </div>

          {/* Activos Asignados */}
          {activosAsignados.length > 0 && (
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Activo Asignado (Opcional)
              </label>
              <select
                name="activoId"
                value={formData.activoId || ''}
                onChange={handleActivoChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccione un activo (opcional)</option>
                {activosAsignados.map(activo => (
                  <option key={activo.id} value={activo.id}>
                    {activo.codigo} - {activo.nombreEquipo} ({activo.categoria})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selecciona un activo si el ticket está relacionado con un equipo específico
              </p>
            </div>
          )}

          {/* Información del Ticket */}
          <h3 className="col-span-1 md:col-span-2 text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            Información del Ticket
          </h3>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Título *</label>
            <input
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Descripción *</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-32"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Categoría *</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Prioridad *</label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {prioridades.map(pri => (
                <option key={pri} value={pri}>
                  {pri}
                </option>
              ))}
            </select>
          </div>



          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Evidencia (Opcional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.gif"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formatos permitidos: PDF, JPG, PNG, GIF. Máximo 5MB.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !apiAvailable}
            className="col-span-1 md:col-span-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creando Ticket...' : 'Crear Ticket'}
          </button>
        </form>

        <div className="mt-8 text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p>• Los tickets se procesan en orden de prioridad y llegada.</p>
          <p>• El usuario recibirá una notificación por email cuando su ticket sea asignado.</p>
          <p>• Para urgencias críticas, contacte directamente al departamento de IT.</p>
          <p>• Los campos marcados con * son obligatorios.</p>
        </div>
      </div>
    </div>
  );
} 