// backend/bot/persistenceService.js
const db = require('../config/db');

async function carregarHistorico() {
  try {
    const { rows } = await db.query(`
        SELECT id, cliente_id, nome_cliente, telefone_cliente, valor_boleto, vencimento_boleto, 
               to_char(data_envio, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "dataEnvio", 
               status_envio as status
        FROM historico_cobrancas ORDER BY data_envio DESC
    `);
    
    let ultimaExecucao = null;
    if (rows.length > 0) {
        ultimaExecucao = rows[0].dataEnvio;
    }

    return {
        ultimaExecucao: ultimaExecucao,
        mensagensEnviadas: rows.map(r => ({...r, valor: r.valor_boleto, nome: r.nome_cliente, telefone: r.telefone_cliente, vencimento: r.vencimento_boleto }))
    };
  } catch (error) {
    console.error('Erro ao carregar histórico de cobranças do BD:', error);
    return { ultimaExecucao: null, mensagensEnviadas: [] };
  }
}

async function registrarMensagemEnviada(boleto, statusEnvio = 'enviado', mensagemTexto = null, respostaApi = null) {
  const query = `
    INSERT INTO historico_cobrancas 
    (cliente_id, nome_cliente, telefone_cliente, valor_boleto, vencimento_boleto, status_envio, mensagem_enviada, resposta_api)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    boleto.ID, boleto.Nome, boleto.Telefone, boleto.Valor, boleto.Vencimento,
    statusEnvio, mensagemTexto, respostaApi ? String(respostaApi) : null
  ];

  try {
    await db.query(query, values);
    console.log(`📝 Mensagem para ${boleto.Nome} (status: ${statusEnvio}) registrada no BD.`);
  } catch (error) {
    console.error('Erro ao registrar mensagem no BD:', error);
  }
}

async function verificarMensagemEnviadaHoje(boleto) {
  const hojeInicio = new Date();
  hojeInicio.setHours(0, 0, 0, 0);

  const query = `
    SELECT 1 FROM historico_cobrancas
    WHERE cliente_id = $1 
      AND vencimento_boleto = $2
      AND status_envio = 'enviado'
      AND data_envio >= $3
    LIMIT 1;
  `;
  const values = [boleto.ID, boleto.Vencimento, hojeInicio];

  try {
    const { rows } = await db.query(query, values);
    if (rows.length > 0) {
        console.log(`⏭️ Verificação BD: Mensagem para ${boleto.Nome} já foi enviada com sucesso hoje.`);
        return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar mensagem enviada no BD:', error);
    return false;
  }
}

async function obterEstatisticas() {
  try {
    const stats = { totalEnviadasComSucesso: 0, totalFalhas: 0, enviosHojeComSucesso: 0, falhasHoje: 0, ultimoEnvio: null, statusContagem: {} };
    const contagemGeralQuery = `SELECT status_envio, COUNT(*) as count FROM historico_cobrancas GROUP BY status_envio;`;
    const { rows: contagemGeral } = await db.query(contagemGeralQuery);
    contagemGeral.forEach(row => {
        const count = parseInt(row.count, 10);
        stats.statusContagem[row.status_envio] = count;
        if (row.status_envio === 'enviado') stats.totalEnviadasComSucesso += count;
        else stats.totalFalhas += count;
    });

    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);
    const contagemHojeQuery = `SELECT status_envio, COUNT(*) as count FROM historico_cobrancas WHERE data_envio >= $1 GROUP BY status_envio;`;
    const { rows: contagemHoje } = await db.query(contagemHojeQuery, [hojeInicio]);
    contagemHoje.forEach(row => {
        const count = parseInt(row.count, 10);
        if (row.status_envio === 'enviado') stats.enviosHojeComSucesso += count;
        else stats.falhasHoje += count;
    });
    
    const ultimaExecQuery = `SELECT MAX(data_envio) as last_execution FROM historico_cobrancas;`;
    const { rows: ultimaExecResult } = await db.query(ultimaExecQuery);
    if (ultimaExecResult.length > 0 && ultimaExecResult[0].last_execution) {
        stats.ultimoEnvio = new Date(ultimaExecResult[0].last_execution).toISOString();
    }
    return stats;
  } catch (error) {
    console.error('Erro ao obter estatísticas do BD:', error);
    return { totalEnviadasComSucesso: 0, totalFalhas: 0, enviosHojeComSucesso: 0, falhasHoje: 0, ultimoEnvio: null, statusContagem: {} };
  }
}

module.exports = {
  registrarMensagemEnviada,
  verificarMensagemEnviadaHoje,
  carregarHistorico,
  obterEstatisticas
};