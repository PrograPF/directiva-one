import { useState, useEffect } from 'react'
import { LayoutDashboard, Wallet, Calendar, Users, Settings, PlusCircle, Sun, Moon } from 'lucide-react'
import ApoderadosModule from './modules/Apoderados/ApoderadosModule'

function App() {
  const [activeTab, setActiveTab] = useState('alumnos');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Efecto para aplicar el tema al body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
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
            { id: 'settings', label: 'Configuración', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
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

        <div className="content-area">
          {activeTab === 'alumnos' ? (
            <ApoderadosModule />
          ) : (
            <div className="placeholder-module">
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
      <nav className="mobile-nav">
        {[
          { id: 'alumnos', icon: Users, label: 'Alumnos' },
          { id: 'caja', icon: Wallet, label: 'Caja' },
          { id: 'eventos', icon: Calendar, label: 'Eventos' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <item.icon size={22} fill={activeTab === item.id ? 'currentColor' : 'none'} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-dark: #0f172a;
          --sidebar-dark: #1e293b;
          --accent-blue: #3b82f6;
          --text-gray: #94a3b8;
        }

        .app-container {
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(to right, #60a5fa, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100%;
          width: 256px;
          background: var(--sidebar-dark);
          border-right: 1px solid #334155;
          display: flex;
          flex-direction: column;
          z-index: 20;
        }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main-content { margin-left: 0 !important; }
        }

        .sidebar-header { padding: 24px; }
        .sidebar-nav { padding: 0 16px; margin-top: 16px; flex: 1; }
        
        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-gray);
          transition: all 0.2s;
          margin-bottom: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(51, 65, 85, 0.5);
          color: white;
        }

        .nav-item.active {
          background: var(--accent-blue);
          color: white;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
        }

        /* Main Content */
        .main-content {
          margin-left: 256px;
          padding-bottom: 80px;
        }

        .main-header {
          position: sticky;
          top: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          z-index: 10;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .theme-toggle {
          padding: 8px;
          border-radius: 12px;
          background: #1e293b;
          color: #fbbf24;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .theme-toggle:active { transform: scale(0.9); }

        /* Placeholder */
        .placeholder-module {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          text-align: center;
          color: var(--text-gray);
        }

        .placeholder-icon {
          padding: 24px;
          border-radius: 100%;
          background: #1e293b;
          margin-bottom: 16px;
          color: var(--accent-blue);
          opacity: 0.3;
        }

        /* Mobile Nav */
        .mobile-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(30, 41, 59, 0.95);
          backdrop-filter: blur(12px);
          border-top: 1px solid #334155;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          z-index: 20;
        }

        @media (min-width: 769px) {
          .mobile-nav { display: none; }
        }

        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--text-gray);
          background: transparent;
          border: none;
        }

        .mobile-nav-item.active { color: var(--accent-blue); }
        .mobile-nav-item span { font-size: 10px; font-weight: 500; }

        .capitalize { text-transform: capitalize; }
      `}} />
    </div>
  )
}

export default App
