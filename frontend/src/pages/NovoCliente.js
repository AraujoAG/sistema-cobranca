// frontend/src/pages/NovoCliente.js
import React from 'react';
import ClienteForm from '../components/ClienteForm';

function NovoCliente() {
  return (
    <div>
      <h1>Cadastrar Novo Cliente</h1>
      <p>Preencha os dados abaixo para adicionar um novo cliente e seu respectivo boleto.</p>
      {/* O componente ClienteForm sem props 'cliente' e 'isEditing'
          funcionará no modo de criação. */}
      <ClienteForm />
    </div>
  );
}

export default NovoCliente;