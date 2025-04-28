// backend/testarRoutes.js
const axios = require('axios');

const baseURL = 'https://sistema-cobranca-backend.onrender.com/api';

async function testarRoutes() {
  console.log('Testando rotas da API...');
  
  try {
    // Teste da rota de status
    console.log('Testando /api/test...');
    const statusRes = await axios.get(`${baseURL}/test`);
    console.log('Status da API:', statusRes.data);
    
    // Teste do dashboard
    console.log('Testando /api/dashboard/resumo...');
    const dashboardRes = await axios.get(`${baseURL}/dashboard/resumo`);
    console.log('Resumo do dashboard:', dashboardRes.data);
    
    // Teste de listagem de clientes
    console.log('Testando /api/clientes...');
    const clientesRes = await axios.get(`${baseURL}/clientes`);
    console.log('Clientes:', clientesRes.data.length);
    
    // Teste de histórico de cobrança
    console.log('Testando /api/cobrancas/historico...');
    const historicoRes = await axios.get(`${baseURL}/cobrancas/historico`);
    console.log('Histórico de cobrança:', historicoRes.data.length);
    
    console.log('Todos os testes concluídos com sucesso!');
  } catch (error) {
    console.error('Erro nos testes:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.status, error.response.data);
    }
  }
}

testarRoutes();