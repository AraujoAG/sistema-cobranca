// frontend/src/pages/NovoCliente.js
import React from 'react';
import ClienteForm from '../components/ClienteForm';

function NovoCliente() {
  return (
    <div> {/* Este div pode ser um .card se quiser o mesmo padding e sombra */}
      <div className="card-header"> {/* Adicionado para consistência */}
         <h1>Cadastrar Novo Cliente</h1>
      </div>
      <p style={{padding: '0 20px 20px 20px'}}>Preencha os dados abaixo para adicionar um novo cliente e seu respectivo boleto.</p>
      <ClienteForm /> {/* O ClienteForm já renderiza um .card */}
    </div>
  );
}

export default NovoCliente;