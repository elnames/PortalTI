// src/pages/Usuarios.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '../components/DataTable';
import ActivosAsignadosCell from '../components/ActivosAsignadosCell';
// eslint-disable-next-line no-unused-vars
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { User, Building, Users, TrendingUp, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const columnHelper = createColumnHelper()

const columns = [
    columnHelper.accessor('nombre', { header: 'Nombre' }),
    columnHelper.accessor('apellido', { header: 'Apellido' }),
    columnHelper.accessor('rut', { header: 'RUT' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('departamento', { header: 'Departamento' }),
    columnHelper.accessor('empresa', { header: 'Empresa' }),
    columnHelper.accessor(
        row => row.activosAsignados,
        {
            id: 'activosAsignados',
            header: 'Activos Asignados',
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ getValue, row }) => <ActivosAsignadosCell activosAsignados={getValue()} usuario={row.original} />
        }
    ),
]

export default function Usuarios() {
    const navigate = useNavigate()
    const [usuarios, setUsuarios] = useState([])
    const [loading, setLoading] = useState(true)
    const [rowSelection, setRowSelection] = useState({})

    // Estados para navegación de cards
    const [currentDeptIndex, setCurrentDeptIndex] = useState(0)
    const [currentEmpresaIndex, setCurrentEmpresaIndex] = useState(0)
    const [currentActivosIndex, setCurrentActivosIndex] = useState(0)

    // Estados para filtrado
    const [filteredData, setFilteredData] = useState([])
    const [activeFilter, setActiveFilter] = useState(null)

    // Estados para el modal de confirmación
    // eslint-disable-next-line no-unused-vars
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    // eslint-disable-next-line no-unused-vars
    const [usuariosToDelete, setUsuariosToDelete] = useState([])

    const fetchUsuarios = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/usuarios')
            setUsuarios(data)
            setFilteredData(data) // Inicialmente mostrar todos
        } catch (err) {
            console.error('Error al cargar usuarios:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsuarios()
    }, [])

    // Calcular estadísticas
    const stats = useMemo(() => {
        if (!usuarios.length) return {
            total: 0,
            porEmpresa: {},
            porDepartamento: {},
            usuariosConActivos: 0,
            usuariosSinActivos: 0,
            departamentosArray: [],
            empresasArray: [],
            activosArray: []
        }

        const porEmpresa = usuarios.reduce((acc, user) => {
            // Manejar casos donde empresa es null, undefined, o string vacío
            const empresa = user.empresa && user.empresa.trim() !== '' ? user.empresa : 'Sin empresa'
            acc[empresa] = (acc[empresa] || 0) + 1
            return acc
        }, {})

        const porDepartamento = usuarios.reduce((acc, user) => {
            const depto = user.departamento || 'Sin departamento'
            acc[depto] = (acc[depto] || 0) + 1
            return acc
        }, {})

        const usuariosConActivos = usuarios.filter(user =>
            user.activosAsignados && user.activosAsignados.length > 0
        ).length

        const usuariosSinActivos = usuarios.length - usuariosConActivos

        const departamentosArray = Object.entries(porDepartamento)
            .sort(([, a], [, b]) => b - a)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))

        const empresasArray = Object.entries(porEmpresa)
            .sort(([, a], [, b]) => b - a)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))

        const activosArray = [
            { nombre: 'Con Activos', cantidad: usuariosConActivos },
            { nombre: 'Sin Activos', cantidad: usuariosSinActivos }
        ]

        return {
            total: usuarios.length,
            porEmpresa,
            porDepartamento,
            usuariosConActivos,
            usuariosSinActivos,
            departamentosArray,
            empresasArray,
            activosArray
        }
    }, [usuarios])

    // Resetear índices cuando cambien los datos
    useEffect(() => {
        setCurrentDeptIndex(0)
        setCurrentEmpresaIndex(0)
        setCurrentActivosIndex(0)
    }, [stats.departamentosArray.length, stats.empresasArray.length, stats.activosArray.length])

    // Funciones de filtrado
    const handleFilterByDepartment = (departamento) => {
        if (activeFilter?.type === 'departamento' && activeFilter?.value === departamento) {
            // Si ya está filtrado por este departamento, quitar filtro
            setFilteredData(usuarios)
            setActiveFilter(null)
        } else {
            // Aplicar filtro
            const filtered = usuarios.filter(user => user.departamento === departamento)
            setFilteredData(filtered)
            setActiveFilter({ type: 'departamento', value: departamento })
        }
    }

    const handleFilterByCompany = (empresa) => {
        if (activeFilter?.type === 'empresa' && activeFilter?.value === empresa) {
            // Si ya está filtrado por esta empresa, quitar filtro
            setFilteredData(usuarios)
            setActiveFilter(null)
        } else {
            // Aplicar filtro
            const filtered = usuarios.filter(user => {
                const userEmpresa = user.empresa && user.empresa.trim() !== '' ? user.empresa : 'Sin empresa'
                return userEmpresa === empresa
            })
            setFilteredData(filtered)
            setActiveFilter({ type: 'empresa', value: empresa })
        }
    }

    const handleFilterByTotal = () => {
        setFilteredData(usuarios)
        setActiveFilter(null)
    }

    const handleFilterByActivos = (tipo) => {
        if (activeFilter?.type === tipo) {
            // Si ya está filtrado por este tipo, quitar filtro
            setFilteredData(usuarios)
            setActiveFilter(null)
        } else {
            // Aplicar filtro
            let filtered
            if (tipo === 'withAssets') {
                filtered = usuarios.filter(user =>
                    user.activosAsignados && user.activosAsignados.length > 0
                )
            } else if (tipo === 'withoutAssets') {
                filtered = usuarios.filter(user =>
                    !user.activosAsignados || user.activosAsignados.length === 0
                )
            }
            setFilteredData(filtered)
            setActiveFilter({ type: tipo })
        }
    }

    const selectedRowIndex = Object.keys(rowSelection)[0]
    const selectedId = selectedRowIndex !== undefined ? filteredData[selectedRowIndex]?.id : undefined
    const selectedCount = Object.keys(rowSelection).length

    const handleDelete = () => {
        if (selectedCount === 0) return

        // Obtener información de los usuarios seleccionados
        const usuariosSeleccionados = Object.keys(rowSelection).map(index => filteredData[parseInt(index)])

        // Preparar datos para el modal
        const usuariosParaEliminar = usuariosSeleccionados.map(user => ({
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            departamento: user.departamento,
            activosAsignados: user.activosAsignados ? user.activosAsignados.length : 0
        }))

        setUsuariosToDelete(usuariosParaEliminar)
        setShowDeleteModal(true)
    }

    // eslint-disable-next-line no-unused-vars
    const handleConfirmDelete = async () => {
        try {
            if (usuariosToDelete.length === 1) {
                // Eliminación individual
                const response = await api.delete(`/usuarios/${usuariosToDelete[0].id}`)

                // Mostrar información adicional si hay activos desasignados
                if (response.data && response.data.activosDesasignados > 0) {
                    alert(`✅ Usuario eliminado exitosamente.\n\n${response.data.activosDesasignados} activo(s) han sido desasignados automáticamente.`)
                } else {
                    alert('✅ Usuario eliminado exitosamente.')
                }
            } else {
                // Eliminación múltiple
                const idsAEliminar = usuariosToDelete.map(u => u.id)
                const response = await api.delete('/usuarios/multiple', { data: idsAEliminar })

                // Mostrar información adicional si hay activos desasignados
                if (response.data && response.data.totalActivosDesasignados > 0) {
                    alert(`✅ ${response.data.usuariosEliminados} usuario(s) eliminado(s) exitosamente.\n\n${response.data.totalActivosDesasignados} activo(s) han sido desasignados automáticamente.`)
                } else {
                    alert(`✅ ${response.data.usuariosEliminados} usuario(s) eliminado(s) exitosamente.`)
                }
            }

            await fetchUsuarios() // refresca la lista desde el backend
            setRowSelection({})
            setShowDeleteModal(false)
            setUsuariosToDelete([])
        } catch (err) {
            console.error('Error al eliminar usuario(s):', err)
            alert('❌ Error al eliminar usuario(s). Por favor, inténtalo de nuevo.')
        }
    }

    // eslint-disable-next-line no-unused-vars
    const handleCancelDelete = () => {
        setShowDeleteModal(false)
        setUsuariosToDelete([])
    }

    const handleRowClick = (row) => {
        // Navegar al detalle del usuario
        navigate(`/usuarios/${row.id}`)
    }

    const actions = (
        <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={() => navigate('/usuarios/nuevo')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm px-3 py-2 rounded-lg hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg transform-gpu font-medium"
            >
                + Nuevo
            </button>
            <button
                onClick={() => navigate(`/usuarios/${selectedId}`)}
                disabled={!selectedId || selectedCount !== 1}
                className={`text-sm px-3 py-2 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1 ${selectedId && selectedCount === 1
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-105 shadow-md hover:shadow-lg transform-gpu'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
            >
                <span>👁️</span>
                <span className="hidden sm:inline">Ver</span>
                <span className="sm:hidden">Ver</span>
            </button>
            <button
                onClick={() => navigate(`/usuarios/${selectedId}/editar`)}
                disabled={!selectedId || selectedCount !== 1}
                className={`text-sm px-3 py-2 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1 ${selectedId && selectedCount === 1
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white hover:scale-105 shadow-md hover:shadow-lg transform-gpu'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
            >
                <span>✏️</span>
                <span className="hidden sm:inline">Editar</span>
                <span className="sm:hidden">Edit</span>
            </button>
            <button
                onClick={handleDelete}
                disabled={selectedCount === 0}
                className={`text-sm px-3 py-2 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1 ${selectedCount > 0
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:scale-105 shadow-md hover:shadow-lg transform-gpu'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
            >
                <span>🗑️</span>
                <span className="hidden sm:inline">{selectedCount === 1 ? 'Borrar' : `Borrar (${selectedCount})`}</span>
                <span className="sm:hidden">{selectedCount === 1 ? 'Borrar' : `(${selectedCount})`}</span>
            </button>
        </div>
    )

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300">Cargando usuarios…</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white">
                <User className="w-6 h-6 mr-2 text-primary" />
                Usuarios
            </h1>

            {/* Cards de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total de usuarios */}
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${activeFilter === null ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
                        }`}
                    onClick={handleFilterByTotal}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usuarios</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                {/* Activos - Card interactivo */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center cursor-pointer flex-1"
                            onClick={() => {
                                if (stats.activosArray.length > 0) {
                                    const tipo = stats.activosArray[currentActivosIndex]?.nombre === 'Con Activos' ? 'withAssets' : 'withoutAssets'
                                    handleFilterByActivos(tipo)
                                }
                            }}
                        >
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activos</p>
                                {stats.activosArray.length > 0 ? (
                                    <>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {stats.activosArray[currentActivosIndex]?.nombre || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {stats.activosArray[currentActivosIndex]?.cantidad || 0} usuarios
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {stats.total > 0 ? `${Math.round((stats.activosArray[currentActivosIndex]?.cantidad / stats.total) * 100)}%` : '0%'}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos</p>
                                )}
                            </div>
                        </div>
                        {stats.activosArray.length > 1 && (
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setCurrentActivosIndex(prev =>
                                        prev === 0 ? stats.activosArray.length - 1 : prev - 1
                                    )}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={() => setCurrentActivosIndex(prev =>
                                        prev === stats.activosArray.length - 1 ? 0 : prev + 1
                                    )}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Departamentos - Card interactivo */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center cursor-pointer flex-1"
                            onClick={() => {
                                if (stats.departamentosArray.length > 0) {
                                    handleFilterByDepartment(stats.departamentosArray[currentDeptIndex]?.nombre)
                                }
                            }}
                        >
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                                <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departamentos</p>
                                {stats.departamentosArray.length > 0 ? (
                                    <>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {stats.departamentosArray[currentDeptIndex]?.nombre || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {stats.departamentosArray[currentDeptIndex]?.cantidad || 0} usuarios
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos</p>
                                )}
                            </div>
                        </div>
                        {stats.departamentosArray.length > 1 && (
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setCurrentDeptIndex(prev =>
                                        prev === 0 ? stats.departamentosArray.length - 1 : prev - 1
                                    )}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={() => setCurrentDeptIndex(prev =>
                                        prev === stats.departamentosArray.length - 1 ? 0 : prev + 1
                                    )}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Empresas - Card interactivo */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center cursor-pointer flex-1"
                            onClick={() => {
                                if (stats.empresasArray.length > 0) {
                                    handleFilterByCompany(stats.empresasArray[currentEmpresaIndex]?.nombre)
                                }
                            }}
                        >
                            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                                <Building className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Empresa</p>
                                {stats.empresasArray.length > 0 ? (
                                    <>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {stats.empresasArray[currentEmpresaIndex]?.nombre || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {stats.empresasArray[currentEmpresaIndex]?.cantidad || 0} usuarios
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sin empresas</p>
                                )}
                            </div>
                        </div>
                        {stats.empresasArray.length > 1 && (
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setCurrentEmpresaIndex(prev =>
                                        prev === 0 ? stats.empresasArray.length - 1 : prev - 1
                                    )}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={() => setCurrentEmpresaIndex(prev =>
                                        prev === stats.empresasArray.length - 1 ? 0 : prev + 1
                                    )}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Indicador de filtro activo */}
            {activeFilter && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Filtro activo:</strong> {activeFilter.type === 'departamento' ? 'Departamento' :
                            activeFilter.type === 'empresa' ? 'Empresa' :
                                activeFilter.type === 'withAssets' ? 'Usuarios con activos' :
                                    activeFilter.type === 'withoutAssets' ? 'Usuarios sin activos' : ''} - {activeFilter.value || (activeFilter.type === 'withAssets' ? 'Con activos' : activeFilter.type === 'withoutAssets' ? 'Sin activos' : '')}
                        <button
                            onClick={() => {
                                setFilteredData(usuarios)
                                setActiveFilter(null)
                            }}
                            className="ml-2 text-blue-500 hover:text-blue-700 underline"
                        >
                            Limpiar filtro
                        </button>
                    </p>
                </div>
            )}

            <DataTable
                columns={columns}
                data={filteredData}
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                onRowClick={handleRowClick}
                actions={actions}
            />

            {/* Modal de confirmación de eliminación */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                usuarios={usuariosToDelete}
                activosDesasignados={usuariosToDelete}
            />
        </div>
    );
}
