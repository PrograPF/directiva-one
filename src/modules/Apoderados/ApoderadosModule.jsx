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
          <h2 className="text-3xl font-bold">Alumnos</h2>
          <p className="text-muted text-sm">38 fichas registradas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ width: 'auto', padding: '0.8rem' }}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar alumno o apoderado..."
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
            <div key={alumno.id} className="card flex flex-col gap-3 relative">
              {/* Cabecera de la ficha */}
              <div className="flex items-start justify-between w-full border-b border-slate-500/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <h3 className="font-bold text-lg m-0 leading-tight">{alumno.nombre_alumno}</h3>
                </div>
                
                <div className="relative shrink-0">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === alumno.id ? null : alumno.id)}
                    className="p-1.5 text-slate-100 hover:bg-white/10 rounded-full transition-all"
                  >
                    <MoreVertical size={22} />
                  </button>

                  {activeMenu === alumno.id && (
                    <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-20 flex flex-col min-w-[150px] overflow-hidden animate-in fade-in zoom-in duration-200">
                      <button 
                        onClick={() => { openEditModal(alumno); setActiveMenu(null); }}
                        className="flex items-center gap-3 p-4 hover:bg-blue-500/20 text-slate-100 hover:text-blue-400 border-none rounded-none text-sm font-bold w-full justify-start"
                      >
                        <Pencil size={18} className="text-blue-500" /> Editar
                      </button>
                      <button 
                        onClick={() => { handleDelete(alumno.id, alumno.nombre_alumno); setActiveMenu(null); }}
                        className="flex items-center gap-3 p-4 hover:bg-red-500/20 text-slate-100 hover:text-red-400 border-none rounded-none text-sm font-bold w-full justify-start"
                      >
                        <Trash2 size={18} className="text-red-500" /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <User size={14} className="text-blue-500" /> 
                  <span className="text-slate-200">{alumno.apoderado_1}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail size={14} className="text-blue-500" /> 
                  <span className="text-slate-200">{alumno.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone size={14} className="text-blue-500" /> 
                  <span className="text-slate-200">{alumno.telefono_1}</span>
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
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Alumno</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Juan Pérez Soto"
                  value={formData.nombre_alumno}
                  onChange={(e) => setFormData({...formData, nombre_alumno: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Apoderado 1</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nombre completo"
                    value={formData.apoderado_1}
                    onChange={(e) => setFormData({...formData, apoderado_1: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Apoderado 2 (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Nombre completo"
                    value={formData.apoderado_2}
                    onChange={(e) => setFormData({...formData, apoderado_2: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono 1</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+56 9 ..."
                    value={formData.telefono_1}
                    onChange={(e) => setFormData({...formData, telefono_1: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono 2</label>
                  <input 
                    type="tel" 
                    placeholder="+56 9 ..."
                    value={formData.telefono_2}
                    onChange={(e) => setFormData({...formData, telefono_2: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
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
