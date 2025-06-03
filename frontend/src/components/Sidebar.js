// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from 'react'; // Adicionado useEffect
import { Link, useLocation } from 'react-router-dom';
// Se você tiver um '../styles/Sidebar.css', ele pode complementar os estilos globais.
// Os estilos principais para .sidebar-header e .sidebar-logo estão no App.css que forneci acima.

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); // Inicia não colapsado

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Efeito para adicionar/remover classe no 'content' para ajustar margem
  // Isso assume que o elemento 'content' tem um ID ou classe fácil de selecionar,
  // ou que você passe uma referência ou callback do App.js
  useEffect(() => {
    const contentElement = document.querySelector('.content'); // Usando a classe .content do App.css
    if (contentElement) {
      if (collapsed) {
        contentElement.classList.add('sidebar-collapsed');
        document.documentElement.style.setProperty('--current-sidebar-width', 'var(--sidebar-width-collapsed)');

      } else {
        contentElement.classList.remove('sidebar-collapsed');
        document.documentElement.style.setProperty('--current-sidebar-width', 'var(--sidebar-width)');
      }
    }
    // Ajuste também a posição do footer se ele for fixo e depender da margem da sidebar
    const footerElement = document.querySelector('.footer');
    if (footerElement && getComputedStyle(footerElement).position === 'fixed') {
        footerElement.style.left = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)';
    }


  }, [collapsed]);


  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}>
      <div className="sidebar-header">
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
            style={{ // Estilo básico, pode ser melhorado com CSS
                position: 'absolute',
                top: collapsed ? '25px' : '15px', // Ajustar posição vertical
                right: collapsed ? '-15px' : '10px', // Puxar para fora quando colapsado
                transform: collapsed ? 'translateY(-50%)' : 'none',
                zIndex: 1010, // Acima da sidebar
                background: 'var(--secondary-color)',
                color: 'white',
                border: '2px solid var(--primary-color)', // Borda para destacar
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
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
          {/* Removido link duplicado de NovoCliente se Clientes já cobre isso. Se não, descomente:
          <li className={location.pathname === '/novo-cliente' ? 'active' : ''}>
            <Link to="/novo-cliente">
              <i className="fas fa-user-plus"></i>
              {!collapsed && <span>Novo Cliente</span>}
            </Link>
          </li>
          */}
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
          <i className="fas fa-circle status-indicator online" style={{color: '#4CAF50'}}></i> {/* Cor inline para garantir */}
          {!collapsed && <span>Sistema Online</span>}
        </p>
      </div>
    </div>
  );
}

export default Sidebar;