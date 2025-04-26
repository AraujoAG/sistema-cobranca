// frontend/src/components/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();
  
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <img 
          src="https://altalinhamoveis.com.br/new/wp-content/uploads/2023/11/logotipo-alta-linha-moveis-planejados-e-decoracoes-sorocaba-2.png" 
          alt="Alta Linha Móveis" 
          className="sidebar-logo"
        />
        <h2>Sistema de Cobrança</h2>
      </div>
      <ul className="nav-links">
        <li className={location.pathname === '/' ? 'active' : ''}>
          <Link to="/">
            <i className="fas fa-chart-line"></i> Dashboard
          </Link>
        </li>
        <li className={location.pathname === '/clientes' ? 'active' : ''}>
          <Link to="/clientes">
            <i className="fas fa-users"></i> Clientes
          </Link>
        </li>
        <li className={location.pathname === '/novo-cliente' ? 'active' : ''}>
          <Link to="/novo-cliente">
            <i className="fas fa-user-plus"></i> Novo Cliente
          </Link>
        </li>
        <li className={location.pathname === '/mensagens' ? 'active' : ''}>
          <Link to="/mensagens">
            <i className="fas fa-paper-plane"></i> Disparar Mensagens
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;