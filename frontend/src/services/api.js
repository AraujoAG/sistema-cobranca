import axios from 'axios';

// Ambiente de desenvolvimento vs. produção
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Em produção, o backend e frontend estarão no mesmo domínio
  : 'http://localhost:5000/api';  // Em desenvolvimento

const api = axios.create({
  baseURL
});

export const getBoletos = async () => {
  try {
    const response = await api.get('/boletos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar boletos:', error);
    throw error;
  }
};

// Resto das funções continuam iguais...