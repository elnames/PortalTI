import React, { useState, useMemo, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '../components/DataTable';
import AsignarActivoModal from '../components/AsignarActivoModal';
import HistorialAsignacionesModal from '../components/HistorialAsignacionesModal';

import {
    HardDrive,
    Smartphone,
    Monitor,
    Keyboard,
    Usb,
    Wifi,
    List,
    User,
    History,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { activosAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const columnHelper = createColumnHelper()

// Columnas por categoría
const columnsByCategory = {
    all: [
        columnHelper.accessor('codigo', { header: 'Código' }),
        columnHelper.accessor('categoria', { header: 'Categoría' }),
        columnHelper.accessor('estado', { header: 'Estado' }),
        columnHelper.accessor('ubicacion', { header: 'Ubicación' }),
        columnHelper.accessor(
            row => row.asignadoA ? `${row.asignadoA.nombre} (${row.asignadoA.departamento})` : 'Sin asignar',
            {
                id: 'asignadoA',
                header: 'Asignado a',
                enableSorting: false,
                enableColumnFilter: false,
            }
        ),
    ],
    Equipos: [
        columnHelper.accessor('codigo', { header: 'Código' }),
        columnHelper.accessor('nombreEquipo', { header: 'Nombre' }),
        columnHelper.accessor('tipoEquipo', { header: 'Tipo Equipo' }),
        columnHelper.accessor('marca', { header: 'Marca' }),
        columnHelper.accessor('procesador', { header: 'Procesador' }),
        columnHelper.accessor('ram', { header: 'RAM' }),
        columnHelper.accessor(
            row => {
                // Intentar parsear desde discosJson si existe
                if (row.discosJson) {
                    try {
                        const discos = JSON.parse(row.discosJson);
                        return Array.isArray(discos) ? discos.map(d => `${d.tipo} ${d.capacidad}GB`).join(', ') : '';
                    } catch (e) {
                        console.error('Error parseando discosJson:', e);
                        return '';
                    }
                }
                // Si no hay discosJson, usar el campo discos directo
                return Array.isArray(row.discos) ? row.discos.map(d => `${d.tipo} ${d.capacidad}GB`).join(', ') : '';
            },
            { header: 'Almacenamiento' }
        ),
        columnHelper.accessor('ubicacion', { header: 'Ubicación' }),
        columnHelper.accessor(
            row => row.asignadoA ? `${row.asignadoA.nombre} (${row.asignadoA.departamento})` : 'Sin asignar',
            {
                id: 'asignadoA',
                header: 'Asignado a',
                enableSorting: false,
                enableColumnFilter: false,
            }
        ),
    ],
    Móviles: [
        columnHelper.accessor('codigo', { header: 'Código' }),
        columnHelper.accessor('nombre', { header: 'Nombre' }),
        columnHelper.accessor('imei', { header: 'IMEI' }),
        columnHelper.accessor('celular', { header: 'N° Celular' }),
        columnHelper.accessor('marca', { header: 'Marca' }),
        columnHelper.accessor('modelo', { header: 'Modelo' }),
        columnHelper.accessor('plan', { header: 'Plan' }),
        columnHelper.accessor('ubicacion', { header: 'Ubicación' }),
        columnHelper.accessor(
            row => row.asignadoA ? `${row.asignadoA.nombre} (${row.asignadoA.departamento})` : 'Sin asignar',
            {
                id: 'asignadoA',
                header: 'Asignado a',
                enableSorting: false,
                enableColumnFilter: false,
            }
        ),
    ],
    Monitores: [
        columnHelper.accessor('codigo', { header: 'Código' }),
        columnHelper.accessor('nombre', { header: 'Nombre' }),
        columnHelper.accessor('serie', { header: 'N° Serie' }),
        columnHelper.accessor('marca', { header: 'Marca' }),
        columnHelper.accessor('pulgadas', { header: 'Pulgadas' }),
        columnHelper.accessor('ubicacion', { header: 'Ubicación' }),
        columnHelper.accessor(
            row => row.asignadoA ? `${row.asignadoA.nombre} (${row.asignadoA.departamento})` : 'Sin asignar',
            {
                id: 'asignadoA',
                header: 'Asignado a',
                enableSorting: false,
                enableColumnFilter: false,
            }
        ),
    ],
    Periféricos: [
        columnHelper.accessor('codigo', { header: 'Código' }),
        columnHelper.accessor('nombre', { header: 'Nombre' }),
        columnHelper.accessor('cantidad', { header: 'Cantidad' }),
        columnHelper.accessor('ubicacion', { header: 'Ubicación' }),
        columnHelper.accessor(
            row => row.asignadoA ? `${row.asignadoA.nombre} (${row.asignadoA.departamento})` : 'Sin asignar',
            {
                id: 'asignadoA',
                header: 'Asignado a',
                enableSorting: false,
                enableColumnFilter: false,
            }
        ),
    ],
    Accesorios: [
        columnHelper.accessor('codigo', { header: 'Código' }),
        columnHelper.accessor('nombre', { header: 'Nombre' }),
        columnHelper.accessor('cantidad', { header: 'Cantidad' }),
        columnHelper.accessor('ubicacion', { header: 'Ubicación' }),
        columnHelper.accessor(
            row => row.asignadoA ? `${row.asignadoA.nombre} (${row.asignadoA.departamento})` : 'Sin asignar',
            {
                id: 'asignadoA',
                header: 'Asignado a',
                enableSorting: false,
                enableColumnFilter: false,
            }
        ),
    ],
    Red: [
        columnHelper.accessor('codigo', { header: 'Código' }),
        columnHelper.accessor('nombre', { header: 'Nombre' }),
        columnHelper.accessor('cantidad', { header: 'Cantidad' }),
        columnHelper.accessor('ubicacion', { header: 'Ubicación' }),
        columnHelper.accessor(
            row => row.asignadoA ? `${row.asignadoA.nombre} (${row.asignadoA.departamento})` : 'Sin asignar',
            {
                id: 'asignadoA',
                header: 'Asignado a',
                enableSorting: false,
                enableColumnFilter: false,
            }
        ),
    ],
}

// Categorías fijas (comentadas por ahora)
// const categories = [
//     { key: 'all', label: 'Todos', icon: List },
//     { key: 'Equipos', label: 'Equipos', icon: HardDrive },
//     { key: 'Móviles', label: 'Móviles', icon: Smartphone },
//     { key: 'Monitores', label: 'Monitores', icon: Monitor },
//     { key: 'Periféricos', label: 'Periféricos', icon: Keyboard },
//     { key: 'Accesorios', label: 'Accesorios', icon: Usb },
//     { key: 'Red', label: 'Red', icon: Wifi },
// ]

export default function Activos() {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [activos, setActivos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedCat, setSelectedCat] = useState('all')
    const [rowSelection, setRowSelection] = useState({})

    // Estados para los modales
    const [showAsignarModal, setShowAsignarModal] = useState(false)
    const [showHistorialModal, setShowHistorialModal] = useState(false)
    const [showDarBajaModal, setShowDarBajaModal] = useState(false)
    const [selectedActivo, setSelectedActivo] = useState(null)
    const [motivoBaja, setMotivoBaja] = useState('')

    // Estados para filtrado
    const [filteredData, setFilteredData] = useState([])
    const [activeFilter, setActiveFilter] = useState(null)

    const fetchActivos = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await api.get('/activos')
            setActivos(data)
            setFilteredData(data) // Inicialmente mostrar todos
        } catch (err) {
            console.error('Error al cargar activos:', err)
            setError('Error al cargar los activos. Verifica tu conexión.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActivos()
    }, [])

    // Calcular estadísticas por categoría
    const stats = useMemo(() => {
        if (!activos.length) return {
            total: 0,
            porCategoria: {},
            categoriasArray: []
        }

        const porCategoria = activos.reduce((acc, activo) => {
            const categoria = activo.categoria || 'Sin categoría'
            acc[categoria] = (acc[categoria] || 0) + 1
            return acc
        }, {})

        const categoriasArray = Object.entries(porCategoria)
            .sort(([, a], [, b]) => b - a)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))

        return {
            total: activos.length,
            porCategoria,
            categoriasArray
        }
    }, [activos])

    // Obtener columnas según categoría seleccionada
    const columns = useMemo(() => {
        return columnsByCategory[selectedCat] || columnsByCategory.all
    }, [selectedCat])

    // Filtrar y mapear datos según categoría
    const data = useMemo(() => {
        if (selectedCat === 'all') {
            return activos
        }
        if (selectedCat === 'Equipos') {
            const equiposFiltrados = activos
                .filter(a => a.categoria === 'Equipos')
                .map(a => {
                    return {
                        ...a,
                        tipoEquipo: a.tipoEquipo || '',
                        nombre: a.nombreEquipo,
                        procesador: a.procesador || '',
                        ram: a.ram,
                        marca: a.marca,
                        modelo: a.modelo,
                        discos: a.discos || [],
                        ubicacion: a.ubicacion || '',
                    }
                })
            return equiposFiltrados
        }
        if (selectedCat === 'Móviles') {
            return activos
                .filter(a => a.categoria === 'Móviles')
                .map(a => ({
                    ...a,
                    // adapta los campos según tu modelo real
                }))
        }
        if (selectedCat === 'Monitores') {
            return activos
                .filter(a => a.categoria === 'Monitores')
                .map(a => ({
                    ...a,
                    // adapta los campos según tu modelo real
                }))
        }
        if (selectedCat === 'Periféricos') {
            return activos
                .filter(a => a.categoria === 'Periféricos')
                .map(a => ({
                    ...a,
                    // adapta los campos según tu modelo real
                }))
        }
        if (selectedCat === 'Accesorios') {
            return activos
                .filter(a => a.categoria === 'Accesorios')
                .map(a => ({
                    ...a,
                    // adapta los campos según tu modelo real
                }))
        }
        if (selectedCat === 'Red') {
            return activos
                .filter(a => a.categoria === 'Red')
                .map(a => ({
                    ...a,
                    // adapta los campos según tu modelo real
                }))
        }
        return activos
    }, [activos, selectedCat])

    // Funciones de filtrado
    const handleFilterByCategory = (categoria) => {
        if (activeFilter?.type === 'categoria' && activeFilter?.value === categoria) {
            // Si ya está filtrado por esta categoría, quitar filtro
            setActiveFilter(null)
            setSelectedCat('all')
        } else {
            // Aplicar filtro
            setActiveFilter({ type: 'categoria', value: categoria })
            setSelectedCat(categoria)
        }
    }

    const handleFilterByTotal = () => {
        setActiveFilter(null)
        setSelectedCat('all')
    }

    const selectedRowIndex = Object.keys(rowSelection)[0]
    const selectedId = selectedRowIndex !== undefined ? data[selectedRowIndex]?.codigo : undefined
    const selectedCount = Object.keys(rowSelection).length

    const handleDelete = async () => {
        if (selectedCount === 0) return

        const confirmMessage = selectedCount === 1
            ? '¿Seguro que deseas eliminar este activo?'
            : `¿Seguro que deseas eliminar ${selectedCount} activos?`

        if (!window.confirm(confirmMessage)) return

        try {
            if (selectedCount === 1) {
                // Eliminación individual
                await api.delete(`/activos/${selectedId}`)
            } else {
                // Eliminación múltiple
                const codigosAEliminar = Object.keys(rowSelection).map(index => data[parseInt(index)].codigo)
                await api.delete('/activos/multiple', { data: codigosAEliminar })
            }

            await fetchActivos() // refresca la lista desde el backend
            setRowSelection({})
        } catch (err) {
            console.error('Error al eliminar activo(s):', err)
        }
    }

    const handleAsignar = () => {
        if (selectedCount === 0) return

        if (selectedCount === 1) {
            // Asignación individual
            const activo = data[selectedRowIndex]
            setSelectedActivo(activo)
        } else {
            // Asignación múltiple
            const activosSeleccionados = Object.keys(rowSelection).map(index => data[parseInt(index)])
            setSelectedActivo(activosSeleccionados)
        }

        setShowAsignarModal(true)
    }

    const handleVerHistorial = () => {
        if (!selectedId || selectedCount !== 1) return
        const activo = data[selectedRowIndex]
        setSelectedActivo(activo)
        setShowHistorialModal(true)
    }

    const handleAsignacionCreada = () => {
        fetchActivos() // Recargar la lista para mostrar la nueva asignación
        setRowSelection({})
    }

    const handleDevolucionRealizada = () => {
        fetchActivos() // Recargar la lista para mostrar el cambio de estado
    }

    const handleDarBaja = async () => {
        if (!motivoBaja.trim()) {
            showToast('Debe ingresar un motivo para dar de baja', 'error')
            return
        }

        try {
            const selectedActivos = Object.keys(rowSelection).map(index => activos[index])

            for (const activo of selectedActivos) {
                await activosAPI.darBaja(activo.id, motivoBaja)
            }

            showToast(`Activo(s) dado(s) de baja exitosamente`, 'success')
            setShowDarBajaModal(false)
            setMotivoBaja('')
            setRowSelection({})
            fetchActivos()
        } catch (error) {
            console.error('Error al dar de baja:', error)
            const errorMessage = error.response?.data || 'Error al dar de baja el activo'
            showToast(errorMessage, 'error')
        }
    }

    const handleRowClick = (row) => {
        // Navegar al detalle del activo
        navigate(`/activos/${row.codigo}`)
    }

    const actions = (
        <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <button
                    onClick={() => {
                        const categoriaSeleccionada = activeFilter?.value || (selectedCat !== 'all' ? selectedCat : '')
                        navigate(`/activos/nuevo?categoria=${categoriaSeleccionada}`)
                    }}
                    className="bg-primary text-white text-xs px-2 py-1 rounded hover:bg-primary-dark transition-colors font-medium"
                >
                    + Nuevo
                </button>
                <button
                    onClick={() => navigate(`/activos/${selectedId}`)}
                    disabled={!selectedId || selectedCount !== 1}
                    className={`text-xs px-2 py-1 rounded transition-colors font-medium ${selectedId && selectedCount === 1
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Ver
                </button>
                <button
                    onClick={() => navigate(`/activos/${selectedId}/editar`)}
                    disabled={!selectedId || selectedCount !== 1}
                    className={`text-xs px-2 py-1 rounded transition-colors font-medium ${selectedId && selectedCount === 1
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Editar
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <button
                    onClick={handleAsignar}
                    disabled={selectedCount === 0}
                    className={`text-xs px-2 py-1 rounded transition-colors font-medium flex items-center space-x-1 ${selectedCount > 0
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <User className="w-3 h-3" />
                    <span>{selectedCount === 1 ? 'Asignar' : `Asignar (${selectedCount})`}</span>
                </button>
                <button
                    onClick={handleVerHistorial}
                    disabled={!selectedId || selectedCount !== 1}
                    className={`text-xs px-2 py-1 rounded transition-colors font-medium flex items-center space-x-1 ${selectedId && selectedCount === 1
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <History className="w-3 h-3" />
                    <span>Historial</span>
                </button>
                <button
                    onClick={() => setShowDarBajaModal(true)}
                    disabled={selectedCount === 0}
                    className={`text-xs px-2 py-1 rounded transition-colors font-medium flex items-center space-x-1 ${selectedCount > 0
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <Trash2 className="w-3 h-3" />
                    <span>{selectedCount === 1 ? 'Dar de Baja' : `Dar de Baja (${selectedCount})`}</span>
                </button>
                <button
                    onClick={handleDelete}
                    disabled={selectedCount === 0}
                    className={`text-xs px-2 py-1 rounded transition-colors font-medium ${selectedCount > 0
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {selectedCount === 1 ? 'Borrar' : `Borrar (${selectedCount})`}
                </button>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white">
                    <HardDrive className="w-6 h-6 mr-2 text-primary" />
                    Activos
                </h1>
                <p className="mt-4 text-gray-700 dark:text-gray-300">Cargando activos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white">
                    <HardDrive className="w-6 h-6 mr-2 text-primary" />
                    Activos
                </h1>
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
                    <p>{error}</p>
                    <button
                        onClick={fetchActivos}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white">
                <HardDrive className="w-6 h-6 mr-2 text-primary" />
                Activos
            </h1>

            {/* Cards de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total de activos */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${activeFilter === null ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
                        }`}
                    onClick={handleFilterByTotal}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                            <List className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Activos</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                {/* Equipos */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${activeFilter?.type === 'categoria' && activeFilter?.value === 'Equipos' ? 'ring-2 ring-green-500' : 'hover:shadow-lg'
                        }`}
                    onClick={() => handleFilterByCategory('Equipos')}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                            <HardDrive className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Equipos</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.porCategoria['Equipos'] || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Móviles */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${activeFilter?.type === 'categoria' && activeFilter?.value === 'Móviles' ? 'ring-2 ring-purple-500' : 'hover:shadow-lg'
                        }`}
                    onClick={() => handleFilterByCategory('Móviles')}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                            <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Móviles</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.porCategoria['Móviles'] || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Monitores */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${activeFilter?.type === 'categoria' && activeFilter?.value === 'Monitores' ? 'ring-2 ring-orange-500' : 'hover:shadow-lg'
                        }`}
                    onClick={() => handleFilterByCategory('Monitores')}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                            <Monitor className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monitores</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.porCategoria['Monitores'] || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Periféricos */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${activeFilter?.type === 'categoria' && activeFilter?.value === 'Periféricos' ? 'ring-2 ring-red-500' : 'hover:shadow-lg'
                        }`}
                    onClick={() => handleFilterByCategory('Periféricos')}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                            <Keyboard className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Periféricos</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.porCategoria['Periféricos'] || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Accesorios */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${activeFilter?.type === 'categoria' && activeFilter?.value === 'Accesorios' ? 'ring-2 ring-indigo-500' : 'hover:shadow-lg'
                        }`}
                    onClick={() => handleFilterByCategory('Accesorios')}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/20">
                            <Usb className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accesorios</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.porCategoria['Accesorios'] || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Red */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${activeFilter?.type === 'categoria' && activeFilter?.value === 'Red' ? 'ring-2 ring-teal-500' : 'hover:shadow-lg'
                        }`}
                    onClick={() => handleFilterByCategory('Red')}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-teal-100 dark:bg-teal-900/20">
                            <Wifi className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Red</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.porCategoria['Red'] || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Indicador de filtro activo */}
            {activeFilter && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Filtro activo:</strong> Categoría - {activeFilter.value}
                        </p>
                        <button
                            onClick={() => {
                                setActiveFilter(null)
                                setSelectedCat('all')
                            }}
                            className="text-blue-500 hover:text-blue-700 underline text-sm"
                        >
                            Limpiar filtro
                        </button>
                    </div>
                </div>
            )}

            {/* Tabla con acciones y columnas dinámicas */}
            <DataTable
                columns={columns}
                data={data}
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                onRowClick={handleRowClick}
                actions={actions}
            />

            {/* Modales */}
            <AsignarActivoModal
                isOpen={showAsignarModal}
                onClose={() => setShowAsignarModal(false)}
                activo={selectedActivo}
                onAsignacionCreada={handleAsignacionCreada}
            />

            <HistorialAsignacionesModal
                isOpen={showHistorialModal}
                onClose={() => setShowHistorialModal(false)}
                activo={selectedActivo}
                onDevolucionRealizada={handleDevolucionRealizada}
            />

            {/* Modal para dar de baja */}
            {showDarBajaModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                                Dar de Baja Activo(s)
                            </h2>
                            <button
                                onClick={() => {
                                    setShowDarBajaModal(false)
                                    setMotivoBaja('')
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                ¿Está seguro que desea dar de baja {selectedCount === 1 ? 'el activo seleccionado' : `los ${selectedCount} activos seleccionados`}?
                                Esta acción no se puede deshacer.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Motivo de la baja *
                                </label>
                                <textarea
                                    value={motivoBaja}
                                    onChange={(e) => setMotivoBaja(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Ingrese el motivo de la baja..."
                                    rows="3"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={() => {
                                    setShowDarBajaModal(false)
                                    setMotivoBaja('')
                                }}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDarBaja}
                                disabled={!motivoBaja.trim()}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Confirmar Baja
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
