// frontend/src/pages/Clientes.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Renomeado
  const [clienteParaRemover, setClienteParaRemover] = useState(null);
  const [success, setSuccess] = useState(''); // Renomeado

  const carregarClientes = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess(''); // Limpa mensagem de sucesso ao recarregar
    console.log('Carregando lista de clientes...');

    try {
      // Opcional: "Acordar" o backend do Render.
      // await api.get('/test');
      // console.log('Teste de conexão com backend OK para clientes.');

      const response = await api.get('/clientes');
      console.log('Clientes recebidos:', response.data);

      if (Array.isArray(response.data)) {
        setClientes(response.data);
      } else {
        console.error('Resposta da API de clientes não é um array:', response.data);
        setClientes([]); // Define como array vazio para evitar erros de map
        setError('Formato de dados de clientes inválido recebido do servidor.');
      }
    } catch (apiError) {
      console.error('Erro ao carregar clientes:', apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.message || 'Erro desconhecido ao carregar clientes.';
      setError(`Falha ao carregar clientes: ${errorMsg}`);
      setClientes([]); // Garante que clientes seja um array em caso de erro
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  const confirmarRemocao = (cliente) => {
    setClienteParaRemover(cliente);
  };

  const cancelarRemocao = () => {
    setClienteParaRemover(null);
  };

  const handleRemoverCliente = async () => {
    if (!clienteParaRemover || !clienteParaRemover.ID) return;

    setLoading(true); // Pode-se usar um loading específico para remoção
    setError('');
    setSuccess('');

    try {
      console.log('Removendo cliente ID:', clienteParaRemover.ID);
      await api.delete(`/clientes/${clienteParaRemover.ID}`);
      setSuccess(`Cliente "${clienteParaRemover.Nome}" removido com sucesso!`);
      setClienteParaRemover(null); // Fecha o modal
      await carregarClientes(); // Recarrega a lista
    } catch (apiError) {
      console.error('Erro ao remover cliente:', apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.message || 'Erro desconhecido ao remover cliente.';
      setError(`Falha ao remover cliente: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatarValorBR = (valor) => {
    const numero = parseFloat(valor);
    if (isNaN(numero)) return 'R$ -';
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading && clientes.length === 0) {
    return <div className="loader" aria-label="Carregando clientes"></div>;
  }

  return (
    <div>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Clientes e Boletos</h1>
        <div>
          <Link to="/novo-cliente" className="btn btn-primary" style={{ marginRight: '10px' }}>
            <i className="fas fa-plus"></i> Novo Cliente
          </Link>
          <button
            className="btn btn-secondary"
            onClick={carregarClientes}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> {loading ? 'Atualizando...' : 'Atualizar Lista'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">{success}</div>}

      {clienteParaRemover && (
        <div className="modal" style={{ display: 'block', position: 'fixed', zIndex: 1050, left: 0, top: 0, width: '100%', height: '100%', overflow: 'auto', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog" style={{ margin: '10% auto', maxWidth: '500px' }}>
            <div className="modal-content" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '5px', boxShadow: '0 5px 15px rgba(0,0,0,.5)' }}>
              <h3>Confirmar Exclusão</h3>
              <p>Tem certeza que deseja remover o cliente <strong>{clienteParaRemover.Nome}</strong> (ID: {clienteParaRemover.ID})?</p>
              <p>Esta ação não poderá ser desfeita.</p>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="btn btn-secondary" onClick={cancelarRemocao} style={{ marginRight: '10px' }} disabled={loading}>Cancelar</button>
                <button className="btn btn-danger" onClick={handleRemoverCliente} disabled={loading}>
                  {loading ? 'Removendo...' : 'Confirmar Remoção'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {clientes.length === 0 && !loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Nenhum cliente cadastrado.</p>
        ) : (
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
                    <td>{cliente.Nome || '-'}</td>
                    <td>{cliente.Telefone || '-'}</td>
                    <td>{cliente.Vencimento || '-'}</td>
                    <td>{formatarValorBR(cliente.Valor)}</td>
                    <td>
                      <span className={`status-${(cliente.Status || 'pendente').toLowerCase()}`}>
                        {cliente.Status || 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/editar-cliente/${cliente.ID}`} className="btn btn-secondary btn-sm" style={{ marginRight: '5px' }} title="Editar Cliente">
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => confirmarRemocao(cliente)}
                        title="Remover Cliente"
                        disabled={loading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
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

export default Clientes;