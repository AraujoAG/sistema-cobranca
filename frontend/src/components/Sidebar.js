// frontend/src/components/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css'; // Certifique-se que este CSS existe e está correto

// ATENÇÃO: Para os ícones (fas fa-chart-line, etc.) funcionarem,
// você precisa ter o Font Awesome configurado no seu projeto.
// Isso pode ser via CDN no public/index.html ou instalando pacotes como @fortawesome/react-fontawesome.

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); // Inicia não colapsado

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    // Ajusta a margem do conteúdo principal se necessário (pode ser feito via CSS também)
    // document.documentElement.style.setProperty('--current-sidebar-width', collapsed ? 'var(--sidebar-width)' : 'var(--sidebar-width-collapsed)');
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3>
          <img
            src="https://altalinhamoveis.com.br/new/wp-content/uploads/2023/11/logotipo-alta-linha-moveis-planejados-e-decoracoes-sorocaba-2.png"
            alt="Alta Linha Móveis Logo"
            className="sidebar-logo"
          />
          {!collapsed && <span className="sidebar-title">Cobranças</span>}
        </h3>
        <button className="toggle-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <i className={`fas ${collapsed ? 'fa-angle-double-right' : 'fa-angle-double-left'}`}></i>
        </button>
      </div>

      <nav className="sidebar-menu">
        <ul>
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/">
              <i className="fas fa-chart-line"></i>
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          <li className={location.pathname === '/clientes' || location.pathname.startsWith('/editar-cliente') ? 'active' : ''}>
            <Link to="/clientes">
              <i className="fas fa-users"></i>
              {!collapsed && <span>Clientes</span>}
            </Link>
          </li>
          <li className={location.pathname === '/novo-cliente' ? 'active' : ''}>
            <Link to="/novo-cliente">
              <i className="fas fa-user-plus"></i>
              {!collapsed && <span>Novo Cliente</span>}
            </Link>
          </li>
          <li className={location.pathname === '/mensagens' ? 'active' : ''}>
            <Link to="/mensagens">
              <i className="fas fa-paper-plane"></i>
              {!collapsed && <span>Enviar Mensagens</span>}
            </Link>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <p>
          <i className="fas fa-circle status-indicator online"></i>
          {!collapsed && <span>Sistema Online</span>}
        </p>
        {/* Você pode adicionar um status real aqui se tiver um endpoint de health check */}
      </div>
    </div>
  );
}

export default Sidebar;