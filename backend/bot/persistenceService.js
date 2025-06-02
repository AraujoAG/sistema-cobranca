// backend/bot/persistenceService.js
const fs = require('fs');
const path = require('path');

const historicoFilePath = path.join(__dirname, 'historico_cobrancas.json');
// ATENÇÃO: Usar __dirname para dados dinâmicos em um ambiente sem servidor como o Render
// resultará em perda de dados em reinicializações/redeploys.
// Esta abordagem é adequada apenas para desenvolvimento local ou se o arquivo
// for parte do build e não mudar. Para dados dinâmicos, use um banco de dados.

function initializeHistoricoFile() {
  try {
    if (!fs.existsSync(historicoFilePath)) {
      // Cria o arquivo com uma estrutura inicial vazia.
      // No Render, este arquivo será criado, mas será perdido no próximo deploy/restart.
      fs.writeFileSync(historicoFilePath, JSON.stringify({
        ultimaExecucao: null,
        mensagensEnviadas: []
      }, null, 2), 'utf8');
      console.log(`📁 Arquivo de histórico de cobranças criado em: ${historicoFilePath} (Será efêmero no Render)`);
    }
  } catch (error) {
    console.error('❌ Erro ao tentar inicializar o arquivo de histórico:', error);
    // Em um cenário de produção, você pode querer lançar o erro ou ter um fallback.
  }
}

function carregarHistorico() {
  initializeHistoricoFile(); // Garante que o arquivo exista antes de tentar ler
  try {
    if (fs.existsSync(historicoFilePath)) {
      const dadosRaw = fs.readFileSync(historicoFilePath, 'utf8');
      return JSON.parse(dadosRaw);
    }
    // Se o arquivo não existir mesmo após initialize (improvável, mas por segurança)
    return { ultimaExecucao: null, mensagensEnviadas: [] };
  } catch (error) {
    console.error('❌ Erro ao carregar histórico de cobranças:', error);
    // Retorna um estado padrão em caso de erro de parse ou leitura
    return { ultimaExecucao: null, mensagensEnviadas: [] };
  }
}

function salvarHistorico(historico) {
  try {
    // No Render, esta escrita será no sistema de arquivos efêmero.
    fs.writeFileSync(historicoFilePath, JSON.stringify(historico, null, 2), 'utf8');
    // console.log('💾 Histórico de cobranças salvo com sucesso (efêmero no Render).');
  } catch (error) {
    console.error('❌ Erro ao salvar histórico de cobranças:', error);
  }
}

function registrarMensagemEnviada(boleto, status = 'enviado') {
  const historico = carregarHistorico();

  const novoRegistro = {
    id: `${boleto.ID || boleto.Telefone}-${boleto.Vencimento}-${Date.now()}`, // Garante um ID único
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
  console.log(`📝 Mensagem para ${boleto.Nome} (${status}) registrada no histórico.`);

  return novoRegistro;
}

function verificarMensagemEnviada(boleto) {
  const historico = carregarHistorico();
  const hoje = new Date().toISOString().split('T')[0]; // Data no formato YYYY-MM-DD

  // É importante que boleto.Telefone e boleto.Vencimento existam e sejam consistentes
  const telefoneFormatado = boleto.Telefone ? boleto.Telefone.toString().replace(/\D/g, '') : '';

  const mensagemJaEnviada = historico.mensagensEnviadas.some(msg => {
    const dataEnvio = msg.dataEnvio ? msg.dataEnvio.split('T')[0] : '';
    const msgTelefoneFormatado = msg.telefone ? msg.telefone.toString().replace(/\D/g, '') : '';

    // Compara por telefone, vencimento e se foi enviado hoje com sucesso
    return msgTelefoneFormatado === telefoneFormatado &&
           msg.vencimento === boleto.Vencimento &&
           dataEnvio === hoje &&
           msg.status === 'enviado'; // Considera apenas envios bem-sucedidos para evitar reenvio
  });

  if (mensagemJaEnviada) {
      console.log(`⏭️ Verificação: Mensagem para ${boleto.Nome} (Tel: ${telefoneFormatado}, Venc: ${boleto.Vencimento}) já foi enviada com sucesso hoje.`);
  }
  return mensagemJaEnviada;
}

function obterEstatisticas() {
  const historico = carregarHistorico();
  const stats = {
    totalEnviadasComSucesso: 0,
    totalFalhas: 0,
    totalOutrosStatus:0,
    enviosHojeComSucesso: 0,
    falhasHoje: 0,
    ultimoEnvio: historico.ultimaExecucao,
    statusContagem: {} // Contará todos os status
  };

  const hojeISO = new Date().toISOString().split('T')[0];

  historico.mensagensEnviadas.forEach(msg => {
    // Contagem geral por status
    if (!stats.statusContagem[msg.status]) {
      stats.statusContagem[msg.status] = 0;
    }
    stats.statusContagem[msg.status]++;

    if (msg.status === 'enviado') {
        stats.totalEnviadasComSucesso++;
    } else if (msg.status === 'falha' || msg.status === 'erro') {
        stats.totalFalhas++;
    } else {
        stats.totalOutrosStatus++;
    }

    // Contagem de hoje por status
    const dataEnvioISO = msg.dataEnvio ? msg.dataEnvio.split('T')[0] : '';
    if (dataEnvioISO === hojeISO) {
      if (msg.status === 'enviado') {
        stats.enviosHojeComSucesso++;
      } else if (msg.status === 'falha' || msg.status === 'erro') {
        stats.falhasHoje++;
      }
    }
  });
  return stats;
}

module.exports = {
  initializeHistoricoFile, // Exporte se chamado externamente
  registrarMensagemEnviada,
  verificarMensagemEnviada,
  carregarHistorico, // Exporte se precisar ler o histórico completo externamente
  obterEstatisticas
};