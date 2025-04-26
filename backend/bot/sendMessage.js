const wppconnect = require('@wppconnect-team/wppconnect');

// Variáveis globais
let client = null;
let clientReady = false;

// Função para inicializar o WhatsApp
async function initializeWhatsApp() {
  if (client) {
    console.log("Cliente WhatsApp já inicializado.");
    return client;
  }

  try {
    console.log("Inicializando cliente WhatsApp...");
    client = await wppconnect.create({
      session: 'cobranca-bot',
      headless: true,
      catchQR: (base64Qr, asciiQR) => {
        console.log('QR CODE RECEBIDO:');
        console.log(asciiQR);
      },
      statusFind: (statusSession, session) => {
        console.log('Status da sessão:', statusSession);
        // Quando o status for 'inChat' ou 'CONNECTED', o cliente está pronto
        if (statusSession === 'inChat' || statusSession === 'CONNECTED') {
          clientReady = true;
        }
      },
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    console.log("✅ Cliente WhatsApp inicializado com sucesso!");
    clientReady = true;
    return client;
  } catch (error) {
    console.error("❌ Erro ao inicializar o cliente WhatsApp:", error);
    throw error;
  }
}

// Função para aguardar até que o WhatsApp esteja pronto
async function waitForWhatsAppReady(maxWaitTime = 60000) {
  const startTime = Date.now();
  
  while (!clientReady) {
    // Verifica se excedeu o tempo máximo de espera
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error("Tempo limite excedido ao aguardar WhatsApp ficar pronto");
    }
    console.log("⚠️ Aguardando WhatsApp ficar pronto...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
  }
  
  console.log("✅ WhatsApp está pronto para enviar mensagens.");
}

// Função para enviar a mensagem
async function sendMessage(numero, mensagem) {
  // Verifica se o cliente existe e está pronto
  if (!client) {
    try {
      await initializeWhatsApp();
    } catch (error) {
      console.error("❌ Não foi possível inicializar o WhatsApp:", error);
      return;
    }
  }
  
  // Aguarda o WhatsApp estar pronto
  try {
    await waitForWhatsAppReady();
    
    // Formata o número conforme necessário para o WPPConnect
    let telefoneFormatado = numero.toString().trim();
    
    // Garante que o número comece com 55 (Brasil)
    if (!telefoneFormatado.startsWith('55')) {
      telefoneFormatado = '55' + telefoneFormatado;
    }
    
    console.log(`📤 Enviando mensagem para ${telefoneFormatado}: ${mensagem.substring(0, 30)}...`);
    
    // Envia a mensagem
    const result = await client.sendText(`${telefoneFormatado}@c.us`, mensagem);
    
    if (result) {
      console.log(`✅ Mensagem enviada com sucesso para ${telefoneFormatado}`);
      return true;
    } else {
      console.error(`❌ Falha ao enviar mensagem para ${telefoneFormatado}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Erro ao enviar mensagem para ${numero}:`, err);
    return false;
  }
}

module.exports = {
  initializeWhatsApp,
  sendMessage
};