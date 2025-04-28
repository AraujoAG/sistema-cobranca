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
      setErro('');
      console.log('Carregando dados de mensagens...');
      
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
      
      // Tenta carregar clientes
      let clientesData = [];
      try {
        console.log('Carregando clientes...');
        const clientesRes = await api.get('/clientes');
        clientesData = Array.isArray(clientesRes.data) ? clientesRes.data : [];
        console.log(`${clientesData.length} clientes carregados`);
      } catch (clientesError) {
        console.error('Erro ao carregar clientes:', clientesError);
        setErro(`Erro ao carregar clientes: ${clientesError.message}`);
      }
      
      // Tenta carregar histórico
      let historicoData = [];
      try {
        console.log('Carregando histórico...');
        const historicoRes = await api.get('/cobrancas/historico');
        historicoData = Array.isArray(historicoRes.data) ? historicoRes.data : [];
        console.log(`${historicoData.length} registros de histórico carregados`);
      } catch (historicoError) {
        console.error('Erro ao carregar histórico:', historicoError);
        
        // Não sobrescreve o erro anterior se houver
        if (!erro) {
          setErro(`Erro ao carregar histórico: ${historicoError.message}`);
        }
      }
      
      setClientes(clientesData);
      setHistorico(historicoData);
      setLoading(false);
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      setErro(`Erro ao carregar dados: ${error.message}`);
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
      setSucesso('');
      setErro('');
      
      console.log('Enviando mensagem para cliente ID:', id);
      
      const response = await api.post('/cobrancas/disparar-individual', { id });
      
      // Verificar resposta
      if (response.data && response.data.mensagem) {
        setSucesso(`Mensagem enviada com sucesso! ${response.data.tentativas > 1 ? `(${response.data.tentativas} tentativas)` : ''}`);
      } else {
        console.warn('Resposta inesperada:', response);
        setSucesso('Operação concluída, mas com resposta inesperada do servidor');
      }
      
      setEnviando(false);
      
      // Recarrega o histórico
      try {
        const historicoRes = await api.get('/cobrancas/historico');
        if (Array.isArray(historicoRes.data)) {
          setHistorico(historicoRes.data);
        }
      } catch (historicoError) {
        console.error('Erro ao recarregar histórico:', historicoError);
      }
    } catch (error) {
      console.error('Erro completo:', error);
      
      let mensagemErro = 'Erro ao enviar mensagem';
      
      // Extrair detalhes do erro se disponíveis
      if (error.response) {
        // O servidor respondeu com status de erro
        const { data, status } = error.response;
        mensagemErro = `Erro ${status}: ${data.erro || 'Falha na requisição'}`;
        
        if (data.detalhes) {
          mensagemErro += ` - ${data.detalhes}`;
        }
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        mensagemErro = 'Sem resposta do servidor. Verifique sua conexão de rede.';
      } else {
        // Erro na configuração da requisição
        mensagemErro = `Erro: ${error.message}`;
      }
      
      setErro(mensagemErro);
      setEnviando(false);
    }
  };

  const dispararMensagens = async () => {
    try {
      setEnviando(true);
      setSucesso('');
      setErro('');
      
      console.log('Iniciando disparo de mensagens...');
      console.log('Clientes selecionados:', clientesSelecionados);
      
      if (clientesSelecionados.length === 0) {
        // Dispara para todos
        console.log('Disparando para todos os clientes');
        const response = await api.post('/cobrancas/disparar');
        console.log('Resposta do disparo geral:', response.data);
        setSucesso('Processo de cobrança iniciado para todos os clientes!');
      } else {
        // Dispara individualmente para cada selecionado
        console.log(`Disparando para ${clientesSelecionados.length} clientes selecionados`);
        
        // Envio sequencial para evitar sobrecarga
        let sucessoCount = 0;
        let falhaCount = 0;
        
        for (const id of clientesSelecionados) {
          try {
            console.log(`Enviando para cliente ID: ${id}`);
            await api.post('/cobrancas/disparar-individual', { id });
            sucessoCount++;
          } catch (error) {
            console.error(`Erro no envio para ID ${id}:`, error);
            falhaCount++;
          }
          
          // Pequeno delay entre requisições para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        setSucesso(`Mensagens enviadas: ${sucessoCount} com sucesso, ${falhaCount} com falha.`);
      }
      
      setEnviando(false);
      
      // Recarrega o histórico
      try {
        console.log('Recarregando histórico...');
        const historicoRes = await api.get('/cobrancas/historico');
        if (Array.isArray(historicoRes.data)) {
          setHistorico(historicoRes.data);
        } else {
          console.warn('Formato de resposta inválido para histórico:', historicoRes.data);
        }
      } catch (historicoError) {
        console.error('Erro ao recarregar histórico:', historicoError);
      }
      
      // Limpa seleção
      setClientesSelecionados([]);
    } catch (error) {
      console.error('Erro completo:', error);
      
      let mensagemErro = 'Erro ao enviar mensagens';
      
      if (error.response) {
        mensagemErro = `Erro ${error.response.status}: ${error.response.data.erro || 'Falha na requisição'}`;
      } else if (error.request) {
        mensagemErro = 'Sem resposta do servidor. Verifique sua conexão de rede.';
      } else {
        mensagemErro = `Erro: ${error.message}`;
      }
      
      setErro(mensagemErro);
      setEnviando(false);
    }
  };

  const formatarData = (dataString) => {
    try {
      return new Date(dataString).toLocaleString('pt-BR');
    } catch {
      return dataString || 'Data inválida';
    }
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
          <button 
            className="btn btn-secondary"
            onClick={carregarDados}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> Atualizar
          </button>
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
                historico.slice().reverse().map(mensagem => (
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