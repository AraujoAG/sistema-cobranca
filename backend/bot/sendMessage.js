// backend/bot/sendMessage.js
const axios = require('axios');

// Simulação de estado do cliente para compatibilidade com código existente
let clientReady = true;

// Função para inicializar (mantida para compatibilidade com código existente)
async function initializeWhatsApp() {
  console.log("Cliente WhatsApp API inicializado...");
  return true;
}

// Função para enviar a mensagem usando CallMeBot API
async function sendMessage(numero, mensagem) {
  try {
    // Formata o número conforme necessário
    let telefoneFormatado = numero.toString().trim();
    
    // Remove qualquer caractere não numérico
    telefoneFormatado = telefoneFormatado.replace(/\D/g, '');
    
    // Garante que o número comece com 55 (Brasil)
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }
    
    console.log(`📤 Preparando envio para ${telefoneFormatado}`);
    
    // Codifica a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    // API key confirmada para o número 5515988049936
    const apiKey = '3073908';
    
    // Cria a URL da API
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${telefoneFormatado}&text=${mensagemCodificada}&apikey=${apiKey}`;
    
    console.log('Enviando requisição para CallMeBot API...');
    
    // Faz a requisição HTTP com timeout e validação de status
    const response = await axios.get(apiUrl, {
      timeout: 15000, // 15 segundos de timeout
      validateStatus: function (status) {
        return status < 500; // Aceita status codes menores que 500
      }
    });
    
    // Log detalhado da resposta para diagnóstico
    console.log(`Resposta da API - Status: ${response.status}`);
    if (response.data) {
      console.log(`Conteúdo da resposta: ${typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}`);
    }
    
    // Verifica a resposta
    if (response.status === 200) {
      // Mesmo com status 200, a API pode retornar mensagens de erro no corpo
      if (response.data && typeof response.data === 'string') {
        if (response.data.includes('ERROR') || 
            response.data.includes('Error') || 
            response.data.includes('error')) {
          console.error(`⚠️ Erro retornado pela API: ${response.data}`);
          return false;
        }
        
        if (response.data.includes('Message Sent')) {
          console.log(`✅ Mensagem enviada com sucesso para ${telefoneFormatado}`);
          return true;
        }
      }
      
      // Se chegou aqui, assumimos que deu certo (status 200 sem erro explícito no corpo)
      console.log(`✅ Mensagem provavelmente enviada com sucesso para ${telefoneFormatado}`);
      return true;
    } else {
      console.error(`❌ Falha ao enviar mensagem para ${telefoneFormatado}: HTTP ${response.status}`);
      console.error(`Detalhes da falha: ${response.data}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Erro ao enviar mensagem para ${numero}:`, err.message);
    
    // Log detalhado para diferentes tipos de erro axios
    if (err.response) {
      // A API respondeu com status de erro
      console.error('Detalhes do erro da API:', err.response.status, err.response.data);
    } else if (err.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta da API. Possível timeout ou problema de rede');
    } else {
      // Erro na configuração da requisição
      console.error('Erro na configuração da requisição:', err.message);
    }
    
    // Verifica se é um erro de timeout
    if (err.code === 'ECONNABORTED') {
      console.error('A requisição excedeu o tempo limite (timeout)');
    }
    
    return false;
  }
}

// Função para aguardar (mantida para compatibilidade)
async function waitForWhatsAppReady() {
  return true; // Sempre pronto com a API
}

module.exports = {
  initializeWhatsApp,
  sendMessage
};