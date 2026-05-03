import { useState, useEffect } from 'react'
import { LayoutDashboard, Wallet, Calendar, Users, Settings, PlusCircle, Sun, Moon, CheckCircle2 } from 'lucide-react'
import ApoderadosModule from './modules/Apoderados/ApoderadosModule'
import CalendarModule from './modules/Calendar/CalendarModule'
import VotacionesModule from './modules/Votaciones/VotacionesModule'

function App() {
  const [activeTab, setActiveTab] = useState('alumnos');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Efecto para aplicar el tema al body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar / Desktop Nav */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo-text">DirectivaOne</h1>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'alumnos', label: 'Alumnos', icon: Users },
            { id: 'caja', label: 'Caja y Pagos', icon: Wallet },
            { id: 'eventos', label: 'Eventos', icon: Calendar },
            { id: 'votaciones', label: 'Votaciones', icon: CheckCircle2 },
            { id: 'settings', label: 'Configuración', icon: Settings },
          ].map((item) => {
            const Icon = item.icon || PlusCircle;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="mobile-logo md-hidden">
            <h1 className="logo-text">DirectivaOne</h1>
          </div>
          <div className="header-title mobile-hidden">
            <h2 className="capitalize">{activeTab}</h2>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="theme-toggle"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="content-area container">
          {activeTab === 'alumnos' ? (
            <ApoderadosModule />
          ) : activeTab === 'eventos' ? (
            <CalendarModule />
          ) : activeTab === 'votaciones' ? (
            <VotacionesModule />
          ) : (
            <div className="placeholder-module card">
              <div className="placeholder-icon">
                <PlusCircle size={48} />
              </div>
              <div>
                <h3>Módulo en construcción</h3>
                <p>Pronto podrás gestionar {activeTab} aquí.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="bottom-nav md-hidden">
        {[
          { id: 'alumnos', icon: Users, label: 'Alumnos' },
          { id: 'caja', icon: Wallet, label: 'Caja' },
          { id: 'eventos', icon: Calendar, label: 'Eventos' },
          { id: 'votaciones', icon: CheckCircle2, label: 'Votos' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-tab ${activeTab === item.id ? 'active' : ''}`}
          >
            <item.icon size={22} fill={activeTab === item.id ? 'currentColor' : 'none'} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Estilos específicos de componentes de layout que no están en index.css */}
      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100%;
          width: 280px;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
          z-index: 50;
        }

        .sidebar-header { padding: 32px 24px; }
        
        .logo-text {
          font-size: 1.6rem;
          font-weight: 800;
          background: linear-gradient(to right, var(--accent), var(--highlight));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }

        .sidebar-nav { padding: 0 16px; flex: 1; }
        
        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 16px;
          color: var(--text-muted);
          transition: all 0.3s ease;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .nav-item:hover {
          background: rgba(139, 92, 246, 0.1);
          color: var(--accent);
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3);
        }

        .main-content {
          margin-left: 280px;
          min-height: 100vh;
        }

        .main-header {
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--nav-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--card-border);
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .theme-toggle {
          padding: 10px;
          border-radius: 14px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: #fbbf24;
          box-shadow: var(--shadow-sm);
        }

        .content-area { padding-top: 32px; padding-bottom: 100px; }

        .placeholder-module {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }

        .placeholder-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 24px;
          color: var(--accent);
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main-content { margin-left: 0; }
          .md-hidden { display: flex; }
          .mobile-hidden { display: none; }
          .main-header { padding: 16px 20px; }
        }

        @media (min-width: 769px) {
          .md-hidden { display: none !important; }
        }

        .capitalize { text-transform: capitalize; }
      `}</style>
    </div>
  )
}

export default App
