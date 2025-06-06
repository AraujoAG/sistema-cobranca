// backend/controllers/cobrancasController.js
const persistenceService = require('../bot/persistenceService');
const whatsappService = require('../services/whatsappService');
const db = require('../config/db');
const processaBoletos = require('../bot/processaBoletos');

exports.obterHistorico = async (req, res) => {
  try {
    const historicoCompleto = await persistenceService.carregarHistorico();
    res.json(historicoCompleto.mensagensEnviadas || []);
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ erro: 'Erro ao obter histórico', detalhes: error.message });
  }
};

exports.dispararCobrancas = async (req, res) => {
  try {
    const resultadoProcessamento = await processaBoletos();
    res.json({ mensagem: 'Processo de cobrança para clientes pendentes iniciado.', ...resultadoProcessamento });
  } catch (error) {
    console.error('Erro ao disparar cobranças:', error);
    res.status(500).json({ erro: 'Erro ao disparar cobranças', detalhes: error.message });
  }
};

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

exports.dispararCobrancaIndividual = async (req, res) => {
  try {
    const { id: clienteId } = req.body;
    if (!clienteId) return res.status(400).json({ erro: 'ID do cliente não fornecido' });
    const { rows, rowCount } = await db.query('SELECT * FROM clientes WHERE id = $1', [clienteId]);
    if (rowCount === 0) return res.status(404).json({ erro: 'Cliente não encontrado' });

    const boletoParaEnvio = {...rows[0], ID: rows[0].id, Nome: rows[0].nome, Valor: rows[0].valor, Vencimento: rows[0].vencimento, Telefone: rows[0].telefone};
    const mensagemTexto = gerarMensagem(boletoParaEnvio);
    const numeroFormatado = String(boletoParaEnvio.Telefone).replace(/\D/g, '');

    const resultadoEnvio = await whatsappService.sendWhatsappMessage(numeroFormatado, mensagemTexto);

    if (resultadoEnvio.success) {
      await persistenceService.registrarMensagemEnviada(boletoParaEnvio, 'enviado', mensagemTexto, resultadoEnvio.messageId);
      res.json({ mensagem: 'Cobrança enviada com sucesso', detalhes: resultadoEnvio });
    } else {
      await persistenceService.registrarMensagemEnviada(boletoParaEnvio, 'falha', mensagemTexto, resultadoEnvio.error);
      res.status(500).json({ erro: 'Falha ao enviar cobrança', detalhes: resultadoEnvio.error });
    }
  } catch (error) {
    console.error('Erro crítico em dispararCobrancaIndividual:', error);
    res.status(500).json({ erro: 'Erro crítico ao disparar cobrança', detalhes: error.message });
  }
};