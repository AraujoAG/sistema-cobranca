// backend/controllers/dashboardController.js
const persistenceService = require('../bot/persistenceService');
const path = require('path');
const xlsx = require('xlsx');

// Arquivo Excel dos boletos
const arquivoBoletos = path.join(__dirname, '../bot/boletos.xlsx');

exports.obterResumo = (req, res) => {
  try {
    // Inicializar serviço de persistência se necessário
    persistenceService.initializeHistoricoFile();
    
    // Ler dados do Excel
    const workbook = xlsx.readFile(arquivoBoletos);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const boletos = xlsx.utils.sheet_to_json(worksheet);
    
    // Obter histórico de cobranças
    const historico = persistenceService.carregarHistorico();
    
    // Calcular estatísticas
    const hoje = new Date();
    let boletosVencidos = 0;
    let boletosAVencer = 0;
    let valorTotal = 0;
    
    boletos.forEach(boleto => {
      const partes = boleto.Vencimento.split('/');
      const dataVencimento = new Date(partes[2], partes[1] - 1, partes[0]);
      
      valorTotal += parseFloat(boleto.Valor);
      
      if (dataVencimento < hoje) {
        boletosVencidos++;
      } else {
        boletosAVencer++;
      }
    });
    
    // Preparar resumo
    const resumo = {
      totalClientes: boletos.length,
      boletosVencidos,
      boletosAVencer,
      valorTotal,
      mensagensEnviadas: historico.mensagensEnviadas.length,
      ultimaExecucao: historico.ultimaExecucao
    };
    
    res.json(resumo);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter resumo', detalhes: error.message });
  }
};

exports.obterEstatisticas = (req, res) => {
  try {
    // Inicializar serviço de persistência
    persistenceService.initializeHistoricoFile();
    
    // Obter estatísticas do serviço
    const estatisticas = persistenceService.obterEstatisticas();
    
    res.json(estatisticas);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter estatísticas', detalhes: error.message });
  }
};