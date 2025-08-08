// src/components/Tooltip.jsx
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export default function Tooltip({ 
    children, 
    content, 
    position = 'top',
    className = '',
    disabled = false 
}) {
    const { settings } = useSettings();
    const [isVisible, setIsVisible] = useState(false);

    // Si los tooltips están deshabilitados o el prop disabled es true, no mostrar
    if (!settings.interfaceSettings.showTooltips || disabled) {
        return <span className={className}>{children}</span>;
    }

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    return (
        <div 
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`
                    absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg
                    ${positionClasses[position]}
                    ${className}
                `}>
                    {content}
                    {/* Flecha del tooltip */}
                    <div className={`
                        absolute w-0 h-0
                        ${position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900' : ''}
                        ${position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900' : ''}
                        ${position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900' : ''}
                        ${position === 'right' ? 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900' : ''}
                    `} />
                </div>
            )}
        </div>
    );
}
