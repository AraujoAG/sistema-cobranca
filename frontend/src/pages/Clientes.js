// frontend/src/pages/Clientes.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [clienteParaRemover, setClienteParaRemover] = useState(null);
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      setErro('');
      
      console.log('Carregando lista de clientes...');
      
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
      
      const response = await api.get('/clientes');
      console.log('Resposta recebida:', response.data);
      
      if (Array.isArray(response.data)) {
        setClientes(response.data);
        console.log(`${response.data.length} clientes carregados`);
      } else {
        console.error('Resposta não é um array:', response.data);
        setClientes([]);
        setErro('Formato de dados inválido recebido do servidor');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      
      let mensagemErro = 'Erro ao carregar dados dos clientes';
      
      if (error.response) {
        mensagemErro += `: ${error.response.data.erro || error.response.status}`;
      } else if (error.request) {
        mensagemErro += ': Sem resposta do servidor';
      } else {
        mensagemErro += `: ${error.message}`;
      }
      
      setErro(mensagemErro);
      setClientes([]);
      setLoading(false);
    }
  };

  const confirmarRemocao = (cliente) => {
    setClienteParaRemover(cliente);
  };

  const cancelarRemocao = () => {
    setClienteParaRemover(null);
  };

  const removerCliente = async () => {
    if (!clienteParaRemover) return;
    
    try {
      setLoading(true);
      await api.delete(`/clientes/${clienteParaRemover.ID}`);
      setClienteParaRemover(null);
      setSucesso(`Cliente ${clienteParaRemover.Nome} removido com sucesso!`);
      await carregarClientes();
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      setErro('Erro ao remover cliente');
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    return dataString; // A data já está formatada como DD/MM/YYYY
  };

  const formatarValor = (valor) => {
    try {
      return parseFloat(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    } catch (error) {
      console.error('Erro ao formatar valor:', error);
      return `R$ ${valor}`;
    }
  };

  if (loading && clientes.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Clientes e Boletos</h1>
        <div>
          <Link to="/novo-cliente" className="btn btn-primary">
            <i className="fas fa-plus"></i> Novo Cliente
          </Link>
          <button 
            className="btn btn-secondary" 
            onClick={carregarClientes} 
            style={{ marginLeft: '10px' }}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> Atualizar
          </button>
        </div>
      </div>
      
      {erro && <div className="alert alert-danger">{erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}
      
      {clienteParaRemover && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: 'white', width: '50%', margin: '15% auto', padding: '20px', borderRadius: '5px' }}>
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja remover o cliente {clienteParaRemover.Nome}?</p>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={cancelarRemocao} style={{ marginRight: '10px' }}>Cancelar</button>
              <button className="btn btn-danger" onClick={removerCliente}>Remover</button>
            </div>
          </div>
        </div>
      )}
      
      {clientes.length === 0 && !loading ? (
        <div className="card">
          <p style={{ padding: '20px', textAlign: 'center' }}>Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr key={cliente.ID}>
                    <td>{cliente.Nome}</td>
                    <td>{cliente.Telefone}</td>
                    <td>{formatarData(cliente.Vencimento)}</td>
                    <td>{formatarValor(cliente.Valor)}</td>
                    <td>
                      <span className={cliente.Status?.toLowerCase() === 'pendente' ? 'text-warning' : 'text-success'}>
                        {cliente.Status || 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/editar-cliente/${cliente.ID}`} className="btn btn-secondary btn-sm" style={{ marginRight: '5px' }}>
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => confirmarRemocao(cliente)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;