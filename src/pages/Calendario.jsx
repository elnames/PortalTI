import React, { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import '@fullcalendar/daygrid/index.css';
import '@fullcalendar/timegrid/index.css';
import { calendarioAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function Calendario() {
  const calendarRef = useRef(null);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

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

  const handleSelect = async (selectionInfo) => {
    const title = prompt('Título de la tarea/reunión:');
    if (!title) return;
    try {
      setLoading(true);
      const payload = {
        title,
        start: selectionInfo.startStr,
        end: selectionInfo.endStr,
        allDay: selectionInfo.allDay
      };
      await calendarioAPI.create(payload);
      showToast('Evento creado', 'success');
      const api = calendarRef.current?.getApi();
      api?.refetchEvents();
    } catch (e) {
      showToast('No se pudo crear el evento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = async (clickInfo) => {
    const decision = window.confirm('¿Eliminar este evento?');
    if (!decision) return;
    try {
      setLoading(true);
      await calendarioAPI.remove(clickInfo.event.id);
      showToast('Evento eliminado', 'success');
      clickInfo.event.remove();
    } catch (e) {
      showToast('No se pudo eliminar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">Calendario</h1>
        {loading && <span className="text-xs text-gray-500">Guardando...</span>}
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locales={[esLocale]}
        locale="es"
        headerToolbar={headerToolbar}
        height="75vh"
        selectable
        selectMirror
        editable={false}
        events={fetchEvents}
        select={handleSelect}
        eventClick={handleEventClick}
        themeSystem="standard"
        dayMaxEventRows={3}
      />
    </div>
  );
}


