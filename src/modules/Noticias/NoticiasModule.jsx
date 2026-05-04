import { useState, useEffect } from 'react'
import { 
  Bell, 
  Vote, 
  Calendar, 
  Users, 
  CreditCard, 
  ExternalLink, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function NoticiasModule() {
  const [loading, setLoading] = useState(true)
  const [noticias, setNoticias] = useState({
    votacionesVigentes: [],
    eventoCercano: null,
    directiva: [],
    configPagos: {
      banco: 'Banco Estado',
      tipo_cuenta: 'Cuenta RUT',
      numero: '12.345.678-9',
      titular: 'Tesorero del Curso',
      email: 'tesoreria@curso.cl'
    }
  })

  useEffect(() => {
    fetchNoticias()
  }, [])

  async function fetchNoticias() {
    setLoading(true)
    try {
      // 1. Votaciones vigentes
      const { data: vots } = await supabase
        .from('votaciones')
        .select('*')
        .eq('estado', 'vigente')
        .limit(3)

      // 2. Evento más cercano
      const { data: evts } = await supabase
        .from('eventos')
        .select('*')
        .eq('estado', 'abierto')
        .order('fecha', { ascending: true })
        .limit(1)

      // 3. Directiva (Alumnos con rol_directiva)
      const { data: dirs } = await supabase
        .from('alumnos')
        .select('nombre_alumno, rol_directiva')
        .not('rol_directiva', 'is', null)
        .neq('rol_directiva', '')
        .order('rol_directiva')

      setNoticias(prev => ({
        ...prev,
        votacionesVigentes: vots || [],
        eventoCercano: evts?.[0] || null,
        directiva: dirs || []
      }))
    } catch (error) {
      console.error('Error fetching noticias:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-accent" size={48} />
        <p className="text-muted font-medium">Cargando novedades...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent shadow-lg shadow-accent/10">
          <Bell size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Novedades</h2>
          <p className="text-muted text-sm font-medium">Lo más importante del curso hoy.</p>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Columna Izquierda: Votaciones y Eventos */}
        <div className="flex flex-col gap-6">
          
          {/* Tarjeta de Votaciones */}
          <div className="card !p-0 overflow-hidden border-emerald-500/20 bg-emerald-500/[0.02]">
            <div className="p-5 flex items-center justify-between border-b border-white/5 bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <Vote size={20} />
                </div>
                <h3 className="font-bold text-main">Votaciones Activas</h3>
              </div>
              <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                {noticias.votacionesVigentes.length}
              </span>
            </div>
            
            <div className="p-5 flex flex-col gap-3">
              {noticias.votacionesVigentes.length > 0 ? (
                noticias.votacionesVigentes.map(vot => (
                  <div key={vot.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all group cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{vot.nombre}</span>
                      <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Encuesta en curso</span>
                    </div>
                    <ArrowRight size={16} className="text-muted group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-4 opacity-50">
                  <CheckCircle2 size={20} className="text-muted" />
                  <p className="text-sm text-muted">No hay votaciones pendientes.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Próximo Evento */}
          <div className="card !p-0 overflow-hidden border-blue-500/20 bg-blue-500/[0.02]">
            <div className="p-5 flex items-center justify-between border-b border-white/5 bg-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <Calendar size={20} />
                </div>
                <h3 className="font-bold text-main">Próximo Evento</h3>
              </div>
            </div>
            
            <div className="p-5">
              {noticias.eventoCercano ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-500/20 rounded-2xl border border-blue-500/20">
                      <span className="text-[10px] font-black text-blue-400 uppercase">{new Date(noticias.eventoCercano.fecha).toLocaleDateString('es-CL', { month: 'short' })}</span>
                      <span className="text-2xl font-black text-white leading-none">{new Date(noticias.eventoCercano.fecha).getDate() + 1}</span>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-white text-lg leading-tight">{noticias.eventoCercano.nombre}</h4>
                      <p className="text-xs text-muted mt-1">{noticias.eventoCercano.descripcion || 'Sin descripción adicional'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 opacity-50">
                  <Info size={20} className="text-muted" />
                  <p className="text-sm text-muted">No hay eventos programados.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Directiva y Pagos */}
        <div className="flex flex-col gap-6">
          
          {/* Tarjeta de Directiva */}
          <div className="card !p-0 overflow-hidden border-accent/20 bg-accent/[0.02]">
            <div className="p-5 flex items-center justify-between border-b border-white/5 bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-xl text-accent">
                  <Users size={20} />
                </div>
                <h3 className="font-bold text-main">Directiva del Curso</h3>
              </div>
            </div>
            
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {noticias.directiva.length > 0 ? (
                noticias.directiva.map((member, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-[10px] font-bold">
                      {member.nombre_alumno.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white leading-none">{member.nombre_alumno}</span>
                      <span className="text-[9px] text-accent uppercase font-black tracking-widest mt-1">{member.rol_directiva}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex items-center gap-3 p-4 opacity-50">
                  <AlertCircle size={20} className="text-muted" />
                  <p className="text-sm text-muted">Directiva no asignada aún.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Datos de Pago */}
          <div className="card !p-0 overflow-hidden border-amber-500/20 bg-amber-500/[0.02]">
            <div className="p-5 flex items-center justify-between border-b border-white/5 bg-amber-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500">
                  <Wallet size={20} />
                </div>
                <h3 className="font-bold text-main">Datos de Transferencia</h3>
              </div>
            </div>
            
            <div className="p-5">
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Banco</span>
                  <span className="text-xs font-bold text-white">{noticias.configPagos.banco}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Tipo</span>
                  <span className="text-xs font-bold text-white">{noticias.configPagos.tipo_cuenta}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Cuenta</span>
                  <span className="text-xs font-bold text-white">{noticias.configPagos.numero}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Titular</span>
                  <span className="text-xs font-bold text-white">{noticias.configPagos.titular}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Email</span>
                  <span className="text-xs font-bold text-white">{noticias.configPagos.email}</span>
                </div>
              </div>
              <button className="w-full mt-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                Copiar Datos de Transferencia
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
