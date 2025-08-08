// src/components/Header.jsx
import { Search, Bell, User, Settings, LogOut, ChevronDown, X, Loader2, Sun, Moon, Menu } from 'lucide-react'
import { Menu as HeadlessMenu, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useSearch } from '../contexts/SearchContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'

export default function Header({ toggleSidebar }) {
    const { user, logout } = useAuth()
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications()
    const { searchQuery, searchResults, isSearching, handleSearch, clearSearch, navigateToResult, searchHistory, clearSearchHistory, setSearchQuery } = useSearch()
    const { darkMode, toggleDarkMode } = useTheme()
    const navigate = useNavigate()
    const [showSearchResults, setShowSearchResults] = useState(false)
    const searchRef = useRef(null)

    // Debug: verificar historial
    useEffect(() => {
        console.log('Historial de búsquedas:', searchHistory)
    }, [searchHistory])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleProfile = () => {
        navigate('/perfil')
    }

    const handleSettings = () => {
        navigate('/ajustes')
    }

    const getInitials = (user) => {
        if (user?.nombre && user?.apellido) {
            return `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
        }
        if (user?.username) {
            return user.username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return 'U'
    }

    const handleSearchChange = (e) => {
        const query = e.target.value
        handleSearch(query)
        setShowSearchResults(true)
    }

    const handleSearchFocus = () => {
        setShowSearchResults(true)
    }

    const handleSearchBlur = () => {
        // Delay para permitir clicks en los resultados
        setTimeout(() => setShowSearchResults(false), 200)
    }

    const handleResultClick = (result) => {
        navigateToResult(result)
        setShowSearchResults(false)
    }

    const handleHistoryClick = (query) => {
        console.log('Clic en historial:', query)
        handleSearch(query)
        setSearchQuery(query)
    }

    // Cerrar resultados al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getTypeIcon = (type) => {
        switch (type) {
            case 'activo': return '💻'
            case 'usuario': return '👤'
            case 'ticket': return '🎫'
            default: return '📄'
        }
    }

    const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now - date
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Ahora'
        if (minutes < 60) return `${minutes}m`
        if (hours < 24) return `${hours}h`
        return `${days}d`
    }

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo y búsqueda */}
                    <div className="flex items-center space-x-4">
                        {/* Botón de hamburguesa para móviles */}
                        <button
                            onClick={toggleSidebar}
                            className="sm:hidden p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-md transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Portal IT</h1>
                        </div>

                        {/* Solo mostrar búsqueda para admin y soporte */}
                        {(user?.role === 'admin' || user?.role === 'soporte') && (
                            <div className="hidden md:block relative" ref={searchRef}>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {isSearching ? (
                                            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                                        ) : (
                                            <Search className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar activos, usuarios, tickets..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={handleSearchFocus}
                                        onBlur={handleSearchBlur}
                                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={clearSearch}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Resultados de búsqueda */}
                                {showSearchResults && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                                        {searchResults.length > 0 ? (
                                            searchResults.map((result) => (
                                                <div
                                                    key={`${result.tipo}-${result.id}`}
                                                    onClick={() => handleResultClick(result)}
                                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-lg">{getTypeIcon(result.tipo)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                {result.titulo}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {result.subtitulo}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : searchQuery && !isSearching ? (
                                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                No se encontraron resultados
                                            </div>
                                        ) : searchQuery.length === 0 && searchHistory.length > 0 ? (
                                            <div>
                                                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                            Historial de búsquedas
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                clearSearchHistory();
                                                            }}
                                                            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            Limpiar
                                                        </button>
                                                    </div>
                                                </div>
                                                {searchHistory.map((query, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => handleHistoryClick(query)}
                                                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-lg">🔍</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {query}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Búsqueda anterior
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notificaciones y perfil */}
                    <div className="flex items-center space-x-4">
                        {/* Botón de tema */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-full transition-colors"
                            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            {darkMode ? (
                                <Sun className="h-6 w-6" />
                            ) : (
                                <Moon className="h-6 w-6" />
                            )}
                        </button>

                        {/* Notificaciones */}
                        <HeadlessMenu as="div" className="relative">
                            <HeadlessMenu.Button className="relative p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-full">
                                <Bell className="h-6 w-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
                                )}
                            </HeadlessMenu.Button>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <HeadlessMenu.Items className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div className="py-1">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notificaciones</h3>
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                >
                                                    Marcar todas como leídas
                                                </button>
                                            )}
                                        </div>
                                        {notifications.length > 0 ? (
                                            <div className="max-h-64 overflow-y-auto">
                                                {notifications.map((notification) => (
                                                    <HeadlessMenu.Item key={notification.id}>
                                                        {({ active }) => (
                                                            <div className={`px-4 py-3 ${active ? 'bg-gray-50 dark:bg-gray-700' : ''} ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="text-lg">{notification.icon}</span>
                                                                            <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                            {formatTime(notification.timestamp)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        {!notification.read && (
                                                                            <button
                                                                                onClick={() => markAsRead(notification.id)}
                                                                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                                            >
                                                                                Marcar
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => removeNotification(notification.id)}
                                                                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                                        >
                                                                            Eliminar
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </HeadlessMenu.Item>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                No hay notificaciones
                                            </div>
                                        )}
                                    </div>
                                </HeadlessMenu.Items>
                            </Transition>
                        </HeadlessMenu>

                        {/* Menú de usuario */}
                        <HeadlessMenu as="div" className="relative">
                            <HeadlessMenu.Button className="flex items-center space-x-3 p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-full">
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                        <span className="text-sm font-medium text-white">
                                            {getInitials(user)}
                                        </span>
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user?.nombre && user?.apellido
                                                ? `${user.nombre} ${user.apellido}`
                                                : user?.username || 'Usuario'
                                            }
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Usuario'}</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </HeadlessMenu.Button>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <HeadlessMenu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                    <div className="py-1">
                                        <HeadlessMenu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleProfile}
                                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                                        } group flex items-center w-full px-4 py-2 text-sm`}
                                                >
                                                    <User className="mr-3 h-4 w-4" />
                                                    Mi perfil
                                                </button>
                                            )}
                                        </HeadlessMenu.Item>

                                        <HeadlessMenu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleSettings}
                                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                                        } group flex items-center w-full px-4 py-2 text-sm`}
                                                >
                                                    <Settings className="mr-3 h-4 w-4" />
                                                    Ajustes
                                                </button>
                                            )}
                                        </HeadlessMenu.Item>

                                        <div className="border-t border-gray-100 dark:border-gray-700"></div>

                                        <HeadlessMenu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleLogout}
                                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                                        } group flex items-center w-full px-4 py-2 text-sm`}
                                                >
                                                    <LogOut className="mr-3 h-4 w-4" />
                                                    Cerrar sesión
                                                </button>
                                            )}
                                        </HeadlessMenu.Item>
                                    </div>
                                </HeadlessMenu.Items>
                            </Transition>
                        </HeadlessMenu>
                    </div>
                </div>
            </div>
        </header>
    )
}
