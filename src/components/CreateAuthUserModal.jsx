import React, { useState, useEffect } from 'react';
import { X, User, Shield, Eye, EyeOff, ArrowLeft, Settings, FileText, CheckCircle } from 'lucide-react';
import StepWizard from './StepWizard';
import api from '../services/api';

export default function CreateAuthUserModal({ isOpen, onClose, onUserCreated }) {
    const [step, setStep] = useState(1);
    const [creationType, setCreationType] = useState(''); // 'standalone' o 'nomina'
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'soporte',
        isActive: true,
        // Campos adicionales para usuario de nómina
        nominaId: null,
        nombre: '',
        apellido: '',
        email: '',
        rut: '',
        departamento: '',
        empresa: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [nominaUsers, setNominaUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                username: '',
                password: '',
                role: 'soporte',
                isActive: true,
                nominaId: null,
                nombre: '',
                apellido: '',
                email: '',
                rut: '',
                departamento: '',
                empresa: ''
            });
            setError('');
            setStep(1);
            setCreationType('');
            setSearchTerm('');
        }
    }, [isOpen]);

    const loadNominaUsers = async () => {
        try {
            const response = await api.get('/pazysalvoroles/users');
            setNominaUsers(response.data);
        } catch (err) {
            console.error('Error al cargar usuarios de nómina:', err);
            setError('Error al cargar usuarios de nómina');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (step === 1 && !creationType) {
            return; // No hacer nada si no se ha seleccionado el tipo
        }
        
        if (step < 3) {
            setStep(s => s + 1);
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', formData);
            onUserCreated();
            onClose();
        } catch (err) {
            console.error('Error al crear usuario:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || 'Error al crear usuario';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreationTypeSelect = (type) => {
        setCreationType(type);
        if (type === 'nomina') {
            loadNominaUsers();
        }
    };

    const handleNominaUserSelect = (user) => {
        setFormData(prev => ({
            ...prev,
            nominaId: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            username: user.email, // Usar email como username
            rut: user.rut,
            departamento: user.departamento,
            empresa: user.empresa
        }));
    };

    // Filtrar usuarios no registrados y aplicar búsqueda
    const filteredNominaUsers = nominaUsers
        .filter(user => !user.hasAuthUser) // Solo usuarios no registrados
        .filter(user => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                user.nombre?.toLowerCase().includes(searchLower) ||
                user.apellido?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower) ||
                user.departamento?.toLowerCase().includes(searchLower) ||
                user.empresa?.toLowerCase().includes(searchLower) ||
                user.rut?.toLowerCase().includes(searchLower)
            );
        });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-8 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                            Crear Nuevo Usuario
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                            Completa la información para registrar un nuevo usuario
                        </p>
                        <button
                            onClick={onClose}
                            className="inline-flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Volver</span>
                        </button>
                    </div>
                </div>

                {/* Step Wizard */}
                <StepWizard current={step} type="usuario" />

                {/* Form Content */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                                        <User className="w-5 h-5 mr-2 text-blue-600" />
                                        Selecciona el tipo de usuario a crear
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Opción 1: Usuario independiente */}
                                        <div 
                                            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                                                creationType === 'standalone' 
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                            onClick={() => handleCreationTypeSelect('standalone')}
                                        >
                                            <div className="flex items-center mb-4">
                                                <User className="w-8 h-8 text-blue-600 mr-3" />
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Usuario Independiente
                                                </h4>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                Crear un usuario sin vincular a datos de nómina. Ideal para usuarios externos o administrativos.
                                            </p>
                                        </div>

                                        {/* Opción 2: Usuario de nómina */}
                                        <div 
                                            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                                                creationType === 'nomina' 
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                            onClick={() => handleCreationTypeSelect('nomina')}
                                        >
                                            <div className="flex items-center mb-4">
                                                <FileText className="w-8 h-8 text-green-600 mr-3" />
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Usuario de Nómina
                                                </h4>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                Crear un usuario vinculado a los datos de nómina existentes. Los datos se cargarán automáticamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                {creationType === 'standalone' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <User className="w-5 h-5 mr-2 text-blue-600" />
                                            Información del usuario independiente
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Nombre de Usuario *
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Ingresa el nombre de usuario"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Contraseña *
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full pl-3 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Ingresa la contraseña"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Rol del Usuario *
                                                </label>
                                                <div className="relative">
                                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <select
                                                        name="role"
                                                        value={formData.role}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="admin">Administrador</option>
                                                        <option value="soporte">Soporte</option>
                                                        <option value="usuario">Usuario</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    name="isActive"
                                                    checked={formData.isActive}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Usuario activo
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {creationType === 'nomina' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <FileText className="w-5 h-5 mr-2 text-green-600" />
                                            Selecciona el usuario de nómina
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Barra de búsqueda */}
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nombre, email, departamento, empresa o RUT..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            
                                            {/* Contador de resultados */}
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {filteredNominaUsers.length} usuario{filteredNominaUsers.length !== 1 ? 's' : ''} disponible{filteredNominaUsers.length !== 1 ? 's' : ''}
                                                {searchTerm && ` para "${searchTerm}"`}
                                            </div>

                                            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                                                {filteredNominaUsers.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                        {searchTerm ? 'No se encontraron usuarios con ese criterio de búsqueda' : 'No hay usuarios de nómina disponibles para registrar'}
                                                    </div>
                                                ) : (
                                                    filteredNominaUsers.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className={`p-4 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                                            formData.nominaId === user.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''
                                                        }`}
                                                        onClick={() => handleNominaUserSelect(user)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                                    {user.nombre} {user.apellido}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {user.email} • {user.departamento} • {user.empresa}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    RUT: {user.rut}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    ))
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Contraseña *
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full pl-3 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="Ingresa la contraseña"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Rol del Usuario *
                                                    </label>
                                                    <div className="relative">
                                                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <select
                                                            name="role"
                                                            value={formData.role}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        >
                                                            <option value="admin">Administrador</option>
                                                            <option value="soporte">Soporte</option>
                                                            <option value="usuario">Usuario</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                        <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                                        Revisión y confirmación
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuario:</span>
                                                <p className="text-gray-900 dark:text-white">{formData.username}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rol:</span>
                                                <p className="text-gray-900 dark:text-white capitalize">{formData.role}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado:</span>
                                                <p className="text-gray-900 dark:text-white">{formData.isActive ? 'Activo' : 'Inactivo'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6">
                            <button
                                type="button"
                                onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {step > 1 ? 'Anterior' : 'Cancelar'}
                            </button>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Creando...' : step < 3 ? 'Siguiente' : 'Crear Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}