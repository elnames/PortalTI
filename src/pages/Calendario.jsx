import React, { useMemo, useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { calendarioAPI, authAPI } from '../services/api';
import UserAutoComplete from '../components/UserAutoComplete';
import MicrosoftAuth from '../components/MicrosoftAuth';
import { teamsService } from '../services/teamsService';
import { useToast } from '../contexts/ToastContext';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Settings,
  Users,
  Video,
  Phone,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Share,
  Bell,
  AlertCircle
} from 'lucide-react';

export default function Calendario() {
  const calendarRef = useRef(null);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    color: '#3b82f6',
    assigneeIds: [],
    location: '',
    meetingType: 'none',
    teamsMeeting: false,
    category: 'general'
  });
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState('create');
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['general', 'meeting', 'personal', 'work']);
  const [showAgenda, setShowAgenda] = useState(false);
  const [microsoftUser, setMicrosoftUser] = useState(null);
  const [isMicrosoftAuthenticated, setIsMicrosoftAuthenticated] = useState(false);

  // Categorías predefinidas con colores
  const categories = {
    general: { name: 'General', color: '#3b82f6', icon: Calendar },
    meeting: { name: 'Reunión', color: '#10b981', icon: Users },
    personal: { name: 'Personal', color: '#f59e0b', icon: Clock },
    work: { name: 'Trabajo', color: '#8b5cf6', icon: Settings },
    teams: { name: 'Teams', color: '#6366f1', icon: Video },
    call: { name: 'Llamada', color: '#06b6d4', icon: Phone }
  };

  useEffect(() => {
    // Solo listar asignables con rol admin/soporte desde backend
    authAPI.getUsuarios()
      .then(({ data }) => setUsers((data || []).filter(u => u.role === 'admin' || u.role === 'soporte')))
      .catch(() => setUsers([]));

    // Verificar autenticación de Microsoft
    setIsMicrosoftAuthenticated(teamsService.isAuthenticated());
  }, []);

  const formatLocal = (dateObj, time = '09:00') => {
    const pad = (n) => String(n).padStart(2, '0');
    const y = dateObj.getFullYear();
    const m = pad(dateObj.getMonth() + 1);
    const d = pad(dateObj.getDate());
    return `${y}-${m}-${d}T${time}`;
  };

  const headerToolbar = useMemo(() => ({
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  }), []);

  // Función para crear reunión de Teams
  const createTeamsMeeting = async (eventData) => {
    try {
      if (!isMicrosoftAuthenticated) {
        showToast('Debes conectar tu cuenta de Microsoft para crear reuniones de Teams', 'warning');
        return null;
      }

      const result = await teamsService.createTeamsMeeting(eventData);
      showToast('Reunión de Teams creada exitosamente', 'success');
      return result;
    } catch (error) {
      showToast(`Error al crear reunión de Teams: ${error.message}`, 'error');
      throw error;
    }
  };

  // Función para generar enlace de Teams (fallback)
  const generateTeamsLink = () => {
    const baseUrl = 'https://teams.microsoft.com/l/meetup-join/';
    const meetingId = Math.random().toString(36).substring(2, 15);
    return `${baseUrl}${meetingId}`;
  };

  // Manejar autenticación exitosa de Microsoft
  const handleMicrosoftAuthSuccess = (user) => {
    setMicrosoftUser(user);
    setIsMicrosoftAuthenticated(true);
  };

  // Manejar error de autenticación de Microsoft
  const handleMicrosoftAuthError = (error) => {
    console.error('Error de autenticación Microsoft:', error);
    setIsMicrosoftAuthenticated(false);
    setMicrosoftUser(null);
  };

  const fetchEvents = async (info, successCallback, failureCallback) => {
    try {
      const { startStr, endStr } = info;
      const { data } = await calendarioAPI.getEvents({ start: startStr, end: endStr });
      const events = data.map(ev => ({
        id: String(ev.id),
        title: ev.title,
        start: ev.start,
        end: ev.end,
        allDay: ev.allDay,
        backgroundColor: ev.color || categories[ev.category]?.color || '#3b82f6',
        borderColor: ev.color || categories[ev.category]?.color || '#3b82f6',
        extendedProps: {
          description: ev.description,
          location: ev.location,
          meetingType: ev.meetingType,
          teamsUrl: ev.teamsUrl,
          category: ev.category || 'general',
          assignees: ev.assignees || []
        }
      }));
      successCallback(events);
    } catch (err) {
      failureCallback(err);
      showToast('Error al cargar eventos', 'error');
    }
  };

  const handleSelect = (selectionInfo) => {
    const start = new Date(selectionInfo.start);
    const endExclusive = new Date(selectionInfo.end);
    // Si selecciona varios días en vista de mes, end es exclusivo → restar 1 día
    const lastDay = new Date(endExclusive);
    lastDay.setDate(endExclusive.getDate() - 1);
    const isMultiDay = lastDay.toDateString() !== start.toDateString();

    const startStr = formatLocal(start, '09:00');
    const endStr = isMultiDay ? formatLocal(lastDay, '18:00') : formatLocal(start, '18:00');

    setForm({
      title: '',
      description: '',
      start: startStr,
      end: endStr,
      allDay: selectionInfo.allDay,
      color: '#3b82f6',
      assigneeIds: [],
      location: '',
      meetingType: 'none',
      teamsMeeting: false,
      category: 'general'
    });
    setMode('create');
    setCurrentEventId(null);
    setModalOpen(true);
  };

  const handleEventClick = async (clickInfo) => {
    try {
      const { data } = await calendarioAPI.getById(clickInfo.event.id);
      // Mostrar modal de detalle moderno
      setDetail({
        open: true,
        event: data
      });
    } catch (e) {
      showToast('No se pudo cargar el detalle', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let payload = {
        title: form.title,
        description: form.description || null,
        start: form.start,
        end: form.end,
        allDay: !!form.allDay,
        color: form.color,
        assigneeAuthIds: form.assigneeIds,
        location: form.location || null,
        category: form.category,
        meetingType: form.meetingType
      };

      // Si es una reunión de Teams, crear la reunión real
      if (form.teamsMeeting) {
        if (isMicrosoftAuthenticated) {
          try {
            const teamsResult = await createTeamsMeeting({
              title: form.title,
              description: form.description,
              start: form.start,
              end: form.end,
              location: form.location,
              assignees: form.assigneeIds.map(id => {
                const user = users.find(u => u.authId === id);
                return user ? {
                  id: user.authId,
                  name: `${user.nombre} ${user.apellido}`,
                  email: user.username
                } : null;
              }).filter(Boolean)
            });

            if (teamsResult) {
              payload.teamsUrl = teamsResult.meetingUrl;
              payload.meetingId = teamsResult.meetingId;
              payload.meetingType = 'teams';
              payload.category = 'teams';
            }
          } catch (error) {
            // Si falla la creación de Teams, usar enlace de fallback
            payload.teamsUrl = generateTeamsLink();
            payload.meetingType = 'teams';
            payload.category = 'teams';
            showToast('Reunión creada con enlace de demostración (configura Azure AD para enlaces reales)', 'info');
          }
        } else {
          // Usar enlace de fallback si no está autenticado
          payload.teamsUrl = generateTeamsLink();
          payload.meetingType = 'teams';
          payload.category = 'teams';
          showToast('Reunión creada con enlace de demostración (configura Microsoft para enlaces reales)', 'info');
        }
      }

      if (mode === 'edit' && currentEventId) {
        await calendarioAPI.update(currentEventId, payload);
      } else {
        await calendarioAPI.create(payload);
      }

      setModalOpen(false);
      showToast(mode === 'edit' ? 'Evento actualizado' : 'Evento creado', 'success');
      const api = calendarRef.current?.getApi();
      api?.refetchEvents();
    } catch (err) {
      showToast('No se pudo guardar el evento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!detail.event) return;
    const confirmDelete = window.confirm('¿Eliminar este evento?');
    if (!confirmDelete) return;
    try {
      setLoading(true);
      await calendarioAPI.remove(detail.event.id);
      setDetail({ open: false, event: null });
      showToast('Evento eliminado', 'success');
      const api = calendarRef.current?.getApi();
      api?.refetchEvents();
    } catch (err) {
      showToast('No se pudo eliminar el evento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [detail, setDetail] = useState({ open: false, event: null });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const startEditFromDetail = () => {
    if (!detail.event) return;
    const ev = detail.event;
    const parseIso = (iso) => {
      const d = new Date(iso);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return formatLocal(d, `${hh}:${mm}`);
    };
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      start: ev.start ? parseIso(ev.start) : '',
      end: ev.end ? parseIso(ev.end) : (ev.start ? parseIso(ev.start) : ''),
      allDay: !!ev.allDay,
      color: ev.color || '#3b82f6',
      assigneeIds: (ev.assignees || []).map(a => a.id),
      location: ev.location || '',
      meetingType: ev.meetingType || 'none',
      teamsMeeting: ev.meetingType === 'teams',
      category: ev.category || 'general'
    });
    setMode('edit');
    setCurrentEventId(ev.id);
    setDetail({ open: false, event: null });
    setModalOpen(true);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className={`${sidebarOpen ? 'text-xl' : 'hidden'} font-semibold text-gray-900 dark:text-white`}>
              Calendario
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${!sidebarOpen && 'rotate-180'}`} />
            </button>
          </div>
        </div>

        {/* Botón Nuevo Evento */}
        <div className="p-4">
          <button
            onClick={() => {
              const now = new Date();
              const start = formatLocal(now, '09:00');
              const end = formatLocal(now, '10:00');
              setForm({
                title: '',
                description: '',
                start,
                end,
                allDay: false,
                color: '#3b82f6',
                assigneeIds: [],
                location: '',
                meetingType: 'none',
                teamsMeeting: false,
                category: 'general'
              });
              setMode('create');
              setCurrentEventId(null);
              setModalOpen(true);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {sidebarOpen && <span>Nuevo evento</span>}
          </button>
        </div>

        {/* Búsqueda */}
        {sidebarOpen && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Categorías */}
        {sidebarOpen && (
          <div className="px-4 pb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Categorías</h3>
            <div className="space-y-2">
              {Object.entries(categories).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, key]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== key));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista de Agenda */}
        {sidebarOpen && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowAgenda(!showAgenda)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista de Agenda</span>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showAgenda && 'rotate-90'}`} />
            </button>
          </div>
        )}

        {/* Autenticación de Microsoft */}
        {sidebarOpen && (
          <div className="px-4 pb-4">
            <MicrosoftAuth
              onAuthSuccess={handleMicrosoftAuthSuccess}
              onAuthError={handleMicrosoftAuthError}
            />
          </div>
        )}
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header Principal */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const api = calendarRef.current?.getApi();
                  api?.prev();
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => {
                  const api = calendarRef.current?.getApi();
                  api?.next();
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => {
                  const api = calendarRef.current?.getApi();
                  api?.today();
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { key: 'dayGridMonth', label: 'Mes' },
                  { key: 'timeGridWeek', label: 'Semana' },
                  { key: 'timeGridDay', label: 'Día' },
                  { key: 'listWeek', label: 'Agenda' }
                ].map((view) => (
                  <button
                    key={view.key}
                    onClick={() => {
                      setCurrentView(view.key);
                      const api = calendarRef.current?.getApi();
                      api?.changeView(view.key);
                    }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${currentView === view.key
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="flex-1 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locales={[esLocale]}
              locale="es"
              headerToolbar={false}
              height="100%"
              selectable
              selectMirror
              editable={true}
              events={fetchEvents}
              select={handleSelect}
              eventClick={handleEventClick}
              themeSystem="standard"
              dayMaxEventRows={3}
              eventDisplay="block"
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              nowIndicator
              weekNumbers
              stickyHeaderDates
              dayHeaderClassNames={["bg-gray-50", "dark:bg-gray-700", "text-gray-700", "dark:text-gray-200", "font-medium"]}
              dayCellClassNames={["dark:bg-gray-800", "bg-white", "hover:bg-gray-50", "dark:hover:bg-gray-700"]}
              slotLaneClassNames={["dark:bg-gray-800", "bg-white"]}
              slotLabelClassNames={["text-gray-600", "dark:text-gray-300", "font-medium"]}
              eventClassNames={(arg) => [
                'rounded-md',
                'shadow-sm',
                'hover:shadow-md',
                'transition',
                'duration-150',
                'px-1',
                'text-white',
                'font-medium'
              ]}
              eventContent={(eventInfo) => {
                const category = eventInfo.event.extendedProps.category;
                const IconComponent = categories[category]?.icon || Calendar;
                return (
                  <div className="flex items-center gap-1">
                    <IconComponent className="w-3 h-3" />
                    <span className="truncate">{eventInfo.event.title}</span>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {mode === 'create' ? 'Nuevo evento' : 'Editar evento'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Título</label>
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Título del evento"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Descripción</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción del evento"
                />
              </div>

              {/* Fechas y hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Inicio</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.start}
                    onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Fin</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.end}
                    onChange={e => setForm(f => ({ ...f, end: e.target.value }))}
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Ubicación</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Ubicación del evento"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(categories).map(([key, category]) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, category: key }))}
                        className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${form.category === key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opciones de reunión */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de reunión</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="meetingType"
                      value="none"
                      checked={form.meetingType === 'none'}
                      onChange={e => setForm(f => ({ ...f, meetingType: e.target.value, teamsMeeting: false }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sin reunión</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="meetingType"
                      value="teams"
                      checked={form.meetingType === 'teams'}
                      onChange={e => setForm(f => ({ ...f, meetingType: e.target.value, teamsMeeting: true }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Video className="w-4 h-4 text-blue-600" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Reunión de Teams</span>
                      {!isMicrosoftAuthenticated && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Conecta Microsoft para crear reuniones automáticamente
                        </div>
                      )}
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="meetingType"
                      value="call"
                      checked={form.meetingType === 'call'}
                      onChange={e => setForm(f => ({ ...f, meetingType: e.target.value, teamsMeeting: false }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Llamada telefónica</span>
                  </label>
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={e => setForm(f => ({ ...f, allDay: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Todo el día</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Color personalizado</span>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                </div>
              </div>

              {/* Asignados */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Asignados</label>
                <div className="space-y-2">
                  {form.assigneeIds.map((id, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <UserAutoComplete
                        value={id}
                        onChange={(val) => {
                          const copy = [...form.assigneeIds];
                          copy[idx] = val ? Number(val) : 0;
                          setForm(f => ({ ...f, assigneeIds: copy.filter(v => !!v) }));
                        }}
                        usuarios={users.map(u => ({
                          id: u.authId,
                          nombre: u.nombre,
                          apellido: u.apellido,
                          departamento: u.departamento,
                          email: u.username
                        }))}
                        placeholder="Buscar admin/soporte..."
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...form.assigneeIds];
                          copy.splice(idx, 1);
                          setForm(f => ({ ...f, assigneeIds: copy }));
                        }}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, assigneeIds: [...new Set([...(f.assigneeIds || []), 0])] }))}
                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir asignado
                  </button>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {mode === 'edit' ? 'Actualizar' : 'Crear'} evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail.open && detail.event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetail({ open: false, event: null })} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: detail.event.color || categories[detail.event.category]?.color || '#3b82f6' }}
                  />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{detail.event.title}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(detail.event.start).toLocaleString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {detail.event.end && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(detail.event.end).toLocaleString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800"
                  onClick={startEditFromDetail}
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800"
                  title="Copiar"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800"
                  title="Compartir"
                >
                  <Share className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800"
                  onClick={() => setConfirmDeleteOpen(true)}
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => setDetail({ open: false, event: null })}
                  title="Cerrar"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Información del evento */}
            <div className="space-y-4">
              {detail.event.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Descripción</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {detail.event.description}
                  </p>
                </div>
              )}

              {detail.event.location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Ubicación</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{detail.event.location}</span>
                  </div>
                </div>
              )}

              {detail.event.meetingType === 'teams' && detail.event.teamsUrl && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Reunión de Teams</h4>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <a
                      href={detail.event.teamsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm underline"
                    >
                      Unirse a la reunión
                    </a>
                  </div>
                </div>
              )}

              {detail.event.meetingType === 'call' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Llamada telefónica</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span>Llamada telefónica programada</span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Asignados</h4>
                {detail.event.assignees && detail.event.assignees.length > 0 ? (
                  <div className="space-y-2">
                    {detail.event.assignees.map(a => (
                      <div key={a.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{a.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    Sin asignados
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar eliminación</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              Esta acción eliminará permanentemente el evento del calendario. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2"
                onClick={() => { setConfirmDeleteOpen(false); handleDeleteEvent(); }}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


