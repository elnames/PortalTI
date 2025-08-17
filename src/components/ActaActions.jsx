import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { actasAPI, authAPI } from '../services/api';
import { Eye, Download, CheckCircle, XCircle, Upload, PenTool, Clock } from 'lucide-react';
import Tooltip from './Tooltip';
import ReasonModal from './ReasonModal';
import SignatureDrawer from './SignatureDrawer';

const ActaActions = ({ acta, asignacion, onActionComplete, onApprove, onReject, currentUserRole }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSignatureDrawer, setShowSignatureDrawer] = useState(false);
  const [modals, setModals] = useState({ approve: false, reject: false, annul: false });

  // Determinar qué acciones están disponibles según el estado del acta
  const canPreview = true; // Siempre se puede previsualizar
  const canDownload = acta && acta.rutaArchivo;
  // Un usuario (no TI) puede firmar cuando no hay acta o cuando está pendiente/rechazada.
  // Para admin/soporte ocultaremos la opción de firmar; ese control viene desde la página padre vía rol o props.
  const canSign = !acta || acta.estado?.toLowerCase() === 'pendiente' || acta.estado?.toLowerCase() === 'rechazada';
  const canUpload = !acta || acta.estado?.toLowerCase() === 'pendiente' || acta.estado?.toLowerCase() === 'rechazada';
  const canApprove = acta && acta.estado?.toLowerCase() === 'firmada'; // Solo aprobar si está firmada
  const canReject = !!acta; // Se puede rechazar en cualquier estado

  // Función para previsualizar acta según su estado
  const handlePreview = async () => {
    try {
      setLoading(true);
      let response;

      if (!acta) {
        response = await actasAPI.previsualizarActa(asignacion.id);
      } else {
        // Usar previsualización automática por prioridad
        response = await actasAPI.previewAuto(acta.id);
      }

      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al previsualizar:', error);
      showToast('Error', 'No se pudo previsualizar el acta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar acta
  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await actasAPI.descargarActa(acta.id);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = acta.nombreArchivo || `Acta_${asignacion.activo?.codigo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Éxito', 'Acta descargada correctamente', 'success');
    } catch (error) {
      console.error('Error al descargar:', error);
      showToast('Error', 'No se pudo descargar el acta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para firmar digitalmente (oculto para admin/soporte; visible para usuarios)
  const handleDigitalSign = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('asignacionId', asignacion.id);
      formData.append('observaciones', 'Firma digital aplicada');

      await actasAPI.firmarDigital(formData);
      showToast('Éxito', 'Acta firmada digitalmente correctamente', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al firmar:', error);
      if (error.response?.status === 400) {
        // Si no hay firma en el perfil, ofrecer crearla en el momento
        setShowSignatureDrawer(true);
        const infoMsg = error.response?.data?.message || 'No tienes una firma digital configurada. Crea tu firma ahora.';
        showToast('Información', infoMsg, 'info');
      } else {
        showToast('Error', 'No se pudo firmar el acta', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Guardar firma dibujada y reintentar firma digital
  const handleSaveSignature = async (file) => {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('signature', file);
      await authAPI.uploadSignature(fd);
      showToast('Éxito', 'Tu firma se guardó correctamente', 'success');
      setShowSignatureDrawer(false);

      // Reintentar firma digital
      const signData = new FormData();
      signData.append('asignacionId', asignacion.id);
      signData.append('observaciones', 'Firma digital aplicada (firma creada desde modal)');
      await actasAPI.firmarDigital(signData);
      showToast('Éxito', 'Acta firmada digitalmente correctamente', 'success');
      if (onActionComplete) onActionComplete();
    } catch (e) {
      console.error('Error guardando firma o firmando acta:', e);
      showToast('Error', 'No se pudo guardar la firma o firmar el acta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para subir PDF
  const handleUploadPdf = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('acta', file);
      formData.append('asignacionId', asignacion.id);
      formData.append('observaciones', 'PDF firmado subido por el usuario');

      await actasAPI.subirPdf(formData);
      showToast('Éxito', 'PDF subido correctamente', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al subir PDF:', error);
      showToast('Error', 'No se pudo subir el PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar acta
  const handleApprove = () => {
    if (onApprove) {
      onApprove();
    } else {
      // Fallback: hacer la acción directamente
      handleApproveDirect();
    }
  };

  // Función para rechazar acta
  const handleReject = () => {
    if (onReject) {
      onReject();
    } else {
      // Fallback: hacer la acción directamente
      handleRejectDirect();
    }
  };

  // Marcar como pendiente de firma (disponible en cualquier estado)
  const handleMarkPending = async () => {
    try {
      setLoading(true);
      if (acta && acta.id) {
        await actasAPI.marcarPendiente(acta.id);
      } else {
        await actasAPI.marcarPendienteFirma({ asignacionId: asignacion.id });
      }
      showToast('Éxito', 'Acta marcada como pendiente de firma', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al marcar pendiente:', error);
      showToast('Error', 'No se pudo marcar como pendiente de firma', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar acta directamente (fallback)
  const handleApproveDirect = async () => {
    try {
      setLoading(true);
      await actasAPI.aprobarActa(acta.id, { Aprobar: true, Comentarios: '' });
      showToast('Éxito', 'Acta aprobada correctamente', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al aprobar:', error);
      showToast('Error', 'No se pudo aprobar el acta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para rechazar acta directamente (fallback)
  const handleRejectDirect = async () => {
    try {
      setLoading(true);
      const motivo = window.prompt('Escribe el motivo de rechazo:');
      if (!motivo || !motivo.trim()) {
        showToast('Información', 'Debes ingresar un motivo de rechazo', 'info');
        return;
      }
      await actasAPI.rechazarActa(acta.id, { Motivo: motivo });
      showToast('Éxito', 'Acta rechazada correctamente', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al rechazar:', error);
      showToast('Error', 'No se pudo rechazar el acta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Rechazo con modal de motivo (TI)
  const handleRejectDirectWithReason = async (motivo) => {
    try {
      setLoading(true);
      await actasAPI.rechazarActa(acta.id, { Motivo: (motivo || '').trim() });
      showToast('Éxito', 'Acta rechazada correctamente', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al rechazar:', error);
      showToast('Error', 'No se pudo rechazar el acta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar acta para TI (permite comentario opcional si no hay PDF usuario)
  const handleApproveTI = async (comentarios = '') => {
    try {
      setLoading(true);
      await actasAPI.aprobarActa(acta.id, { Aprobar: true, Comentarios: comentarios || '' });
      showToast('Éxito', 'Acta aprobada correctamente', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al aprobar:', error);
      showToast('Error', 'No se pudo aprobar el acta', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Anular acta
  const handleAnnul = async (motivo) => {
    try {
      if (!acta || !acta.id) return;
      setLoading(true);
      await actasAPI.anularActa(acta.id, { Motivo: (motivo || '').trim() });
      showToast('Éxito', 'Acta anulada', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al anular:', error);
      showToast('Error', 'No se pudo anular el acta', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Botón de Previsualizar */}
      {canPreview && (
        <Tooltip content="Previsualizar acta según su estado actual">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            <span>Previsualizar</span>
          </button>
        </Tooltip>
      )}

      {/* Botón de Descargar */}
      {canDownload && (
        <Tooltip content="Descargar acta">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Descargar</span>
          </button>
        </Tooltip>
      )}

      {/* Botón de Firma Digital (solo usuarios) */}
      {canSign && currentUserRole !== 'admin' && currentUserRole !== 'soporte' && (
        <Tooltip content="Firmar digitalmente con tu firma del perfil">
          <button
            onClick={handleDigitalSign}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <PenTool className="w-4 h-4" />
            <span>Firmar Digital</span>
          </button>
        </Tooltip>
      )}

      {/* Botón de Subir PDF (usuario) */}
      {canUpload && currentUserRole !== 'admin' && currentUserRole !== 'soporte' && (
        <Tooltip content="Subir PDF firmado manualmente">
          <label className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Subir PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleUploadPdf(file);
                }
              }}
              className="hidden"
              disabled={loading}
            />
          </label>
        </Tooltip>
      )}

      {/* Botón de Subir PDF (TI/Admin) */}
      {currentUserRole && (currentUserRole === 'admin' || currentUserRole === 'soporte') && (
        <Tooltip content="Subir PDF firmado en nombre de TI">
          <label className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Subir PDF (TI)</span>
            <input
              type="file"
              accept=".pdf"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (!acta || !acta.id) {
                  showToast('Error', 'Primero genera un acta para poder adjuntar PDF TI', 'error');
                  return;
                }
                try {
                  setLoading(true);
                  const formData = new FormData();
                  formData.append('pdf', file);
                  await actasAPI.uploadPdfTI(acta.id, formData);
                  showToast('Éxito', 'PDF subido por TI', 'success');
                  if (onActionComplete) onActionComplete();
                } catch (err) {
                  console.error('Error al subir PDF TI:', err);
                  showToast('Error', 'No se pudo subir el PDF TI', 'error');
                } finally {
                  setLoading(false);
                }
              }}
              className="hidden"
              disabled={loading}
            />
          </label>
        </Tooltip>
      )}

      {/* Botón de Marcar Pendiente (siempre visible para TI) */}
      <Tooltip content="Marcar acta como pendiente de firma en cualquier estado">
        <button
          onClick={handleMarkPending}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <Clock className="w-4 h-4" />
          <span>Marcar Pendiente</span>
        </button>
      </Tooltip>

      {/* Botón de Aprobar (TI siempre visible si existe acta) */}
      {(currentUserRole === 'admin' || currentUserRole === 'soporte') && acta?.id ? (
        <Tooltip content="Aprobar acta (TI)">
          <button
            onClick={() => setModals((m) => ({ ...m, approve: true }))}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Aprobar</span>
          </button>
        </Tooltip>
      ) : (
        canApprove && (
        <Tooltip content="Aprobar acta">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Aprobar</span>
          </button>
        </Tooltip>
        )
      )}

      {/* Botón de Rechazar (TI siempre visible si existe acta) */}
      {(currentUserRole === 'admin' || currentUserRole === 'soporte') && acta?.id ? (
        <Tooltip content="Rechazar acta (TI)">
          <button
            onClick={() => setModals((m) => ({ ...m, reject: true }))}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Rechazar</span>
          </button>
        </Tooltip>
      ) : (
        canReject && (
        <Tooltip content="Rechazar acta">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Rechazar</span>
          </button>
        </Tooltip>
        )
      )}

      {/* Botón de Anular (TI) */}
      {(currentUserRole === 'admin' || currentUserRole === 'soporte') && acta?.id && (
        <Tooltip content="Anular acta">
          <button
            onClick={() => setModals((m) => ({ ...m, annul: true }))}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Anular</span>
          </button>
        </Tooltip>
      )}

      {/* Modales TI */}
      <ReasonModal
        isOpen={modals.approve}
        title="Aprobar acta"
        label="Comentario (opcional)"
        placeholder="Comentario de aprobación..."
        confirmText="Aprobar"
        required={false}
        onConfirm={(comentarios) => {
          setModals((m) => ({ ...m, approve: false }));
          handleApproveTI(comentarios);
        }}
        onClose={() => setModals((m) => ({ ...m, approve: false }))}
      />

      <ReasonModal
        isOpen={modals.reject}
        title="Rechazar acta"
        label="Motivo"
        placeholder="Describe el motivo del rechazo..."
        confirmText="Rechazar"
        required={false}
        onConfirm={async (motivo) => {
          setModals((m) => ({ ...m, reject: false }));
          await handleRejectDirectWithReason(motivo);
        }}
        onClose={() => setModals((m) => ({ ...m, reject: false }))}
      />

      <ReasonModal
        isOpen={modals.annul}
        title="Anular acta"
        label="Motivo"
        placeholder="Describe el motivo de anulación..."
        confirmText="Anular"
        required={false}
        onConfirm={(motivo) => {
          setModals((m) => ({ ...m, annul: false }));
          handleAnnul(motivo);
        }}
        onClose={() => setModals((m) => ({ ...m, annul: false }))}
      />

      {/* Indicador de carga */}
      {loading && (
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Procesando...</span>
        </div>
      )}
      {/* Modal para crear firma cuando no existe */}
      <SignatureDrawer
        isOpen={showSignatureDrawer}
        onClose={() => setShowSignatureDrawer(false)}
        onSave={handleSaveSignature}
        title="Crear firma digital"
      />
    </div>
  );
};

export default ActaActions;
