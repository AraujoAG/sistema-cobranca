// frontend/src/components/ClienteForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ClienteForm({ cliente, isEditing }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Nome: cliente?.Nome || '',
    Telefone: cliente?.Telefone || '',
    Vencimento: cliente?.Vencimento || '',
    Valor: cliente?.Valor || '',
    Status: cliente?.Status || 'Pendente'
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validarFormulario = () => {
    if (!formData.Nome.trim()) return 'Nome é obrigatório';
    if (!formData.Telefone.trim()) return 'Telefone é obrigatório';
    
    // Validar formato do telefone (aceita formatos como 5515999999999 ou 15999999999)
    const telefoneNumerico = formData.Telefone.replace(/\D/g, '');
    if (telefoneNumerico.length < 10 || telefoneNumerico.length > 13) {
      return 'Telefone inválido. Use o formato como 5515999999999';
    }
    
    // Validar data
    if (!formData.Vencimento.trim()) return 'Data de vencimento é obrigatória';
    
    const regexData = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regexData.test(formData.Vencimento)) {
      return 'Use o formato de data DD/MM/AAAA';
    }
    
    // Validar valor
    if (!formData.Valor || isNaN(parseFloat(formData.Valor)) || parseFloat(formData.Valor) <= 0) {
      return 'Valor deve ser um número positivo';
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulário
    const erro = validarFormulario();
    if (erro) {
      setErro(erro);
      return;
    }
    
    setLoading(true);
    setErro('');
    setSucesso('');
    
    try {
      // Teste da conexão com o backend
      try {
        await api.get('/test');
        console.log('Conexão com backend OK');
      } catch (testError) {
        console.error('Erro de conexão:', testError);
        setErro('Erro na conexão com o servidor. Verifique se o backend está online.');
        setLoading(false);
        return;
      }
      
      // Preparar dados
      const dadosEnvio = {
        ...formData,
        Valor: parseFloat(formData.Valor)
      };
      
      console.log('Enviando dados:', dadosEnvio);
      
      if (isEditing && cliente?.ID) {
        // Atualizar cliente existente
        await api.put(`/clientes/${cliente.ID}`, dadosEnvio);
        setSucesso('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        await api.post('/clientes', dadosEnvio);
        setSucesso('Cliente cadastrado com sucesso!');
        
        // Limpar formulário após sucesso
        setFormData({
          Nome: '',
          Telefone: '',
          Vencimento: '',
          Valor: '',
          Status: 'Pendente'
        });
      }
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/clientes');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      
      let mensagemErro = 'Erro ao salvar dados do cliente';
      
      if (error.response) {
        mensagemErro += `: ${error.response.data.erro || error.response.status}`;
      } else if (error.request) {
        mensagemErro += ': Sem resposta do servidor';
      } else {
        mensagemErro += `: ${error.message}`;
      }
      
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {erro && <div className="alert alert-danger">{erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="Nome">Nome do Cliente</label>
          <input
            type="text"
            id="Nome"
            name="Nome"
            className="form-control"
            value={formData.Nome}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="Telefone">Telefone (com DDD e código do país)</label>
          <input
            type="text"
            id="Telefone"
            name="Telefone"
            className="form-control"
            value={formData.Telefone}
            onChange={handleChange}
            placeholder="Ex: 5515999999999"
            required
          />
          <small className="form-text text-muted">
            Use o formato 5515999999999 (país + DDD + número)
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="Vencimento">Data de Vencimento</label><div className="form-group">
          <label htmlFor="Vencimento">Data de Vencimento</label>
          <input
            type="text"
            id="Vencimento"
            name="Vencimento"
            className="form-control"
            value={formData.Vencimento}
            onChange={handleChange}
            placeholder="DD/MM/AAAA"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="Valor">Valor (R$)</label>
          <input
            type="number"
            id="Valor"
            name="Valor"
            className="form-control"
            value={formData.Valor}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="Status">Status</label>
          <select
            id="Status"
            name="Status"
            className="form-control"
            value={formData.Status}
            onChange={handleChange}
          >
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
        
        <div className="form-group" style={{ marginTop: '20px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/clientes')}
            style={{ marginLeft: '10px' }}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClienteForm;