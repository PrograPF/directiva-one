import { useState, useEffect } from 'react'
import { Plus, X, BarChart2, CheckCircle2, Trash2, Loader2, AlertCircle, TrendingUp, User, ChevronRight, Lock, History, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function VotacionesModule() {
  const [votaciones, setVotaciones] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [alumnoSearchTerm, setAlumnoSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false)
  const [selectedVotacion, setSelectedVotacion] = useState(null)
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('')
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null)
  const [isAlumnoSelectOpen, setIsAlumnoSelectOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [votosDetalle, setVotosDetalle] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState(null)

  // Formulario para nueva votación
  const [formData, setFormData] = useState({
    nombre: '',
    opciones: ['', '']
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    try {
      // Cargar alumnos para el tope y para el selector de votante
      const { data: alumnosData, error: alumnosError } = await supabase
        .from('alumnos')
        .select('id, nombre_alumno')
        .order('nombre_alumno')
      
      if (alumnosError) throw alumnosError
      setAlumnos(alumnosData || [])

      // Cargar votaciones
      const { data: votacionesData, error: votacionesError } = await supabase
        .from('votaciones')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (votacionesError) {
        if (votacionesError.code === 'PGRST116' || votacionesError.message.includes('not found')) {
          setError('Las tablas de votación no han sido creadas en Supabase.')
        } else {
          throw votacionesError
        }
      }
      setVotaciones(votacionesData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddOption = () => {
    setFormData({ ...formData, opciones: [...formData.opciones, ''] })
  }

  const handleRemoveOption = (index) => {
    if (formData.opciones.length > 2) {
      const newOptions = formData.opciones.filter((_, i) => i !== index)
      setFormData({ ...formData, opciones: newOptions })
    }
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.opciones]
    newOptions[index] = value
    setFormData({ ...formData, opciones: newOptions })
  }

  const handleCreateVotacion = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Preparar las opciones con votos iniciales en 0
    const opcionesConVotos = formData.opciones
      .filter(opt => opt.trim() !== '')
      .map(nombre => ({ nombre, votos: 0 }))

    if (opcionesConVotos.length < 2) {
      alert('Debes incluir al menos 2 opciones.')
      setIsSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('votaciones')
      .insert([{
        nombre: formData.nombre,
        opciones: opcionesConVotos,
        estado: 'vigente',
        total_alumnos_tope: alumnos.length
      }])
      .select()

    if (error) {
      alert('Error al crear votación: ' + error.message)
    } else {
      setVotaciones([data[0], ...votaciones])
      setIsModalOpen(false)
      setFormData({ nombre: '', opciones: ['', ''] })
    }
    setIsSaving(false)
  }

  const handleVote = async (opcionIndex) => {
    if (!selectedAlumnoId) {
      alert('Por favor, selecciona al alumno que está votando.')
      return
    }

    setIsSaving(true)
    
    try {
      // 1. Verificar si el alumno ya votó en esta votación
      const { data: existingVote, error: checkError } = await supabase
        .from('votos_por_alumno')
        .select('id')
        .eq('votacion_id', selectedVotacion.id)
        .eq('alumno_id', selectedAlumnoId)
        .single()

      if (existingVote) {
        alert('Este alumno ya ha registrado su voto en esta votación.')
        setIsSaving(false)
        return
      }

      // 2. Registrar el voto
      const { error: voteError } = await supabase
        .from('votos_por_alumno')
        .insert([{
          votacion_id: selectedVotacion.id,
          alumno_id: selectedAlumnoId,
          opcion_index: opcionIndex
        }])

      if (voteError) throw voteError

      // 3. Actualizar el conteo en la tabla de votaciones
      const updatedOpciones = [...selectedVotacion.opciones]
      updatedOpciones[opcionIndex].votos += 1

      // Calcular total de votos actual
      const totalVotos = updatedOpciones.reduce((acc, opt) => acc + opt.votos, 0)
      
      // Si llegamos al tope, cerramos automáticamente
      const nuevoEstado = totalVotos >= selectedVotacion.total_alumnos_tope ? 'cerrada' : 'vigente'

      const { data: updatedData, error: updateError } = await supabase
        .from('votaciones')
        .update({ 
          opciones: updatedOpciones,
          estado: nuevoEstado
        })
        .eq('id', selectedVotacion.id)
        .select()
        .single()

      if (updateError) throw updateError

      setVotaciones(votaciones.map(v => v.id === selectedVotacion.id ? updatedData : v))
      setIsVotingModalOpen(false)
      setSelectedAlumnoId('')
      setSelectedOptionIndex(null)
      alert('¡Voto registrado con éxito!')

    } catch (err) {
      alert('Error al votar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCerrarVotacion = async (id) => {
    if (window.confirm('¿Estás seguro de cerrar esta votación? Ya no se podrán recibir más votos.')) {
      const { data, error } = await supabase
        .from('votaciones')
        .update({ estado: 'cerrada' })
        .eq('id', id)
        .select()
        .single()

      if (error) alert('Error: ' + error.message)
      else setVotaciones(votaciones.map(v => v.id === id ? data : v))
    }
  }

  const handleDeleteVotacion = async (id) => {
    if (window.confirm('¿Eliminar definitivamente esta votación y todos sus registros?')) {
      const { error } = await supabase.from('votaciones').delete().eq('id', id)
      if (error) alert('Error: ' + error.message)
      else setVotaciones(votaciones.filter(v => v.id !== id))
    }
  }

  const openVotingModal = (votacion) => {
    setSelectedVotacion(votacion)
    setIsVotingModalOpen(true)
    setIsAlumnoSelectOpen(false)
    setAlumnoSearchTerm('')
    setSelectedAlumnoId('')
    setSelectedOptionIndex(null)
  }

  const openHistoryModal = async (votacion) => {
    setSelectedVotacion(votacion)
    setIsHistoryModalOpen(true)
    setIsLoadingHistory(true)
    
    try {
      const { data, error } = await supabase
        .from('votos_por_alumno')
        .select(`
          created_at,
          opcion_index,
          alumnos (
            nombre_alumno
          )
        `)
        .eq('votacion_id', votacion.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVotosDetalle(data || [])
    } catch (err) {
      console.error('Error fetching history:', err)
      alert('Error al cargar el detalle de votos.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 size={48} className="text-accent animate-spin" />
        <p className="text-muted">Cargando módulo de votaciones...</p>
      </div>
    )
  }

  const vigentes = votaciones.filter(v => v.estado === 'vigente')
  const historicas = votaciones.filter(v => v.estado === 'cerrada')

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Votaciones</h2>
            <p className="text-muted text-sm opacity-80">
              Tope basado en {alumnos.length} alumnos registrados.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ width: '56px', height: '56px', borderRadius: '18px' }}
          >
            <Plus size={28} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-400">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold">Atención</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Sección Vigentes */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="text-lg font-bold">Votaciones Vigentes</h3>
            {vigentes.length > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1"></span>
            )}
          </div>

          {vigentes.length === 0 ? (
            <div className="card p-8 text-center border-dashed border-2 opacity-60">
              <p className="text-muted">No hay votaciones activas en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vigentes.map(v => (
                <VotacionCard 
                  key={v.id} 
                  votacion={v} 
                  onVote={() => openVotingModal(v)}
                  onViewHistory={() => openHistoryModal(v)}
                  onClose={() => handleCerrarVotacion(v.id)}
                  onDelete={() => handleDeleteVotacion(v.id)}
                  isAdmin={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sección Históricas */}
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2 px-2">
            <History size={18} className="text-slate-400" />
            <h3 className="text-lg font-bold text-slate-400">Historial</h3>
          </div>

          {historicas.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted italic">
              El historial está vacío.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historicas.map(v => (
              <VotacionCard 
                key={v.id} 
                votacion={v} 
                onViewHistory={() => openHistoryModal(v)}
                onDelete={() => handleDeleteVotacion(v.id)}
                isAdmin={true}
              />
            ))}
            </div>
          )}
        </div>

        {/* Modal Crear Votación */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setIsModalOpen(false)}>
            <div className="modal-content">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Nueva Votación</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500">
                  <X size={28} />
                </button>
              </div>
              
              <form onSubmit={handleCreateVotacion} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Título de la Votación</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Destino del paseo de fin de año"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="rounded-[18px]"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Opciones</label>
                  {formData.opciones.map((opcion, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        placeholder={`Opción ${index + 1}`}
                        value={opcion}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="rounded-[16px] flex-1"
                      />
                      {formData.opciones.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={handleAddOption}
                    className="text-sm text-accent font-bold flex items-center gap-1 mt-1 hover:underline"
                  >
                    <Plus size={16} /> Añadir opción
                  </button>
                </div>

                <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex items-center gap-3">
                  <Lock size={18} className="text-accent" />
                  <p className="text-xs text-muted leading-relaxed">
                    Esta votación se cerrará automáticamente al alcanzar los <span className="text-accent font-bold">{alumnos.length} votos</span>.
                  </p>
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
                    {isSaving ? <Loader2 size={24} className="animate-spin m-auto" /> : 'Crear Votación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Votar */}
        {isVotingModalOpen && selectedVotacion && (
          <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setIsVotingModalOpen(false)}>
            <div className="modal-content !max-w-2xl min-h-[750px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedVotacion.nombre}</h2>
                  <p className="text-sm text-muted">Registra tu voto</p>
                </div>
                <button onClick={() => setIsVotingModalOpen(false)} className="p-2 text-slate-500">
                  <X size={28} />
                </button>
              </div>
              
              <div className="flex flex-col gap-6 flex-1">
                {/* Dropdown de Alumnos Searchable */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setIsAlumnoSelectOpen(!isAlumnoSelectOpen)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                        <User size={18} />
                      </div>
                      <span className={selectedAlumnoId ? 'text-white' : 'text-muted'}>
                        {selectedAlumnoId 
                          ? alumnos.find(a => a.id === selectedAlumnoId)?.nombre_alumno 
                          : 'Selecciona un alumno...'}
                      </span>
                    </div>
                    <ChevronRight size={20} className={`text-muted transition-transform ${isAlumnoSelectOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isAlumnoSelectOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl z-[1100] animate-in fade-in slide-in-from-top-2">
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input 
                          type="text" 
                          placeholder="Buscar alumno..."
                          value={alumnoSearchTerm}
                          onChange={(e) => setAlumnoSearchTerm(e.target.value)}
                          className="pl-10 py-2 text-sm rounded-xl bg-white/5 border-transparent focus:border-accent/50"
                        />
                      </div>
                      <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {alumnos
                          .filter(a => a.nombre_alumno.toLowerCase().includes(alumnoSearchTerm.toLowerCase()))
                          .map(a => (
                            <button
                              key={a.id}
                              onClick={() => {
                                setSelectedAlumnoId(a.id)
                                setIsAlumnoSelectOpen(false)
                              }}
                              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                                selectedAlumnoId === a.id 
                                  ? 'bg-accent text-white' 
                                  : 'hover:bg-white/5 text-muted hover:text-white'
                              }`}
                            >
                              <span className="text-sm font-medium">{a.nombre_alumno}</span>
                              {selectedAlumnoId === a.id && <CheckCircle2 size={14} className="ml-auto" />}
                            </button>
                          ))
                        }
                        {alumnos.filter(a => a.nombre_alumno.toLowerCase().includes(alumnoSearchTerm.toLowerCase())).length === 0 && (
                          <div className="text-center p-4 text-xs text-muted opacity-50">No hay resultados</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Elige una opción</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedVotacion.opciones.map((opt, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedOptionIndex(idx)}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                          selectedOptionIndex === idx 
                            ? 'bg-accent/20 border-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                            : 'bg-white/5 border-white/5 hover:border-white/20 text-muted'
                        }`}
                      >
                        <span className={`font-bold transition-colors ${selectedOptionIndex === idx ? 'text-accent' : ''}`}>{opt.nombre}</span>
                        {selectedOptionIndex === idx && <CheckCircle2 size={18} className="text-accent" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5">
                <button 
                  disabled={!selectedAlumnoId || selectedOptionIndex === null || isSaving}
                  onClick={() => handleVote(selectedOptionIndex)}
                  className="w-full btn-primary !h-16 text-lg shadow-[0_10px_20px_-10px_rgba(139,92,246,0.5)]"
                >
                  {isSaving ? (
                    <Loader2 size={24} className="animate-spin m-auto" />
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={22} />
                      CONFIRMAR MI VOTO
                    </div>
                  )}
                </button>
                {!selectedAlumnoId || selectedOptionIndex === null ? (
                  <p className="text-center text-[10px] text-muted mt-3 uppercase tracking-widest opacity-60">
                    Debes seleccionar un alumno y una opción para continuar
                  </p>
                ) : (
                  <p className="text-center text-[10px] text-accent mt-3 uppercase tracking-widest font-bold animate-pulse">
                    ¡Listo para registrar! Pulsa el botón de arriba
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Historial de Votos */}
      {isHistoryModalOpen && selectedVotacion && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setIsHistoryModalOpen(false)}>
          <div className="modal-content !max-w-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">Detalle de Votos</h2>
                <p className="text-sm text-muted">{selectedVotacion.nombre}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-slate-500">
                <X size={28} />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <Loader2 size={32} className="text-accent animate-spin" />
                <p className="text-sm text-muted">Cargando registros...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-muted">
                      <tr>
                        <th className="px-6 py-4">Alumno</th>
                        <th className="px-6 py-4 text-right">Voto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {votosDetalle.map((v, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                                {v.alumnos?.nombre_alumno?.charAt(0)}
                              </div>
                              <span className="font-medium">{v.alumnos?.nombre_alumno}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg border border-accent/20">
                              {selectedVotacion.opciones[v.opcion_index]?.nombre}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {votosDetalle.length === 0 && (
                    <div className="p-10 text-center text-muted opacity-50 italic">
                      No hay registros de votos individuales.
                    </div>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={() => setIsHistoryModalOpen(false)}
              className="w-full mt-6 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-bold transition-all"
            >
              Cerrar Detalle
            </button>
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
        input, select {
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          width: 100%;
          outline: none;
          transition: all 0.3s ease;
        }
        input:focus, select:focus {
          border-color: var(--accent);
          background: rgba(139, 92, 246, 0.05);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
        }
      `}</style>
    </>
  )
}

function VotacionCard({ votacion, onVote, onViewHistory, onClose, onDelete, isAdmin }) {
  const totalVotos = votacion.opciones.reduce((acc, opt) => acc + opt.votos, 0)
  const isCerrada = votacion.estado === 'cerrada'
  
  return (
    <div 
      onClick={onViewHistory}
      className={`card flex flex-col gap-5 relative overflow-hidden transition-all cursor-pointer ${
        isCerrada ? 'opacity-80 grayscale-[0.3] hover:grayscale-0 hover:border-accent/30' : 'hover:scale-[1.01] hover:border-emerald-500/30'
      }`}
    >
      {/* Badge de estado */}
      <div className="flex justify-between items-start">
        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
          isCerrada ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          {isCerrada ? 'Finalizada' : 'Vigente'}
        </div>
        
        <div className="flex gap-1">
          {!isCerrada && isAdmin && (
            <button 
              onClick={onClose}
              title="Cerrar votación"
              className="p-2 text-muted hover:text-highlight hover:bg-highlight/10 rounded-xl transition-all"
            >
              <CheckCircle2 size={18} />
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={onDelete}
              title="Eliminar"
              className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-main leading-tight mb-1">{votacion.nombre}</h3>
        <p className="text-xs text-muted flex items-center gap-1.5">
          <BarChart2 size={14} />
          {totalVotos} votos de {votacion.total_alumnos_tope} posibles
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {votacion.opciones.map((opt, idx) => {
          const porcentaje = totalVotos > 0 ? Math.round((opt.votos / totalVotos) * 100) : 0
          return (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-main/90">{opt.nombre}</span>
                <span className="font-bold text-accent">{opt.votos} ({porcentaje}%)</span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-highlight transition-all duration-1000 ease-out"
                  style={{ width: `${porcentaje}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      {!isCerrada && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onVote();
          }}
          className="w-full mt-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white py-3 rounded-2xl font-bold transition-all border border-emerald-500/20 flex items-center justify-center gap-2 group"
        >
          <TrendingUp size={18} className="group-hover:scale-110 transition-transform" />
          INGRESAR VOTO
        </button>
      )}
    </div>
  )
}
