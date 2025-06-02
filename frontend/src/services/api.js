// frontend/src/services/api.js
import axios from 'axios';

// Obtém a URL da API do ambiente ou usa um padrão para desenvolvimento/produção.
// Certifique-se de que REACT_APP_API_URL está configurado no seu ambiente do Render.
const API_URL = process.env.REACT_APP_API_URL || 'https://sistema-cobranca-backend.onrender.com/api';

console.log('Frontend configurado para usar API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // `withCredentials: false` é geralmente o padrão e adequado se você não usa cookies
  // de sessão gerenciados pelo browser de forma cross-origin.
  // Se o backend tiver `credentials: true` no CORS, e você precisar enviar cookies,
  // mude para `true` aqui e ajuste o CORS do backend para uma origem específica.
  withCredentials: false,
  timeout: 30000 // Timeout de 30 segundos para acomodar o "cold start" do Render
});

// Interceptor para logar requisições (útil para debug)
api.interceptors.request.use(
  config => {
    console.log(`Enviando requisição: ${config.method ? config.method.toUpperCase() : ''} ${config.url}`);
    // Exemplo: Adicionar token de autenticação se existir
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    console.error('Erro na configuração da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros globalmente
api.interceptors.response.use(
  response => {
    console.log(`Resposta recebida de: ${response.config.url} (Status: ${response.status})`);
    return response;
  },
  error => {
    console.error('Erro na chamada API:', error.message);

    if (error.response) {
      // O servidor respondeu com um status de erro (4xx, 5xx)
      console.error('Detalhes do erro (resposta do servidor):', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url
      });
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      console.error('Erro na requisição (sem resposta do servidor):', error.request);
      if (API_URL.includes('onrender.com') && error.message.includes('Network Error')) {
        console.warn('DICA RENDER: Serviços no plano gratuito podem "dormir" após inatividade. A primeira requisição pode levar mais tempo ou falhar devido ao cold start. Tente novamente em alguns segundos.');
      }
    } else {
      // Algo aconteceu ao configurar a requisição que acionou um erro
      console.error('Erro desconhecido na configuração da requisição Axios:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;