// frontend/src/components/ClienteForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Corrigido: useNavigate estava sem chaves
import api from '../services/api';

function ClienteForm({ cliente, isEditing = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Nome: '',
    Telefone: '',
    Vencimento: '',
    Valor: '',
    Status: 'Pendente'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditing && cliente) {
      setFormData({
        Nome: cliente.Nome || '',
        Telefone: cliente.Telefone || '',
        Vencimento: cliente.Vencimento || '',
        Valor: cliente.Valor !== undefined ? String(cliente.Valor) : '',
        Status: cliente.Status || 'Pendente'
      });
    } else {
      setFormData({ Nome: '', Telefone: '', Vencimento: '', Valor: '', Status: 'Pendente' });
    }
  }, [isEditing, cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.Nome.trim()) return 'O campo Nome é obrigatório.';
    if (!formData.Telefone.trim()) return 'O campo Telefone é obrigatório.';
    const telefoneNumerico = formData.Telefone.replace(/\D/g, '');
    if (!/^(55)?\d{10,11}$/.test(telefoneNumerico)) {
      return 'Telefone inválido. Formato esperado: (55)XXYYYYYYYYY ou XXYYYYYYYYY.';
    }
    if (!formData.Vencimento.trim()) return 'A Data de Vencimento é obrigatória.';
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.Vencimento)) {
      return 'Formato de Data de Vencimento inválido. Use DD/MM/AAAA.';
    }
    if (!formData.Valor || isNaN(parseFloat(formData.Valor)) || parseFloat(formData.Valor) <= 0) {
      return 'O Valor deve ser um número positivo.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Removida a chamada de teste /test
    // try {
    //   await api.get('/test');
    //   console.log('Teste de conexão com backend OK antes de salvar cliente.');
    // } catch (testConnError) {
    //   console.warn('Falha no teste de conexão (wake-up call):', testConnError.message);
    // }

    const dataToSend = {
      ...formData,
      Valor: parseFloat(formData.Valor),
      Telefone: formData.Telefone.replace(/\D/g, '')
    };
    if (dataToSend.Telefone.length >= 10 && dataToSend.Telefone.length <= 11 && !dataToSend.Telefone.startsWith('55')) {
        dataToSend.Telefone = '55' + dataToSend.Telefone;
    }

    try {
      if (isEditing && cliente && cliente.ID) {
        console.log('Atualizando cliente ID:', cliente.ID, 'com dados:', dataToSend);
        await api.put(`/clientes/${cliente.ID}`, dataToSend);
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        console.log('Cadastrando novo cliente com dados:', dataToSend);
        await api.post('/clientes', dataToSend);
        setSuccess('Cliente cadastrado com sucesso!');
        if (!isEditing) { // Limpa o formulário apenas se estiver criando novo
             setFormData({ Nome: '', Telefone: '', Vencimento: '', Valor: '', Status: 'Pendente' });
        }
      }
      // Não redirecionar imediatamente para ver a mensagem de sucesso
      // setTimeout(() => {
      //   navigate('/clientes');
      // }, 2000);

    } catch (apiError) {
      console.error('Erro ao salvar cliente:', apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.response?.data?.detalhes || apiError.message || 'Erro desconhecido ao salvar.';
      setError(`Falha ao salvar: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card"> {/* O formulário já está dentro de um card na página NovoCliente/EditarCliente */}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="Nome">Nome do Cliente</label>
          <input
            type="text" id="Nome" name="Nome" className="form-control"
            value={formData.Nome} onChange={handleChange} required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Telefone">Telefone</label>
          <input
            type="tel" id="Telefone" name="Telefone" className="form-control"
            value={formData.Telefone} onChange={handleChange} placeholder="Ex: 5515999999999 ou 15999999999" required
          />
           <small className="form-text text-muted">
            Inclua DDI e DDD. Ex: 5515988041234.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="Vencimento">Data de Vencimento</label>
          <input
            type="text" id="Vencimento" name="Vencimento" className="form-control"
            value={formData.Vencimento} onChange={handleChange} placeholder="DD/MM/AAAA" required maxLength="10"
          />
        </div>

        <div className="form-group">
          <label htmlFor="Valor">Valor (R$)</label>
          <input
            type="number" id="Valor" name="Valor" className="form-control"
            value={formData.Valor} onChange={handleChange} placeholder="Ex: 123.45"
            step="0.01" min="0.01" required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Status">Status</label>
          <select id="Status" name="Status" className="form-control" value={formData.Status} onChange={handleChange}>
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="Atrasado">Atrasado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className="form-group mt-3" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/clientes')} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (isEditing ? 'Atualizando...' : 'Cadastrando...') : (isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClienteForm;