// src/pages/Perfil.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Lock, Check, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SignatureImage } from '../utils/signatureUtils';

export default function Perfil() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [signatureFile, setSignatureFile] = useState(null);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [currentSignature, setCurrentSignature] = useState(null);

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage('Las contraseñas no coinciden');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // Llamada real a la API para cambiar contraseña
            await api.put('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setMessage('Contraseña cambiada correctamente');
            setShowPasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            if (error.response?.status === 400) {
                setMessage('La contraseña actual es incorrecta');
            } else {
                setMessage('Error al cambiar la contraseña. Inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Cargar información actual del usuario incluyendo la firma
        const loadCurrentUser = async () => {
            try {
                const response = await api.get('/auth/me');
                setCurrentSignature(response.data.signaturePath);
            } catch (error) {
                console.error('Error al cargar datos del usuario:', error);
            }
        };
        loadCurrentUser();
    }, []);

    const handleSignatureFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setSignatureFile(file);
            } else {
                setMessage('Solo se permiten archivos de imagen');
            }
        }
    };

    const handleUploadSignature = async () => {
        if (!signatureFile) {
            setMessage('Por favor selecciona un archivo de imagen');
            return;
        }

        setUploadingSignature(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('signature', signatureFile);

            const response = await api.post('/auth/upload-signature', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('Firma subida exitosamente');
            setCurrentSignature(response.data.signaturePath);
            setSignatureFile(null);

            // Limpiar el input de archivo
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error('Error al subir firma:', error);
            setMessage('Error al subir la firma. Inténtalo de nuevo.');
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleRemoveSignature = async () => {
        setUploadingSignature(true);
        setMessage('');

        try {
            await api.delete('/auth/remove-signature');
            setMessage('Firma eliminada exitosamente');
            setCurrentSignature(null);
        } catch (error) {
            console.error('Error al eliminar firma:', error);
            setMessage('Error al eliminar la firma. Inténtalo de nuevo.');
        } finally {
            setUploadingSignature(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-semibold">Mi Perfil</h1>
            </div>

            {/* Mensaje de estado */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.includes('Error') || message.includes('incorrecta')
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                    <Check className="w-4 h-4" />
                    <span>{message}</span>
                </div>
            )}

            {/* Información del usuario */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-2xl font-medium text-white">
                            {user?.nombre && user?.apellido
                                ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
                                : user?.username?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                            }
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">
                            {user?.nombre && user?.apellido
                                ? `${user.nombre} ${user.apellido}`
                                : user?.username || 'Usuario'
                            }
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 capitalize">{user?.role || 'Usuario'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                            {user?.nombre || 'No disponible'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Apellido
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                            {user?.apellido || 'No disponible'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                            {user?.username}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rol
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 capitalize">
                            {user?.role || 'Usuario'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Departamento
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                            {user?.departamento || 'No disponible'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Empresa
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                            {user?.empresa || 'Empresa A'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ID de usuario
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                            {user?.id || 'N/A'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                        </label>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Activo
                        </span>
                    </div>
                </div>

                {/* Sección de Firma Digital */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Firma Digital</h3>
                    <div className="space-y-4">
                        {/* Mostrar firma actual si existe */}
                        {currentSignature && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Firma actual:</p>
                                <div className="flex items-center justify-between">
                                    <SignatureImage
                                        signaturePath={currentSignature}
                                        alt="Firma actual"
                                        className="max-h-16 bg-white p-2 border rounded"
                                        onError={(error) => {
                                            console.error('Error cargando firma:', error);
                                        }}
                                    />
                                    <button
                                        onClick={handleRemoveSignature}
                                        disabled={uploadingSignature}
                                        className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                    >
                                        <X className="w-3 h-3 mr-1" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Subir nueva firma */}
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {currentSignature ? 'Cambiar firma:' : 'Subir firma digital:'}
                            </p>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleSignatureFileSelect}
                                    className="flex-1 text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                                />
                                <button
                                    onClick={handleUploadSignature}
                                    disabled={!signatureFile || uploadingSignature}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadingSignature ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Subiendo...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Subir
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Se recomienda usar imágenes PNG con fondo transparente. Tamaño máximo: 5MB
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Acciones</h3>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Cambiar contraseña
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal para cambiar contraseña */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Cambiar contraseña</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contraseña actual
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Ingresa tu contraseña actual"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nueva contraseña
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirmar nueva contraseña
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Repite la nueva contraseña"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleChangePassword}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    });
                                    setMessage('');
                                }}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 