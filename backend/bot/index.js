// backend/bot/index.js
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const processaBoletos = require('./processaBoletos');
const { initializeWhatsApp } = require('./sendMessage'); // Usaremos a versão adaptada
const persistenceService = require('./persistenceService');

const arquivoBoletosPath = path.join(__dirname, 'boletos.xlsx');

// ATENÇÃO: Esta função que verifica e CRIA 'boletos.xlsx' é problemática
// para persistência de dados no Render. O arquivo será perdido.
// Idealmente, a estrutura de dados (tabela/coleção) seria criada no banco de dados.
function verificarECriarArquivoBoletosModelo() {
  console.log(`Verificando arquivo de boletos em: ${arquivoBoletosPath}`);
  if (!fs.existsSync(arquivoBoletosPath)) {
    console.warn('⚠️ Arquivo de boletos não encontrado!');
    try {
      console.log('Tentando criar arquivo de boletos modelo (será efêmero no Render)...');
      const xlsx = require('xlsx'); // Só carrega se necessário
      const workbook = xlsx.utils.book_new();
      // Cabeçalhos esperados
      const worksheetData = [['ID', 'Nome', 'Telefone', 'Vencimento', 'Valor', 'Status']];
      const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Boletos');
      xlsx.writeFile(workbook, arquivoBoletosPath);
      console.log('✅ Arquivo de boletos modelo criado com sucesso.');
      return true; // Arquivo modelo criado
    } catch (error) {
      console.error('❌ Erro crítico ao tentar criar arquivo de boletos modelo:', error);
      return false; // Falha ao criar
    }
  }
  console.log('✅ Arquivo de boletos (ou modelo) encontrado.');
  return true; // Arquivo já existe
}

function agendarTarefas() {
  console.log('📅 Configurando agendamentos do bot...');

  // Agendamento para processar boletos diariamente às 8h da manhã
  // Formato: 'segundo minuto hora diaDoMês mês diaDaSemana'
  //          '* * * * * *' (executa a cada segundo - NÃO USE EM PRODUÇÃO)
  //          '0 0 8 * * *' (executa todo dia às 08:00:00)
  const horarioProcessamento = process.env.CRON_HORARIO_PROCESSAMENTO || '0 0 8 * * *';
  console.log(`Agendado processamento de boletos para: ${horarioProcessamento}`);
  if (cron.validate(horarioProcessamento)) {
    cron.schedule(horarioProcessamento, async () => {
      console.log(`⏰ CRON: Execução diária de processaBoletos iniciada às ${new Date().toLocaleTimeString()}`);
      if (verificarECriarArquivoBoletosModelo()) { // Garante que o arquivo (modelo) exista
        await processaBoletos();
      } else {
        console.error("CRON: Não foi possível verificar/criar o arquivo de boletos modelo. Processamento abortado.");
      }
    }, {
      timezone: "America/Sao_Paulo" // Defina seu fuso horário
    });
    console.log('✅ Agendamento de processamento de boletos configurado.');
  } else {
    console.error(`❌ Expressão cron inválida para processamento: ${horarioProcessamento}`);
  }


  // Agendamento para gerar relatório no final do dia (ex: 18h)
  const horarioRelatorio = process.env.CRON_HORARIO_RELATORIO || '0 0 18 * * *';
  console.log(`Agendado relatório diário para: ${horarioRelatorio}`);
  if (cron.validate(horarioRelatorio)) {
    cron.schedule(horarioRelatorio, () => {
      console.log(`📊 CRON: Gerando relatório diário às ${new Date().toLocaleTimeString()}`);
      const stats = persistenceService.obterEstatisticas(); // Usa o histórico (que também é problemático no Render)
      console.log(`
      ==== RELATÓRIO DIÁRIO DE COBRANÇAS ====
      Data: ${new Date().toLocaleDateString('pt-BR')}
      Total de mensagens enviadas com sucesso (histórico): ${stats.totalEnviadasComSucesso}
      Total de falhas registradas (histórico): ${stats.totalFalhas}
      Envios com sucesso hoje: ${stats.enviosHojeComSucesso}
      Falhas hoje: ${stats.falhasHoje}
      Última execução de processamento: ${stats.ultimoEnvio ? new Date(stats.ultimoEnvio).toLocaleString('pt-BR') : 'Nenhuma'}
      Contagem por status no histórico: ${JSON.stringify(stats.statusContagem)}
      =====================================
      `);
    }, {
      timezone: "America/Sao_Paulo" // Defina seu fuso horário
    });
    console.log('✅ Agendamento de relatório diário configurado.');
  } else {
    console.error(`❌ Expressão cron inválida para relatório: ${horarioRelatorio}`);
  }
}

async function main() {
  console.log('🚀 Iniciando Bot de Cobrança Alta Linha Móveis...');

  // Inicializa o serviço de persistência (cria o arquivo JSON se não existir)
  // Lembre-se: no Render, este arquivo será efêmero.
  persistenceService.initializeHistoricoFile();
  console.log('✅ Serviço de persistência (arquivo JSON local) inicializado.');

  // "Inicializa" o WhatsApp (para CallMeBot, apenas verifica a API Key)
  const whatsappPronto = await initializeWhatsApp();
  if (whatsappPronto) {
    console.log('✅ Simulação de inicialização do WhatsApp (CallMeBot API) concluída.');
  } else {
    console.error('❌ Falha na simulação de inicialização do WhatsApp (CallMeBot API). Verifique a API Key.');
    // Considerar se o bot deve prosseguir ou parar aqui
  }

  // Verifica o arquivo de boletos (cria um modelo se não existir)
  // Lembre-se: no Render, este arquivo será efêmero.
  verificarECriarArquivoBoletosModelo();

  // Processar boletos no início (opcional, controlado por variável de ambiente)
  if (process.env.PROCESSAR_BOLETOS_NO_INICIO === 'true') {
    console.log('⚙️ PROCESSAR_BOLETOS_NO_INICIO está ativo. Processando boletos agora...');
    await processaBoletos();
  } else {
    console.log('ℹ️ Processamento de boletos no início desativado. Aguardando agendamento ou acionamento manual.');
  }

  // Configura os agendamentos (cron jobs)
  agendarTarefas();

  console.log('✅ Bot de cobrança principal inicializado e tarefas agendadas.');
  console.log('💡 Lembre-se: A persistência de dados via arquivos locais (Excel, JSON) não é adequada para o Render.com e resultará em perda de dados. Migre para um banco de dados.');
}

// Para ser chamado pelo server.js
module.exports = { main };

// Se você quisesse rodar este arquivo diretamente (ex: node backend/bot/index.js), descomente:
// main().catch(error => {
//   console.error("❌ Erro fatal na execução principal do bot:", error);
// });