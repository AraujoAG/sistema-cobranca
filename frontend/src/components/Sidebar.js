// frontend/src/components/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3>
          <img 
            src="https://altalinhamoveis.com.br/new/wp-content/uploads/2023/11/logotipo-alta-linha-moveis-planejados-e-decoracoes-sorocaba-2.png"
            alt="Alta Linha Móveis"
            className="sidebar-logo"
          />
          {!collapsed && <span className="sidebar-title">Sistema de Cobranças</span>}
        </h3>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <i className={`fas ${collapsed ? 'fa-angle-right' : 'fa-angle-left'}`}></i>
        </button>
      </div>
      
      <div className="sidebar-menu">
        <ul>
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/">
              <i className="fas fa-chart-line"></i>
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          <li className={location.pathname === '/clientes' ? 'active' : ''}>
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
      </div>
      
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