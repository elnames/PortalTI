// src/components/SoftwareSecurityManager.jsx
import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Plus, Edit2, Trash2, Key } from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import UserAutoComplete from './UserAutoComplete';
import {
    softwareSecurityAPI,
    programasEstandarAPI,
    softwareAPI,
    programasSeguridadAPI,
    licenciasAPI
} from '../services/api';
import api from '../services/api';

export default function SoftwareSecurityManager({ activoId, activoData }) {
    const [softwareList, setSoftwareList] = useState([]);
    const [securityList, setSecurityList] = useState([]);
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddSoftware, setShowAddSoftware] = useState(false);
    const [showAddSecurity, setShowAddSecurity] = useState(false);
    const [showAddLicense, setShowAddLicense] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [programasEstandar, setProgramasEstandar] = useState([]);
    const [programasSoftware, setProgramasSoftware] = useState([]);
    const [programasSeguridad, setProgramasSeguridad] = useState([]);
    const [programasLicencias, setProgramasLicencias] = useState([]);
    const { alertSuccess, alertError } = useNotificationContext();

    // Estados para formularios
    const [newSoftware, setNewSoftware] = useState({
        nombre: '',
        version: '',
        estado: 'OK',
        fechaInstalacion: '',
        notas: ''
    });

    const [newSecurity, setNewSecurity] = useState({
        nombre: '',
        tipo: 'Antivirus',
        estado: 'OK',
        notas: ''
    });

    const [newLicense, setNewLicense] = useState({
        software: '',
        tipo: 'Perpetua',
        numeroLicencia: '',
        usuarioAsignado: '',
        notas: ''
    });

    useEffect(() => {
        if (activoId) {
            loadSoftwareAndSecurity();
            loadUsuarios();
            loadProgramasEstandar();
        }
    }, [activoId]);

    const loadUsuarios = async () => {
        try {
            const response = await api.get('/usuarios');
            setUsuarios(response.data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    };

    const loadProgramasEstandar = async () => {
        try {
            console.log('Cargando programas estándar...');
            const response = await programasEstandarAPI.getAll();
            console.log('Respuesta de programas estándar:', response);
            const programas = response.data;
            console.log('Programas recibidos:', programas);
            setProgramasEstandar(programas);
            setProgramasSoftware(programas.filter(p => p.categoria === 'Software'));
            setProgramasSeguridad(programas.filter(p => p.categoria === 'Seguridad'));
            setProgramasLicencias(programas.filter(p => p.categoria === 'Licencia'));
            console.log('Programas de software:', programas.filter(p => p.categoria === 'Software'));
            console.log('Programas de seguridad:', programas.filter(p => p.categoria === 'Seguridad'));
            console.log('Programas de licencias:', programas.filter(p => p.categoria === 'Licencia'));
        } catch (error) {
            console.error('Error al cargar programas estándar:', error);
            alertError('Error al cargar programas estándar: ' + error.message);
        }
    };

    const handleTogglePrograma = async (programa, tipo) => {
        try {
            const isInstalado = tipo === 'software'
                ? softwareList.some(s => s.nombre.toLowerCase().includes(programa.nombre.toLowerCase()))
                : tipo === 'seguridad'
                    ? securityList.some(p => p.nombre.toLowerCase().includes(programa.nombre.toLowerCase()))
                    : licenses.some(l => l.software.toLowerCase().includes(programa.nombre.toLowerCase()));

            if (isInstalado) {
                // Si está instalado, eliminarlo
                if (tipo === 'software') {
                    const softwareToRemove = softwareList.find(s => s.nombre.toLowerCase().includes(programa.nombre.toLowerCase()));
                    if (softwareToRemove) {
                        await softwareSecurityAPI.deleteSoftware(softwareToRemove.id);
                        loadSoftware();
                    }
                } else if (tipo === 'seguridad') {
                    const programaToRemove = securityList.find(p => p.nombre.toLowerCase().includes(programa.nombre.toLowerCase()));
                    if (programaToRemove) {
                        await softwareSecurityAPI.deleteProgramaSeguridad(programaToRemove.id);
                        loadProgramasSeguridad();
                    }
                } else if (tipo === 'licencia') {
                    const licenciaToRemove = licenses.find(l => l.software.toLowerCase().includes(programa.nombre.toLowerCase()));
                    if (licenciaToRemove) {
                        await softwareSecurityAPI.deleteLicencia(licenciaToRemove.id);
                        loadLicencias();
                    }
                }
                alertSuccess(`${programa.nombre} eliminado correctamente`);
            } else {
                // Si no está instalado, agregarlo
                const nuevoItem = {
                    nombre: programa.nombre,
                    version: programa.versionRecomendada || 'Latest',
                    estado: 'OK',
                    fechaInstalacion: new Date().toISOString().split('T')[0],
                    notas: `Agregado desde programas estándar - ${programa.descripcion || ''}`
                };

                if (tipo === 'software') {
                    await softwareSecurityAPI.createSoftware({
                        ...nuevoItem,
                        activoId: activoId
                    });
                    loadSoftware();
                } else if (tipo === 'seguridad') {
                    await softwareSecurityAPI.createProgramaSeguridad({
                        ...nuevoItem,
                        activoId: activoId
                    });
                    loadProgramasSeguridad();
                } else if (tipo === 'licencia') {
                    await softwareSecurityAPI.createLicencia({
                        ...nuevoItem,
                        activoId: activoId
                    });
                    loadLicencias();
                }
                alertSuccess(`${programa.nombre} agregado correctamente`);
            }
        } catch (error) {
            console.error('Error al toggle programa:', error);
            alertError('Error al actualizar programa: ' + error.message);
        }
    };

    const getUserNameById = (userId) => {
        if (!userId || !usuarios.length) return 'No asignado';
        const usuario = usuarios.find(u => u.id === userId);
        return usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.email || 'Usuario sin nombre' : 'Usuario no encontrado';
    };

    const loadSoftware = async () => {
        try {
            const response = await softwareSecurityAPI.getByActivo(activoId);
            setSoftwareList(response.data.software || []);
        } catch (error) {
            console.error('Error al cargar software:', error);
        }
    };

    const loadProgramasSeguridad = async () => {
        try {
            const response = await softwareSecurityAPI.getByActivo(activoId);
            setSecurityList(response.data.programasSeguridad || []);
        } catch (error) {
            console.error('Error al cargar programas de seguridad:', error);
        }
    };

    const loadLicencias = async () => {
        try {
            const response = await softwareSecurityAPI.getByActivo(activoId);
            setLicenses(response.data.licencias || []);
        } catch (error) {
            console.error('Error al cargar licencias:', error);
        }
    };

    const loadSoftwareAndSecurity = async () => {
        try {
            setLoading(true);
            const response = await softwareSecurityAPI.getByActivo(activoId);
            setSoftwareList(response.data.software || []);
            setSecurityList(response.data.programasSeguridad || []);
            setLicenses(response.data.licencias || []);
        } catch (error) {
            console.error('Error al cargar software y seguridad:', error);
            alertError('Error al cargar software y seguridad');
        } finally {
            setLoading(false);
        }
    };

    const addSoftware = async () => {
        try {
            const response = await softwareSecurityAPI.createSoftware({
                ...newSoftware,
                activoId: activoId
            });
            setSoftwareList(prev => [...prev, response.data]);
            setNewSoftware({ nombre: '', version: '', estado: 'OK', fechaInstalacion: '', notas: '' });
            setShowAddSoftware(false);
            alertSuccess('Software agregado correctamente');
        } catch (error) {
            console.error('Error al agregar software:', error);
            alertError('Error al agregar software');
        }
    };

    const addSecurity = async () => {
        try {
            const response = await softwareSecurityAPI.createProgramaSeguridad({
                ...newSecurity,
                activoId: activoId
            });
            setSecurityList(prev => [...prev, response.data]);
            setNewSecurity({ nombre: '', tipo: 'Antivirus', estado: 'OK', notas: '' });
            setShowAddSecurity(false);
            alertSuccess('Programa de seguridad agregado correctamente');
        } catch (error) {
            console.error('Error al agregar programa de seguridad:', error);
            alertError('Error al agregar programa de seguridad');
        }
    };

    const addLicense = async () => {
        try {
            const response = await softwareSecurityAPI.createLicencia({
                ...newLicense,
                activoId: activoId,
                fechaInicio: null,
                fechaVencimiento: null
            });
            setLicenses(prev => [...prev, response.data]);
            setNewLicense({ software: '', tipo: 'Perpetua', numeroLicencia: '', usuarioAsignado: '', notas: '' });
            setShowAddLicense(false);
            alertSuccess('Licencia agregada correctamente');
        } catch (error) {
            console.error('Error al agregar licencia:', error);
            alertError('Error al agregar licencia');
        }
    };

    const deleteSoftware = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este software?')) return;

        try {
            await softwareSecurityAPI.deleteSoftware(id);
            setSoftwareList(prev => prev.filter(s => s.id !== id));
            alertSuccess('Software eliminado correctamente');
        } catch (error) {
            console.error('Error al eliminar software:', error);
            alertError('Error al eliminar software');
        }
    };

    const deleteSecurity = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este programa de seguridad?')) return;

        try {
            await softwareSecurityAPI.deleteProgramaSeguridad(id);
            setSecurityList(prev => prev.filter(s => s.id !== id));
            alertSuccess('Programa de seguridad eliminado correctamente');
        } catch (error) {
            console.error('Error al eliminar programa de seguridad:', error);
            alertError('Error al eliminar programa de seguridad');
        }
    };

    const deleteLicense = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta licencia?')) return;

        try {
            await softwareSecurityAPI.deleteLicencia(id);
            setLicenses(prev => prev.filter(l => l.id !== id));
            alertSuccess('Licencia eliminada correctamente');
        } catch (error) {
            console.error('Error al eliminar licencia:', error);
            alertError('Error al eliminar licencia');
        }
    };

    const getStatusIcon = (estado) => {
        switch (estado?.toUpperCase()) {
            case 'OK':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'NO':
            case 'PENDIENTE':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = (estado) => {
        switch (estado?.toUpperCase()) {
            case 'OK':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'NO':
            case 'PENDIENTE':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Software Instalado */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-blue-600" />
                        Software Instalado
                    </h3>
                    <button
                        onClick={() => setShowAddSoftware(true)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Agregar</span>
                    </button>
                </div>
                <div className="p-4">
                    {/* Programas Estándar Disponibles */}
                    {programasSoftware.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Programas Estándar Disponibles</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {programasSoftware.map((programa) => {
                                    const isInstalado = softwareList.some(s => s.nombre.toLowerCase().includes(programa.nombre.toLowerCase()));
                                    return (
                                        <div
                                            key={programa.id}
                                            onClick={() => handleTogglePrograma(programa, 'software')}
                                            className={`p-2 rounded border text-xs cursor-pointer transition-all duration-200 hover:shadow-md ${isInstalado
                                                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{programa.nombre}</span>
                                                {isInstalado ? (
                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 text-gray-400" />
                                                )}
                                            </div>
                                            {programa.versionRecomendada && (
                                                <div className="text-xs opacity-75 mt-1">
                                                    v{programa.versionRecomendada}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {softwareList.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay software registrado</p>
                    ) : (
                        <div className="space-y-3">
                            {softwareList.map((software) => (
                                <div key={software.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {getStatusIcon(software.estado)}
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{software.nombre}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Versión {software.version} • Instalado: {software.fechaInstalacion}
                                            </p>
                                            {software.notas && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{software.notas}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(software.estado)}`}>
                                            {software.estado}
                                        </span>
                                        <button
                                            onClick={() => deleteSoftware(software.id)}
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            title="Eliminar software"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Programas de Seguridad */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-green-600" />
                        Programas de Seguridad
                    </h3>
                    <button
                        onClick={() => setShowAddSecurity(true)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Agregar</span>
                    </button>
                </div>
                <div className="p-4">
                    {/* Programas de Seguridad Estándar Disponibles */}
                    {programasSeguridad.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Programas de Seguridad Estándar Disponibles</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {programasSeguridad.map((programa) => {
                                    const isInstalado = securityList.some(s => s.nombre.toLowerCase().includes(programa.nombre.toLowerCase()));
                                    return (
                                        <div
                                            key={programa.id}
                                            onClick={() => handleTogglePrograma(programa, 'seguridad')}
                                            className={`p-2 rounded border text-xs cursor-pointer transition-all duration-200 hover:shadow-md ${isInstalado
                                                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{programa.nombre}</span>
                                                {isInstalado ? (
                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="text-xs opacity-75 mt-1">
                                                {programa.tipo}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {securityList.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay programas de seguridad registrados</p>
                    ) : (
                        <div className="space-y-3">
                            {securityList.map((security) => (
                                <div key={security.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {getStatusIcon(security.estado)}
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{security.nombre}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {security.tipo}
                                            </p>
                                            {security.notas && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{security.notas}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(security.estado)}`}>
                                            {security.estado}
                                        </span>
                                        <button
                                            onClick={() => deleteSecurity(security.id)}
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            title="Eliminar programa de seguridad"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Licencias Asignadas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Key className="h-5 w-5 mr-2 text-purple-600" />
                        Licencias Asignadas
                    </h3>
                    <button
                        onClick={() => setShowAddLicense(true)}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Agregar</span>
                    </button>
                </div>
                <div className="p-4">
                    {/* Licencias Estándar Disponibles */}
                    {programasLicencias.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Licencias Estándar Disponibles</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {programasLicencias.map((programa) => {
                                    const isAsignada = licenses.some(l => l.software.toLowerCase().includes(programa.nombre.toLowerCase()));
                                    return (
                                        <div
                                            key={programa.id}
                                            onClick={() => handleTogglePrograma(programa, 'licencia')}
                                            className={`p-2 rounded border text-xs cursor-pointer transition-all duration-200 hover:shadow-md ${isAsignada
                                                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{programa.nombre}</span>
                                                {isAsignada ? (
                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="text-xs opacity-75 mt-1">
                                                {programa.tipo}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {licenses.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay licencias asignadas</p>
                    ) : (
                        <div className="space-y-3">
                            {licenses.map((license) => (
                                <div key={license.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-gray-900 dark:text-white">{license.software}</p>
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                                {license.tipo}
                                            </span>
                                            <button
                                                onClick={() => deleteLicense(license.id)}
                                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                title="Eliminar licencia"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <p>Licencia: {license.numeroLicencia}</p>
                                        <p>Usuario: {getUserNameById(license.usuarioAsignado)}</p>
                                    </div>
                                    {license.notas && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{license.notas}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para agregar software */}
            {showAddSoftware && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agregar Software</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Seleccionar Software Estándar
                                </label>
                                <select
                                    value={newSoftware.nombre}
                                    onChange={(e) => {
                                        const programa = programasSoftware.find(p => p.nombre === e.target.value);
                                        setNewSoftware(prev => ({
                                            ...prev,
                                            nombre: e.target.value,
                                            version: programa?.versionRecomendada || ''
                                        }));
                                    }}
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Seleccionar programa...</option>
                                    {programasSoftware.map((programa) => (
                                        <option key={programa.id} value={programa.nombre}>
                                            {programa.nombre} {programa.versionRecomendada && `(${programa.versionRecomendada})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    O escribir manualmente
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre del software"
                                    value={newSoftware.nombre}
                                    onChange={(e) => setNewSoftware(prev => ({ ...prev, nombre: e.target.value }))}
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Versión"
                                value={newSoftware.version}
                                onChange={(e) => setNewSoftware(prev => ({ ...prev, version: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <select
                                value={newSoftware.estado}
                                onChange={(e) => setNewSoftware(prev => ({ ...prev, estado: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="OK">OK</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="NO">NO</option>
                            </select>
                            <input
                                type="date"
                                value={newSoftware.fechaInstalacion}
                                onChange={(e) => setNewSoftware(prev => ({ ...prev, fechaInstalacion: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <textarea
                                placeholder="Notas (opcional)"
                                value={newSoftware.notas}
                                onChange={(e) => setNewSoftware(prev => ({ ...prev, notas: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                rows="3"
                            />
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddSoftware(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addSoftware}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para agregar seguridad */}
            {showAddSecurity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agregar Programa de Seguridad</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Seleccionar Programa de Seguridad Estándar
                                </label>
                                <select
                                    value={newSecurity.nombre}
                                    onChange={(e) => {
                                        const programa = programasSeguridad.find(p => p.nombre === e.target.value);
                                        setNewSecurity(prev => ({
                                            ...prev,
                                            nombre: e.target.value,
                                            tipo: programa?.tipo || 'Antivirus'
                                        }));
                                    }}
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Seleccionar programa...</option>
                                    {programasSeguridad.map((programa) => (
                                        <option key={programa.id} value={programa.nombre}>
                                            {programa.nombre} ({programa.tipo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    O escribir manualmente
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre del programa"
                                    value={newSecurity.nombre}
                                    onChange={(e) => setNewSecurity(prev => ({ ...prev, nombre: e.target.value }))}
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <select
                                value={newSecurity.tipo}
                                onChange={(e) => setNewSecurity(prev => ({ ...prev, tipo: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="Antivirus">Antivirus</option>
                                <option value="Firewall">Firewall</option>
                                <option value="VPN">VPN</option>
                                <option value="Antimalware">Antimalware</option>
                                <option value="Otro">Otro</option>
                            </select>
                            <select
                                value={newSecurity.estado}
                                onChange={(e) => setNewSecurity(prev => ({ ...prev, estado: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="OK">OK</option>
                                <option value="NO">NO</option>
                                <option value="Pendiente">Pendiente</option>
                            </select>

                            <textarea
                                placeholder="Notas (opcional)"
                                value={newSecurity.notas}
                                onChange={(e) => setNewSecurity(prev => ({ ...prev, notas: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                rows="3"
                            />
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddSecurity(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addSecurity}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para agregar licencia */}
            {showAddLicense && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agregar Licencia</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Seleccionar Licencia Estándar
                                </label>
                                <select
                                    value={newLicense.software}
                                    onChange={(e) => {
                                        const programa = programasLicencias.find(p => p.nombre === e.target.value);
                                        setNewLicense(prev => ({
                                            ...prev,
                                            software: e.target.value,
                                            tipo: programa?.tipo || 'Perpetua'
                                        }));
                                    }}
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Seleccionar licencia...</option>
                                    {programasLicencias.map((programa) => (
                                        <option key={programa.id} value={programa.nombre}>
                                            {programa.nombre} ({programa.tipo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    O escribir manualmente
                                </label>
                                <input
                                    type="text"
                                    placeholder="Software"
                                    value={newLicense.software}
                                    onChange={(e) => setNewLicense(prev => ({ ...prev, software: e.target.value }))}
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <select
                                value={newLicense.tipo}
                                onChange={(e) => setNewLicense(prev => ({ ...prev, tipo: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="Perpetua">Perpetua</option>
                                <option value="Anual">Anual</option>
                                <option value="Mensual">Mensual</option>
                                <option value="Trial">Trial</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Número de licencia"
                                value={newLicense.numeroLicencia}
                                onChange={(e) => setNewLicense(prev => ({ ...prev, numeroLicencia: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <UserAutoComplete
                                value={newLicense.usuarioAsignado}
                                onChange={(userId) => setNewLicense(prev => ({ ...prev, usuarioAsignado: userId }))}
                                usuarios={usuarios}
                                placeholder="Buscar usuario para asignar licencia..."
                                label="Usuario asignado"
                                className="w-full"
                            />
                            <textarea
                                placeholder="Notas (opcional)"
                                value={newLicense.notas}
                                onChange={(e) => setNewLicense(prev => ({ ...prev, notas: e.target.value }))}
                                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                rows="3"
                            />
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddLicense(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addLicense}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
