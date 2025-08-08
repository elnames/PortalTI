import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Eye, FileText, CheckCircle, Clock, XCircle, Upload, PenTool } from 'lucide-react';
import { actasAPI } from '../services/api';
import Tooltip from '../components/Tooltip';
import SignatureDrawer from '../components/SignatureDrawer';

const Actas = () => {
  const { showToast } = useToast();
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [selectedAsignacion, setSelectedAsignacion] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [activeTab, setActiveTab] = useState('todas'); // 'todas', 'pendientes', 'firmadas', 'rechazadas'
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignatureDrawer, setShowSignatureDrawer] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showCreateSignaturePrompt, setShowCreateSignaturePrompt] = useState(false);

  const fetchActas = async () => {
    try {
      setLoading(true);
      const { data } = await actasAPI.getMisActas();
      setActas(data);
    } catch (error) {
      console.error('Error:', error);
      showToast('No se pudieron cargar las actas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      showToast('Solo se permiten archivos PDF', 'error');
      e.target.value = null;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedAsignacion) {
      showToast('Selecciona un archivo y una asignación', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('acta', selectedFile);
    formData.append('asignacionId', selectedAsignacion.id);
    formData.append('observaciones', observaciones);

    try {
      await actasAPI.subirPdf(formData);
      showToast('Acta subida correctamente', 'success');
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedAsignacion(null);
      setObservaciones('');
      fetchActas(); // Recargar lista
    } catch (error) {
      console.error('Error:', error);
      showToast('No se pudo subir el archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Funciones para firma digital
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    if (!selectedAsignacion) {
      showToast('No hay asignación seleccionada', 'error');
      return;
    }

    setSigning(true);
    const formData = new FormData();
    formData.append('asignacionId', selectedAsignacion.id);
    formData.append('observaciones', observaciones);

    try {
      const response = await actasAPI.firmarDigital(formData);
      showToast(response.data.message, 'success');
      setShowSignatureModal(false);
      setSelectedAsignacion(null);
      setObservaciones('');
      fetchActas();
    } catch (error) {
      console.error('Error al firmar:', error);

      // Manejar el caso cuando el usuario no tiene firma
      if (error.response?.status === 400 && error.response?.data?.options) {
        const options = error.response.data.options;

        // Mostrar mensaje con opciones
        const message = `${error.response.data.message}\n\nOpciones:\n• ${options.createSignature}\n• ${options.uploadSignature}\n• ${options.uploadPdf}`;
        showToast(message, 'info');

        // Si hay opción de crear firma, mostrar el prompt dentro del modal
        if (options.createSignature) {
          setShowCreateSignaturePrompt(true);
        }
      } else if (error.response?.status === 400 && error.response?.data?.message) {
        showToast(error.response.data.message, 'error');
      } else {
        showToast(error.response?.data?.message || 'No se pudo firmar el acta', 'error');
      }
    } finally {
      setSigning(false);
    }
  };

  const handleFirmarDigital = async (asignacionId) => {
    setSelectedAsignacion({ id: asignacionId });
    setObservaciones('');
    setShowCreateSignaturePrompt(false);
    setShowSignatureModal(true);
  };

  const handleCreateSignature = async (signatureFile) => {
    try {
      const formData = new FormData();
      formData.append('firma', signatureFile);

      await actasAPI.subirFirma(formData);
      showToast('Firma creada y guardada exitosamente', 'success');
      setShowSignatureDrawer(false);

      // Si el modal de firma estaba abierto, intentar firmar automáticamente
      if (showSignatureModal && selectedAsignacion) {
        setTimeout(() => {
          saveSignature();
        }, 1000);
      }
    } catch (error) {
      console.error('Error al crear firma:', error);
      showToast('Error al crear la firma', 'error');
    }
  };

  useEffect(() => {
    fetchActas();
  }, []);



  // 🎯 FLUJO COMPLETO - 6 CONDICIONES DEL OJO AZUL
  const handlePrevisualizarActa = async (acta, asignacionId) => {
    try {
      let response;

      // 1. 🆕 PENDIENTE DE FIRMA - !acta (no existe acta)
      if (!acta) {
        response = await actasAPI.previsualizarActa(asignacionId);
        showToast('Generando acta con firma de admin/soporte para que puedas previsualizar y firmar a mano', 'info');
      }
      // 2. ⏳ PENDIENTE DE APROBACIÓN - estado === 'firmada' && metodoFirma === 'PDF_Subido'
      else if (acta.estado?.toLowerCase() === 'firmada' && acta.metodoFirma?.toLowerCase() === 'pdf_subido') {
        response = await actasAPI.descargarActa(acta.id);
        showToast('Previsualizando PDF que subiste para aprobación', 'info');
      }
      // 3. ✅ APROBADA - estado === 'aprobada' && metodoFirma === 'PDF_Subido'
      else if (acta.estado?.toLowerCase() === 'aprobada' && acta.metodoFirma?.toLowerCase() === 'pdf_subido') {
        response = await actasAPI.descargarActa(acta.id);
        showToast('Previsualizando tu PDF aprobado', 'info');
      }
      // 4. ✍️ FIRMADA DIGITALMENTE - estado === 'firmada' && metodoFirma === 'Digital'
      else if (acta.estado?.toLowerCase() === 'firmada' && acta.metodoFirma?.toLowerCase() === 'digital') {
        response = await actasAPI.previsualizarActaFirmado(acta.id);
        showToast('Previsualizando acta con tu firma digital y firma de admin/soporte', 'info');
      }
      // 5. 📤 SUBIDA POR ADMIN/SOPORTE - metodoFirma === 'Admin_Subida'
      else if (acta.metodoFirma?.toLowerCase() === 'admin_subida') {
        response = await actasAPI.descargarActa(acta.id);
        showToast('Previsualizando PDF que subió el admin/soporte', 'info');
      }
      // 6. ❌ RECHAZADA - estado === 'rechazada' && metodoFirma === 'PDF_Subido'
      else if (acta.estado?.toLowerCase() === 'rechazada' && acta.metodoFirma?.toLowerCase() === 'pdf_subido') {
        response = await actasAPI.previsualizarActa(asignacionId);
        showToast('Generando acta con firma de admin/soporte para que puedas previsualizar y firmar a mano nuevamente', 'info');
      }
      // Caso por defecto - usar previsualización general
      else {
        response = await actasAPI.previsualizarActa(asignacionId);
        showToast('Previsualizando acta', 'info');
      }

      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error:', error);
      showToast('No se pudo previsualizar el acta', 'error');
    }
  };



  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pendiente de aprobación':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'firmada':
      case 'firmado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'aprobada':
      case 'aprobado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'rechazada':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getMetodoFirmaIcon = (metodo) => {
    switch (metodo?.toLowerCase()) {
      case 'digital':
        return <PenTool className="w-4 h-4" />;
      case 'pdf_subido':
        return <Upload className="w-4 h-4" />;
      case 'admin_subida':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getAsignacionesActivas = () => {
    // Aquí deberías obtener las asignaciones activas del usuario
    // Por ahora retornamos un array vacío
    return [];
  };

  const filteredActas = actas.filter(acta => {
    switch (activeTab) {
      case 'pendientes':
        return acta.estado?.toLowerCase() === 'pendiente' || acta.estado?.toLowerCase() === 'pendiente de aprobación';
      case 'firmadas':
        return acta.estado?.toLowerCase() === 'firmada' || acta.estado?.toLowerCase() === 'firmado';
      case 'rechazadas':
        return acta.estado?.toLowerCase() === 'rechazada';
      default:
        return true; // todas
    }
  });



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Actas
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona tus actas de entrega y recepción
          </p>
        </div>


      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{actas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {actas.filter(a => a.estado?.toLowerCase() === 'pendiente' || a.estado?.toLowerCase() === 'pendiente de aprobación').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Firmadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {actas.filter(a => a.estado?.toLowerCase() === 'firmada' || a.estado?.toLowerCase() === 'firmado').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rechazadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {actas.filter(a => a.estado?.toLowerCase() === 'rechazada').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('todas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'todas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Todas ({actas.length})
          </button>
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pendientes'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Pendientes ({actas.filter(a => a.estado?.toLowerCase() === 'pendiente' || a.estado?.toLowerCase() === 'pendiente de aprobación').length})
          </button>
          <button
            onClick={() => setActiveTab('firmadas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'firmadas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Firmadas ({actas.filter(a => a.estado?.toLowerCase() === 'firmada' || a.estado?.toLowerCase() === 'firmado').length})
          </button>
          <button
            onClick={() => setActiveTab('rechazadas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'rechazadas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Rechazadas ({actas.filter(a => a.estado?.toLowerCase() === 'rechazada').length})
          </button>
        </nav>
      </div>

      {/* Lista de actas */}
      {filteredActas.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {activeTab === 'todas' ? 'No tienes actas' : `No hay actas ${activeTab}`}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'todas'
              ? 'No tienes actas registradas.'
              : activeTab === 'pendientes'
                ? 'No tienes actas pendientes de firma.'
                : activeTab === 'firmadas'
                  ? 'No tienes actas firmadas.'
                  : 'No tienes actas rechazadas.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {filteredActas.map((acta) => (
                <div
                  key={acta.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          {getMetodoFirmaIcon(acta.metodoFirma)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {acta.asignacion?.activo?.codigo} - {acta.asignacion?.activo?.categoria}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(acta.estado)}`}>
                            {acta.estado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Método: {acta.metodoFirma} • Creada: {new Date(acta.fechaCreacion).toLocaleDateString()}
                        </p>
                        {acta.observaciones && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Observaciones: {acta.observaciones}
                          </p>
                        )}
                        {acta.comentariosAprobacion && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Comentarios: {acta.comentariosAprobacion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 👁️ OJO AZUL - Previsualizar según 6 condiciones */}
                      <Tooltip content="Previsualizar acta según su estado actual">
                        <button
                          onClick={() => handlePrevisualizarActa(acta, acta.asignacion?.id)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </Tooltip>

                      {/* ✍️ PLUMA - Firmar digitalmente (solo en pendiente y rechazada) */}
                      {(!acta || acta.estado?.toLowerCase() === 'pendiente' || acta.estado?.toLowerCase() === 'rechazada') && (
                        <Tooltip content="Firmar digitalmente con tu firma del perfil">
                          <button
                            onClick={() => handleFirmarDigital(acta?.asignacion?.id || acta.asignacionId)}
                            className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}

                      {/* 📤 UPLOAD - Subir PDF (solo en pendiente y rechazada) */}
                      {(!acta || acta.estado?.toLowerCase() === 'pendiente' || acta.estado?.toLowerCase() === 'rechazada') && (
                        <Tooltip content="Subir PDF firmado">
                          <button
                            onClick={() => {
                              setSelectedAsignacion(acta?.asignacion || { id: acta.asignacionId });
                              setShowUploadModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Modal de subida */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Subir Acta Firmada
              </h3>
              <div className="space-y-4">
                {!selectedAsignacion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Seleccionar Asignación
                    </label>
                    <select
                      value={selectedAsignacion?.id || ''}
                      onChange={(e) => {
                        const asignacion = getAsignacionesActivas().find(a => a.id === parseInt(e.target.value));
                        setSelectedAsignacion(asignacion);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Selecciona una asignación</option>
                      {getAsignacionesActivas().map(asignacion => (
                        <option key={asignacion.id} value={asignacion.id}>
                          {asignacion.activo?.codigo} - {asignacion.activo?.categoria}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar archivo PDF
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Observaciones sobre la acta..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setSelectedAsignacion(null);
                      setObservaciones('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || (!selectedAsignacion && getAsignacionesActivas().length > 0) || uploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Subiendo...' : 'Subir'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de firma digital */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Firmar Digitalmente
              </h3>
              <div className="space-y-4">
                {showCreateSignaturePrompt ? (
                  // Prompt para crear firma
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          No tienes firma digital
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          Para firmar digitalmente necesitas crear tu firma primero.
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setShowSignatureModal(false);
                              setShowCreateSignaturePrompt(false);
                              setShowSignatureDrawer(true);
                            }}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                          >
                            Crear Firma
                          </button>
                          <button
                            onClick={() => {
                              setShowCreateSignaturePrompt(false);
                            }}
                            className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Información normal de firma digital
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Se usará tu firma digital del perfil para firmar el acta automáticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Observaciones sobre la firma..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowSignatureModal(false);
                      setShowCreateSignaturePrompt(false);
                      setSelectedAsignacion(null);
                      setObservaciones('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  {!showCreateSignaturePrompt && (
                    <button
                      onClick={saveSignature}
                      disabled={signing}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {signing ? 'Firmando...' : 'Firmar Acta'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Componente para crear firma digital */}
      <SignatureDrawer
        isOpen={showSignatureDrawer}
        onClose={() => setShowSignatureDrawer(false)}
        onSave={handleCreateSignature}
        title="Crear tu firma digital"
      />
    </div>
  );
};

export default Actas; 