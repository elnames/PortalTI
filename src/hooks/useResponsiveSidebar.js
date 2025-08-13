import { useState, useEffect } from 'react';

export function useResponsiveSidebar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            // En pantallas pequeñas (menos de 1024px), cerrar el sidebar automáticamente
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                // En pantallas grandes, mantener el sidebar abierto por defecto
                setIsSidebarOpen(true);
            }
        };

        // Ejecutar al montar el componente
        handleResize();

        // Agregar listener para cambios de tamaño
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return { isSidebarOpen, toggleSidebar };
}

