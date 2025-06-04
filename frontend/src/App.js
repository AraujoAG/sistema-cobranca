// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import NovoCliente from './pages/NovoCliente';
import EditarCliente from './pages/EditarCliente';
import Mensagens from './pages/Mensagens';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import './App.css'; // Estilos globais da aplicação

function App() {
  return (
    <Router>
      <div className="app-container"> {/* Este terá display:flex; flex-direction:column; */}
        <div className="main-wrapper"> {/* Este terá display:flex; flex-grow:1; */}
          <Sidebar />
          <main className="content"> {/* Este terá flex:1; e margin-left para a sidebar fixa */}
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/novo-cliente" element={<NovoCliente />} />
              <Route path="/editar-cliente/:id" element={<EditarCliente />} />
              <Route path="/mensagens" element={<Mensagens />} />
              {/* <Route path="*" element={<div>Página Não Encontrada</div>} /> */}
            </Routes>
          </main>
        </div>
        <Footer /> {/* Este será o último item no .app-container (flex-direction:column) */}
      </div>
    </Router>
  );
}

export default App;
