import { useState, useEffect } from 'react'
import { LayoutDashboard, Wallet, Calendar, Users, Settings, PlusCircle, Sun, Moon } from 'lucide-react'
import ApoderadosModule from './modules/Apoderados/ApoderadosModule'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.className = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">D1</div>
          <h1 className="text-lg font-bold tracking-tight m-0">Directiva<span className="text-blue-500">One</span></h1>
        </div>
        <div className="flex gap-1">
          <button onClick={toggleTheme} className="p-2 text-slate-400">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="p-2 text-slate-400">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container">
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-3xl font-bold">Resumen</h2>
              <p className="text-muted">4to Medio A - Colegio San Pedro</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <StatCard title="Saldo Disponible" value="$450.000" trend="+12%" color="text-green-500" />
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Cuotas" value="28/35" trend="80%" color="text-blue-500" />
                <StatCard title="Próxima" value="Rifa" trend="15 May" color="text-amber-500" />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold mb-4">Actividad</h3>
              <div className="flex flex-col gap-3">
                <ActivityItem label="Cuota Mayo - Juan P." amount="+$10k" date="Hoy" type="plus" />
                <ActivityItem label="Bingo - Materiales" amount="-$25k" date="Ayer" type="minus" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apoderados' && <ApoderadosModule />}
        
        {activeTab !== 'dashboard' && activeTab !== 'apoderados' && (
          <div className="flex items-center justify-center h-48 card border-dashed border-2">
            <p className="text-muted">Próximamente: {activeTab}</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <NavTab 
          icon={<LayoutDashboard size={24} />} 
          label="Inicio" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <NavTab 
          icon={<Wallet size={24} />} 
          label="Caja" 
          active={activeTab === 'caja'} 
          onClick={() => setActiveTab('caja')} 
        />
        <NavTab 
          icon={<Calendar size={24} />} 
          label="Eventos" 
          active={activeTab === 'eventos'} 
          onClick={() => setActiveTab('eventos')} 
        />
        <NavTab 
          icon={<Users size={24} />} 
          label="Alumnos" 
          active={activeTab === 'apoderados'} 
          onClick={() => setActiveTab('apoderados')} 
        />
      </nav>
    </div>
  )
}

function NavTab({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`nav-tab ${active ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function StatCard({ title, value, trend, color }) {
  return (
    <div className="card">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{title}</p>
      <div className="flex justify-between items-end">
        <h3 className="text-2xl font-bold m-0">{value}</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 ${color}`}>
          {trend}
        </span>
      </div>
    </div>
  )
}

function ActivityItem({ label, amount, date, type }) {
  return (
    <div className="flex justify-between items-center p-2">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-1.5 rounded-full ${type === 'plus' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <div>
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-[10px] text-slate-500">{date}</p>
        </div>
      </div>
      <span className={`font-bold ${type === 'plus' ? 'text-green-500' : 'text-red-500'}`}>
        {amount}
      </span>
    </div>
  )
}

export default App
