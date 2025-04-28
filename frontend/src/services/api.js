// frontend/src/services/api.js
import axios from 'axios';

// Obtém a URL da API do ambiente
const API_URL = process.env.REACT_APP_API_URL || 'https://sistema-cobranca-backend.onrender.com/api';

console.log('API URL configurada:', API_URL);

// Criando instância do axios com a URL do .env
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Credenciais CORS apenas se necessário (pode causar problemas)
  withCredentials: false,
  // Aumenta o timeout para aplicações hospedadas no Render (que podem demorar para "acordar")
  timeout: 30000
});

// Adiciona interceptador para logar requisições (ajuda no debug)
api.interceptors.request.use(config => {
  console.log(`Fazendo requisição para: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Adiciona interceptador para tratar erros
api.interceptors.response.use(
  response => {
    console.log(`Resposta recebida de: ${response.config.url} (${response.status})`);
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
      console.error('Erro na requisição (sem resposta). O servidor pode estar offline ou dormindo.');
      
      // Informação especial para Render.com
      if (API_URL.includes('render.com')) {
        console.warn('DICA: Serviços gratuitos no Render.com adormecem após 15 minutos de inatividade. A primeira requisição pode demorar até 30 segundos.');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;