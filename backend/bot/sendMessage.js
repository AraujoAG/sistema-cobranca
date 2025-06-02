// backend/bot/sendMessage.js
const axios = require('axios');

/**
 * Simula a inicialização do WhatsApp. Para a API CallMeBot,
 * não há uma sessão persistente para inicializar da mesma forma que com @wppconnect.
 * Esta função pode ser usada para verificações preliminares, se necessário.
 */
async function initializeWhatsApp() {
  console.log("Verificando configuração para envio de mensagens via API CallMeBot...");
  if (!process.env.CALLMEBOT_API_KEY) {
    console.warn('ATENÇÃO: A variável de ambiente CALLMEBOT_API_KEY não está definida. As mensagens não serão enviadas.');
    return false;
  }
  console.log("Configuração da API CallMeBot verificada.");
  return true; // Indica que a "inicialização" (verificação) foi bem-sucedida.
}

/**
 * Envia uma mensagem via API CallMeBot.
 * @param {string} numero - O número de telefone do destinatário (ex: 5515999999999).
 * @param {string} mensagem - A mensagem a ser enviada.
 * @returns {Promise<boolean>} True se a mensagem foi enviada/encaminhada com sucesso, false caso contrário.
 */
async function sendMessage(numero, mensagem) {
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!apiKey) {
    console.error('ERRO FATAL: CALLMEBOT_API_KEY não está definida. Não é possível enviar a mensagem.');
    return false;
  }

  let telefoneFormatado = numero.toString().trim().replace(/\D/g, '');
  if (!telefoneFormatado.startsWith('55')) {
    // Adiciona o DDI do Brasil se não estiver presente e tiver um tamanho compatível.
    // Ajuste essa lógica se precisar de DDIs de outros países.
    if (telefoneFormatado.length >= 10 && telefoneFormatado.length <= 11) { // Comum para números brasileiros sem 55
        telefoneFormatado = '55' + telefoneFormatado;
    } else if (telefoneFormatado.length === 12 && telefoneFormatado.startsWith('0')) { // Formato como 015...
        telefoneFormatado = '55' + telefoneFormatado.substring(1);
    }
    // Adicione mais validações de formato se necessário
  }


  if (telefoneFormatado.length < 12 || telefoneFormatado.length > 13) { // Ex: 5515999999999 (13) ou 551533333333 (12)
      console.error(`Número de telefone '${numero}' (formatado para '${telefoneFormatado}') parece inválido para envio.`);
      return false;
  }


  console.log(`📤 Preparando envio para ${telefoneFormatado}`);
  const mensagemCodificada = encodeURIComponent(mensagem);

  const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${telefoneFormatado}&text=${mensagemCodificada}&apikey=${apiKey}`;

  try {
    console.log(`Enviando requisição para CallMeBot API para o número ${telefoneFormatado}...`);
    const response = await axios.get(apiUrl, {
      timeout: 20000, // Aumentado para 20 segundos
      validateStatus: function (status) {
        return status < 500; // Aceita códigos de status abaixo de 500 (erros do cliente ou sucesso)
      }
    });

    console.log(`Resposta da API - Status: ${response.status} para ${telefoneFormatado}`);
    const responseDataString = (response.data && typeof response.data !== 'string') ? JSON.stringify(response.data) : response.data;
    console.log(`Conteúdo da resposta: ${responseDataString}`);

    if (response.status === 200) {
      // A API CallMeBot retorna strings no corpo da resposta para indicar sucesso ou erro
      if (responseDataString) {
        if (responseDataString.toLowerCase().includes('error') || responseDataString.toLowerCase().includes('must add the number to the bot first')) {
          console.error(`⚠️ Erro retornado pela API CallMeBot para ${telefoneFormatado}: ${responseDataString}`);
          return false;
        }
        if (responseDataString.includes('Message Sent') || responseDataString.includes('Message queued')) {
          console.log(`✅ Mensagem enviada/encaminhada com sucesso para ${telefoneFormatado}`);
          return true;
        }
      }
      // Se chegou aqui com status 200 mas a resposta não foi clara, pode ser um problema.
      console.warn(`Resposta ambígua da API CallMeBot para ${telefoneFormatado}, mas status 200. Conteúdo: ${responseDataString}`);
      return false; // Mais seguro assumir falha se a confirmação não for explícita
    } else {
      console.error(`❌ Falha na requisição HTTP para ${telefoneFormatado}: Status ${response.status}`);
      console.error(`Detalhes da falha: ${responseDataString}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Erro crítico ao tentar enviar mensagem para ${telefoneFormatado}:`, err.message);
    if (err.response) {
      console.error('Detalhes do erro Axios (response):', err.response.status, err.response.data);
    } else if (err.request) {
      console.error('Detalhes do erro Axios (request): Nenhuma resposta recebida. Timeout ou problema de rede/API.');
    } else {
      console.error('Detalhes do erro Axios (config):', err.message);
    }
    if (err.code === 'ECONNABORTED') {
      console.error('A requisição para CallMeBot API excedeu o tempo limite (timeout).');
    }
    return false;
  }
}

/**
 * Simula a espera pela prontidão do WhatsApp. Para a API CallMeBot,
 * não há um estado de "pronto" da mesma forma que com @wppconnect.
 */
async function waitForWhatsAppReady() {
  console.log("API CallMeBot está sempre 'pronta' se a chave API Key estiver correta e o serviço online.");
  return true;
}

module.exports = {
  initializeWhatsApp,
  sendMessage,
  waitForWhatsAppReady
};