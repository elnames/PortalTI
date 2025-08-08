// src/components/ThemeWrapper.jsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeWrapper({ children }) {
    const { darkMode } = useTheme();

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-50 text-gray-900'
        }`}>
            {children}
        </div>
    );
} 