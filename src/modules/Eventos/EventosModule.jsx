import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ChevronRight, 
  Users, 
  Receipt, 
  Wallet,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Search,
  UserPlus
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function EventosModule() {
  const [eventos, setEventos] = useState([])
  const [cajaGlobal, setCajaGlobal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('actividades')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [eventSubTab, setEventSubTab] = useState('balance')
  const [alumnos, setAlumnos] = useState([])
  const [confirmAction, setConfirmAction] = useState(null) // { message, onConfirm }
  
  // Estados para formularios
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    ganancia_estimada: ''
  })

  const [newTransaction, setNewTransaction] = useState({
    tipo: 'ingreso',
    descripcion: '',
    monto: ''
  })

  const [newColaborador, setNewColaborador] = useState({
    alumno_id: '',
    rol: ''
  })

  const [movimientosGlobales, setMovimientosGlobales] = useState([])

  useEffect(() => {
    fetchData()
    fetchAlumnos()
    fetchMovimientos()
  }, [])

  const fetchMovimientos = async () => {
    const { data } = await supabase
      .from('caja_movimientos')
      .select('*')
      .order('created_at', { ascending: false })
    setMovimientosGlobales(data || [])
  }

  const fetchAlumnos = async () => {
    const { data } = await supabase.from('alumnos').select('*').order('nombre_alumno')
    setAlumnos(data || [])
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 1. Obtener movimientos para calcular el saldo REAL
      const { data: movs } = await supabase
        .from('caja_movimientos')
        .select('*')
        .order('fecha', { ascending: false })
      
      const movimientos = movs || []
      setMovimientosGlobales(movimientos)
      
      // Calcular saldo: suma de entradas menos salidas (FORZANDO NÚMEROS)
      const saldoCalculado = movimientos.reduce((acc, m) => {
        const monto = Number(m.monto) || 0
        return m.tipo === 'entrada' ? acc + monto : acc - monto
      }, 0)
      setCajaGlobal(saldoCalculado)

      // 2. Fetch Eventos con finanzas Y participantes
      const { data: eventosData } = await supabase
        .from('eventos')
        .select(`
          *,
          eventos_financiero (
            id,
            tipo,
            monto,
            descripcion
          ),
          eventos_participantes (
            id,
            alumno_id,
            rol,
            alumnos (
              id,
              nombre_alumno
            )
          )
        `)
        .order('fecha', { ascending: false })

      const evts = eventosData || []
      setEventos(evts)
      
      // CÁLCULO INFALIBLE: Suma de todos los eventos CERRADOS
      const saldoTotal = evts
        .filter(e => e.estado === 'cerrado')
        .reduce((acc, e) => {
          const balance = calculateEventBalance(e)
          return acc + balance.neto
        }, 0)
      
      setCajaGlobal(saldoTotal)

      if (selectedEvent) {
        const updated = evts.find(e => e.id === selectedEvent.id)
        if (updated) setSelectedEvent(updated)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    if (!newTransaction.monto || !newTransaction.descripcion) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('eventos_financiero')
        .insert([{
          evento_id: selectedEvent.id,
          tipo: newTransaction.tipo,
          monto: parseFloat(newTransaction.monto),
          descripcion: newTransaction.descripcion
        }])
      
      if (error) throw error
      setNewTransaction({ tipo: 'ingreso', descripcion: '', monto: '' })
      await fetchData()
    } catch (error) {
      alert('Error al registrar transacción')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddColaborador = async () => {
    if (!newColaborador.alumno_id) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('eventos_participantes')
        .insert([{
          evento_id: selectedEvent.id,
          alumno_id: newColaborador.alumno_id,
          rol: newColaborador.rol || 'Colaborador'
        }])
      
      if (error) throw error
      setNewColaborador({ alumno_id: '', rol: '' })
      await fetchData()
    } catch (error) {
      console.error('Error al asignar colaborador:', error)
      alert('Error al asignar colaborador: ' + (error.message || 'Error desconocido'))
    } finally {
      setIsSaving(false)
    }
  }

  const ejecutarCerrarEvento = async (eventoId) => {
    setIsSaving(true)
    try {
      const balance = calculateEventBalance(selectedEvent)
      
      // 1. Obtener saldo actual de caja global o CREARLA si no existe
      let { data: currentCaja } = await supabase.from('caja_global').select('*').maybeSingle()
      
      if (!currentCaja) {
        const { data: newCaja, error: createError } = await supabase
          .from('caja_global')
          .insert([{ saldo_actual: 0 }])
          .select()
          .single()
        if (createError) throw createError
        currentCaja = newCaja
      }

      // 2. Cerrar el evento
      await supabase.from('eventos').update({ estado: 'cerrado' }).eq('id', eventoId)
      
      // 3. Actualizar Caja Global
      const newSaldo = (currentCaja?.saldo_actual || 0) + balance.neto
      await supabase.from('caja_global').update({ saldo_actual: newSaldo }).eq('id', currentCaja.id)

      // 4. Registrar movimiento de auditoría
      await supabase.from('caja_movimientos').insert([{
        monto: balance.neto,
        tipo: balance.neto >= 0 ? 'entrada' : 'salida',
        motivo: `Cierre de evento: ${selectedEvent.nombre}`,
        evento_id: eventoId
      }])

      setIsDetailModalOpen(false)
      fetchData()
      fetchMovimientos()
    } catch (error) {
      console.error('Error al cerrar:', error)
      alert('Error al cerrar el evento: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdjustBalance = async () => {
    const nuevoMonto = prompt("Ingresa el monto real actual de la Caja Global:", cajaGlobal)
    if (nuevoMonto === null || isNaN(parseFloat(nuevoMonto))) return

    setIsSaving(true)
    try {
      let { data: currentCaja } = await supabase.from('caja_global').select('*').maybeSingle()
      const montoFinal = parseFloat(nuevoMonto)

      if (!currentCaja) {
        await supabase.from('caja_global').insert([{ saldo_actual: montoFinal }])
      } else {
        await supabase.from('caja_global').update({ saldo_actual: montoFinal }).eq('id', currentCaja.id)
      }

      // Registrar el ajuste en movimientos
      await supabase.from('caja_movimientos').insert([{
        monto: montoFinal - (currentCaja?.saldo_actual || 0),
        tipo: 'entrada',
        motivo: 'Ajuste manual de saldo',
      }])

      fetchData()
      fetchMovimientos()
    } catch (error) {
      alert("Error al ajustar el saldo")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCerrarEvento = (eventoId) => {
    const balance = calculateEventBalance(selectedEvent)
    setConfirmAction({
      message: `¿Estás seguro de cerrar este evento? Se traspasarán ${formatMoney(balance.neto)} a la Caja Global.`,
      onConfirm: () => ejecutarCerrarEvento(eventoId)
    })
  }

  const ejecutarDeleteEvento = async (eventoId) => {
    setIsSaving(true)
    try {
      // 1. Eliminar registros relacionados (esto disparará el recálculo al refrescar)
      await supabase.from('eventos_financiero').delete().eq('evento_id', eventoId)
      await supabase.from('eventos_participantes').delete().eq('evento_id', eventoId)
      await supabase.from('caja_movimientos').delete().eq('evento_id', eventoId)
      
      // 2. Borrar el evento
      const { error } = await supabase.from('eventos').delete().eq('id', eventoId)
      if (error) throw error
      
      setIsDetailModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEvento = (eventoId) => {
    if (!eventoId) return
    setConfirmAction({
      message: '¿Estás seguro de eliminar este evento? Se borrarán todas las finanzas y participantes asociados.',
      onConfirm: () => ejecutarDeleteEvento(eventoId)
    })
  }

  const handleCreateEvento = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('eventos')
        .insert([{
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          fecha: formData.fecha,
          ganancia_estimada: parseFloat(formData.ganancia_estimada) || 0
        }])

      if (error) throw error
      
      setIsModalOpen(false)
      setFormData({ nombre: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], ganancia_estimada: '' })
      fetchData()
    } catch (error) {
      alert('Error al crear el evento')
    } finally {
      setIsSaving(false)
    }
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount)
  }

  const calculateEventBalance = (evento) => {
    const finanzas = evento.eventos_financiero || []
    const ingresos = finanzas.filter(f => f.tipo === 'ingreso').reduce((acc, f) => acc + f.monto, 0)
    const egresos = finanzas.filter(f => f.tipo === 'egreso').reduce((acc, f) => acc + f.monto, 0)
    return { ingresos, egresos, neto: ingresos - egresos }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-accent" size={48} />
        <p className="text-muted font-medium animate-pulse">Cargando gestión de gastos...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header y Caja Global */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Eventos y Gastos</h2>
          <p className="text-muted text-sm opacity-80">
            Gestiona la recaudación y la caja global del curso.
          </p>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl shadow-emerald-500/5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Caja Global Actual</p>
            <p className="text-2xl font-black text-white">{formatMoney(cajaGlobal)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden">
        <button 
          onClick={() => setActiveTab('actividades')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all relative z-10 ${
            activeTab === 'actividades' ? 'text-white' : 'text-muted hover:text-white'
          }`}
        >
          <Calendar size={18} className={activeTab === 'actividades' ? 'text-accent' : ''} />
          ACTIVIDADES
        </button>
        <button 
          onClick={() => setActiveTab('historial')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all relative z-10 ${
            activeTab === 'historial' ? 'text-white' : 'text-muted hover:text-white'
          }`}
        >
          <History size={18} className={activeTab === 'historial' ? 'text-slate-400' : ''} />
          MOVIMIENTOS
        </button>
        
        <div 
          className="absolute top-1.5 bottom-1.5 bg-white/[0.08] rounded-xl transition-all duration-300 ease-out border border-white/5 shadow-xl"
          style={{ 
            width: 'calc(50% - 6px)',
            left: activeTab === 'actividades' ? '6px' : 'calc(50%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'actividades' ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-muted uppercase tracking-widest">Eventos de Recaudación</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary !py-2 !px-4 text-xs flex items-center gap-2"
              >
                <Plus size={16} /> NUEVO EVENTO
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventos.filter(e => e.estado === 'abierto').map(evento => {
                const balance = calculateEventBalance(evento)
                return (
                  <div 
                    key={evento.id}
                    onClick={() => {
                      setSelectedEvent(evento)
                      setIsDetailModalOpen(true)
                    }}
                    className="card p-6 flex flex-col gap-4 cursor-pointer hover:scale-[1.02] transition-all hover:border-accent/30 group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold text-main group-hover:text-accent transition-colors">{evento.nombre}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted mt-1">
                          <Calendar size={14} />
                          {new Date(evento.fecha).toLocaleDateString('es-CL', { dateStyle: 'long' })}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                        En Curso
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-muted uppercase mb-1">Ingresos</p>
                        <p className="text-lg font-bold text-emerald-400">{formatMoney(balance.ingresos)}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-muted uppercase mb-1">Egresos</p>
                        <p className="text-lg font-bold text-red-400">{formatMoney(balance.egresos)}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold text-muted uppercase">Ganancia Neta Actual</p>
                        <p className="text-xl font-black text-white">{formatMoney(balance.neto)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                )
              })}

              {eventos.filter(e => e.estado === 'abierto').length === 0 && (
                <div className="col-span-full card p-12 text-center border-dashed border-2 opacity-40 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted">
                    <Calendar size={32} />
                  </div>
                  <p className="text-muted font-medium">No hay eventos activos. ¡Crea uno para empezar!</p>
                </div>
              )}
            </div>

            {/* Historial de Actividades Cerradas */}
            {eventos.filter(e => e.estado === 'cerrado').length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-muted uppercase tracking-widest px-2 mb-4">Actividades Finalizadas</h3>
                <div className="flex flex-col gap-3">
                  {eventos.filter(e => e.estado === 'cerrado').map(evento => {
                    const balance = calculateEventBalance(evento)
                    return (
                      <div 
                        key={evento.id}
                        className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between opacity-80 hover:opacity-100 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(evento)
                          setIsDetailModalOpen(true)
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <h5 className="font-bold text-white">{evento.nombre}</h5>
                            <p className="text-xs text-muted">{new Date(evento.fecha).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-400">+{formatMoney(balance.neto)}</p>
                            <p className="text-[10px] text-muted font-medium uppercase">Ganancia Final</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvento(evento.id);
                            }}
                            className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-muted uppercase tracking-widest">Historial de Caja Global</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Receipt size={12} /> {movimientosGlobales.length} MOVIMIENTOS
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {movimientosGlobales.map((mov, i) => (
                <div key={mov.id || i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      mov.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {mov.tipo === 'entrada' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{mov.motivo}</p>
                      <p className="text-[10px] text-muted uppercase font-medium tracking-wider">
                        {new Date(mov.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <p className={`font-black ${mov.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {mov.tipo === 'entrada' ? '+' : '-'}{formatMoney(Math.abs(mov.monto))}
                  </p>
                </div>
              ))}

              {movimientosGlobales.length === 0 && (
                <div className="card p-12 text-center border-dashed border-2 opacity-40 flex flex-col items-center gap-3">
                  <History size={32} className="text-muted" />
                  <p className="text-muted font-medium">No hay movimientos registrados aún.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Evento */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content !max-w-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Nuevo Evento</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvento} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Nombre del Evento</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Completada para el paseo"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="rounded-[18px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Descripción (Opcional)</label>
                <textarea 
                  placeholder="Detalles sobre la actividad..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="rounded-[18px] bg-white/5 border-white/10 p-4 text-white min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Fecha</label>
                  <input 
                    type="date" 
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="rounded-[18px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Meta a recaudar ($)</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 100000"
                    value={formData.ganancia_estimada}
                    onChange={(e) => setFormData({...formData, ganancia_estimada: e.target.value})}
                    className="rounded-[18px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-main py-4 rounded-2xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] btn-primary"
                >
                  {isSaving ? <Loader2 size={24} className="animate-spin m-auto" /> : 'Crear Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle de Evento */}
      {isDetailModalOpen && selectedEvent && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsDetailModalOpen(false); }}>
          <div className="modal-content !max-w-4xl min-h-[80vh] flex flex-col" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedEvent.nombre}</h2>
                <p className="text-sm text-muted">{new Date(selectedEvent.fecha).toLocaleDateString('es-CL', { dateStyle: 'long' })}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>

            {/* Mini Dashboard de Evento */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 sm:p-4 rounded-2xl">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Ingresos</span>
                </div>
                <p className="text-sm sm:text-2xl font-black text-white">{formatMoney(calculateEventBalance(selectedEvent).ingresos)}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-2.5 sm:p-4 rounded-2xl">
                <div className="flex items-center gap-1.5 text-red-400 mb-1">
                  <ArrowDownRight size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Gastos</span>
                </div>
                <p className="text-sm sm:text-2xl font-black text-white">{formatMoney(calculateEventBalance(selectedEvent).egresos)}</p>
              </div>
              <div className="bg-accent/10 border border-accent/20 p-2.5 sm:p-4 rounded-2xl">
                <div className="flex items-center gap-1.5 text-accent mb-1">
                  <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Balance</span>
                </div>
                <p className="text-sm sm:text-2xl font-black text-white">{formatMoney(calculateEventBalance(selectedEvent).neto)}</p>
              </div>
            </div>

            {/* Pestañas Internas del Modal - Estilo Neón */}
            <div className="flex gap-2 p-1.5 bg-slate-900/50 rounded-2xl mb-6 border border-white/5 shadow-inner">
              {['balance', 'colaboradores'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setEventSubTab(tab)}
                  className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    eventSubTab === tab 
                      ? 'bg-accent/20 text-accent border border-accent/40 shadow-[0_0_15px_rgba(139,92,246,0.2)] scale-[1.02]' 
                      : 'text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {eventSubTab === 'balance' ? (
                <div className="flex flex-col gap-6">
                  {/* Formulario Nueva Transacción - Estilo Neón */}
                  {selectedEvent.estado === 'abierto' ? (
                    <div className="bg-slate-900/60 p-6 rounded-[2rem] border-2 border-accent/30 shadow-[0_0_30px_rgba(139,92,246,0.15)] mb-4">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Receipt size={18} className="text-accent" />
                        </div>
                        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-accent">Registrar Movimiento</h4>
                      </div>
                      
                      <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-accent/80 uppercase ml-2 tracking-widest">TIPO</label>
                            <select 
                              value={newTransaction.tipo}
                              onChange={(e) => setNewTransaction({...newTransaction, tipo: e.target.value})}
                              className="!py-4 !px-4 !text-base rounded-2xl bg-slate-950 border-white/10 text-white focus:border-accent/50 appearance-none cursor-pointer"
                            >
                              <option value="ingreso">Ingreso (+)</option>
                              <option value="egreso">Egreso (-)</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-accent/80 uppercase ml-2 tracking-widest">MONTO ($)</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={newTransaction.monto}
                              onChange={(e) => setNewTransaction({...newTransaction, monto: e.target.value})}
                              className="!py-4 !px-4 !text-2xl rounded-2xl bg-slate-950 border-white/10 text-white font-black focus:border-accent/50 placeholder:text-white/10"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-accent/80 uppercase ml-2 tracking-widest">DESCRIPCIÓN</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Ej: Venta de completos"
                              value={newTransaction.descripcion}
                              onChange={(e) => setNewTransaction({...newTransaction, descripcion: e.target.value})}
                              className="flex-1 !py-4 !px-4 !text-base rounded-2xl bg-slate-950 border-white/10 text-white focus:border-accent/50"
                            />
                            <button 
                              onClick={handleAddTransaction}
                              disabled={isSaving || !newTransaction.monto || !newTransaction.descripcion}
                              className="bg-accent hover:bg-accent-hover text-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                              {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Plus size={32} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <p className="text-xs font-bold text-emerald-400/80">Este evento está cerrado. No se pueden añadir más movimientos.</p>
                    </div>
                  )}

                  {/* Listado de Transacciones */}
                  <div className="flex flex-col gap-3">
                    {selectedEvent.eventos_financiero?.length > 0 ? (
                      selectedEvent.eventos_financiero.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              f.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {f.tipo === 'ingreso' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            </div>
                            <div>
                              <p className="font-medium text-white">{f.descripcion}</p>
                              <p className="text-[10px] text-muted uppercase font-bold tracking-tighter">
                                {new Date().toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className={`font-black ${f.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {f.tipo === 'ingreso' ? '+' : '-'}{formatMoney(f.monto)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-30 italic text-sm">
                        No hay movimientos registrados para este evento.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Selector de Colaboradores - ESTILO NEÓN UNIFICADO */}
                  {selectedEvent.estado === 'abierto' && (
                    <div className="bg-slate-900/40 p-5 rounded-3xl border border-accent/20 shadow-[0_0_20px_rgba(139,92,246,0.05)]">
                      <div className="flex items-center gap-2 mb-4">
                        <UserPlus size={16} className="text-accent" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent/80">Asignar Colaborador</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6 flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-accent/80 uppercase ml-2 tracking-widest">ALUMNO / APODERADO</label>
                          <select 
                            value={newColaborador.alumno_id}
                            onChange={(e) => setNewColaborador({...newColaborador, alumno_id: e.target.value})}
                            className="!py-2.5 !px-3 !text-xs rounded-xl bg-slate-950 border-white/10 text-white focus:border-accent/50"
                          >
                            <option value="">Seleccionar...</option>
                            {alumnos.map(a => (
                              <option key={a.id} value={a.id}>{a.nombre_alumno}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-6 flex items-end gap-2">
                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-[9px] font-bold text-accent/80 uppercase ml-2 tracking-widest">ROL / TAREA</label>
                            <input 
                              type="text" 
                              placeholder="Ej: Cocinero, Compras"
                              value={newColaborador.rol}
                              onChange={(e) => setNewColaborador({...newColaborador, rol: e.target.value})}
                              className="!py-2.5 !px-4 !text-xs rounded-xl bg-slate-950 border-white/10 text-white focus:border-accent/50"
                            />
                          </div>
                          <button 
                            onClick={handleAddColaborador}
                            disabled={isSaving || !newColaborador.alumno_id}
                            className="bg-accent hover:bg-accent-hover text-white h-[38px] w-[38px] rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Listado de Colaboradores */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEvent.eventos_participantes?.length > 0 ? (
                      selectedEvent.eventos_participantes.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">{p.alumnos?.nombre_alumno}</p>
                            <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-md border border-accent/20 font-bold uppercase">
                              {p.rol}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-10 opacity-30 italic text-sm">
                        No hay colaboradores asignados aún.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex gap-4">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-bold transition-all text-muted hover:text-white"
              >
                Cerrar
              </button>
              
              <button 
                onClick={() => handleDeleteEvento(selectedEvent.id)}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-4 rounded-2xl font-bold transition-all border border-red-500/20 flex items-center justify-center gap-2"
              >
                <X size={20} />
                ELIMINAR
              </button>

              {selectedEvent.estado === 'abierto' && (
                <button 
                  onClick={() => handleCerrarEvento(selectedEvent.id)}
                  className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  FINALIZAR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Propio */}
      {confirmAction && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null); }}>
          <div className="modal-content !max-w-md" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <AlertCircle size={48} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Confirmar Acción</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>{confirmAction.message}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{ flex: 1, padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const action = confirmAction.onConfirm
                  setConfirmAction(null)
                  action()
                }}
                style={{ flex: 2, padding: '14px', borderRadius: '16px', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '14px' }}
              >
                Sí, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: #0f172a;
          width: 100%;
          max-width: 500px;
          border-radius: 32px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        input, select, textarea {
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          width: 100%;
          outline: none;
          transition: all 0.3s ease;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--accent);
          background: rgba(139, 92, 246, 0.05);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        /* Eliminar flechas de número (spinners) */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }

        /* Corregir contraste de opciones en select */
        select option {
          background-color: #1e1b4b; /* Azul profundo para combinar con el tema */
          color: white;
          padding: 10px;
        }
      `}</style>
    </div>
  )
}
