// src/components/AnimatedWrapper.jsx
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

export default function AnimatedWrapper({ 
    children, 
    animation = 'fadeIn',
    duration = 'normal',
    className = '',
    disabled = false 
}) {
    const { settings } = useSettings();

    // Si las animaciones están deshabilitadas o el prop disabled es true, no aplicar animaciones
    if (!settings.interfaceSettings.showAnimations || disabled) {
        return <div className={className}>{children}</div>;
    }

    const durationClasses = {
        fast: 'duration-150',
        normal: 'duration-300',
        slow: 'duration-500'
    };

    const animationClasses = {
        fadeIn: 'animate-fade-in',
        slideUp: 'animate-slide-up',
        slideDown: 'animate-slide-down',
        slideLeft: 'animate-slide-left',
        slideRight: 'animate-slide-right',
        scale: 'animate-scale',
        bounce: 'animate-bounce',
        pulse: 'animate-pulse'
    };

    return (
        <div className={`
            ${animationClasses[animation] || ''}
            ${durationClasses[duration]}
            transition-all ease-in-out
            ${className}
        `}>
            {children}
        </div>
    );
}
