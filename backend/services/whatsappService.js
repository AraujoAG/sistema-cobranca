// backend/services/whatsappService.js
const { Client, RemoteAuth } = require('whatsapp-web.js');
const PgStore = require('./pgStore'); // <-- MUDANÇA AQUI: Usando nosso arquivo local
const qrcode = require('qrcode-terminal');

console.log('Inicializando o serviço do WhatsApp com armazenamento via PostgreSQL (Custom Store)...');

// 1. Crie uma instância do nosso 'Store' customizado
const store = new PgStore({
    tableName: 'wwebjs_sessions'
});

// 2. Configure a estratégia de autenticação remota, passando o 'store'
const authStrategy = new RemoteAuth({
    clientId: 'bot-alta-linha', // Dê um ID único para esta sessão
    store: store,
    backupSyncIntervalMs: 300000 // Salva a sessão no BD a cada 5 minutos
});

// 3. O resto do código permanece o mesmo de antes
const client = new Client({
    authStrategy: authStrategy,
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

// ... COPIE E COLE O RESTO DO CÓDIGO DO `whatsappService.js` DA MINHA RESPOSTA ANTERIOR AQUI ...
// (A parte com client.on('qr'), client.on('ready'), initializeClient(), etc., é exatamente a mesma)

// ... (Resto do código igual) ...
let qrCodeString = null;
let clientStatus = 'DESCONECTADO';
let statusMessage = 'Serviço não inicializado.';

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

client.on('remote_session_saved', () => {
    console.log('💾 Sessão remota salva no banco de dados com sucesso.');
});

client.on('auth_failure', msg => {
    clientStatus = 'FALHA_AUTENTICACAO';
    statusMessage = `Falha na autenticação: ${msg}.`;
    console.error('❌ Falha na autenticação do WhatsApp:', msg);
});

client.on('disconnected', (reason) => {
    clientStatus = 'DESCONECTADO';
    statusMessage = `WhatsApp desconectado: ${reason}.`;
    console.warn(`🔌 WhatsApp foi desconectado! Razão: ${reason}`);
});

function initializeClient() {
    if (clientStatus === 'DESCONECTADO' || clientStatus === 'FALHA_AUTENTICACAO') {
        console.log('Iniciando cliente WhatsApp...');
        clientStatus = 'INICIALIZANDO';
        statusMessage = 'Iniciando o cliente WhatsApp...';
        client.initialize();
    } else {
        console.log('Cliente WhatsApp já está inicializado ou em processo.');
    }
}

function getQRCode() {
    return qrCodeString;
}

function getClientStatus() {
    return { status: clientStatus, message: statusMessage };
}

async function sendWhatsappMessage(number, message) {
    if (clientStatus !== 'PRONTO') {
        console.error('Tentativa de enviar mensagem, mas o cliente não está pronto. Status:', clientStatus);
        return { success: false, error: `Cliente não está pronto. Status atual: ${clientStatus}` };
    }
    try {
        const chatId = `${number}@c.us`;
        const response = await client.sendMessage(chatId, message);
        console.log(`Mensagem enviada com sucesso para ${number}. ID da mensagem: ${response.id.id}`);
        return { success: true, messageId: response.id.id };
    } catch (error) {
        console.error(`Falha ao enviar mensagem para ${number}:`, error);
        return { success: false, error: error.message };
    }
}

async function logoutClient() {
    try {
        await client.logout();
        clientStatus = 'DESCONECTADO';
        statusMessage = 'Sessão encerrada com sucesso.';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        statusMessage = 'Erro ao tentar encerrar a sessão.';
    }
}

module.exports = {
    initializeClient,
    getQRCode,
    getClientStatus,
    sendWhatsappMessage,
    logoutClient
};