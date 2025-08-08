import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  FileText,
  Search,
  Calendar,
  User,
  HardDrive,
  CheckCircle,
  XCircle,
  Eye,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Download,
  Trash2,
  Filter,
  Clock
} from 'lucide-react';
import { asignacionesAPI, actasAPI } from '../services/api';
import GenerarActaModal from '../components/GenerarActaModal';
import Tooltip from '../components/Tooltip';

const GestionActas = () => {
  const { showToast } = useToast();

  // Estados principales
  const [asignaciones, setAsignaciones] = useState([]);
  const [actasPorAsignacion, setActasPorAsignacion] = useState({}); // Mapeo de actas por asignación
  const [loading, setLoading] = useState(true);

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterCategoria, setFilterCategoria] = useState('todos');

  // Estados para ordenamiento
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Estados de modales
  const [showGenerarActaModal, setShowGenerarActaModal] = useState(false);
  const [selectedAsignacion, setSelectedAsignacion] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedAsignacionForUpload, setSelectedAsignacionForUpload] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  // Estados para modal de previsualización personalizada
  const [showPrevisualizacionModal, setShowPrevisualizacionModal] = useState(false);
  const [selectedActaForPreview, setSelectedActaForPreview] = useState(null);
  const [selectedAsignacionForPreview, setSelectedAsignacionForPreview] = useState(null);
  const [incluirFirmaTI, setIncluirFirmaTI] = useState(true);
  const [fechaEntrega, setFechaEntrega] = useState('');

  // Estados para Control de Actas
  const [actas, setActas] = useState([]);
  const [loadingActas, setLoadingActas] = useState(true);
  const [searchTermActas, setSearchTermActas] = useState('');
  const [filterStatusActas, setFilterStatusActas] = useState('todos');
  const [sortOrderActas, setSortOrderActas] = useState('fecha-desc'); // 'fecha-desc', 'fecha-asc', 'usuario', 'activo', 'estado'
  const [showUploadModalActas, setShowUploadModalActas] = useState(false);
  const [uploadDataActas, setUploadDataActas] = useState({
    usuarioId: '',
    nombreArchivo: '',
    descripcion: ''
  });
  const [selectedFileActas, setSelectedFileActas] = useState(null);

  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState('asignaciones'); // 'asignaciones' o 'control-actas'

  // Estados para estadísticas
  const [stats, setStats] = useState({
    totalAsignaciones: 0,
    asignacionesActivas: 0,
    asignacionesEsteMes: 0,
    actasPendientes: 0,
    actasFirmadas: 0,
    actasAprobadas: 0,
    actasRechazadas: 0,
    porcentajeCompletado: 0,
    actasSubidas: 0
  });

  const fetchAsignaciones = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await asignacionesAPI.getActivas();
      setAsignaciones(data);
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      showToast('Error', 'No se pudieron cargar las asignaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchActasPendientes = useCallback(async () => {
    try {
      const { data } = await actasAPI.getTodasActas();

      // Crear un mapeo de actas por asignación para mostrar las acciones correctas
      const actasMap = {};
      data.forEach(acta => {
        if (acta.asignacion?.id) {
          actasMap[acta.asignacion.id] = acta;
        }
      });
      setActasPorAsignacion(actasMap);

      // Calcular estadísticas de actas (todas las actas)
      const actasPendientes = data.filter(acta => acta.estado?.toLowerCase() === 'pendiente').length;
      const actasFirmadas = data.filter(acta => acta.estado?.toLowerCase() === 'firmada').length;
      const actasAprobadas = data.filter(acta => acta.estado?.toLowerCase() === 'aprobada').length;
      const actasRechazadas = data.filter(acta => acta.estado?.toLowerCase() === 'rechazada').length;
      // Para Control de Actas, contar solo las actas no pendientes
      const actasNoPendientes = data.filter(acta => acta.estado?.toLowerCase() !== 'pendiente').length;

      setStats(prev => ({
        ...prev,
        actasPendientes,
        actasFirmadas,
        actasAprobadas,
        actasRechazadas,
        actasSubidas: actasNoPendientes
      }));
    } catch (error) {
      console.error('Error al cargar actas:', error);
      showToast('Error', 'No se pudieron cargar las actas', 'error');
    }
  }, [showToast]);

  // Funciones para Control de Actas
  const fetchActas = useCallback(async () => {
    try {
      setLoadingActas(true);
      const { data } = await actasAPI.getTodasActas();

      // Mostrar solo actas que NO estén pendientes (Firmada, Aprobada, Rechazada)
      const actasNoPendientes = data.filter(acta =>
        acta.estado?.toLowerCase() !== 'pendiente'
      );
      setActas(actasNoPendientes);
    } catch (error) {
      showToast('Error', 'Error al cargar las actas', 'error');
      console.error('Error:', error);
    } finally {
      setLoadingActas(false);
    }
  }, [showToast]);

  const handleFileChangeActas = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFileActas(file);
    } else {
      showToast('Error', 'Solo se permiten archivos PDF', 'error');
      e.target.value = null;
    }
  };

  const handleUploadActas = async (e) => {
    e.preventDefault();

    if (!uploadDataActas.usuarioId || !uploadDataActas.nombreArchivo || !selectedFileActas) {
      showToast('Error', 'Por favor completa todos los campos y selecciona un archivo', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('acta', selectedFileActas);
      formData.append('usuarioId', uploadDataActas.usuarioId);
      formData.append('nombreArchivo', uploadDataActas.nombreArchivo);
      formData.append('descripcion', uploadDataActas.descripcion);

      await actasAPI.subirActaAdmin(formData);

      showToast('Éxito', 'Acta subida exitosamente', 'success');
      setShowUploadModalActas(false);
      setUploadDataActas({ usuarioId: '', nombreArchivo: '', descripcion: '' });
      setSelectedFileActas(null);
      fetchActas();
    } catch (error) {
      showToast('Error', 'Error al subir el acta', 'error');
      console.error('Error:', error);
    }
  };

  const handlePreview = async (actaId, nombreArchivo) => {
    try {
      const { data } = await actasAPI.descargarActa(actaId);
      const url = window.URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (error) {
      showToast('Error', 'Error al previsualizar el acta', 'error');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (actaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este acta?')) {
      return;
    }

    try {
      await actasAPI.eliminarActa(actaId);
      showToast('Éxito', 'Acta eliminada exitosamente', 'success');
      fetchActas();
    } catch (error) {
      showToast('Error', 'Error al eliminar el acta', 'error');
      console.error('Error:', error);
    }
  };

  const sortActas = (actasToSort) => {
    const sortedActas = [...actasToSort];

    switch (sortOrderActas) {
      case 'fecha-desc':
        return sortedActas.sort((a, b) => new Date(b.fechaSubida || b.fechaCreacion) - new Date(a.fechaSubida || a.fechaCreacion));
      case 'fecha-asc':
        return sortedActas.sort((a, b) => new Date(a.fechaSubida || a.fechaCreacion) - new Date(b.fechaSubida || b.fechaCreacion));
      case 'usuario':
        return sortedActas.sort((a, b) => {
          const userA = `${a.asignacion?.usuario?.nombre || ''} ${a.asignacion?.usuario?.apellido || ''}`.toLowerCase();
          const userB = `${b.asignacion?.usuario?.nombre || ''} ${b.asignacion?.usuario?.apellido || ''}`.toLowerCase();
          return userA.localeCompare(userB);
        });
      case 'activo':
        return sortedActas.sort((a, b) => {
          const activoA = a.asignacion?.activo?.codigo || '';
          const activoB = b.asignacion?.activo?.codigo || '';
          return activoA.localeCompare(activoB);
        });
      case 'estado':
        return sortedActas.sort((a, b) => {
          const estadoA = a.estado?.toLowerCase() || '';
          const estadoB = b.estado?.toLowerCase() || '';
          return estadoA.localeCompare(estadoB);
        });
      default:
        return sortedActas;
    }
  };

  const getStatusColorActas = (status) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'firmado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rechazado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Funciones de filtrado para Control de Actas
  const filteredActas = sortActas(actas.filter(acta => {
    const searchTerm = searchTermActas.toLowerCase();
    const matchesSearch =
      (acta.nombreArchivo?.toLowerCase() || '').includes(searchTerm) ||
      (acta.asignacion?.usuario?.nombre?.toLowerCase() || '').includes(searchTerm) ||
      (acta.asignacion?.usuario?.apellido?.toLowerCase() || '').includes(searchTerm) ||
      (acta.asignacion?.usuario?.email?.toLowerCase() || '').includes(searchTerm);
    const matchesFilter = filterStatusActas === 'todos' || acta.estado === filterStatusActas;
    return matchesSearch && matchesFilter;
  }));

  useEffect(() => {
    fetchAsignaciones();
    fetchActasPendientes();

    // Recargar datos cada 2 minutos para mantener sincronizado (reducido de 30 segundos)
    const interval = setInterval(() => {
      fetchAsignaciones();
      fetchActasPendientes();
    }, 120000); // 2 minutos

    return () => clearInterval(interval);
  }, [fetchAsignaciones, fetchActasPendientes]);

  // Cargar actas cuando se active la pestaña de Control de Actas
  useEffect(() => {
    if (activeTab === 'control-actas') {
      fetchActas();
    }
  }, [activeTab, fetchActas]);

  // Calcular estadísticas cuando cambien los datos
  useEffect(() => {
    const calcularEstadisticas = () => {
      const totalAsignaciones = asignaciones.length;
      const asignacionesActivas = asignaciones.filter(a => a.estado === 'Activa').length;
      const asignacionesEsteMes = asignaciones.filter(a => {
        const asignacionDate = new Date(a.fechaAsignacion);
        const now = new Date();
        return asignacionDate.getMonth() === now.getMonth() &&
          asignacionDate.getFullYear() === now.getFullYear();
      }).length;

      const porcentajeCompletado = asignacionesActivas > 0
        ? Math.round((stats.actasAprobadas / asignacionesActivas) * 100)
        : 0;

      setStats(prev => ({
        ...prev,
        totalAsignaciones,
        asignacionesActivas,
        asignacionesEsteMes,
        porcentajeCompletado
      }));
    };

    calcularEstadisticas();
  }, [asignaciones, stats.actasAprobadas]);



  const handleAprobarActa = async (actaId, aprobado, comentarios = '') => {
    try {
      await actasAPI.aprobarActa(actaId, { aprobado, comentarios });
      showToast('Éxito', `Acta ${aprobado ? 'aprobada' : 'rechazada'} correctamente`, 'success');
      // Recargar asignaciones para actualizar el estado
      fetchAsignaciones();
      // También recargar actas pendientes
      fetchActasPendientes();
    } catch (error) {
      console.error('Error al procesar acta:', error);
      showToast('Error', 'No se pudo procesar la acta', 'error');
    }
  };



  // 🎯 FLUJO COMPLETO - 4 CONDICIONES DEL OJO NARANJA
  const handlePrevisualizarActa = async (acta, asignacionId) => {
    try {
      let response;

      // 1. 🆕 PENDIENTE DE FIRMA - !acta (no existe acta)
      if (!acta) {
        response = await actasAPI.previsualizarActa(asignacionId);
        showToast('Información', 'Generando acta sin firma para el usuario', 'info');
      }
      // 2. ⏳ PENDIENTE DE APROBACIÓN - estado === 'firmada' && metodoFirma === 'PDF_Subido'
      else if (acta.estado?.toLowerCase() === 'firmada' && acta.metodoFirma?.toLowerCase() === 'pdf_subido') {
        response = await actasAPI.descargarActa(acta.id);
        showToast('Información', 'Revisando PDF subido por el usuario', 'info');
      }
      // 3. ✍️ FIRMADA DIGITALMENTE - estado === 'firmada' && metodoFirma === 'Digital'
      else if (acta.estado?.toLowerCase() === 'firmada' && acta.metodoFirma?.toLowerCase() === 'digital') {
        response = await actasAPI.previsualizarActaFirmado(acta.id);
        showToast('Información', 'Revisando acta con firma digital del usuario', 'info');
      }
      // 4. 📤 SUBIDA POR ADMIN/SOPORTE - metodoFirma === 'Admin_Subida'
      else if (acta.metodoFirma?.toLowerCase() === 'admin_subida') {
        response = await actasAPI.descargarActa(acta.id);
        showToast('Información', 'Revisando acta que subiste', 'info');
      }
      // Caso por defecto - usar previsualización general
      else {
        response = await actasAPI.previsualizarActa(asignacionId);
        showToast('Información', 'Previsualizando acta', 'info');
      }

      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error:', error);
      showToast('Error', 'No se pudo previsualizar el acta', 'error');
    }
  };



  const handleCrearActasPendientes = async () => {
    try {
      const response = await asignacionesAPI.crearActasPendientes();
      showToast('Éxito', `Se crearon ${response.data.actasCreadas} actas pendientes`, 'success');
      // Recargar los datos
      fetchAsignaciones();
      fetchActasPendientes();
    } catch (error) {
      console.error('Error:', error);
      showToast('Error', 'No se pudieron crear las actas pendientes', 'error');
    }
  };

  const handleMarcarPendienteFirma = async (asignacionId) => {
    try {
      await actasAPI.marcarPendienteFirma({ asignacionId });
      showToast('Éxito', 'Acta marcada como pendiente de firma exitosamente', 'success');
      // Recargar los datos
      fetchAsignaciones();
      fetchActasPendientes();
    } catch (error) {
      console.error('Error:', error);
      showToast('Error', 'No se pudo marcar como pendiente de firma', 'error');
    }
  };

  // Funciones de manejo de actas
  const handleGenerarActa = (asignacion) => {
    setSelectedAsignacion(asignacion);
    setShowGenerarActaModal(true);
  };

  const handleCloseGenerarActa = () => {
    setShowGenerarActaModal(false);
    setSelectedAsignacion(null);
  };

  const handleGenerarActaSuccess = () => {
    showToast('Éxito', 'Acta generada correctamente', 'success');
    handleCloseGenerarActa();
    fetchActasPendientes();
  };

  const handleSubirActaUsuario = (asignacion) => {
    setSelectedAsignacionForUpload(asignacion);
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      showToast('Error', 'Solo se permiten archivos PDF', 'error');
      e.target.value = null;
    }
  };

  const handleUploadActa = async () => {
    if (!selectedFile || !selectedAsignacionForUpload) {
      showToast('Error', 'Selecciona un archivo y una asignación', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('acta', selectedFile);
    formData.append('asignacionId', selectedAsignacionForUpload.id);
    formData.append('observaciones', observaciones);

    try {
      await actasAPI.subirActaAdmin(formData);
      showToast('Éxito', 'Acta subida correctamente', 'success');
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedAsignacionForUpload(null);
      setObservaciones('');
      fetchActasPendientes(); // Recargar lista
    } catch (error) {
      console.error('Error:', error);
      showToast('Error', 'No se pudo subir el archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Función para manejar previsualización personalizada
  const handlePrevisualizacionPersonalizada = (acta, asignacion) => {
    setSelectedActaForPreview(acta);
    setSelectedAsignacionForPreview(asignacion);
    setIncluirFirmaTI(true);
    setFechaEntrega(new Date().toISOString().split('T')[0]); // Fecha actual por defecto
    setShowPrevisualizacionModal(true);
    console.log('Modal abierto con incluirFirmaTI:', true);
  };

  const handleConfirmarPrevisualizacion = async () => {
    try {
      let response;

      console.log('Parámetros de previsualización:', {
        incluirFirmaTI,
        fechaEntrega,
        selectedActaForPreview: selectedActaForPreview?.id,
        selectedAsignacionForPreview: selectedAsignacionForPreview?.id
      });

      if (selectedActaForPreview) {
        // Si hay acta, usar previsualización con parámetros personalizados
        response = await actasAPI.previsualizarActaPersonalizada(selectedActaForPreview.id, {
          incluirFirmaTI: incluirFirmaTI,
          fechaEntrega: fechaEntrega
        });
      } else {
        // Si no hay acta, generar nueva con parámetros personalizados
        response = await actasAPI.previsualizarActaPersonalizada(selectedAsignacionForPreview.id, {
          incluirFirmaTI: incluirFirmaTI,
          fechaEntrega: fechaEntrega
        });
      }

      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank');

      setShowPrevisualizacionModal(false);
      setSelectedActaForPreview(null);
      setSelectedAsignacionForPreview(null);
    } catch (error) {
      console.error('Error:', error);
      showToast('Error', 'No se pudo generar la previsualización personalizada', 'error');
    }
  };





  // Función de ordenamiento
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para obtener el valor de ordenamiento
  const getSortValue = (asignacion, field) => {
    switch (field) {
      case 'codigo':
        return asignacion.activo?.codigo || '';
      case 'categoria':
        return asignacion.activo?.categoria || '';
      case 'usuario':
        return `${asignacion.usuario?.nombre || ''} ${asignacion.usuario?.apellido || ''}`;
      case 'estado':
        return asignacion.estado || '';
      case 'fecha':
        return asignacion.fechaAsignacion || '';
      default:
        return '';
    }
  };

  // Filtros y búsqueda
  const filteredAsignaciones = asignaciones.filter(asignacion => {
    const matchesSearch =
      asignacion.activo?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.activo?.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.usuario?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignacion.usuario?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'todos' || asignacion.estado === filterStatus;
    const matchesCategoria = filterCategoria === 'todos' || asignacion.activo?.categoria === filterCategoria;

    return matchesSearch && matchesStatus && matchesCategoria;
  });

  // Aplicar ordenamiento
  const sortedAsignaciones = [...filteredAsignaciones].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = getSortValue(a, sortField);
    const bValue = getSortValue(b, sortField);

    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAsignaciones = sortedAsignaciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAsignaciones.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Funciones de utilidad
  const getStatusColor = (status) => {
    switch (status) {
      case 'Activa': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Devuelta': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getEstadoActaColor = (estado) => {
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

  const getCategoriaIcon = (categoria) => {
    switch (categoria?.toLowerCase()) {
      case 'equipos':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'móviles':
      case 'moviles':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'monitores':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return <HardDrive className="w-5 h-5" />;
    }
  };



  // Componente de paginación
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredAsignaciones.length)}
              </span>{' '}
              de <span className="font-medium">{filteredAsignaciones.length}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

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
            Gestión de Actas
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona actas de entrega y recepción
          </p>
        </div>

      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('asignaciones');
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'asignaciones'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Gestión de Actas ({asignaciones.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('control-actas');
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'control-actas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Control de Actas ({stats.actasSubidas})
          </button>
        </nav>
      </div>

      {/* Contenido de Asignaciones */}
      {activeTab === 'asignaciones' && (
        <>
          {/* Estadísticas Mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => {
                setFilterStatus('Activa');
                setSearchTerm('');
                setFilterCategoria('todos');
              }}
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Asignaciones Activas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.asignacionesActivas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">de {stats.totalAsignaciones} total</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FileCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actas Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.actasPendientes}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">por revisar</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actas Aprobadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.actasAprobadas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stats.porcentajeCompletado}% completado</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actas Rechazadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.actasRechazadas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">requieren atención</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros Avanzados */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por código, categoría, usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="Activa">Activas</option>
                  <option value="Devuelta">Devueltas</option>
                </select>
              </div>
              <div>
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas las categorías</option>
                  <option value="Equipos">Equipos</option>
                  <option value="Móviles">Móviles</option>
                  <option value="Monitores">Monitores</option>
                </select>
              </div>
              {/* filterDateRange select is removed */}
            </div>
          </div>

          {/* Lista de Asignaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('codigo')}
                    >
                      <div className="flex items-center">
                        Activo
                        {sortField === 'codigo' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('usuario')}
                    >
                      <div className="flex items-center">
                        Usuario
                        {sortField === 'usuario' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('estado')}
                    >
                      <div className="flex items-center">
                        Estado
                        {sortField === 'estado' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('fecha')}
                    >
                      <div className="flex items-center">
                        Fecha Asignación
                        {sortField === 'fecha' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentAsignaciones.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron asignaciones
                      </td>
                    </tr>
                  ) : (
                    currentAsignaciones.map((asignacion) => (
                      <tr key={asignacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              {getCategoriaIcon(asignacion.activo?.categoria)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {asignacion.activo?.codigo}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {asignacion.activo?.categoria}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {asignacion.usuario?.nombre} {asignacion.usuario?.apellido}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {asignacion.usuario?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asignacion.estado)}`}>
                                {asignacion.estado}
                              </span>
                            </div>
                            {actasPorAsignacion[asignacion.id] ? (
                              <div>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoActaColor(actasPorAsignacion[asignacion.id].estado)}`}>
                                  📄 {actasPorAsignacion[asignacion.id].estado}
                                </span>
                                {actasPorAsignacion[asignacion.id].metodoFirma && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Método: {actasPorAsignacion[asignacion.id].metodoFirma}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">
                                Sin acta
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(asignacion.fechaAsignacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {asignacion.estado === 'Activa' && (
                              <>
                                {/* 📄 GENERAR ACTA - Solo si no hay acta */}
                                {!actasPorAsignacion[asignacion.id] && (
                                  <Tooltip content="Generar acta para el usuario">
                                    <button
                                      onClick={() => handleGenerarActa(asignacion)}
                                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    >
                                      <FileCheck className="w-4 h-4" />
                                    </button>
                                  </Tooltip>
                                )}

                                {/* ⏰ MARCAR PENDIENTE - Solo si no hay acta */}
                                {!actasPorAsignacion[asignacion.id] && (
                                  <Tooltip content="Marcar como pendiente de firma">
                                    <button
                                      onClick={() => handleMarcarPendienteFirma(asignacion.id)}
                                      className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </button>
                                  </Tooltip>
                                )}

                                {/* 📤 UPLOAD - Siempre disponible */}
                                <Tooltip content="Subir acta firmada por el usuario">
                                  <button
                                    onClick={() => handleSubirActaUsuario(asignacion)}
                                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                  >
                                    <Upload className="w-4 h-4" />
                                  </button>
                                </Tooltip>

                                {/* 👁️ OJO NARANJA - Previsualizar según 4 condiciones */}
                                <Tooltip content="Previsualizar acta">
                                  <button
                                    onClick={() => {
                                      const acta = actasPorAsignacion[asignacion.id];
                                      // Si está en estado "pendiente de firma", mostrar modal personalizado
                                      if (!acta || acta.estado?.toLowerCase() === 'pendiente') {
                                        handlePrevisualizacionPersonalizada(acta, asignacion);
                                      } else {
                                        // Para otros estados, usar previsualización normal
                                        handlePrevisualizarActa(acta, asignacion.id);
                                      }
                                    }}
                                    className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </Tooltip>

                                {/* ✅ CHECK - Aprobar (en todos los estados excepto pendiente) */}
                                {actasPorAsignacion[asignacion.id] &&
                                  actasPorAsignacion[asignacion.id].estado?.toLowerCase() !== 'pendiente' && (
                                    <Tooltip content="Aprobar acta">
                                      <button
                                        onClick={() => {
                                          console.log('Aprobando acta:', actasPorAsignacion[asignacion.id].id);
                                          handleAprobarActa(actasPorAsignacion[asignacion.id].id, true);
                                        }}
                                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                    </Tooltip>
                                  )}

                                {/* ❌ X - Rechazar (en todos los estados excepto pendiente) */}
                                {actasPorAsignacion[asignacion.id] &&
                                  actasPorAsignacion[asignacion.id].estado?.toLowerCase() !== 'pendiente' && (
                                    <Tooltip content="Rechazar acta">
                                      <button
                                        onClick={() => {
                                          console.log('Rechazando acta:', actasPorAsignacion[asignacion.id].id);
                                          handleAprobarActa(actasPorAsignacion[asignacion.id].id, false);
                                        }}
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </Tooltip>
                                  )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={paginate}
              />
            )}
          </div>
        </>
      )}

      {/* Contenido de Control de Actas */}
      {activeTab === 'control-actas' && (
        <>
          {/* Header de Control de Actas */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Control de Actas
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Gestiona las actas de todos los usuarios
              </p>
            </div>
            <button
              onClick={() => setShowUploadModalActas(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Acta</span>
            </button>
          </div>

          {/* Estadísticas de Control de Actas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Actas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{actas.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">documentos</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FileCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.actasPendientes}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">por revisar</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprobadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.actasAprobadas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">completadas</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rechazadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.actasRechazadas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">requieren atención</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros de Control de Actas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de archivo o usuario..."
                    value={searchTermActas}
                    onChange={(e) => setSearchTermActas(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatusActas}
                  onChange={(e) => setFilterStatusActas(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="firmado">Firmado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={sortOrderActas}
                  onChange={(e) => setSortOrderActas(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fecha-desc">Más recientes primero</option>
                  <option value="fecha-asc">Más antiguos primero</option>
                  <option value="usuario">Por usuario</option>
                  <option value="activo">Por activo</option>
                  <option value="estado">Por estado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Actas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {loadingActas ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Archivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Activo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredActas.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No se encontraron actas
                        </td>
                      </tr>
                    ) : (
                      filteredActas.map((acta) => (
                        <tr key={acta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {acta.nombreArchivo}
                            </div>
                            {acta.descripcion && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {acta.descripcion}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {acta.asignacion?.usuario?.nombre} {acta.asignacion?.usuario?.apellido}
                            {acta.asignacion?.usuario?.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {acta.asignacion.usuario.email}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                                {getCategoriaIcon(acta.asignacion?.activo?.categoria)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {acta.asignacion?.activo?.codigo}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {acta.asignacion?.activo?.categoria}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorActas(acta.estado)}`}>
                              {acta.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {acta.fechaSubida ? new Date(acta.fechaSubida).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handlePreview(acta.id, acta.nombreArchivo)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Previsualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(acta.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de generar acta */}
      <GenerarActaModal
        isOpen={showGenerarActaModal}
        onClose={handleCloseGenerarActa}
        asignacion={selectedAsignacion}
        onSuccess={handleGenerarActaSuccess}
      />

      {/* Modal de subida de acta por admin */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Subir Acta por Usuario
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asignación Seleccionada
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {selectedAsignacionForUpload ? (
                      <div>
                        <div className="font-medium">
                          {selectedAsignacionForUpload.activo?.codigo} - {selectedAsignacionForUpload.usuario?.nombre} {selectedAsignacionForUpload.usuario?.apellido}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedAsignacionForUpload.usuario?.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Ninguna asignación seleccionada</span>
                    )}
                  </div>
                </div>
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
                      setSelectedAsignacionForUpload(null);
                      setObservaciones('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUploadActa}
                    disabled={!selectedFile || !selectedAsignacionForUpload || uploading}
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

      {/* Modal de previsualización personalizada */}
      {showPrevisualizacionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Previsualización Personalizada
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Personaliza la previsualización del acta en estado pendiente de firma.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Incluir firma de TI
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={incluirFirmaTI}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setIncluirFirmaTI(newValue);
                        console.log('Checkbox cambiado a:', newValue);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mostrar firma de TI en el documento
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de entrega
                  </label>
                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowPrevisualizacionModal(false);
                      setSelectedActaForPreview(null);
                      setSelectedAsignacionForPreview(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarPrevisualizacion}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                  >
                    Previsualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Subida para Control de Actas */}
      {showUploadModalActas && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Subir Acta
              </h3>
              <form onSubmit={handleUploadActas} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usuario ID
                  </label>
                  <input
                    type="number"
                    value={uploadDataActas.usuarioId}
                    onChange={(e) => setUploadDataActas({ ...uploadDataActas, usuarioId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Archivo
                  </label>
                  <input
                    type="text"
                    value={uploadDataActas.nombreArchivo}
                    onChange={(e) => setUploadDataActas({ ...uploadDataActas, nombreArchivo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Archivo PDF
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChangeActas}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={uploadDataActas.descripcion}
                    onChange={(e) => setUploadDataActas({ ...uploadDataActas, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModalActas(false);
                      setUploadDataActas({ usuarioId: '', nombreArchivo: '', descripcion: '' });
                      setSelectedFileActas(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Subir
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionActas; 