import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CategoryCarousel = ({ children, itemsPerView = 4 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef(null);

    // Calcular el número total de slides
    const totalItems = React.Children.count(children);
    const totalSlides = Math.max(1, Math.ceil(totalItems / itemsPerView) - 1);

    const nextSlide = () => {
        setCurrentIndex(prev => Math.min(prev + 1, totalSlides - 1));
    };

    const prevSlide = () => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    const canGoNext = currentIndex < totalSlides - 1;
    const canGoPrev = currentIndex > 0;

    // Navegación con teclado
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft' && canGoPrev) {
                prevSlide();
            } else if (event.key === 'ArrowRight' && canGoNext) {
                nextSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canGoPrev, canGoNext]);

    return (
        <div className="relative w-full">
            {/* Contenedor del carrusel */}
            <div
                ref={containerRef}
                className="overflow-hidden px-6 sm:px-8 md:px-12 py-4"
            >
                <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                        width: `${(totalItems / itemsPerView) * 100}%`
                    }}
                >
                    {React.Children.map(children, (child, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 px-2"
                            style={{
                                width: `${100 / itemsPerView}%`,
                                minWidth: '250px' // Ancho mínimo para evitar que las tarjetas se compriman demasiado
                            }}
                        >
                            {child}
                        </div>
                    ))}
                </div>
            </div>

            {/* Botón de navegación izquierda */}
            {canGoPrev && (
                <button
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 sm:p-3 shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-xl"
                    aria-label="Categoría anterior"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                </button>
            )}

            {/* Botón de navegación derecha */}
            {canGoNext && (
                <button
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 sm:p-3 shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-xl"
                    aria-label="Siguiente categoría"
                >
                    <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                </button>
            )}

            {/* Indicadores de posición */}
            {totalSlides > 1 && (
                <div className="flex justify-center mt-4 sm:mt-6 space-x-2 sm:space-x-3">
                    {Array.from({ length: totalSlides }, (_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 hover:scale-110 ${index === currentIndex
                                ? 'bg-blue-600 dark:bg-blue-400 shadow-md'
                                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                                }`}
                            aria-label={`Ir a slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryCarousel;
