import { useState, useEffect } from 'react'
import { LayoutDashboard, Wallet, Calendar, Users, Settings, PlusCircle, Sun, Moon } from 'lucide-react'
import ApoderadosModule from './modules/Apoderados/ApoderadosModule'

function App() {
  const [activeTab, setActiveTab] = useState('alumnos');
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* Sidebar / Desktop Nav */}
      <aside className={`fixed left-0 top-0 h-full w-64 ${isDarkMode ? 'bg-[#1e293b]' : 'bg-white'} hidden md:flex flex-col border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} z-20`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            DirectivaOne
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: 'alumnos', label: 'Alumnos', icon: Users },
            { id: 'caja', label: 'Caja y Pagos', icon: Wallet },
            { id: 'eventos', label: 'Eventos', icon: Calendar },
            { id: 'settings', label: 'Configuración', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : `text-gray-400 hover:bg-slate-700/50 hover:text-white`
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pb-24 md:pb-8">
        {/* Header */}
        <header className={`sticky top-0 ${isDarkMode ? 'bg-[#0f172a]/80' : 'bg-gray-50/80'} backdrop-blur-md z-10 px-6 py-4 flex justify-between items-center`}>
          <div className="md:hidden">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              DirectivaOne
            </h1>
          </div>
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-gray-400 capitalize">{activeTab}</h2>
          </div>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600'} shadow-sm transition-all active:scale-95`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="px-6 py-4">
          {activeTab === 'alumnos' ? (
            <ApoderadosModule />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className={`p-6 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-xl`}>
                <PlusCircle size={48} className="text-blue-500 opacity-20" />
              </div>
              <div>
                <h3 className="text-xl font-bold italic opacity-40">Módulo en construcción</h3>
                <p className="text-gray-500">Pronto podrás gestionar {activeTab} aquí.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 md:hidden ${isDarkMode ? 'bg-[#1e293b]/95' : 'bg-white/95'} backdrop-blur-lg border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'} px-6 py-3 flex justify-between items-center z-20`}>
        {[
          { id: 'alumnos', icon: Users, label: 'Alumnos' },
          { id: 'caja', icon: Wallet, label: 'Caja' },
          { id: 'eventos', icon: Calendar, label: 'Eventos' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center space-y-1 transition-colors ${
              activeTab === item.id ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <item.icon size={22} fill={activeTab === item.id ? 'currentColor' : 'none'} className={activeTab === item.id ? 'opacity-20' : ''} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
