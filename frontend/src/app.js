// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import NovoCliente from './pages/NovoCliente';
import Mensagens from './pages/Mensagens';
import Sidebar from './components/Sidebar';
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
            <Route path="/mensagens" element={<Mensagens />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
