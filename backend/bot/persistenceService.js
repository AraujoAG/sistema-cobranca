// persistenceService.js
const fs = require('fs');
const path = require('path');

// Arquivo onde será armazenado o histórico de cobranças
const historicoFilePath = path.join(__dirname, 'historico_cobrancas.json');

// Inicializa o arquivo de histórico se não existir
function initializeHistoricoFile() {
  if (!fs.existsSync(historicoFilePath)) {
    try {
      fs.writeFileSync(historicoFilePath, JSON.stringify({ 
        ultimaExecucao: null,
        mensagensEnviadas: []
      }, null, 2));
      console.log('📁 Arquivo de histórico de cobranças criado.');
    } catch (error) {
      console.error('❌ Erro ao criar arquivo de histórico:', error);
    }
  }
}

// Carregar histórico de cobranças
function carregarHistorico() {
  try {
    initializeHistoricoFile();
    const dadosRaw = fs.readFileSync(historicoFilePath, 'utf8');
    return JSON.parse(dadosRaw);
  } catch (error) {
    console.error('❌ Erro ao carregar histórico de cobranças:', error);
    return { ultimaExecucao: null, mensagensEnviadas: [] };
  }
}

// Salvar histórico de cobranças
function salvarHistorico(historico) {
  try {
    fs.writeFileSync(historicoFilePath, JSON.stringify(historico, null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar histórico de cobranças:', error);
  }
}

// Registrar uma mensagem enviada no histórico
function registrarMensagemEnviada(boleto, status = 'enviado') {
  const historico = carregarHistorico();
  
  const novoRegistro = {
    id: `${boleto.Telefone}-${boleto.Vencimento}-${Date.now()}`,
    nome: boleto.Nome,
    telefone: boleto.Telefone,
    valor: boleto.Valor,
    vencimento: boleto.Vencimento,
    dataEnvio: new Date().toISOString(),
    status: status
  };
  
  historico.mensagensEnviadas.push(novoRegistro);
  historico.ultimaExecucao = new Date().toISOString();
  
  salvarHistorico(historico);
  console.log(`📝 Mensagem registrada no histórico para ${boleto.Nome}`);
  
  return novoRegistro;
}

// Verifica se uma mensagem já foi enviada para evitar duplicações
function verificarMensagemEnviada(boleto) {
  const historico = carregarHistorico();
  
  // Busca por mensagens enviadas hoje para o mesmo telefone/vencimento
  const hoje = new Date().toISOString().split('T')[0]; // Pega apenas a data (YYYY-MM-DD)
  
  const mensagemJaEnviada = historico.mensagensEnviadas.some(msg => {
    const dataEnvio = msg.dataEnvio.split('T')[0];
    return msg.telefone === boleto.Telefone && 
           msg.vencimento === boleto.Vencimento && 
           dataEnvio === hoje;
  });
  
  return mensagemJaEnviada;
}

// Obter estatísticas de envio
function obterEstatisticas() {
  const historico = carregarHistorico();
  
  // Inicializa as estatísticas
  const stats = {
    totalEnviadas: historico.mensagensEnviadas.length,
    enviosHoje: 0,
    ultimoEnvio: historico.ultimaExecucao,
    statusContagem: {}
  };
  
  // Data de hoje para comparação
  const hoje = new Date().toISOString().split('T')[0];
  
  // Processa as mensagens para coletar estatísticas
  historico.mensagensEnviadas.forEach(msg => {
    const dataEnvio = msg.dataEnvio.split('T')[0];
    
    // Conta envios de hoje
    if (dataEnvio === hoje) {
      stats.enviosHoje++;
    }
    
    // Contagem por status
    if (!stats.statusContagem[msg.status]) {
      stats.statusContagem[msg.status] = 0;
    }
    stats.statusContagem[msg.status]++;
  });
  
  return stats;
}

module.exports = {
  registrarMensagemEnviada,
  verificarMensagemEnviada,
  carregarHistorico,
  obterEstatisticas,
  initializeHistoricoFile
};