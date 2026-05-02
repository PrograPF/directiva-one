import { useState, useEffect } from 'react'
import { Plus, X, User, Phone, Mail, GraduationCap, Loader2, Search, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ApoderadosModule() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [editId, setEditId] = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre_alumno: '',
    apoderado_1: '',
    apoderado_2: '',
    email: '',
    telefono_1: '',
    telefono_2: ''
  })

  // Cargar alumnos al iniciar
  useEffect(() => {
    fetchAlumnos()
  }, [])

  async function fetchAlumnos() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .order('nombre_alumno', { ascending: true })
    
    if (error) console.error('Error cargando alumnos:', error)
    else setAlumnos(data || [])
    setIsLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    if (editId) {
      // ACTUALIZAR EXISTENTE
      const { data, error } = await supabase
        .from('alumnos')
        .update(formData)
        .eq('id', editId)
        .select()

      if (error) {
        alert('Error al actualizar: ' + error.message)
      } else {
        setAlumnos(alumnos.map(a => a.id === editId ? data[0] : a))
        closeModal()
      }
    } else {
      // CREAR NUEVO
      const { data, error } = await supabase
        .from('alumnos')
        .insert([formData])
        .select()

      if (error) {
        alert('Error al guardar: ' + error.message)
      } else {
        setAlumnos([...alumnos, data[0]])
        closeModal()
      }
    }
    setIsSaving(false)
  }

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar la ficha de ${nombre}?`)) {
      const { error } = await supabase
        .from('alumnos')
        .delete()
        .eq('id', id)
      
      if (error) {
        alert('Error al eliminar: ' + error.message)
      } else {
        setAlumnos(alumnos.filter(a => a.id !== id))
      }
    }
  }

  const openEditModal = (alumno) => {
    setEditId(alumno.id)
    setFormData({
      nombre_alumno: alumno.nombre_alumno,
      apoderado_1: alumno.apoderado_1,
      apoderado_2: alumno.apoderado_2 || '',
      email: alumno.email || '',
      telefono_1: alumno.telefono_1 || '',
      telefono_2: alumno.telefono_2 || ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditId(null)
    setActiveMenu(null)
    setFormData({
      nombre_alumno: '',
      apoderado_1: '',
      apoderado_2: '',
      email: '',
      telefono_1: '',
      telefono_2: ''
    })
  }

  // Filtrar alumnos basado en la búsqueda
  const alumnosFiltrados = alumnos.filter(alumno => 
    alumno.nombre_alumno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.apoderado_1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alumno.apoderado_2 && alumno.apoderado_2.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (alumno.email && alumno.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alumnos</h2>
          <p className="text-muted text-sm opacity-80">{alumnos.length} fichas registradas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ width: '56px', height: '56px', borderRadius: '18px' }}
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={20} />
        <input 
          type="text" 
          placeholder="Buscar alumno o apoderado..."
          className="w-full pl-14 pr-6 py-4 bg-card-bg border border-card-border rounded-[22px] text-main outline-none focus:border-accent transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ backgroundColor: 'var(--card-bg)' }}
        />
      </div>

      {/* Grid de Alumnos (Vista previa) */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="card p-10 text-center flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-blue-500 animate-spin" />
            <p className="text-muted">Cargando alumnos...</p>
          </div>
        ) : alumnosFiltrados.length === 0 ? (
          <div className="card p-10 text-center flex flex-col items-center gap-4 border-dashed border-2">
            <GraduationCap size={48} className="text-slate-600" />
            <p className="text-muted">
              {searchTerm ? 'No se encontraron resultados.' : 'No hay alumnos ingresados aún.'}
            </p>
          </div>
        ) : (
          alumnosFiltrados.map(alumno => (
            <div key={alumno.id} className="card flex flex-col gap-4 relative hover:scale-[1.01] transition-transform">
              {/* Botón de Opciones Absoluto */}
              <div className="absolute top-5 right-4 z-10">
                <button 
                  onClick={() => setActiveMenu(activeMenu === alumno.id ? null : alumno.id)}
                  className="p-2 text-muted hover:bg-white/10 hover:text-main rounded-full transition-all"
                >
                  <MoreVertical size={20} />
                </button>

                {activeMenu === alumno.id && (
                  <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-card-border rounded-2xl shadow-2xl z-20 flex flex-col min-w-[160px] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <button 
                      onClick={() => { openEditModal(alumno); setActiveMenu(null); }}
                      className="flex items-center gap-3 p-4 hover:bg-accent/20 text-main border-none rounded-none text-sm font-bold w-full justify-start transition-colors"
                    >
                      <Pencil size={18} className="text-accent" /> Editar
                    </button>
                    <button 
                      onClick={() => { handleDelete(alumno.id, alumno.nombre_alumno); setActiveMenu(null); }}
                      className="flex items-center gap-3 p-4 hover:bg-red-500/20 text-main border-none rounded-none text-sm font-bold w-full justify-start transition-colors"
                    >
                      <Trash2 size={18} className="text-red-500" /> Eliminar
                    </button>
                  </div>
                )}
              </div>

              {/* Cabecera de la ficha */}
              <div className="flex items-start justify-between w-full border-b border-white/5 pb-4 pr-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shrink-0 border border-accent/20">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl m-0 leading-tight text-main">{alumno.nombre_alumno}</h3>
                  </div>
                </div>
              </div>
              <div className="text-sm flex flex-col gap-3 mt-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-accent">
                    <User size={16} /> 
                  </div>
                  <span className="text-main font-medium">{alumno.apoderado_1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-highlight">
                    <Mail size={16} /> 
                  </div>
                  <span className="text-main font-medium">{alumno.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-accent">
                    <Phone size={16} /> 
                  </div>
                  <span className="text-main font-medium">{alumno.telefono_1}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Ficha de Alumno (Optimizado para móvil) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && closeModal()}>
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editId ? 'Editar Alumno' : 'Nuevo Alumno'}</h2>
              <button onClick={closeModal} className="p-2 text-slate-500">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Nombre del Alumno</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Juan Pérez Soto"
                  value={formData.nombre_alumno}
                  onChange={(e) => setFormData({...formData, nombre_alumno: e.target.value})}
                  className="rounded-[18px]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Apoderado 1</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nombre completo"
                    value={formData.apoderado_1}
                    onChange={(e) => setFormData({...formData, apoderado_1: e.target.value})}
                    className="rounded-[18px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Apoderado 2 (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Nombre completo"
                    value={formData.apoderado_2}
                    onChange={(e) => setFormData({...formData, apoderado_2: e.target.value})}
                    className="rounded-[18px]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="rounded-[18px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Teléfono 1</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+56 9 ..."
                    value={formData.telefono_1}
                    onChange={(e) => setFormData({...formData, telefono_1: e.target.value})}
                    className="rounded-[18px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] ml-1">Teléfono 2</label>
                  <input 
                    type="tel" 
                    placeholder="+56 9 ..."
                    value={formData.telefono_2}
                    onChange={(e) => setFormData({...formData, telefono_2: e.target.value})}
                    className="rounded-[18px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-main py-4 rounded-2xl font-bold transition-all disabled:opacity-50 border border-card-border"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] btn-primary disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={24} className="animate-spin m-auto" /> : (editId ? 'Guardar Cambios' : 'Registrar Alumno')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
