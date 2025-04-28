// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import StatusCard from '../components/StatusCard';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

function Dashboard() {
  const [resumo, setResumo] = useState({
    totalClientes: 0,
    boletosVencidos: 0,
    boletosAVencer: 0,
    valorTotal: 0,
    mensagensEnviadas: 0,
    ultimaExecucao: null
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro('');
      console.log('Carregando dados do dashboard...');
      
      // Teste da conexão com o backend
      try {
        const testResponse = await api.get('/test');
        console.log('Teste de conexão bem-sucedido:', testResponse.data);
      } catch (testError) {
        console.error('Erro no teste de conexão:', testError);
        setErro('Erro na conexão com o servidor. Verifique se o backend está online.');
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get('/dashboard/resumo');
        console.log('Dados do dashboard recebidos:', response.data);
        
        // Garantir que todos os campos existam para evitar erros
        const dadosRecebidos = response.data || {};
        
        setResumo({
          totalClientes: dadosRecebidos.totalClientes || 0,
          boletosVencidos: dadosRecebidos.boletosVencidos || 0,
          boletosAVencer: dadosRecebidos.boletosAVencer || 0,
          valorTotal: dadosRecebidos.valorTotal || 0,
          mensagensEnviadas: dadosRecebidos.mensagensEnviadas || 0,
          ultimaExecucao: dadosRecebidos.ultimaExecucao || null
        });
      } catch (apiError) {
        console.error('Erro ao carregar resumo do dashboard:', apiError);
        setErro('Falha ao carregar dados do dashboard. Verifique o console para detalhes.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro geral ao carregar dashboard:', error);
      setErro(`Erro ao carregar dados: ${error.message}`);
      setLoading(false);
    }
  };

  // Dados para o gráfico de pizza
  const statusBoletos = [
    { name: 'A Vencer', value: resumo.boletosAVencer, color: '#4CAF50' },
    { name: 'Vencidos', value: resumo.boletosVencidos, color: '#F44336' }
  ];

  // Dados de exemplo para o gráfico de barras (histórico de mensagens)
  const dadosMensagens = [
    { mes: 'Jan', quantidade: 45 },
    { mes: 'Fev', quantidade: 60 },
    { mes: 'Mar', quantidade: 32 },
    { mes: 'Abr', quantidade: 70 },
    { mes: 'Mai', quantidade: resumo.mensagensEnviadas }
  ];

  if (loading) {
    return <div className="loader"></div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      {erro && <div className="alert alert-danger">{erro}</div>}
      
      <div className="summary-cards">
        <StatusCard 
          title="Total de Clientes"
          value={resumo.totalClientes}
          icon="fas fa-users"
        />
        <StatusCard 
          title="Boletos a Vencer"
          value={resumo.boletosAVencer}
          icon="fas fa-calendar-check"
          color="#4CAF50"
        />
        <StatusCard 
          title="Boletos Vencidos"
          value={resumo.boletosVencidos}
          icon="fas fa-calendar-times"
          color="#F44336"
        />
        <StatusCard 
          title="Valor Total"
          value={`R$ ${(resumo.valorTotal || 0).toFixed(2)}`}
          icon="fas fa-money-bill-wave"
          color="#166088"
        />
        <StatusCard 
          title="Mensagens Enviadas"
          value={resumo.mensagensEnviadas}
          icon="fas fa-paper-plane"
          color="#4fc3a1"
        />
      </div>
      
      <div className="charts-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div className="card" style={{ flex: '1', minWidth: '300px', height: '400px' }}>
          <h3>Status dos Boletos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={statusBoletos} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={100} 
                fill="#8884d8" 
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusBoletos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="card" style={{ flex: '1', minWidth: '300px', height: '400px' }}>
          <h3>Histórico de Mensagens Enviadas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosMensagens}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => value} />
              <Legend />
              <Bar dataKey="quantidade" name="Mensagens" fill="#4a6fa5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="card">
        <h3>Última Execução</h3>
        <p>
          {resumo.ultimaExecucao 
            ? new Date(resumo.ultimaExecucao).toLocaleString('pt-BR') 
            : 'Nenhuma execução registrada'}
        </p>
        <button className="btn btn-primary" onClick={carregarDados} style={{ marginTop: '10px' }}>
          <i className="fas fa-sync-alt"></i> Atualizar Dados
        </button>
      </div>
    </div>
  );
}

export default Dashboard;