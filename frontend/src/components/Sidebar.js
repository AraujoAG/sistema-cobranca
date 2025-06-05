// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // ... (seu código existente do Sidebar: toggleSidebar, useEffect) ...
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    const contentElement = document.querySelector('main.content');
    if (contentElement) {
      if (collapsed) {
        contentElement.classList.add('sidebar-collapsed');
      } else {
        contentElement.classList.remove('sidebar-collapsed');
      }
    }
    const toggleButton = document.querySelector('.toggle-btn');
    if (toggleButton) {
        toggleButton.style.right = collapsed ? '-15px' : '10px';
    }
  }, [collapsed]);

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {/* ... seu header da sidebar ... */}
        <img
          src="https://altalinhamoveis.com.br/new/wp-content/uploads/2023/11/logotipo-alta-linha-moveis-planejados-e-decoracoes-sorocaba-2.png"
          alt="Alta Linha Móveis Logo"
          className="sidebar-logo"
        />
        {!collapsed && <span className="sidebar-title-text">Sistema de Cobranças</span>}
        <button
            className="toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
        >
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
          <li className={location.pathname === '/clientes' || location.pathname.startsWith('/editar-cliente') || location.pathname === '/novo-cliente' ? 'active' : ''}>
            <Link to="/clientes">
              <i className="fas fa-users"></i>
              {!collapsed && <span>Clientes</span>}
            </Link>
          </li>
          <li className={location.pathname === '/mensagens' ? 'active' : ''}>
            <Link to="/mensagens">
              <i className="fas fa-paper-plane"></i>
              {!collapsed && <span>Enviar Mensagens</span>}
            </Link>
          </li>

          {/* V-- ADICIONE ESTE NOVO ITEM DE MENU --V */}
          <li className={location.pathname === '/whatsapp-connect' ? 'active' : ''}>
            <Link to="/whatsapp-connect">
              <i className="fab fa-whatsapp"></i> {/* Ícone do FontAwesome para WhatsApp */}
              {!collapsed && <span>Conectar WhatsApp</span>}
            </Link>
          </li>
          {/* ^-- FIM DO NOVO ITEM DE MENU --^ */}

        </ul>
      </nav>
      <div className="sidebar-footer">
        <p>
          <i className="fas fa-circle status-indicator online"></i>
          {!collapsed && <span>Sistema Online</span>}
        </p>
      </div>
    </div>
  );
}
export default Sidebar;