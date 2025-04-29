// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import NovoCliente from './pages/NovoCliente';
import EditarCliente from './pages/EditarCliente'; // Importando o componente de edição
import Mensagens from './pages/Mensagens';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/novo-cliente" element={<NovoCliente />} />
            <Route path="/editar-cliente/:id" element={<EditarCliente />} /> {/* Nova rota */}
            <Route path="/mensagens" element={<Mensagens />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;