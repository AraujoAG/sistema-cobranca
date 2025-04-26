# Estrutura do projeto
mkdir -p sistema-cobranca/{frontend,backend}
cd sistema-cobranca

# Configurar o backend
cd backend
npm init -y
npm install express cors xlsx morgan body-parser nodemon

# Criar arquivo principal do servidor
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Definir caminho para o arquivo Excel
const BOLETOS_FILE = path.join(__dirname, 'data', 'boletos.xlsx');

// Garantir que o diretório data existe
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Criar arquivo Excel inicial se não existir
if (!fs.existsSync(BOLETOS_FILE)) {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([
    { nome: 'Cliente Exemplo', telefone: '11999999999', vencimento: '2025-05-10', valor: 299.99, status: 'Pendente' }
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'Boletos');
  xlsx.writeFile(wb, BOLETOS_FILE);
}

// Funções auxiliares
function lerBoletos() {
  try {
    const workbook = xlsx.readFile(BOLETOS_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error('Erro ao ler arquivo Excel:', error);
    return [];
  }
}

function salvarBoletos(boletos) {
  try {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(boletos);
    xlsx.utils.book_append_sheet(wb, ws, 'Boletos');
    xlsx.writeFile(wb, BOLETOS_FILE);
    return true;
  } catch (error) {
    console.error('Erro ao salvar arquivo Excel:', error);
    return false;
  }
}

// Rotas
app.get('/api/boletos', (req, res) => {
  const boletos = lerBoletos();
  res.json(boletos);
});

app.post('/api/boletos', (req, res) => {
  const novoBoleto = req.body;
  
  if (!novoBoleto.nome || !novoBoleto.telefone || !novoBoleto.vencimento || !novoBoleto.valor) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }
  
  const boletos = lerBoletos();
  novoBoleto.status = novoBoleto.status || 'Pendente';
  boletos.push(novoBoleto);
  
  if (salvarBoletos(boletos)) {
    res.status(201).json(novoBoleto);
  } else {
    res.status(500).json({ mensagem: 'Erro ao salvar boleto' });
  }
});

app.put('/api/boletos/:id', (req, res) => {
  const { id } = req.params;
  const dadosAtualizados = req.body;
  
  const boletos = lerBoletos();
  if (id >= boletos.length || id < 0) {
    return res.status(404).json({ mensagem: 'Boleto não encontrado' });
  }
  
  boletos[id] = { ...boletos[id], ...dadosAtualizados };
  
  if (salvarBoletos(boletos)) {
    res.json(boletos[id]);
  } else {
    res.status(500).json({ mensagem: 'Erro ao atualizar boleto' });
  }
});

app.delete('/api/boletos/:id', (req, res) => {
  const { id } = req.params;
  
  const boletos = lerBoletos();
  if (id >= boletos.length || id < 0) {
    return res.status(404).json({ mensagem: 'Boleto não encontrado' });
  }
  
  boletos.splice(id, 1);
  
  if (salvarBoletos(boletos)) {
    res.json({ mensagem: 'Boleto removido com sucesso' });
  } else {
    res.status(500).json({ mensagem: 'Erro ao remover boleto' });
  }
});

app.post('/api/enviar-mensagens', (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ mensagem: 'IDs dos boletos são obrigatórios' });
  }
  
  const boletos = lerBoletos();
  const boletosParaEnvio = [];
  
  ids.forEach(id => {
    if (id >= 0 && id < boletos.length) {
      boletosParaEnvio.push(boletos[id]);
      boletos[id].status = 'Enviado';
    }
  });
  
  if (boletosParaEnvio.length === 0) {
    return res.status(400).json({ mensagem: 'Nenhum boleto válido para envio' });
  }
  
  // Simulação de envio de mensagens
  console.log('Enviando mensagens para:', boletosParaEnvio);
  
  if (salvarBoletos(boletos)) {
    res.json({ 
      mensagem: `${boletosParaEnvio.length} mensagens enviadas com sucesso`,
      boletos: boletosParaEnvio
    });
  } else {
    res.status(500).json({ mensagem: 'Erro ao processar envio de mensagens' });
  }
});

app.get('/api/dashboard', (req, res) => {
  const boletos = lerBoletos();
  
  // Estatísticas simples
  const total = boletos.length;
  const pendentes = boletos.filter(b => b.status === 'Pendente').length;
  const enviados = boletos.filter(b => b.status === 'Enviado').length;
  const pagos = boletos.filter(b => b.status === 'Pago').length;
  
  // Cálculo de valor total
  const valorTotal = boletos.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
  const valorPendente = boletos
    .filter(b => b.status === 'Pendente')
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
  
  res.json({
    total,
    pendentes,
    enviados,
    pagos,
    valorTotal: valorTotal.toFixed(2),
    valorPendente: valorPendente.toFixed(2)
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
EOF

# Criar package.json com scripts
cat > package.json << 'EOF'
{
  "name": "sistema-cobranca-backend",
  "version": "1.0.0",
  "description": "Backend para sistema de cobrança",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "morgan": "^1.10.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Configurar o frontend
cd ../frontend
npx create-react-app .
npm install axios react-router-dom chart.js react-chartjs-2

# Substituir App.js
cat > src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Páginas
import Dashboard from './pages/Dashboard';
import ListaBoletos from './pages/ListaBoletos';
import NovoBoleto from './pages/NovoBoleto';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Sistema de Cobrança</h1>
          <nav>
            <ul>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/boletos">Boletos</Link></li>
              <li><Link to="/novo-boleto">Novo Boleto</Link></li>
            </ul>
          </nav>
        </header>
        
        <main className="App-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/boletos" element={<ListaBoletos />} />
            <Route path="/novo-boleto" element={<NovoBoleto />} />
          </Routes>
        </main>
        
        <footer className="App-footer">
          <p>Sistema de Cobrança © 2025</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
EOF

# Melhorar estilos
cat > src/App.css << 'EOF'
.App {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.App-header {
  background-color: #282c34;
  color: white;
  padding: 1rem;
}

.App-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.App-header nav ul {
  display: flex;
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.App-header nav ul li {
  margin-right: 1.5rem;
}

.App-header nav ul li a {
  color: white;
  text-decoration: none;
  font-weight: 500;
}

.App-header nav ul li a:hover {
  text-decoration: underline;
}

.App-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.App-footer {
  background-color: #f5f5f5;
  padding: 1rem;
  text-align: center;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card h3 {
  margin-top: 0;
  color: #333;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #0066cc;
}

.chart-container {
  height: 300px;
  margin-bottom: 2rem;
}

.boletos-list {
  width: 100%;
  border-collapse: collapse;
}

.boletos-list th, 
.boletos-list td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.boletos-list th {
  background-color: #f5f5f5;
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input, 
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.button-primary {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.button-danger {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.button-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.actions-container {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
EOF

# Criar serviço de API
mkdir -p src/services
cat > src/services/api.js << 'EOF'
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const getBoletos = async () => {
  try {
    const response = await api.get('/boletos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar boletos:', error);
    throw error;
  }
};

export const criarBoleto = async (boleto) => {
  try {
    const response = await api.post('/boletos', boleto);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar boleto:', error);
    throw error;
  }
};

export const atualizarBoleto = async (id, boleto) => {
  try {
    const response = await api.put(`/boletos/${id}`, boleto);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar boleto:', error);
    throw error;
  }
};

export const removerBoleto = async (id) => {
  try {
    const response = await api.delete(`/boletos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao remover boleto:', error);
    throw error;
  }
};

export const enviarMensagens = async (ids) => {
  try {
    const response = await api.post('/enviar-mensagens', { ids });
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagens:', error);
    throw error;
  }
};

export const getDashboardData = async () => {
  try {
    const response = await api.get('/dashboard');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    throw error;
  }
};

export default api;
EOF

# Criar páginas
mkdir -p src/pages
cat > src/pages/Dashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    enviados: 0,
    pagos: 0,
    valorTotal: '0.00',
    valorPendente: '0.00'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = {
    labels: ['Pendentes', 'Enviados', 'Pagos'],
    datasets: [
      {
        data: [stats.pendentes, stats.enviados, stats.pagos],
        backgroundColor: [
          '#FFC107', // Amarelo para pendentes
          '#17A2B8', // Azul para enviados
          '#28A745'  // Verde para pagos
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total de Boletos</h3>
          <div className="stat-value">{stats.total}</div>
        </div>
        
        <div className="stat-card">
          <h3>Boletos Pendentes</h3>
          <div className="stat-value">{stats.pendentes}</div>
        </div>
        
        <div className="stat-card">
          <h3>Mensagens Enviadas</h3>
          <div className="stat-value">{stats.enviados}</div>
        </div>
        
        <div className="stat-card">
          <h3>Boletos Pagos</h3>
          <div className="stat-value">{stats.pagos}</div>
        </div>
        
        <div className="stat-card">
          <h3>Valor Total</h3>
          <div className="stat-value">R$ {stats.valorTotal}</div>
        </div>
        
        <div className="stat-card">
          <h3>Valor Pendente</h3>
          <div className="stat-value">R$ {stats.valorPendente}</div>
        </div>
      </div>
      
      <div className="chart-container">
        <h3>Status dos Boletos</h3>
        <Pie data={chartData} />
      </div>
    </div>
  );
}

export default Dashboard;
EOF

cat > src/pages/ListaBoletos.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { getBoletos, removerBoleto, enviarMensagens } from '../services/api';

function ListaBoletos() {
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [mensagemEnviada, setMensagemEnviada] = useState('');

  const fetchBoletos = async () => {
    try {
      setLoading(true);
      const data = await getBoletos();
      setBoletos(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar boletos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoletos();
  }, []);

  const handleDelete = async (index) => {
    if (window.confirm('Tem certeza que deseja excluir este boleto?')) {
      try {
        await removerBoleto(index);
        await fetchBoletos();
      } catch (err) {
        setError('Erro ao excluir boleto');
      }
    }
  };

  const handleSelectBoleto = (index) => {
    if (selectedIds.includes(index)) {
      setSelectedIds(selectedIds.filter(id => id !== index));
    } else {
      setSelectedIds([...selectedIds, index]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === boletos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(boletos.map((_, index) => index));
    }
  };

  const handleEnviarMensagens = async () => {
    if (selectedIds.length === 0) {
      alert('Selecione pelo menos um boleto para enviar mensagem');
      return;
    }

    try {
      const response = await enviarMensagens(selectedIds);
      setMensagemEnviada(response.mensagem);
      setSelectedIds([]);
      await fetchBoletos();
      
      // Limpar a mensagem após 5 segundos
      setTimeout(() => {
        setMensagemEnviada('');
      }, 5000);
    } catch (err) {
      setError('Erro ao enviar mensagens');
    }
  };

  const formatarData = (dataStr) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR');
    } catch (e) {
      return dataStr;
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <h2>Lista de Boletos</h2>
      
      <div className="actions-container">
        <div>
          <button 
            className="button-primary" 
            onClick={handleEnviarMensagens}
            disabled={selectedIds.length === 0}
          >
            Disparar Mensagens ({selectedIds.length} selecionados)
          </button>
        </div>
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={selectedIds.length === boletos.length && boletos.length > 0}
              onChange={handleSelectAll}
            /> Selecionar Todos
          </label>
        </div>
      </div>
      
      {mensagemEnviada && (
        <div className="success-message">
          {mensagemEnviada}
        </div>
      )}
      
      {boletos.length === 0 ? (
        <p>Nenhum boleto cadastrado.</p>
      ) : (
        <table className="boletos-list">
          <thead>
            <tr>
              <th>Selecionar</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {boletos.map((boleto, index) => (
              <tr key={index}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(index)}
                    onChange={() => handleSelectBoleto(index)}
                  />
                </td>
                <td>{boleto.nome}</td>
                <td>{boleto.telefone}</td>
                <td>{formatarData(boleto.vencimento)}</td>
                <td>R$ {parseFloat(boleto.valor).toFixed(2)}</td>
                <td>{boleto.status}</td>
                <td>
                  <div className="button-group">
                    <button 
                      className="button-danger" 
                      onClick={() => handleDelete(index)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ListaBoletos;
EOF

cat > src/pages/NovoBoleto.js << 'EOF'
import React, { useState } from 'react';
import { criarBoleto } from '../services/api';
import { useNavigate } from 'react-router-dom';

function NovoBoleto() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    vencimento: '',
    valor: '',
    status: 'Pendente'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome || !formData.telefone || !formData.vencimento || !formData.valor) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    try {
      setLoading(true);
      await criarBoleto(formData);
      navigate('/boletos');
    } catch (err) {
      setError('Erro ao criar boleto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Cadastrar Novo Boleto</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome do Cliente</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Nome completo do cliente"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="telefone">Telefone</label>
            <input
              type="text"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="Ex: 11999999999"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="vencimento">Data de Vencimento</label>
            <input
              type="date"
              id="vencimento"
              name="vencimento"
              value={formData.vencimento}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="valor">Valor (R$)</label>
            <input
              type="number"
              id="valor"
              name="valor"
              value={formData.valor}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Pendente">Pendente</option>
              <option value="Enviado">Enviado</option>
              <option value="Pago">Pago</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="button-primary" 
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Cadastrar Boleto'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NovoBoleto;
EOF

# Criar script para executar o projeto facilmente
cd ../
cat > start.sh << 'EOF'
#!/bin/bash

# Iniciar backend
echo "Iniciando o backend..."
cd backend
npm install
gnome-terminal -- npm run dev &
cd ..

# Iniciar frontend
echo "Iniciando o frontend..."
cd frontend
npm install
gnome-terminal -- npm start &
cd ..

echo "Aplicação iniciada. Acesse http://localhost:3000 no navegador."
EOF

chmod +x start.sh

echo "Projeto criado com sucesso!"
echo "Para iniciar, execute: ./start.sh"