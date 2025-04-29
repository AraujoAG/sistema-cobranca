// frontend/src/pages/EditarCliente.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ClienteForm from '../components/ClienteForm';
import api from '../services/api';

function EditarCliente() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregarCliente = async () => {
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
        
        const response = await api.get('/clientes');
        const clienteEncontrado = response.data.find(c => c.ID === id);
        
        if (clienteEncontrado) {
          setCliente(clienteEncontrado);
        } else {
          setErro('Cliente não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        setErro('Erro ao carregar dados do cliente');
      } finally {
        setLoading(false);
      }
    };

    carregarCliente();
  }, [id]);

  if (loading) return <div className="loader"></div>;
  if (erro) return <div className="alert alert-danger">{erro}</div>;
  if (!cliente) return <div className="alert alert-warning">Cliente não encontrado</div>;

  return (
    <div>
      <h1>Editar Cliente</h1>
      <ClienteForm cliente={cliente} isEditing={true} />
    </div>
  );
}

export default EditarCliente;