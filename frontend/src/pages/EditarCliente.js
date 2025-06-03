// frontend/src/pages/EditarCliente.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Adicionado Link
import ClienteForm from '../components/ClienteForm';
import api from '../services/api';

function EditarCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregarCliente = useCallback(async () => {
    if (!id) {
      setError("ID do cliente não fornecido na URL.");
      setLoading(false);
      navigate("/clientes");
      return;
    }
    setLoading(true);
    setError('');
    console.log(`Carregando cliente para edição, ID: ${id}`);

    try {
      const response = await api.get(`/clientes/${id}`);
      console.log('Cliente para edição recebido:', response.data);
      setCliente(response.data);
    } catch (apiError) {
      console.error('Erro ao carregar cliente para edição:', apiError);
      let errorMsg = 'Erro ao carregar dados do cliente.';
      if (apiError.response) {
        if (apiError.response.status === 404) {
          errorMsg = `Cliente com ID ${id} não encontrado.`;
        } else {
          errorMsg = apiError.response.data?.erro || apiError.message || errorMsg;
        }
      } else {
        errorMsg = apiError.message || errorMsg;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    carregarCliente();
  }, [carregarCliente]);

  if (loading) {
    return <div className="loader" aria-label="Carregando dados do cliente"></div>;
  }

  if (error) {
    return (
      <div> {/* Envolver em um card para consistência visual */}
        <div className="card-header">
            <h1>Erro ao Editar Cliente</h1>
        </div>
        <div className="card">
            <div className="alert alert-danger" role="alert">{error}</div>
            <Link to="/clientes" className="btn btn-primary">Voltar para Clientes</Link>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div>
        <div className="card-header">
             <h1>Cliente Não Encontrado</h1>
        </div>
        <div className="card">
            <div className="alert alert-warning" role="alert">
            O cliente que você está tentando editar não foi encontrado.
            </div>
            <Link to="/clientes" className="btn btn-primary">Voltar para Clientes</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
        <div className="card-header">
             <h1>Editar Cliente: {cliente.Nome}</h1>
        </div>
      <ClienteForm cliente={cliente} isEditing={true} />
    </div>
  );
}

export default EditarCliente;