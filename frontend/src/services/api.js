// frontend/src/services/api.js
import axios from 'axios';

// Criando instância do axios com a URL correta
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://sistema-cobranca-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // Aumenta o timeout para evitar problemas de conexão
  timeout: 15000,
  // Permite credenciais para CORS
  withCredentials: true
});

// Adiciona interceptor para tratar erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erro na API:', error);
    // Você pode tratar erros específicos aqui
    return Promise.reject(error);
  }
);

export default api;