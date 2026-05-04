import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  User,
  Calendar,
  DollarSign,
  Save,
  ChevronLeft
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const MESES = [
  { id: 3, nombre: 'Marzo' },
  { id: 4, nombre: 'Abril' },
  { id: 5, nombre: 'Mayo' },
  { id: 6, nombre: 'Junio' },
  { id: 7, nombre: 'Julio' },
  { id: 8, nombre: 'Agosto' },
  { id: 9, nombre: 'Septiembre' },
  { id: 10, nombre: 'Octubre' },
  { id: 11, nombre: 'Noviembre' },
  { id: 12, nombre: 'Diciembre' }
]

export default function CuotasModule() {
  const [alumnos, setAlumnos] = useState([])
  const [cuotasConfig, setCuotasConfig] = useState([])
  const [pagos, setPagos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('matriz') // 'matriz' o 'config'
  
  // Estado para edición de montos
  const [editingConfig, setEditingConfig] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Alumnos
      const { data: alumnosData } = await supabase
        .from('alumnos')
        .select('id, nombre_alumno')
        .order('nombre_alumno')
      
      // 2. Fetch Configuración de Cuotas
      const { data: configData } = await supabase
        .from('cuotas_config')
        .select('*')
        .order('mes')
      
      // 3. Fetch Pagos
      const { data: pagosData } = await supabase
        .from('cuotas_pagos')
        .select('*')
        .eq('anio', 2026)

      setAlumnos(alumnosData || [])
      setCuotasConfig(configData || [])
      setPagos(pagosData || [])
      
      // Inicializar edición de config
      const configObj = {}
      ;(configData || []).forEach(c => {
        configObj[c.mes] = c.monto
      })
      setEditingConfig(configObj)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateConfig = async () => {
    setIsSaving(true)
    try {
      const promises = Object.entries(editingConfig).map(([mes, monto]) => {
        return supabase
          .from('cuotas_config')
          .upsert({ 
            mes: parseInt(mes), 
            monto: parseFloat(monto), 
            anio: 2026 
          }, { onConflict: 'mes,anio' })
      })

      await Promise.all(promises)
      await fetchData()
      setActiveTab('matriz')
    } catch (error) {
      alert("Error al actualizar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePago = async (alumnoId, mes) => {
    const pagoExistente = pagos.find(p => p.alumno_id === alumnoId && p.mes === mes)
    const configMes = cuotasConfig.find(c => c.mes === mes)
    
    if (pagoExistente) {
      // Eliminar pago
      const { error } = await supabase
        .from('cuotas_pagos')
        .delete()
        .eq('id', pagoExistente.id)
      if (error) return
    } else {
      // Crear pago
      const { error } = await supabase
        .from('cuotas_pagos')
        .insert([{
          alumno_id: alumnoId,
          mes: mes,
          monto_pagado: configMes?.monto || 0,
          anio: 2026
        }])
      if (error) return
    }
    
    fetchData()
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header Estilizado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            Cuotas Anuales <span className="text-accent text-sm bg-accent/10 px-3 py-1 rounded-full border border-accent/20">2026</span>
          </h1>
          <p className="text-slate-400 font-medium">Gestión y control de mensualidades del curso.</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab(activeTab === 'matriz' ? 'config' : 'matriz')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'config' 
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {activeTab === 'config' ? <ChevronLeft size={20} /> : <Settings size={20} />}
            {activeTab === 'config' ? 'Volver a Matriz' : 'Configurar Montos'}
          </button>
        </div>
      </div>

      {activeTab === 'matriz' ? (
        <div className="space-y-6">
          {/* Matriz de Pagos Premium */}
          <div className="bg-slate-900/40 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-950/50">
                    <th className="p-3 sm:p-6 text-left text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 sticky left-0 bg-slate-900/90 z-20 backdrop-blur-md min-w-[100px] sm:min-w-[150px]">
                      Alumno
                    </th>
                    {MESES.map(mes => (
                      <th key={mes.id} className="p-2 sm:p-6 text-center text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 min-w-[70px] sm:min-w-[120px]">
                        {mes.nombre.substring(0, 3)}
                        <div className="text-[8px] text-accent/60 mt-1">
                          {formatMoney(cuotasConfig.find(c => c.mes === mes.id)?.monto || 0).replace('CLP', '')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map(alumno => {
                    const pagosAlumno = pagos.filter(p => p.alumno_id === alumno.id)
                    const totalPagado = pagosAlumno.length
                    const porcentaje = (totalPagado / MESES.length) * 100
                    
                    // Lógica "Al Día"
                    const currentMonth = new Date().getMonth() + 1
                    const mesesRequeridos = MESES.filter(m => m.id <= currentMonth)
                    const isAlDia = mesesRequeridos.every(m => pagos.some(p => p.alumno_id === alumno.id && p.mes === m.id))

                    return (
                      <tr key={alumno.id} className="group hover:bg-white/5 transition-colors">
                        <td className="p-2 sm:p-5 sticky left-0 bg-slate-900/90 group-hover:bg-slate-800/90 z-20 border-b border-white/5 backdrop-blur-md">
                          <div className="flex flex-col gap-1">
                            <p className="text-[11px] sm:text-sm font-bold text-white group-hover:text-accent transition-colors truncate max-w-[80px] sm:max-w-none">
                              {alumno.nombre_alumno}
                            </p>
                            <span className={`text-[8px] font-black uppercase tracking-tighter ${isAlDia ? 'text-emerald-400' : 'text-amber-500'}`}>
                              {isAlDia ? '● Al Día' : '○ Pendiente'}
                            </span>
                          </div>
                        </td>
                        {MESES.map(mes => {
                          const pagado = pagos.some(p => p.alumno_id === alumno.id && p.mes === mes.id)
                          const currentMonth = new Date().getMonth() + 1
                          const isAtrasado = !pagado && mes.id <= currentMonth

                          return (
                            <td key={mes.id} className="p-1 sm:p-3 text-center border-b border-white/5">
                              <button
                                onClick={() => handleTogglePago(alumno.id, mes.id)}
                                className={`w-full py-2.5 sm:py-4 rounded-lg sm:rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${
                                  pagado 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                                    : isAtrasado
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]'
                                      : 'bg-white/5 text-slate-600 hover:text-white hover:bg-white/10 border border-transparent'
                                }`}
                              >
                                {pagado ? (
                                  <>
                                    <CheckCircle2 size={14} className="sm:w-[18px] sm:h-[18px]" />
                                    <span className="text-[6px] sm:text-[8px] font-black uppercase">Pagado</span>
                                  </>
                                ) : isAtrasado ? (
                                  <>
                                    <XCircle size={14} className="text-red-400 sm:w-[18px] sm:h-[18px]" />
                                    <span className="text-[6px] sm:text-[8px] font-black uppercase">Debe</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle size={14} className="opacity-30 sm:w-[18px] sm:h-[18px]" />
                                    <span className="text-[6px] sm:text-[8px] font-black uppercase">Pendiente</span>
                                  </>
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Pantalla de Configuración de Montos */
        <div className="max-w-2xl mx-auto bg-slate-900/40 p-8 rounded-[32px] border border-white/5 shadow-2xl animate-scale-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-500">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Configurar Cuotas por Mes</h2>
              <p className="text-sm text-slate-400">Ajusta el monto que corresponde a cada periodo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {MESES.map(mes => (
              <div key={mes.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{mes.nombre}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input 
                    type="number"
                    value={editingConfig[mes.id] || ''}
                    onChange={(e) => setEditingConfig({...editingConfig, [mes.id]: e.target.value})}
                    className="w-full bg-slate-950 border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:border-accent/50 transition-all outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleUpdateConfig}
            disabled={isSaving}
            className="w-full bg-accent hover:bg-accent-hover text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-accent/20 flex items-center justify-center gap-3 transition-all"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Guardar Configuración Anual
          </button>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </div>
  )
}
