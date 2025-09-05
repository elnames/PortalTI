import { useState, useEffect } from 'react';

export function useResponsiveSidebar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            // Solo cerrar automáticamente en pantallas muy pequeñas (menos de 768px)
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                // En pantallas medianas y grandes, mantener el sidebar abierto
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

