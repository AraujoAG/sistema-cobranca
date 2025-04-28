// frontend/src/services/api.js
import axios from 'axios';

// Criando instância do axios com a URL correta
const api = axios.create({
  baseURL: 'https://sistema-cobranca-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // Permite envio de credenciais (cookies)
  withCredentials: true,
  // Aumenta o timeout para aplicações hospedadas no Render (que podem demorar para "acordar")
  timeout: 15000
});

// Adiciona interceptador para logar requisições (ajuda no debug)
api.interceptors.request.use(config => {
  console.log(`Fazendo requisição para: ${config.url}`);
  return config;
});

// Adiciona interceptador para tratar erros
api.interceptors.response.use(
  response => {
    console.log(`Resposta recebida de: ${response.config.url}`);
    return response;
  },
  error => {
    console.error('Erro na API:', error.message);
    
    // Detalhes adicionais para depuração
    if (error.response) {
      console.error('Detalhes do erro:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('Erro na requisição (sem resposta):', error.request);
    }
    
    return Promise.reject(error);
  }
);

export default api;