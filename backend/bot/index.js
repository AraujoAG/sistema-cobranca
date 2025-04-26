const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const processaBoletos = require('./processaBoletos');
const { initializeWhatsApp } = require('./sendMessage');
const persistenceService = require('./persistenceService');

// Variáveis de configuração
const arquivoBoletos = path.join(__dirname, 'boletos.xlsx');

// Função para verificar se o arquivo de boletos existe
function verificarArquivo() {
  console.log('Verificando arquivo de boletos...');
  if (!fs.existsSync(arquivoBoletos)) {
    console.error('❌ Arquivo de boletos não encontrado!');
    return false;
  }
  console.log('✅ Arquivo de boletos encontrado.');
  return true;
}

// Função para agendar o envio de mensagens
function agendarEnvioDeMensagem() {
  console.log('📅 Agendamento diário configurado para 8h da manhã...');
  // Correção na expressão cron: segundos minutos horas dia mês dia_semana
  cron.schedule('0 8 * * *', () => {
    console.log('▶️ Execução diária iniciada...');
    if (verificarArquivo()) {
      processaBoletos();
    }
  });
  
  // Opcional: Adicionar agendamento para gerar relatório no final do dia
  cron.schedule('0 18 * * *', () => {
    console.log('📊 Gerando relatório diário...');
    const stats = persistenceService.obterEstatisticas();
    console.log(`
==== RELATÓRIO DIÁRIO ====
Data: ${new Date().toLocaleDateString()}
Mensagens enviadas hoje: ${stats.enviosHoje}
Total histórico: ${stats.totalEnviadas}
Status: ${JSON.stringify(stats.statusContagem)}
==========================
    `);
  });
}

// Função principal
async function main() {
  try {
    console.log('🚀 Iniciando Bot de Cobrança...');
    
    // Inicializa o serviço de persistência
    persistenceService.initializeHistoricoFile();
    console.log('✅ Serviço de persistência inicializado.');
    
    // Inicializa o cliente WhatsApp
    await initializeWhatsApp();
    
    // Verifica se o arquivo existe antes de processar
    if (verificarArquivo()) {
      // Processamento inicial dos boletos
      await processaBoletos();
    }
    
    // Configura o agendamento diário
    agendarEnvioDeMensagem();
    
    console.log('✅ Bot de cobrança inicializado e pronto para uso!');
  } catch (error) {
    console.error('❌ Erro na execução principal:', error);
  }
}

// Inicia o programa
main();