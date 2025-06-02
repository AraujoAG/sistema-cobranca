// frontend/src/pages/Mensagens.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function Mensagens() {
  const [clientes, setClientes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [clientesSelecionados, setClientesSelecionados] = useState(new Set()); // Usar Set para melhor performance na seleção
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(''); // Renomeado
  const [success, setSuccess] = useState(''); // Renomeado

  const carregarDados = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    setSuccess(''); // Limpa mensagens ao recarregar
    console.log('Carregando dados para a página de Mensagens...');

    try {
      // Opcional: Teste de conexão com o backend
      // await api.get('/test');
      // console.log('Teste de conexão com backend OK para Mensagens.');

      const [clientesRes, historicoRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/cobrancas/historico')
      ]);

      console.log('Clientes carregados:', clientesRes.data);
      setClientes(Array.isArray(clientesRes.data) ? clientesRes.data : []);

      console.log('Histórico carregado:', historicoRes.data);
      // O histórico já vem como um array de mensagens, não precisa de .mensagensEnviadas
      setHistorico(Array.isArray(historicoRes.data) ? historicoRes.data.slice().reverse() : []);


    } catch (apiError) {
      console.error('Erro ao carregar dados para Mensagens:', apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.message || 'Erro desconhecido ao carregar dados.';
      setError(`Falha ao carregar dados: ${errorMsg}`);
      setClientes([]);
      setHistorico([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSelecaoCliente = (clienteId) => {
    setClientesSelecionados(prevSelecionados => {
      const novosSelecionados = new Set(prevSelecionados);
      if (novosSelecionados.has(clienteId)) {
        novosSelecionados.delete(clienteId);
      } else {
        novosSelecionados.add(clienteId);
      }
      return novosSelecionados;
    });
  };

  const handleSelecionarTodos = (event) => {
    if (event.target.checked) {
      setClientesSelecionados(new Set(clientes.map(cliente => cliente.ID)));
    } else {
      setClientesSelecionados(new Set());
    }
  };

  const dispararMensagemIndividual = async (clienteId) => {
    setEnviando(true);
    setError('');
    setSuccess('');
    console.log('Enviando mensagem individual para cliente ID:', clienteId);

    try {
      const response = await api.post('/cobrancas/disparar-individual', { id: clienteId });
      setSuccess(response.data?.mensagem || `Operação para cliente ${clienteId} concluída.`);
      await carregarDados(false); // Recarrega sem mostrar loading principal
    } catch (apiError) {
      console.error(`Erro ao enviar mensagem individual para ID ${clienteId}:`, apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.response?.data?.detalhes || apiError.message || 'Erro desconhecido.';
      setError(`Falha no envio para ID ${clienteId}: ${errorMsg}`);
    } finally {
      setEnviando(false);
    }
  };

  const dispararMensagensSelecionadasOuTodas = async () => {
    setEnviando(true);
    setError('');
    setSuccess('');

    const idsParaEnviar = Array.from(clientesSelecionados);

    if (idsParaEnviar.length === 0) {
      console.log('Disparando para TODOS os clientes (via /cobrancas/disparar)');
      try {
        const response = await api.post('/cobrancas/disparar'); // Endpoint para processar todos
        setSuccess(response.data?.mensagem || 'Processo de cobrança para todos iniciado.');
      } catch (apiError) {
        console.error('Erro ao disparar para todos os clientes:', apiError);
        const errorMsg = apiError.response?.data?.erro || apiError.message || 'Erro desconhecido.';
        setError(`Falha ao iniciar cobrança para todos: ${errorMsg}`);
      }
    } else {
      console.log(`Disparando para ${idsParaEnviar.length} clientes selecionados...`);
      let sucessoCount = 0;
      let falhaCount = 0;
      for (const id of idsParaEnviar) {
        try {
          await api.post('/cobrancas/disparar-individual', { id });
          sucessoCount++;
        } catch (apiError) {
          falhaCount++;
          console.error(`Erro no envio individual (em lote) para ID ${id}:`, apiError.message);
        }
        // Opcional: pequeno delay para não sobrecarregar
        // await new Promise(resolve => setTimeout(resolve, 200));
      }
      setSuccess(`${sucessoCount} mensagens iniciadas com sucesso. ${falhaCount} falhas.`);
    }
    setClientesSelecionados(new Set()); // Limpa seleção
    await carregarDados(false); // Recarrega sem mostrar loading principal
    setEnviando(false);
  };

  const formatarDataHora = (dataString) => {
    if (!dataString) return '-';
    try {
      return new Date(dataString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dataString; // Retorna a string original se a data for inválida
    }
  };

  const formatarValorBR = (valor) => {
    const numero = parseFloat(valor);
    if (isNaN(numero)) return 'R$ -';
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };


  if (loading) {
    return <div className="loader" aria-label="Carregando dados de mensagens"></div>;
  }

  return (
    <div>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Disparar Mensagens de Cobrança</h1>
        <button
            className="btn btn-secondary"
            onClick={() => carregarDados(true)} // Força o loading ao atualizar manualmente
            disabled={loading || enviando}
          >
            <i className="fas fa-sync-alt"></i> Atualizar Dados
          </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">{success}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Selecionar Clientes para Envio</h2>
          <button
            className="btn btn-primary"
            onClick={dispararMensagensSelecionadasOuTodas}
            disabled={enviando || clientes.length === 0}
          >
            {enviando ? 'Enviando...' :
             (clientesSelecionados.size > 0 ? `Disparar para ${clientesSelecionados.size} Selecionados` : 'Disparar para Todos Pendentes (Backend)')}
          </button>
        </div>

        {clientes.length === 0 && !loading ? (
           <p style={{ padding: '20px', textAlign: 'center' }}>Nenhum cliente encontrado para enviar mensagens.</p>
        ) : (
        <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelecionarTodos}
                    checked={clientes.length > 0 && clientesSelecionados.size === clientes.length}
                    disabled={clientes.length === 0}
                  />
                </th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Vencimento</th>
                <th>Status Boleto</th>
                <th>Ação Individual</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <tr key={cliente.ID}>
                  <td>
                    <input
                      type="checkbox"
                      checked={clientesSelecionados.has(cliente.ID)}
                      onChange={() => handleSelecaoCliente(cliente.ID)}
                    />
                  </td>
                  <td>{cliente.Nome}</td>
                  <td>{cliente.Telefone}</td>
                  <td>{cliente.Vencimento}</td>
                  <td>{cliente.Status}</td>
                  <td>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => dispararMensagemIndividual(cliente.ID)}
                      disabled={enviando}
                      title="Enviar mensagem apenas para este cliente"
                    >
                      <i className="fas fa-paper-plane"></i> Enviar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2>Histórico de Mensagens Enviadas</h2>
        {historico.length === 0 && !loading ? (
           <p style={{ padding: '20px', textAlign: 'center' }}>Nenhum histórico de mensagens encontrado.</p>
        ) : (
        <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
          <table>
            <thead>
              <tr>
                <th>Data Envio</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Valor</th>
                <th>Vencimento Boleto</th>
                <th>Status Envio</th>
              </tr>
            </thead>
            <tbody>
              {historico.map(mensagem => (
                <tr key={mensagem.id}>
                  <td>{formatarDataHora(mensagem.dataEnvio)}</td>
                  <td>{mensagem.nome}</td>
                  <td>{mensagem.telefone}</td>
                  <td>{formatarValorBR(mensagem.valor)}</td>
                  <td>{mensagem.vencimento}</td>
                  <td>
                    <span className={`status-envio-${(mensagem.status || 'desconhecido').toLowerCase()}`}>
                      {mensagem.status === 'enviado' ? '✅ Enviado' : `❌ ${mensagem.status || 'Falha'}`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

export default Mensagens;