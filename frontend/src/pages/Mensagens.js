// frontend/src/pages/Mensagens.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Mensagens() {
  const [clientes, setClientes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [clientesSelecionados, setClientesSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carrega clientes e histórico em paralelo
      const [clientesRes, historicoRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/cobrancas/historico')
      ]);
      
      setClientes(clientesRes.data);
      setHistorico(historicoRes.data);
      setLoading(false);
    } catch (error) {
      setErro('Erro ao carregar dados');
      setLoading(false);
    }
  };

  const handleSelecaoCliente = (event, clienteId) => {
    if (event.target.checked) {
      setClientesSelecionados([...clientesSelecionados, clienteId]);
    } else {
      setClientesSelecionados(clientesSelecionados.filter(id => id !== clienteId));
    }
  };

  const selecionarTodos = (event) => {
    if (event.target.checked) {
      setClientesSelecionados(clientes.map(cliente => cliente.ID));
    } else {
      setClientesSelecionados([]);
    }
  };

  const dispararMensagemIndividual = async (id) => {
    try {
      setEnviando(true);
      await api.post('/cobrancas/disparar-individual', { id });
      setSucesso('Mensagem enviada com sucesso!');
      setEnviando(false);
      // Recarrega o histórico
      const historicoRes = await api.get('/cobrancas/historico');
      setHistorico(historicoRes.data);
    } catch (error) {
      setErro('Erro ao enviar mensagem');
      setEnviando(false);
    }
  };

  const dispararMensagens = async () => {
    try {
      setEnviando(true);
      setSucesso('');
      setErro('');
      
      if (clientesSelecionados.length === 0) {
        // Dispara para todos
        await api.post('/cobrancas/disparar');
      } else {
        // Dispara individualmente para cada selecionado
        await Promise.all(
          clientesSelecionados.map(id => api.post('/cobrancas/disparar-individual', { id }))
        );
      }
      
      setSucesso('Mensagens enviadas com sucesso!');
      setEnviando(false);
      
      // Recarrega o histórico
      const historicoRes = await api.get('/cobrancas/historico');
      setHistorico(historicoRes.data);
      
      // Limpa seleção
      setClientesSelecionados([]);
    } catch (error) {
      setErro('Erro ao enviar mensagens');
      setEnviando(false);
    }
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  if (loading) {
    return <div className="loader"></div>;
  }

  return (
    <div>
      <h1>Disparar Mensagens</h1>
      
      {erro && <div className="alert alert-danger">{erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}
      
      <div className="card">
        <div className="card-header">
          <h2>Clientes Disponíveis</h2>
          <button 
            className="btn btn-primary"
            onClick={dispararMensagens}
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Disparar Mensagens'}
            {clientesSelecionados.length > 0 ? ` (${clientesSelecionados.length})` : ' (Todos)'}
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    onChange={selecionarTodos}
                    checked={clientesSelecionados.length === clientes.length && clientes.length > 0}
                  />
                </th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Nenhum cliente cadastrado</td>
                </tr>
              ) : (
                clientes.map(cliente => (
                  <tr key={cliente.ID}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={clientesSelecionados.includes(cliente.ID)}
                        onChange={(e) => handleSelecaoCliente(e, cliente.ID)}
                      />
                    </td>
                    <td>{cliente.Nome}</td>
                    <td>{cliente.Telefone}</td>
                    <td>{cliente.Vencimento}</td>
                    <td>R$ {parseFloat(cliente.Valor).toFixed(2)}</td>
                    <td>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => dispararMensagemIndividual(cliente.ID)}
                        disabled={enviando}
                      >
                        <i className="fas fa-paper-plane"></i> Enviar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <h2>Histórico de Mensagens</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Data de Envio</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historico.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Nenhuma mensagem enviada</td>
                </tr>
              ) : (
                historico.map(mensagem => (
                  <tr key={mensagem.id}>
                    <td>{formatarData(mensagem.dataEnvio)}</td>
                    <td>{mensagem.nome}</td>
                    <td>{mensagem.telefone}</td>
                    <td>R$ {parseFloat(mensagem.valor).toFixed(2)}</td>
                    <td>{mensagem.vencimento}</td>
                    <td>
                      <span className={mensagem.status === 'enviado' ? 'text-success' : 'text-danger'}>
                        {mensagem.status === 'enviado' ? '✅ Enviado' : '❌ Falha'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Mensagens;