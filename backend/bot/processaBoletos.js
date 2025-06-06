// backend/bot/processaBoletos.js
const db = require('../config/db');
const persistenceService = require('./persistenceService');
const whatsappService = require('../services/whatsappService');

const gerarMensagem = (b) => {
    const { Nome, Vencimento, Valor } = b;
    const partes = Vencimento.split('/');
    const dataVencimento = new Date(partes[2], partes[1] - 1, partes[0]);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    dataVencimento.setHours(0,0,0,0);
    const diferencaEmMilissegundos = dataVencimento.getTime() - hoje.getTime();
    const diferencaDias = Math.ceil(diferencaEmMilissegundos / (1000 * 60 * 60 * 24));
    const valorFormatado = parseFloat(Valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    let mensagem = '';
    if (diferencaDias > 0) {
        mensagem = `Olá ${Nome}, da Alta Linha Móveis! Seu boleto de ${valorFormatado} vence em ${diferencaDias} dia(s) (${Vencimento}). Pagou? Desconsidere. Dúvidas? (15)3222-3333.`;
    } else if (diferencaDias === 0) {
        mensagem = `Olá ${Nome}, da Alta Linha Móveis! Seu boleto de ${valorFormatado} vence HOJE (${Vencimento}). Evite juros! Pagou? Desconsidere. Dúvidas? (15)3222-3333.`;
    } else {
        const diasAtraso = Math.abs(diferencaDias);
        mensagem = `Olá ${Nome}, da Alta Linha Móveis! Notamos que seu boleto de ${valorFormatado} (venc. ${Vencimento}) está em aberto há ${diasAtraso} dia(s). Regularize sua situação. Pagou? Desconsidere. Dúvidas? (15)3222-3333.`;
    }
    return mensagem;
};

async function processaBoletos() {
  console.log('⏰ Iniciando o processamento de boletos do BANCO DE DADOS...');
  let clientesPendentes = [];
  try {
    const { rows } = await db.query("SELECT * FROM clientes WHERE status = 'Pendente' OR status = 'Atrasado' ORDER BY id");
    clientesPendentes = rows.map(c => ({...c, ID: c.id, Nome: c.nome, Valor: c.valor, Vencimento: c.vencimento, Telefone: c.telefone}));
    if (clientesPendentes.length === 0) {
      console.log('✅ Nenhum cliente pendente/atrasado para processar.');
      return { enviadosCount: 0, falhasCount: 0, pendentesCount: 0, jaEnviadosCount: 0 };
    }
  } catch (error) {
    console.error('❌ Erro ao buscar clientes pendentes do BD:', error);
    return;
  }
  
  let enviadosCount = 0, falhasCount = 0, jaEnviadosCount = 0;

  for (const boleto of clientesPendentes) {
    if (await persistenceService.verificarMensagemEnviadaHoje(boleto)) {
      jaEnviadosCount++;
      continue;
    }
    
    const mensagem = gerarMensagem(boleto);
    console.log(`🔄 Tentando enviar mensagem para ${boleto.Nome} (ID: ${boleto.ID}).`);
    
    const resultadoEnvio = await whatsappService.sendWhatsappMessage(boleto.Telefone, mensagem);
    
    if (resultadoEnvio.success) {
      await persistenceService.registrarMensagemEnviada(boleto, 'enviado', mensagem, resultadoEnvio.messageId);
      enviadosCount++;
    } else {
      await persistenceService.registrarMensagemEnviada(boleto, 'falha', mensagem, resultadoEnvio.error);
      falhasCount++;
    }
    
    if (clientesPendentes.indexOf(boleto) < clientesPendentes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`📊 Relatório Final do Processamento de Boletos (BD): Enviados=${enviadosCount}, Falhas=${falhasCount}, Já Enviados Hoje=${jaEnviadosCount}`);
  return { enviadosCount, falhasCount, pendentesCount: clientesPendentes.length, jaEnviadosCount };
}

module.exports = processaBoletos;