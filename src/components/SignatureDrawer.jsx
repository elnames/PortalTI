import React, { useRef, useEffect, useState } from 'react';
import { X, RotateCcw, Save } from 'lucide-react';

const SignatureDrawer = ({ isOpen, onClose, onSave, title = "Crear tu firma digital" }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [context, setContext] = useState(null);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Configurar el canvas
            canvas.width = 400;
            canvas.height = 200;

            // Configurar el contexto
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            setContext(ctx);

            // Limpiar canvas
            clearCanvas();
        }
    }, [isOpen]);

    const clearCanvas = () => {
        if (context && canvasRef.current) {
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setHasSignature(false);
        }
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        context.beginPath();
        context.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        context.lineTo(x, y);
        context.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleSave = () => {
        if (!hasSignature) {
            window.alert('Por favor dibuja tu firma antes de guardar');
            return;
        }

        // Convertir canvas a blob
        canvasRef.current.toBlob((blob) => {
            const file = new File([blob], 'signature.png', { type: 'image/png' });
            onSave(file);
            onClose();
        }, 'image/png');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                        ⚠️ Importante
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Tu firma debe ser lo más similar posible a la de tu carnet de identidad.
                        Un admin/soporte puede rechazar el acta si la firma no corresponde.
                    </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
                    <canvas
                        ref={canvasRef}
                        className="border border-gray-200 dark:border-gray-700 rounded cursor-crosshair w-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            const touch = e.touches[0];
                            const mouseEvent = new MouseEvent('mousedown', {
                                clientX: touch.clientX,
                                clientY: touch.clientY
                            });
                            canvasRef.current.dispatchEvent(mouseEvent);
                        }}
                        onTouchMove={(e) => {
                            e.preventDefault();
                            const touch = e.touches[0];
                            const mouseEvent = new MouseEvent('mousemove', {
                                clientX: touch.clientX,
                                clientY: touch.clientY
                            });
                            canvasRef.current.dispatchEvent(mouseEvent);
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            const mouseEvent = new MouseEvent('mouseup', {});
                            canvasRef.current.dispatchEvent(mouseEvent);
                        }}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <button
                        onClick={clearCanvas}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <RotateCcw size={16} className="mr-1" />
                        Limpiar
                    </button>

                    <div className="flex space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasSignature}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} className="mr-1" />
                            Guardar Firma
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignatureDrawer; 