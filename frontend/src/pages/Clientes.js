// frontend/src/pages/Clientes.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [clienteParaRemover, setClienteParaRemover] = useState(null);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes');
      setClientes(response.data);
      setLoading(false);
    } catch (error) {
      setErro('Erro ao carregar dados dos clientes');
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
      await api.delete(`/clientes/${clienteParaRemover.ID}`);
      setClienteParaRemover(null);
      carregarClientes();
    } catch (error) {
      setErro('Erro ao remover cliente');
    }
  };

  const formatarData = (dataString) => {
    return dataString; // A data já está formatada como DD/MM/YYYY
  };

  const formatarValor = (valor) => {
    return parseFloat(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (loading) {
    return <div className="loader"></div>;
  }

  return (
    <div>
      <div className="card-header">
        <h1>Clientes e Boletos</h1>
        <Link to="/novo-cliente" className="btn btn-primary">
          <i className="fas fa-plus"></i> Novo Cliente
        </Link>
      </div>
      
      {erro && <div className="alert alert-danger">{erro}</div>}
      
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
      
      {clientes.length === 0 ? (
        <div className="card">
          <p>Nenhum cliente cadastrado.</p>
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