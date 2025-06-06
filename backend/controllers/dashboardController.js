// backend/controllers/dashboardController.js
const persistenceService = require('../bot/persistenceService');
const db = require('../config/db');

exports.obterResumo = async (req, res) => {
  try {
    const { rows: boletos } = await db.query('SELECT valor, status, vencimento FROM clientes');
    const historicoCompleto = await persistenceService.carregarHistorico();
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    let boletosVencidos = 0;
    let boletosAVencer = 0;
    let valorTotalEmAberto = 0;
    
    boletos.forEach(boleto => {
      if (boleto.status.toLowerCase() === 'pendente' || boleto.status.toLowerCase() === 'atrasado') {
        valorTotalEmAberto += parseFloat(boleto.valor);
        const partes = boleto.vencimento.split('/');
        const dataVencimento = new Date(partes[2], partes[1] - 1, partes[0]);
        dataVencimento.setHours(0,0,0,0);
        if (dataVencimento < hoje) {
          boletosVencidos++;
        } else {
          boletosAVencer++;
        }
      }
    });
    
    const resumo = {
      totalClientes: boletos.length,
      boletosVencidos,
      boletosAVencer,
      valorTotal: valorTotalEmAberto,
      mensagensEnviadas: historicoCompleto.mensagensEnviadas.length,
      ultimaExecucao: historicoCompleto.ultimaExecucao
    };
    
    res.json(resumo);
  } catch (error) {
    console.error('Erro ao obter resumo do dashboard:', error);
    res.status(500).json({ erro: 'Erro ao obter resumo', detalhes: error.message });
  }
};

exports.obterEstatisticas = async (req, res) => {
  try {
    const estatisticas = await persistenceService.obterEstatisticas();
    res.json(estatisticas);
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({ erro: 'Erro ao obter estatísticas', detalhes: error.message });
  }
};