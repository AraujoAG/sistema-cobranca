// frontend/src/components/ClienteForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ClienteForm({ cliente, onSalvar }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Nome: cliente?.Nome || '',
    Telefone: cliente?.Telefone || '',
    Vencimento: cliente?.Vencimento || '',
    Valor: cliente?.Valor || '',
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    if (!formData.Nome || !formData.Telefone || !formData.Vencimento || !formData.Valor) {
      setErro('Todos os campos são obrigatórios');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;
    
    setLoading(true);
    setErro('');
    
    try {
      if (cliente?.ID) {
        // Atualização
        await api.put(`/clientes/${cliente.ID}`, formData);
      } else {
        // Novo cliente
        await api.post('/clientes', formData);
      }
      
      setLoading(false);
      
      if (onSalvar) {
        onSalvar();
      } else {
        navigate('/clientes');
      }
    } catch (error) {
      setLoading(false);
      setErro(error.response?.data?.erro || 'Erro ao salvar cliente');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>{cliente?.ID ? 'Editar Cliente' : 'Novo Cliente'}</h2>
      </div>
      
      {erro && <div className="alert alert-danger">{erro}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nome">Nome</label>
          <input
            type="text"
            id="nome"
            name="Nome"
            className="form-control"
            value={formData.Nome}
            onChange={handleChange}
            placeholder="Nome do cliente"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="telefone">Telefone</label>
          <input
            type="text"
            id="telefone"
            name="Telefone"
            className="form-control"
            value={formData.Telefone}
            onChange={handleChange}
            placeholder="Ex: 5515999999999"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="vencimento">Data de Vencimento</label>
          <input
            type="text"
            id="vencimento"
            name="Vencimento"
            className="form-control"
            value={formData.Vencimento}
            onChange={handleChange}
            placeholder="Ex: 15/05/2025"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="valor">Valor</label>
          <input
            type="text"
            id="valor"
            name="Valor"
            className="form-control"
            value={formData.Valor}
            onChange={handleChange}
            placeholder="Ex: 199.90"
          />
        </div>
        
        <div className="form-group">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : cliente?.ID ? 'Atualizar' : 'Salvar'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/clientes')}
            style={{ marginLeft: '10px' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClienteForm;