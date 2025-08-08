import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AccessDenied() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const getRedirectPath = () => {
        if (!user) return '/login';
        if (user.role === 'admin' || user.role === 'soporte') return '/dashboard';
        return '/mis-activos';
    };

    const handleRedirect = () => {
        navigate(getRedirectPath());
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Acceso Denegado
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        No tienes permisos para acceder a esta página.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleRedirect}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Ir a mi página principal
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver atrás
                    </button>
                </div>

                {user && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Usuario:</strong> {user.nombre && user.apellido
                                ? `${user.nombre} ${user.apellido}`
                                : user.username}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Rol:</strong> {user.role}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
