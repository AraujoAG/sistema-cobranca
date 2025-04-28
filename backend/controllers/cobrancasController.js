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
    
    console.log('Iniciando envio de cobrança individual para ID:', id);
    
    // Ler dados do Excel
    const arquivoBoletos = path.join(__dirname, '../bot/boletos.xlsx');
    console.log('Lendo arquivo Excel:', arquivoBoletos);
    
    const workbook = xlsx.readFile(arquivoBoletos);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const boletos = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`Encontrados ${boletos.length} boletos no arquivo`);
    
    // Encontrar o boleto específico
    const boleto = boletos.find(b => b.ID === id);
    
    if (!boleto) {
      console.log('Boleto não encontrado para ID:', id);
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    console.log('Dados do boleto encontrado:', JSON.stringify(boleto));
    
    // Gerar a mensagem de cobrança
    // Função para gerar a mensagem personalizada com base no tempo de atraso
    const gerarMensagem = (boleto) => {
      const { Nome, Vencimento, Valor } = boleto;
      const valorFormatado = parseFloat(Valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      return `Olá ${Nome}, é a Alta Linha Móveis!\n\nGostaríamos de lembrá-lo que seu boleto no valor de ${valorFormatado} vence em ${Vencimento}.\n\nCaso já tenha efetuado o pagamento, por gentileza desconsidere esta mensagem.\n\nAtenciosamente,\nEquipe Alta Linha Móveis 📞 (15) 3222-3333`;
    };
    
    const mensagem = gerarMensagem(boleto);
    console.log('Mensagem gerada:', mensagem.substring(0, 100) + '...');
    
    // Prepara número formatado
    const numeroFormatado = boleto.Telefone.toString().replace(/\D/g, '');
    console.log('Número formatado:', numeroFormatado);
    
    // Enviar mensagem com retentativas
    let tentativas = 0;
    let enviado = false;
    
    while (tentativas < 3 && !enviado) {
      tentativas++;
      console.log(`Tentativa ${tentativas} de envio para ${boleto.Nome}`);
      
      try {
        enviado = await sendMessage(numeroFormatado, mensagem);
        
        if (!enviado && tentativas < 3) {
          console.log('Aguardando 5 segundos antes da próxima tentativa...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (envioError) {
        console.error(`Erro na tentativa ${tentativas}:`, envioError.message);
        if (tentativas < 3) {
          console.log('Tentando novamente após o erro...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    // Registrar no histórico
    if (enviado) {
      persistenceService.registrarMensagemEnviada(boleto, 'enviado');
      console.log('Mensagem registrada com sucesso no histórico');
      res.json({ 
        mensagem: 'Cobrança enviada com sucesso', 
        tentativas: tentativas,
        detalhes: 'Mensagem registrada no histórico'
      });
    } else {
      persistenceService.registrarMensagemEnviada(boleto, 'falha');
      console.log('Falha registrada no histórico');
      res.status(500).json({ 
        erro: 'Falha ao enviar cobrança', 
        tentativas: tentativas,
        detalhes: 'Todas as tentativas falharam'
      });
    }
  } catch (error) {
    console.error('Erro detalhado:', error);
    res.status(500).json({ 
      erro: 'Erro ao disparar cobrança individual', 
      detalhes: error.message,
      stack: error.stack
    });
  }
};