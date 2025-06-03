// frontend/src/pages/Clientes.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clienteParaRemover, setClienteParaRemover] = useState(null);
  const [success, setSuccess] = useState('');

  const carregarClientes = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    console.log('Carregando lista de clientes...');

    try {
      const response = await api.get('/clientes');
      console.log('Clientes recebidos:', response.data);

      if (Array.isArray(response.data)) {
        setClientes(response.data);
      } else {
        console.error('Resposta da API de clientes não é um array:', response.data);
        setClientes([]);
        setError('Formato de dados de clientes inválido recebido do servidor.');
      }
    } catch (apiError) {
      console.error('Erro ao carregar clientes:', apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.message || 'Erro desconhecido ao carregar clientes.';
      setError(`Falha ao carregar clientes: ${errorMsg}`);
      setClientes([]);
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

    // setLoading(true); // Pode usar um loading específico para remoção, não o global
    let isRemoving = true; // Lógica de loading local para o botão
    const originalButtonText = document.activeElement.innerHTML; // Salva o texto original do botão
    document.activeElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removendo...';
    document.activeElement.disabled = true;


    setError('');
    setSuccess('');

    try {
      console.log('Removendo cliente ID:', clienteParaRemover.ID);
      await api.delete(`/clientes/${clienteParaRemover.ID}`);
      setSuccess(`Cliente "${clienteParaRemover.Nome}" removido com sucesso!`);
      setClienteParaRemover(null);
      await carregarClientes(); // Recarrega a lista
    } catch (apiError) {
      console.error('Erro ao remover cliente:', apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.message || 'Erro desconhecido ao remover cliente.';
      setError(`Falha ao remover cliente: ${errorMsg}`);
    } finally {
      // setLoading(false);
      isRemoving = false;
      // Idealmente, o botão de confirmação do modal seria um componente com seu próprio estado de loading
      // Por agora, apenas restauramos um botão genérico se possível, ou você pode precisar de refs.
      // Esta parte de restaurar o botão é complexa sem refs ou estado de componente para o modal.
      // Vamos focar em fechar o modal.
    }
  };

  const formatarValorBR = (valor) => {
    const numero = parseFloat(valor);
    if (isNaN(numero)) return 'R$ -';
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Para o modal de remoção, é melhor controlar sua visibilidade com estado
  // const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  // useEffect(() => { setIsRemoveModalOpen(!!clienteParaRemover); }, [clienteParaRemover]);

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
            className="btn btn-secondary" // Estilo global do App.css
            onClick={carregarClientes}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> {loading && clientes.length > 0 ? 'Atualizando...' : 'Atualizar Lista'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">{success}</div>}

      {clienteParaRemover && (
        // Este modal é o seu original, pode ser transformado em um componente React reutilizável
        <div className="modal" style={{ display: 'flex' }}> {/* Alterado para flex para centralizar */}
          <div className="modal-content">
            <div className="modal-header">
                <h2>Confirmar Exclusão</h2>
                <button className="close-button" onClick={cancelarRemocao}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja remover o cliente <strong>{clienteParaRemover.Nome}</strong> (ID: {clienteParaRemover.ID})?</p>
              <p>Esta ação não poderá ser desfeita.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cancelarRemocao} /*disabled={loading}*/>Cancelar</button>
              <button className="btn btn-danger" onClick={handleRemoverCliente} /*disabled={loading}*/>
                 {/* {loading ? 'Removendo...' : 'Confirmar Remoção'}  // Este loading é o global, precisaria de um local */}
                 Confirmar Remoção
              </button>
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
                        <i className="fas fa-edit"></i> <span className="sm:hidden md:inline">Editar</span>
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => confirmarRemocao(cliente)}
                        title="Remover Cliente"
                        // disabled={loading} // Não desabilitar com loading global aqui
                      >
                        <i className="fas fa-trash"></i> <span className="sm:hidden md:inline">Remover</span>
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