// frontend/src/components/ClienteForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate }
import api from '../services/api';

function ClienteForm({ cliente, isEditing = false }) { // Default isEditing to false
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Nome: '',
    Telefone: '',
    Vencimento: '', // Formato esperado: DD/MM/AAAA
    Valor: '',
    Status: 'Pendente'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Renomeado para evitar conflito
  const [success, setSuccess] = useState(''); // Renomeado para evitar conflito

  useEffect(() => {
    if (isEditing && cliente) {
      // Preenche o formulário com dados do cliente para edição
      // Assegura que o valor seja uma string para o input number
      // e que a data de vencimento esteja no formato esperado se vier diferente.
      setFormData({
        Nome: cliente.Nome || '',
        Telefone: cliente.Telefone || '',
        Vencimento: cliente.Vencimento || '', // Assumindo que já vem como DD/MM/AAAA
        Valor: cliente.Valor !== undefined ? String(cliente.Valor) : '',
        Status: cliente.Status || 'Pendente'
      });
    } else {
      // Limpa o formulário para novo cliente
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
    if (!/^(55)?\d{10,11}$/.test(telefoneNumerico)) { // Aceita 55 + 10 ou 11 dígitos, ou só 10 ou 11 dígitos
      return 'Telefone inválido. Formato esperado: (55)XXYYYYYYYYY ou XXYYYYYYYYY.';
    }

    if (!formData.Vencimento.trim()) return 'A Data de Vencimento é obrigatória.';
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.Vencimento)) {
      return 'Formato de Data de Vencimento inválido. Use DD/MM/AAAA.';
    }
    // Poderia adicionar validação da data em si (ex: mês válido, dia válido)

    if (!formData.Valor || isNaN(parseFloat(formData.Valor)) || parseFloat(formData.Valor) <= 0) {
      return 'O Valor deve ser um número positivo.';
    }
    return ''; // Sem erros
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

    // Opcional: "Acordar" o backend do Render. Pode ser removido se a API estiver estável.
    try {
      await api.get('/test');
      console.log('Teste de conexão com backend OK antes de salvar cliente.');
    } catch (testConnError) {
      console.warn('Falha no teste de conexão (wake-up call):', testConnError.message);
      // Não necessariamente impede o envio, mas é um aviso.
    }

    const dataToSend = {
      ...formData,
      Valor: parseFloat(formData.Valor),
      // Garante que o telefone seja apenas números, opcionalmente com 55
      Telefone: formData.Telefone.replace(/\D/g, '')
    };
     // Adiciona DDI 55 se não tiver e for um número brasileiro válido
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
        // Limpar formulário após cadastro bem-sucedido
        setFormData({ Nome: '', Telefone: '', Vencimento: '', Valor: '', Status: 'Pendente' });
      }

      setTimeout(() => {
        navigate('/clientes');
      }, 2000);

    } catch (apiError) {
      console.error('Erro ao salvar cliente:', apiError);
      const errorMsg = apiError.response?.data?.erro || apiError.response?.data?.detalhes || apiError.message || 'Erro desconhecido ao salvar.';
      setError(`Falha ao salvar: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
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
          <label htmlFor="Telefone">Telefone</label>
          <input
            type="tel" // Mudei para "tel" para melhor semântica e possível formatação mobile
            id="Telefone"
            name="Telefone"
            className="form-control"
            value={formData.Telefone}
            onChange={handleChange}
            placeholder="Ex: 5515999999999 ou 15999999999"
            required
          />
           <small className="form-text text-muted">
            Inclua DDI e DDD. Ex: 5515988041234.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="Vencimento">Data de Vencimento</label>
          <input
            type="text" // Pode usar type="date" mas o formato DD/MM/AAAA exige input text com máscara ou validação
            id="Vencimento"
            name="Vencimento"
            className="form-control"
            value={formData.Vencimento}
            onChange={handleChange}
            placeholder="DD/MM/AAAA"
            required
            maxLength="10"
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
            placeholder="Ex: 123.45"
            step="0.01"
            min="0.01" // Valor mínimo
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

        <div className="form-group mt-3"> {/* Adicionado margin top para espaçamento */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (isEditing ? 'Atualizando...' : 'Cadastrando...') : (isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente')}
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