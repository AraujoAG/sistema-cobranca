// frontend/src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import StatusCard from '../components/StatusCard';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const COLORS_PIE = ['#4CAF50', '#F44336', '#FFC107', '#2196F3']; // Cores para o gráfico de pizza

function Dashboard() {
  const [resumo, setResumo] = useState({
    totalClientes: 0,
    boletosVencidos: 0,
    boletosAVencer: 0,
    valorTotal: 0,
    mensagensEnviadas: 0, // Este virá do resumo geral
    ultimaExecucao: null
  });
  const [estatisticasHistorico, setEstatisticasHistorico] = useState({
      statusContagem: {}, // Ex: { enviado: 10, falha: 2 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError('');
    console.log('Carregando dados do dashboard...');

    try {
      const resumoResponse = await api.get('/dashboard/resumo');
      console.log('Dados do resumo do dashboard recebidos:', resumoResponse.data);
      const dadosResumo = resumoResponse.data || {};
      setResumo({
        totalClientes: dadosResumo.totalClientes || 0,
        boletosVencidos: dadosResumo.boletosVencidos || 0,
        boletosAVencer: dadosResumo.boletosAVencer || 0,
        valorTotal: dadosResumo.valorTotal || 0,
        mensagensEnviadas: dadosResumo.mensagensEnviadas || 0,
        ultimaExecucao: dadosResumo.ultimaExecucao || null
      });

      const estatisticasResponse = await api.get('/dashboard/estatisticas');
      console.log('Dados de estatísticas do histórico recebidos:', estatisticasResponse.data);
      setEstatisticasHistorico(estatisticasResponse.data || { statusContagem: {} });

    } catch (apiError) {
      console.error('Erro ao carregar dados do dashboard:', apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.message || 'Falha ao carregar dados.';
      setError(`Erro: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const statusBoletosData = [
    { name: 'A Vencer', value: resumo.boletosAVencer || 0 },
    { name: 'Vencidos', value: resumo.boletosVencidos || 0 }
  ].filter(item => item.value > 0);

  const statusEnvioData = Object.entries(estatisticasHistorico.statusContagem || {})
    .map(([name, value]) => ({ name, value }));

  if (loading && resumo.totalClientes === 0) { // Melhor condição de loading inicial
    return <div className="loader" aria-label="Carregando dashboard"></div>;
  }

  return (
    <div>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}> {/* Usando .card-header para consistência */}
        <h1>Dashboard</h1>
        <button className="btn btn-secondary" onClick={carregarDados} disabled={loading}> {/* Usando .btn e .btn-secondary do App.css */}
          <i className="fas fa-sync-alt"></i> {/* Ícone precisa de FontAwesome */}
          {loading && resumo.totalClientes > 0 ? 'Atualizando...' : 'Atualizar Dados'}
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="summary-cards">
        <StatusCard title="Total de Clientes" value={resumo.totalClientes} icon="fas fa-users" color="#17a2b8" />
        <StatusCard title="Boletos a Vencer" value={resumo.boletosAVencer} icon="fas fa-calendar-check" color="#28a745" />
        <StatusCard title="Boletos Vencidos" value={resumo.boletosVencidos} icon="fas fa-calendar-times" color="#dc3545" />
        <StatusCard title="Valor Total em Aberto" value={(resumo.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon="fas fa-money-bill-wave" color="#007bff" />
        <StatusCard title="Total de Mensagens (Histórico)" value={resumo.mensagensEnviadas} icon="fas fa-envelope-open-text" color="#6f42c1" />
      </div>

      <div className="charts-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
        {statusBoletosData.length > 0 && (
          <div className="card" style={{ flex: '1 1 400px', minWidth: '300px', height: '400px' }}>
            <h3>Status dos Boletos (Ativos)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusBoletosData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusBoletosData.map((entry, index) => (
                    <Cell key={`cell-boletos-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {statusEnvioData.length > 0 && (
          <div className="card" style={{ flex: '1 1 400px', minWidth: '300px', height: '400px' }}>
            <h3>Status de Envio (Histórico)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusEnvioData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Quantidade" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h3>Informações do Sistema</h3>
        <p>
          <strong>Última Execução do Processamento de Boletos:</strong><br />
          {resumo.ultimaExecucao
            ? new Date(resumo.ultimaExecucao).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium'})
            : 'Nenhuma execução registrada ou informação indisponível.'}
        </p>
      </div>
    </div>
  );
}

export default Dashboard;