import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  X,
  Cake,
  Users,
  MapPin,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const CalendarModule = () => {
  // Estados principales
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'form'
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    title: '',
    type: 'Evento',
    description: '',
    time: ''
  });

  // Cargar datos al iniciar y cuando cambia el mes/año
  useEffect(() => {
    fetchEvents();
    fetchHolidays(currentDate.getFullYear());
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendario')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error cargando eventos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async (year) => {
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CL`);
      const data = await res.json();
      setHolidays(data);
    } catch (error) {
      console.error('Error cargando feriados:', error);
    }
  };

  // Navegación del calendario
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Lógica de generación de la cuadrícula
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Ajuste para que Lunes sea 0
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);
    const today = new Date();
    
    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 border border-white/5 bg-transparent" />);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      const isHoliday = holidays.find(h => h.date === dateStr);
      const dayEvents = events.filter(e => e.date === dateStr);

      days.push(
        <div 
          key={i} 
          onClick={() => openDayModal(dateStr, dayEvents)}
          className={`h-24 md:h-32 border border-white/5 p-2 transition-all cursor-pointer relative overflow-hidden group
            ${isToday ? 'bg-accent/10' : 'bg-white/5'}
            ${isHoliday ? 'bg-red-500/5' : ''}
            hover:bg-accent/20 hover:scale-[1.02] hover:z-10 hover:rounded-xl hover:border-accent/30
          `}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-bold ${isToday ? 'text-accent bg-accent/20 px-2 rounded-full' : 'text-muted'}`}>
              {i}
            </span>
            {isHoliday && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title={isHoliday.localName} />
            )}
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`text-[10px] md:text-xs py-0.5 px-1.5 rounded-md truncate font-medium
                  ${getEventTypeClass(event.type)}
                `}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const getEventTypeClass = (type) => {
    switch (type) {
      case 'Examen': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'Evento': return 'bg-accent/20 text-accent border border-accent/30';
      case 'Reunión': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Paseo': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  // Gestión de modales
  const openDayModal = (date, dayEvents) => {
    setSelectedDate(date);
    setViewMode('list');
    setShowModal(true);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setFormData({ title: '', type: 'Evento', description: '', time: '' });
    setViewMode('form');
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      description: event.description || '',
      time: event.time || ''
    });
    setViewMode('form');
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este evento?')) return;
    try {
      const { error } = await supabase.from('calendario').delete().eq('id', id);
      if (error) throw error;
      fetchEvents();
      setShowModal(false);
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      time: formData.time || null, // Si está vacío, enviar null para evitar error de Supabase
      date: selectedDate
    };

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('calendario')
          .update(eventData)
          .eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('calendario')
          .insert([eventData]);
        if (error) throw error;
      }
      
      fetchEvents();
      setShowModal(false);
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-main tracking-tight flex items-center gap-3">
            Calendario <span className="text-accent text-lg font-medium bg-accent/10 px-3 py-1 rounded-full">{currentDate.getFullYear()}</span>
          </h1>
          <p className="text-muted mt-1">Organiza las fechas importantes del curso.</p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl text-muted transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="px-6 py-1 text-xl font-bold text-main min-w-[150px] text-center">
            {monthNames[currentDate.getMonth()]}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl text-muted transition-all">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden border border-white/5 shadow-2xl">
        <div className="grid grid-cols-7 bg-white/5 border-b border-white/5">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-widest text-accent/60">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 relative">
          {/* Marca de agua opcional */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <CalendarIcon size={400} />
          </div>
          {renderDays()}
        </div>
      </div>

      {/* Modal de Día / Eventos */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-main">
                    {viewMode === 'list' ? 'Eventos del día' : (editingEvent ? 'Editar Evento' : 'Nuevo Evento')}
                  </h3>
                  <p className="text-accent font-medium mt-1">{selectedDate}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-muted hover:bg-white/10 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              {viewMode === 'list' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {events.filter(e => e.date === selectedDate).length > 0 ? (
                      events.filter(e => e.date === selectedDate).map(event => (
                        <div key={event.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-accent/30 transition-all">
                          <div className="flex gap-4 items-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getEventTypeClass(event.type).split(' ')[0]}`}>
                              {event.type === 'Examen' && <Pencil size={20} />}
                              {event.type === 'Evento' && <CalendarIcon size={20} />}
                              {event.type === 'Reunión' && <Users size={20} />}
                              {event.type === 'Paseo' && <MapPin size={20} />}
                            </div>
                            <div>
                              <p className="font-bold text-main">{event.title}</p>
                              <div className="flex items-center gap-3 text-xs text-muted mt-1">
                                {event.time && <span className="flex items-center gap-1"><Clock size={12}/> {event.time}</span>}
                                <span className="flex items-center gap-1 uppercase tracking-wider font-bold text-[10px]">{event.type}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditEvent(event)} className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-all">
                              <Pencil size={18} />
                            </button>
                            <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <CalendarIcon size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No hay eventos programados.</p>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleAddEvent}
                    className="btn-primary w-full mt-4 py-4 rounded-2xl text-lg flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Agregar Evento
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest ml-2">Título</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-main outline-none focus:border-accent transition-all"
                      placeholder="Ej: Prueba de Matemáticas"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase tracking-widest ml-2">Tipo</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-slate-800 border border-white/10 rounded-2xl p-4 text-main outline-none focus:border-accent transition-all appearance-none"
                      >
                        <option value="Evento">Evento</option>
                        <option value="Examen">Examen</option>
                        <option value="Reunión">Reunión</option>
                        <option value="Paseo">Paseo</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase tracking-widest ml-2">Hora (Opcional)</label>
                      <input 
                        type="time" 
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-main outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest ml-2">Descripción</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-main outline-none focus:border-accent transition-all h-24 resize-none"
                      placeholder="Detalles adicionales..."
                    />
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setViewMode('list')}
                        className="flex-1 py-4 px-6 border border-white/10 rounded-2xl text-main font-bold hover:bg-white/5 transition-all"
                      >
                        Volver
                      </button>
                      <button 
                        type="submit"
                        className="flex-[2] btn-primary py-4 px-6 rounded-2xl text-lg font-bold"
                      >
                        {editingEvent ? 'Guardar Cambios' : 'Crear Evento'}
                      </button>
                    </div>

                    {/* Botón Eliminar - Preparado para lógica de roles en el futuro */}
                    {editingEvent && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteEvent(editingEvent.id)}
                        className="w-full py-3 px-6 text-red-500 font-bold hover:bg-red-500/10 rounded-2xl border border-red-500/20 transition-all mt-2 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} /> Eliminar permanentemente
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarModule;
