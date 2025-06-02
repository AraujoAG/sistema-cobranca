// frontend/src/pages/EditarCliente.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClienteForm from '../components/ClienteForm';
import api from '../services/api';

function EditarCliente() {
  const { id } = useParams(); // Pega o ID da URL
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Renomeado

  const carregarCliente = useCallback(async () => {
    if (!id) {
      setError("ID do cliente não fornecido na URL.");
      setLoading(false);
      navigate("/clientes"); // Redireciona se não houver ID
      return;
    }
    setLoading(true);
    setError('');
    console.log(`Carregando cliente para edição, ID: ${id}`);

    try {
      // Opcional: "Acordar" o backend do Render.
      // await api.get('/test');
      // console.log('Teste de conexão com backend OK para editar cliente.');

      // Busca o cliente específico pela API (assumindo que o backend tem a rota /clientes/:id)
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
      // Em caso de erro, pode ser útil não definir cliente como null para não perder o ID na URL
      // ou redirecionar para a lista de clientes.
      // setCliente(null);
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
      <div>
        <h1>Erro ao Editar Cliente</h1>
        <div className="alert alert-danger" role="alert">{error}</div>
        <Link to="/clientes" className="btn btn-primary">Voltar para Clientes</Link>
      </div>
    );
  }

  if (!cliente) {
    // Este caso pode ser coberto pelo 'error' se a API retornar 404,
    // mas é uma boa verificação adicional.
    return (
      <div>
        <h1>Cliente Não Encontrado</h1>
        <div className="alert alert-warning" role="alert">
          O cliente que você está tentando editar não foi encontrado.
        </div>
        <Link to="/clientes" className="btn btn-primary">Voltar para Clientes</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Editar Cliente: {cliente.Nome}</h1>
      <ClienteForm cliente={cliente} isEditing={true} />
    </div>
  );
}

export default EditarCliente;