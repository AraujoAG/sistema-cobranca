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
    
    try {
      // Cria um arquivo padrão se não existir
      console.log('Criando arquivo de boletos padrão...');
      const xlsx = require('xlsx');
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.aoa_to_sheet([
        ['ID', 'Nome', 'Telefone', 'Vencimento', 'Valor', 'Status']
      ]);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Boletos');
      xlsx.writeFile(workbook, arquivoBoletos);
      console.log('✅ Arquivo de boletos criado com sucesso.');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar arquivo de boletos:', error);
      return false;
    }
  }
  console.log('✅ Arquivo de boletos encontrado.');
  return true;
}

// Função para agendar o envio de mensagens
function agendarEnvioDeMensagem() {
  console.log('📅 Agendamento diário configurado para 8h da manhã...');
  
  // Correção na expressão cron para executar às 8h da manhã
  // O formato é: segundos(0-59) minutos(0-59) horas(0-23) dia(1-31) mês(1-12) dia-semana(0-6)
  try {
    cron.schedule('0 0 8 * * *', async () => {
      console.log('▶️ Execução diária iniciada às 8h...');
      if (verificarArquivo()) {
        await processaBoletos();
      }
    });
    console.log('✅ Agendamento para 8h configurado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao configurar agendamento para 8h:', error);
  }
  
  // Agendamento para gerar relatório no final do dia (18h)
  try {
    cron.schedule('0 0 18 * * *', () => {
      console.log('📊 Gerando relatório diário às 18h...');
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
    console.log('✅ Agendamento para relatório às 18h configurado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao configurar agendamento para relatório:', error);
  }
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
    console.log('✅ Cliente WhatsApp inicializado.');
    
    // Verifica se o arquivo existe antes de processar
    if (verificarArquivo()) {
      // Configuração para não processar automaticamente no início
      // Apenas se a variável de ambiente estiver configurada
      if (process.env.PROCESSAR_INICIO === 'true') {
        console.log('⚙️ Processamento inicial configurado, executando...');
        await processaBoletos();
      } else {
        console.log('⚙️ Processamento inicial desativado, aguardando agendamento ou acionamento manual.');
      }
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