// backend/controllers/cobrancasController.js
const persistenceService = require('../bot/persistenceService');
const { sendMessage } = require('../bot/sendMessage');
const processaBoletos = require('../bot/processaBoletos');
const path = require('path');
const xlsx = require('xlsx');

exports.obterHistorico = (req, res) => {
  try {
    // Inicializar serviço de persistência
    persistenceService.initializeHistoricoFile();
    
    // Obter histórico
    const historico = persistenceService.carregarHistorico();
    
    res.json(historico.mensagensEnviadas);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter histórico', detalhes: error.message });
  }
};

exports.dispararCobrancas = async (req, res) => {
  try {
    // Chamar o módulo de processamento de boletos
    await processaBoletos();
    
    res.json({ mensagem: 'Processo de cobrança iniciado com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao disparar cobranças', detalhes: error.message });
  }
};

exports.dispararCobrancaIndividual = async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ erro: 'ID do cliente não fornecido' });
    }
    
    // Ler dados do Excel
    const arquivoBoletos = path.join(__dirname, '../bot/boletos.xlsx');
    const workbook = xlsx.readFile(arquivoBoletos);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const boletos = xlsx.utils.sheet_to_json(worksheet);
    
    // Encontrar o boleto específico
    const boleto = boletos.find(b => b.ID === id);
    
    if (!boleto) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    // Gerar a mensagem de cobrança
    // Nota: Como o código completo do processaBoletos está truncado, adaptamos aqui
    // Esta função deverá ser implementada conforme seu código original
    // Esta é uma implementação simplificada
    const gerarMensagem = (boleto) => {
      const { Nome, Vencimento, Valor } = boleto;
      const valorFormatado = parseFloat(Valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      return `Olá ${Nome}, é a Alta Linha Móveis!\n\nGostaríamos de lembrá-lo que seu boleto no valor de ${valorFormatado} vence em ${Vencimento}.\n\nCaso já tenha efetuado o pagamento, por gentileza desconsidere esta mensagem.\n\nAtenciosamente,\nEquipe Alta Linha Móveis 📞 (15) 3222-3333`;
    };
    
    const mensagem = gerarMensagem(boleto);
    
    // Enviar mensagem
    const resultado = await sendMessage(boleto.Telefone, mensagem);
    
    // Registrar no histórico
    if (resultado) {
      persistenceService.registrarMensagemEnviada(boleto, 'enviado');
      res.json({ mensagem: 'Cobrança enviada com sucesso' });
    } else {
      res.status(500).json({ erro: 'Falha ao enviar cobrança' });
    }
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao disparar cobrança individual', detalhes: error.message });
  }
};