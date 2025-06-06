// backend/services/whatsappService.js
const { Client, LegacySessionAuth, NoWebCache } = require('whatsapp-web.js'); // <-- 1. IMPORTAR O NoWebCache
const db = require('../config/db');
const qrcode = require('qrcode-terminal');

// ... (as funções saveSession e fetchSession permanecem exatamente as mesmas) ...
async function saveSession(session) {
  try {
    console.log('💾 Salvando sessão no banco de dados...');
    const query = `
        INSERT INTO whatsapp_session (id, session_data) VALUES (1, $1)
        ON CONFLICT (id) DO UPDATE SET session_data = $1;
    `;
    await db.query(query, [session]);
    console.log('✅ Sessão salva com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao salvar sessão no banco de dados:', error);
  }
}

async function fetchSession() {
  try {
    console.log('🔎 Buscando sessão salva no banco de dados...');
    const { rows } = await db.query('SELECT session_data FROM whatsapp_session WHERE id = 1');
    if (rows.length > 0) {
      console.log('✅ Sessão encontrada no banco de dados.');
      return rows[0].session_data;
    }
    console.log('ℹ️ Nenhuma sessão salva encontrada.');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar sessão no banco de dados:', error);
    return null;
  }
}

let client;
let qrCodeString = null;
let clientStatus = 'DESCONECTADO';
let statusMessage = 'Serviço não inicializado.';

async function initializeClient() {
  console.log('Iniciando o processo de inicialização do cliente WhatsApp...');
  const savedSession = await fetchSession();

  client = new Client({
    authStrategy: new LegacySessionAuth({
      session: savedSession || undefined
    }),
    webCache: new NoWebCache(), // <-- 2. ADICIONAR ESTA OPÇÃO PARA DESATIVAR O CACHE
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
    }
  });

  // ... (O resto do arquivo, com client.on('qr'), client.on('ready'), etc., permanece exatamente o mesmo) ...
  client.on('qr', qr => {
    qrCodeString = qr;
    clientStatus = 'AGUARDANDO_QR';
    statusMessage = 'QR Code gerado. Por favor, escaneie.';
    console.log('QR Code Recebido, pronto para escanear.');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    qrCodeString = null;
    clientStatus = 'PRONTO';
    statusMessage = 'WhatsApp conectado e pronto para enviar mensagens!';
    console.log('✅ Cliente WhatsApp está pronto!');
  });
  
  client.on('authenticated', async (session) => {
    console.log('✅ Sessão do WhatsApp autenticada.');
    if(session) {
      await saveSession(session);
    }
  });

  client.on('auth_failure', msg => {
    clientStatus = 'FALHA_AUTENTICACAO';
    statusMessage = `Falha na autenticação: ${msg}. Removendo sessão do banco.`;
    console.error('❌ Falha na autenticação do WhatsApp:', msg);
    db.query('DELETE FROM whatsapp_session WHERE id = 1');
  });

  client.on('disconnected', (reason) => {
    clientStatus = 'DESCONECTADO';
    statusMessage = `WhatsApp desconectado: ${reason}.`;
    console.warn(`🔌 WhatsApp foi desconectado! Razão: ${reason}`);
  });

  console.log('Disparando client.initialize()...');
  client.initialize().catch(err => {
      console.error("ERRO CRÍTICO AO INICIALIZAR O CLIENTE:", err)
      clientStatus = 'FALHA_INICIALIZACAO';
      statusMessage = 'Erro crítico ao inicializar o cliente WhatsApp.'
  });
}

function getQRCode() {
  return qrCodeString;
}

function getClientStatus() {
  return { status: clientStatus, message: statusMessage };
}

async function sendWhatsappMessage(number, message) {
  if (clientStatus !== 'PRONTO') {
    return { success: false, error: `Cliente não está pronto. Status atual: ${clientStatus}` };
  }
  try {
    const chatId = `${number}@c.us`;
    const response = await client.sendMessage(chatId, message);
    return { success: true, messageId: response.id.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function logoutClient() {
    if (!client) return;
    try {
        await client.logout();
        await db.query('DELETE FROM whatsapp_session WHERE id = 1');
        clientStatus = 'DESCONECTADO';
        statusMessage = 'Sessão encerrada com sucesso.';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

module.exports = {
  initializeClient,
  getQRCode,
  getClientStatus,
  sendWhatsappMessage,
  logoutClient
};