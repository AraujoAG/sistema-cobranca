// backend/testarAPI.js
const { sendMessage } = require('./bot/sendMessage');

async function testarEnvioMensagem() {
  console.log('Iniciando teste de envio de mensagem...');
  
  // Seu número já registrado no CallMeBot
  const seuNumero = '5515988049936';
  
  // Mensagem de teste
  const mensagemTeste = 'Teste da API CallMeBot - ' + new Date().toLocaleString();
  
  console.log(`Enviando mensagem para ${seuNumero}: "${mensagemTeste}"`);
  
  try {
    const resultado = await sendMessage(seuNumero, mensagemTeste);
    
    if (resultado) {
      console.log('✅ Mensagem de teste enviada com sucesso!');
    } else {
      console.log('❌ Falha ao enviar mensagem de teste.');
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testarEnvioMensagem();