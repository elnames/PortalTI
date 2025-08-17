import React, { useMemo, useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
// Estilos cargados por CDN en public/index.html para evitar problemas de exports CSS
import { calendarioAPI, authAPI } from '../services/api';
import UserAutoComplete from '../components/UserAutoComplete';
import { useToast } from '../contexts/ToastContext';

export default function Calendario() {
  const calendarRef = useRef(null);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start: '', end: '', allDay: false, color: '#3b82f6', assigneeIds: [] });
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState('create');
  const [currentEventId, setCurrentEventId] = useState(null);

  useEffect(() => {
    // Solo listar asignables con rol admin/soporte desde backend
    authAPI.getUsuarios()
      .then(({ data }) => setUsers((data || []).filter(u => u.role === 'admin' || u.role === 'soporte')))
      .catch(() => setUsers([]));
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
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  }), []);

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
        backgroundColor: ev.color || undefined,
        borderColor: ev.color || undefined
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
      assigneeIds: []
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
      const payload = {
        title: form.title,
        description: form.description || null,
        start: form.start,
        end: form.end,
        allDay: !!form.allDay,
        color: form.color,
        assigneeAuthIds: form.assigneeIds
      };
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
      assigneeIds: (ev.assignees || []).map(a => a.id)
    });
    setMode('edit');
    setCurrentEventId(ev.id);
    setDetail({ open: false, event: null });
    setModalOpen(true);
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-3 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Calendario</h1>
        {loading && <span className="text-xs text-gray-500">Guardando...</span>}
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locales={[esLocale]}
        locale="es"
        headerToolbar={headerToolbar}
        height="78vh"
        selectable
        selectMirror
        editable={false}
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
        dayHeaderClassNames={["bg-gray-100","dark:bg-gray-700","text-gray-700","dark:text-gray-200"]}
        dayCellClassNames={["dark:bg-gray-800","bg-white"]}
        slotLaneClassNames={["dark:bg-gray-800","bg-white"]}
        slotLabelClassNames={["text-gray-600","dark:text-gray-300"]}
        eventClassNames={(arg) => [
          'rounded-md',
          'shadow-sm',
          'hover:shadow-md',
          'transition',
          'duration-150',
          'px-1'
        ]}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-5 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Nuevo evento</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Título</label>
                <input className="w-full rounded-md border dark:bg-gray-700 p-2" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Descripción</label>
                <textarea className="w-full rounded-md border dark:bg-gray-700 p-2" rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Inicio</label>
                  <input type="datetime-local" className="w-full rounded-md border dark:bg-gray-700 p-2" value={form.start} onChange={e => setForm(f => ({...f, start: e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Fin</label>
                  <input type="datetime-local" className="w-full rounded-md border dark:bg-gray-700 p-2" value={form.end} onChange={e => setForm(f => ({...f, end: e.target.value}))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={form.allDay} onChange={e => setForm(f => ({...f, allDay: e.target.checked}))} />
                  Todo el día
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Color</span>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Asignados</label>
                <div className="space-y-2">
                  {form.assigneeIds.map((id, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <UserAutoComplete
                        value={id}
                        onChange={(val) => {
                          const copy = [...form.assigneeIds];
                          copy[idx] = val ? Number(val) : 0;
                          setForm(f => ({...f, assigneeIds: copy.filter(v => !!v)}));
                        }}
                        usuarios={users.map(u => ({
                          id: u.authId, // usar SIEMPRE AuthUser.Id
                          nombre: u.nombre,
                          apellido: u.apellido,
                          departamento: u.departamento,
                          email: u.username
                        }))}
                        placeholder="Buscar admin/soporte..."
                        className="flex-1"
                      />
                      <button type="button" onClick={() => {
                        const copy = [...form.assigneeIds];
                        copy.splice(idx,1);
                        setForm(f => ({...f, assigneeIds: copy}));
                      }} className="px-2 py-2 rounded-md bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">Quitar</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm(f => ({...f, assigneeIds: [...new Set([...(f.assigneeIds||[]), 0])]}))} className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Añadir asignado</button>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail.open && detail.event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetail({ open: false, event: null })} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{detail.event.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(detail.event.start).toLocaleString()} {detail.event.end ? `- ${new Date(detail.event.end).toLocaleString()}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white" onClick={startEditFromDetail}>Editar</button>
                <button className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white" onClick={() => setConfirmDeleteOpen(true)}>Eliminar</button>
                <button className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100" onClick={() => setDetail({ open: false, event: null })}>Cerrar</button>
              </div>
            </div>
            {detail.event.description && (
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">{detail.event.description}</p>
            )}
            <div className="text-sm">
              <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Asignados</div>
              {detail.event.assignees && detail.event.assignees.length > 0 ? (
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                  {detail.event.assignees.map(a => (
                    <li key={a.id}>{a.name}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">Sin asignados</div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Esta acción eliminará el evento del calendario. ¿Deseas continuar?</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100" onClick={() => setConfirmDeleteOpen(false)}>Cancelar</button>
              <button className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white" onClick={() => { setConfirmDeleteOpen(false); handleDeleteEvent(); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


