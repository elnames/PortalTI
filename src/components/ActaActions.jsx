import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { actasAPI } from '../services/api';
import { Eye, Download, CheckCircle, XCircle, Upload, PenTool, Clock } from 'lucide-react';
import Tooltip from './Tooltip';

const ActaActions = ({ acta, asignacion, onActionComplete, onApprove, onReject }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Determinar qué acciones están disponibles según el estado del acta
  const canPreview = true; // Siempre se puede previsualizar
  const canDownload = acta && acta.rutaArchivo;
  const canSign = !acta || acta.estado?.toLowerCase() === 'pendiente' || acta.estado?.toLowerCase() === 'rechazada';
  const canUpload = !acta || acta.estado?.toLowerCase() === 'pendiente' || acta.estado?.toLowerCase() === 'rechazada';
  const canApprove = acta && acta.estado?.toLowerCase() === 'firmada';
  const canReject = acta && acta.estado?.toLowerCase() === 'firmada';

  // Función para previsualizar acta según su estado
  const handlePreview = async () => {
    try {
      setLoading(true);
      let response;

      if (!acta) {
        // No existe acta - generar nueva
        response = await actasAPI.previsualizarActa(asignacion.id);
        showToast('Información', 'Generando acta sin firma para el usuario', 'info');
      } else if (acta.estado?.toLowerCase() === 'firmada' && acta.metodoFirma?.toLowerCase() === 'pdf_subido') {
        // PDF subido por usuario - descargar para revisar
        response = await actasAPI.descargarActa(acta.id);
        showToast('Información', 'Revisando PDF subido por el usuario', 'info');
      } else if (acta.estado?.toLowerCase() === 'aprobada' && acta.metodoFirma?.toLowerCase() === 'pdf_subido') {
        // PDF aprobado - descargar
        response = await actasAPI.descargarActa(acta.id);
        showToast('Información', 'Previsualizando PDF aprobado', 'info');
      } else if (acta.estado?.toLowerCase() === 'firmada' && acta.metodoFirma?.toLowerCase() === 'digital') {
        // Firma digital - generar con ambas firmas
        response = await actasAPI.previsualizarActaFirmado(acta.id);
        showToast('Información', 'Revisando acta con firma digital del usuario', 'info');
      } else if (acta.metodoFirma?.toLowerCase() === 'admin_subida') {
        // Subida por admin - descargar
        response = await actasAPI.descargarActa(acta.id);
        showToast('Información', 'Revisando acta que subiste', 'info');
      } else if (acta.estado?.toLowerCase() === 'rechazada' && acta.metodoFirma?.toLowerCase() === 'pdf_subido') {
        // Rechazada - generar nueva
        response = await actasAPI.previsualizarActa(asignacion.id);
        showToast('Información', 'Generando acta sin firma para el usuario', 'info');
      } else {
        // Caso por defecto
        response = await actasAPI.previsualizarActa(asignacion.id);
        showToast('Información', 'Previsualizando acta', 'info');
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

  // Función para firmar digitalmente
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
      if (error.response?.status === 400 && error.response?.data?.options) {
        const options = error.response.data.options;
        const message = `${error.response.data.message}\n\nOpciones:\n• ${options.uploadSignature}\n• ${options.uploadPdf}`;
        showToast('Información', message, 'info');
      } else {
        showToast('Error', 'No se pudo firmar el acta', 'error');
      }
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
      await actasAPI.aprobarActa(acta.id, { Aprobar: false, Comentarios: '' });
      showToast('Éxito', 'Acta rechazada correctamente', 'success');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error al rechazar:', error);
      showToast('Error', 'No se pudo rechazar el acta', 'error');
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

      {/* Botón de Firma Digital */}
      {canSign && (
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

      {/* Botón de Subir PDF */}
      {canUpload && (
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

             {/* Botón de Aprobar */}
       {canApprove && (
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
       )}

       {/* Botón de Rechazar */}
       {canReject && (
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
       )}

      {/* Indicador de carga */}
      {loading && (
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Procesando...</span>
        </div>
      )}
    </div>
  );
};

export default ActaActions;
