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
    
    // Garante que o número comece com 55 (Brasil)
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }
    
    console.log(`📤 Preparando envio para ${telefoneFormatado}`);
    
    // IMPORTANTE: Você precisa registrar seu número no CallMeBot antes de usar
    // Visite: https://www.callmebot.com/blog/free-api-whatsapp-messages/
    
    // Codifica a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    // Substitua YOUR_API_KEY pela chave que você obteve do CallMeBot
    // Você precisa obter uma API key registrando seu número no site da CallMeBot
    const apiKey = '3073908'; // Substitua pela sua chave real
    
    // Cria a URL da API
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${telefoneFormatado}&text=${mensagemCodificada}&apikey=${apiKey}`;
    
    // Faz a requisição HTTP
    const response = await axios.get(apiUrl);
    
    // Verifica a resposta
    if (response.status === 200) {
      console.log(`✅ Mensagem enviada com sucesso para ${telefoneFormatado}`);
      return true;
    } else {
      console.error(`❌ Falha ao enviar mensagem para ${telefoneFormatado}:`, response.data);
      return false;
    }
  } catch (err) {
    console.error(`❌ Erro ao enviar mensagem para ${numero}:`, err.message);
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