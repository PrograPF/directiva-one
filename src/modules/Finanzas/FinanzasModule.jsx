import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Loader2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import EventosModule from '../Eventos/EventosModule'
import CuotasModule from '../Cuotas/CuotasModule'

export default function FinanzasModule() {
  const [activeTab, setActiveTab] = useState('resumen')
  const [stats, setStats] = useState({
    cuotas: 0,
    eventos: 0,
    gastos: 0,
    totalIngresos: 0,
    utilidad: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'resumen') {
      fetchResumenData()
    }
  }, [activeTab])

  const fetchResumenData = async () => {
    setIsLoading(true)
    try {
      // 1. Obtener Ingresos por Cuotas
      const { data: pagosData } = await supabase
        .from('cuotas_pagos')
        .select('monto_pagado')
        .eq('anio', 2026)
      
      const totalCuotas = (pagosData || []).reduce((acc, p) => acc + (Number(p.monto_pagado) || 0), 0)

      // 2. Obtener Eventos y Gastos
      const { data: eventosData } = await supabase
        .from('eventos')
        .select(`
          *,
          eventos_financiero (
            tipo,
            monto
          )
        `)
        .eq('estado', 'cerrado')

      let totalEventos = 0
      let totalGastos = 0

      ;(eventosData || []).forEach(evento => {
        const finanzas = evento.eventos_financiero || []
        const ingresos = finanzas.filter(f => f.tipo === 'ingreso').reduce((acc, f) => acc + f.monto, 0)
        const egresos = finanzas.filter(f => f.tipo === 'egreso').reduce((acc, f) => acc + f.monto, 0)
        const neto = ingresos - egresos

        if (evento.nombre.startsWith('[GASTO]')) {
          totalGastos += Math.abs(neto)
        } else {
          totalEventos += neto
        }
      })

      const totalIngresos = totalCuotas + totalEventos
      const utilidad = totalIngresos - totalGastos

      setStats({
        cuotas: totalCuotas,
        eventos: totalEventos,
        gastos: totalGastos,
        totalIngresos,
        utilidad
      })
    } catch (error) {
      console.error('Error fetching resumen:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Selector de Pestañas Superior */}
      <div className="flex p-1.5 bg-slate-900/50 rounded-2xl border border-white/5 relative overflow-hidden backdrop-blur-md">
        {[
          { id: 'resumen', label: 'RESUMEN', icon: BarChart3, color: '#60a5fa' },
          { id: 'eventos', label: 'ACTIVIDADES', icon: Wallet, color: '#fbbf24' },
          { id: 'cuotas', label: 'CUOTAS', icon: CreditCard, color: '#8b5cf6' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] sm:text-xs transition-all relative z-10 tracking-widest ${
              activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-white'
            }`}
          >
            <tab.icon size={18} className={activeTab === tab.id ? '' : 'opacity-40'} style={{ color: activeTab === tab.id ? tab.color : '' }} />
            {tab.label}
          </button>
        ))}
        
        {/* Indicador de pestaña activa (Animado) */}
        <div 
          className="absolute top-1.5 bottom-1.5 bg-white/[0.08] rounded-xl transition-all duration-300 ease-out border border-white/5 shadow-xl"
          style={{ 
            width: 'calc(33.33% - 6px)',
            left: activeTab === 'resumen' ? '6px' : activeTab === 'eventos' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)'
          }}
        />
      </div>

      {/* Contenido según pestaña */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'resumen' ? (
          <div className="flex flex-col gap-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-accent" size={48} />
                <p className="text-muted font-medium animate-pulse">Generando balance financiero...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Tabla de Ingresos */}
                <div className="card !p-0 overflow-hidden border-emerald-500/20 bg-emerald-500/[0.02]">
                  <div className="bg-emerald-500/10 p-5 border-b border-emerald-500/20 flex items-center justify-between">
                    <h3 className="text-lg font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <ArrowUpCircle size={20} /> INGRESOS
                    </h3>
                    <PieChart size={18} className="text-emerald-500/40" />
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center group">
                      <span className="text-slate-400 font-bold group-hover:text-white transition-colors">CUOTAS</span>
                      <span className="text-xl font-black text-white">{formatMoney(stats.cuotas)}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-slate-400 font-bold group-hover:text-white transition-colors">EVENTOS</span>
                      <span className="text-xl font-black text-white">{formatMoney(stats.eventos)}</span>
                    </div>
                    <div className="h-px bg-emerald-500/20 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-black tracking-widest text-xs">TOTAL INGRESOS</span>
                      <span className="text-2xl font-black text-emerald-400">{formatMoney(stats.totalIngresos)}</span>
                    </div>
                  </div>
                </div>

                {/* Tabla de Gastos */}
                <div className="card !p-0 overflow-hidden border-red-500/20 bg-red-500/[0.02]">
                  <div className="bg-red-500/10 p-5 border-b border-red-500/20 flex items-center justify-between">
                    <h3 className="text-lg font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                      <ArrowDownCircle size={20} /> GASTOS
                    </h3>
                    <TrendingDown size={18} className="text-red-500/40" />
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center group">
                      <span className="text-slate-400 font-bold group-hover:text-white transition-colors">GASTOS GENERALES</span>
                      <span className="text-xl font-black text-white">{formatMoney(stats.gastos)}</span>
                    </div>
                    <div className="mt-auto pt-10">
                      <div className="h-px bg-red-500/20 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-red-400 font-black tracking-widest text-xs">TOTAL GASTOS</span>
                        <span className="text-2xl font-black text-red-400">{formatMoney(stats.gastos)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Utilidad */}
                <div className={`card !p-0 overflow-hidden border-accent/20 bg-accent/[0.02] md:col-span-2 lg:col-span-1 shadow-2xl ${stats.utilidad >= 0 ? 'shadow-emerald-500/5' : 'shadow-red-500/5'}`}>
                  <div className="bg-accent/10 p-5 border-b border-accent/20 flex items-center justify-between">
                    <h3 className="text-lg font-black text-accent uppercase tracking-widest flex items-center gap-2">
                      <Activity size={20} /> BALANCE NETO
                    </h3>
                    <TrendingUp size={18} className="text-accent/40" />
                  </div>
                  <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${stats.utilidad >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {stats.utilidad >= 0 ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">UTILIDAD ACTUAL</p>
                      <h4 className={`text-4xl font-black ${stats.utilidad >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {formatMoney(stats.utilidad)}
                      </h4>
                    </div>
                    <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${stats.utilidad >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {stats.utilidad >= 0 ? 'Caja en superávit' : 'Caja en déficit'}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : activeTab === 'eventos' ? (
          <EventosModule />
        ) : (
          <CuotasModule />
        )}
      </div>
    </div>
  )
}
