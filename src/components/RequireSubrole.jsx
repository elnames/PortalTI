// src/components/RequireSubrole.jsx
import { useAuth } from '../contexts/AuthContext';
import { useUserSubroles } from '../hooks/useUserSubroles';
import AccessDenied from '../pages/AccessDenied';

/**
 * Componente para proteger rutas basadas en subroles de Paz y Salvo
 * @param {string[]} subroles - Array de subroles requeridos
 * @param {React.ReactNode} children - Componente a renderizar si tiene permisos
 */
export default function RequireSubrole({ subroles, children }) {
    const { user } = useAuth();
    const { hasSubrole, loading } = useUserSubroles();

    // Si no hay usuario autenticado, mostrar acceso denegado
    if (!user) {
        return <AccessDenied />;
    }

    // Si aún está cargando los subroles, mostrar loading
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Verificar si el usuario tiene alguno de los subroles requeridos
    const hasRequiredSubrole = subroles.some(subrole => hasSubrole(subrole));

    // Si no tiene el subrole requerido, mostrar acceso denegado
    if (!hasRequiredSubrole) {
        return <AccessDenied />;
    }

    // Si tiene permisos, renderizar el componente
    return children;
}
