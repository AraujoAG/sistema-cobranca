// backend/bot/index.js
const cron = require('node-cron');
const processaBoletos = require('./processaBoletos');

function agendarTarefas() {
  console.log('📅 Configurando agendamentos do bot...');
  // Por padrão, roda todo dia às 8 da manhã. Você pode mudar isso com variáveis de ambiente.
  const horarioProcessamento = process.env.CRON_HORARIO_PROCESSAMENTO || '0 8 * * *';
  
  if (cron.validate(horarioProcessamento)) {
    console.log(`Agendando processamento de boletos para: ${horarioProcessamento}`);
    cron.schedule(horarioProcessamento, () => {
      console.log(`⏰ CRON: Execução de processaBoletos iniciada às ${new Date().toLocaleTimeString('pt-BR')}.`);
      processaBoletos();
    }, { timezone: "America/Sao_Paulo" });
  } else {
    console.error(`❌ Expressão cron inválida: ${horarioProcessamento}`);
  }
}

async function main() {
  console.log('🚀 Iniciando Tarefas Agendadas do Bot...');
  agendarTarefas();
  console.log('✅ Tarefas do bot agendadas.');
}

module.exports = { main };