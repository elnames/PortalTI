import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, User, Search } from 'lucide-react';

export default function UserAutoComplete({
    value,
    onChange,
    usuarios,
    placeholder = "Buscar usuario...",
    label,
    required = false,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredUsuarios, setFilteredUsuarios] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Si hay un valor inicial, buscar el usuario correspondiente
        if (value && usuarios && usuarios.length > 0) {
            const user = usuarios.find(u => u.id === value);
            if (user) {
                setInputValue(`${user.nombre || ''} ${user.apellido || ''} - ${user.departamento || ''}`);
            }
        }
    }, [value, usuarios]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        if (newValue.trim() === '') {
            setFilteredUsuarios([]);
            setIsOpen(false);
            onChange('');
            return;
        }

        const filtered = usuarios.filter(usuario => {
            if (!usuario) return false;

            const searchTerm = newValue.toLowerCase();
            const fullName = `${usuario.nombre || ''} ${usuario.apellido || ''}`.toLowerCase();
            const department = (usuario.departamento || '').toLowerCase();
            const email = (usuario.email || '').toLowerCase();

            return fullName.includes(searchTerm) ||
                department.includes(searchTerm) ||
                email.includes(searchTerm);
        });

        setFilteredUsuarios(filtered);
        setIsOpen(filtered.length > 0);
    };

    const handleUserSelect = (usuario) => {
        setInputValue(`${usuario.nombre || ''} ${usuario.apellido || ''} - ${usuario.departamento || ''}`);
        onChange(usuario.id);
        setIsOpen(false);
    };

    const handleClear = () => {
        setInputValue('');
        setFilteredUsuarios([]);
        setIsOpen(false);
        onChange('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleFocus = () => {
        if (inputValue.trim() !== '' && filteredUsuarios.length > 0) {
            setIsOpen(true);
        }
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>

                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    required={required}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />

                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    {inputValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && filteredUsuarios.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsuarios.map((usuario) => (
                        <button
                            key={usuario.id}
                            type="button"
                            onClick={() => handleUserSelect(usuario)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                        >
                            <div className="flex items-center">
                                <User className="w-4 h-4 text-blue-600 mr-2" />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {usuario.nombre || ''} {usuario.apellido || ''}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {usuario.departamento || ''} • {usuario.email || ''}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && filteredUsuarios.length === 0 && inputValue.trim() !== '' && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        No se encontraron usuarios que coincidan con "{inputValue}"
                    </div>
                </div>
            )}
        </div>
    );
} 