// backend/bot/processaBoletos.js
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const persistenceService = require('./persistenceService');
const { sendMessage } = require('./sendMessage');
const { gerarMensagem } = require('./utils/messageFormatter'); // Importar do utilitário

const arquivoBoletosPath = path.join(__dirname, 'boletos.xlsx');
// ATENÇÃO: A leitura e manipulação deste arquivo 'boletos.xlsx' diretamente
// do sistema de arquivos não é uma solução persistente para o Render.com.
// Os dados de boletos devem vir de um banco de dados.

async function processaBoletos() {
  console.log('⏰ Iniciando o processamento de boletos...');

  // **ALERTA DE PERSISTÊNCIA**: Esta leitura de arquivo é efêmera no Render.
  if (!fs.existsSync(arquivoBoletosPath)) {
    console.error(`❌ Arquivo de boletos não encontrado em: ${arquivoBoletosPath}. Nenhum boleto será processado.`);
    // Você pode querer criar um arquivo de modelo aqui se for a primeira execução,
    // mas isso não resolve o problema de persistência de dados dinâmicos.
    return { enviadosCount: 0, falhasCount: 0, pendentesCount: 0, jaEnviadosCount: 0, errosFormato: 0 };
  }

  let dados = [];
  try {
    const workbook = xlsx.readFile(arquivoBoletosPath);
    const planilha = workbook.Sheets[workbook.SheetNames[0]];
    if (!planilha) {
        console.error('Nenhuma planilha encontrada no arquivo boletos.xlsx.');
        return { enviadosCount: 0, falhasCount: 0, pendentesCount: 0, jaEnviadosCount: 0, errosFormato: 0 };
    }
    dados = xlsx.utils.sheet_to_json(planilha);
  } catch (error) {
    console.error('❌ Erro ao ler o arquivo boletos.xlsx:', error);
    return { enviadosCount: 0, falhasCount: 0, pendentesCount: 0, jaEnviadosCount: 0, errosFormato: 0 };
  }

  console.log(`📄 Encontrados ${dados.length} registros no arquivo de boletos.`);

  let enviadosCount = 0;
  let pendentesCount = 0;
  let jaEnviadosCount = 0;
  let falhasCount = 0;
  let errosFormato = 0;

  for (const boleto of dados) {
    const { ID, Nome, Telefone, Vencimento, Valor, Status } = boleto;

    if (!Nome || !Telefone || !Vencimento || !Valor || !Status) {
      console.warn(`⚠️ Dados incompletos para o boleto ID ${ID || 'Desconhecido'}. Campos: Nome=${Nome}, Telefone=${Telefone}, Vencimento=${Vencimento}, Valor=${Valor}, Status=${Status}. Pulando.`);
      errosFormato++;
      continue;
    }

    if (Status.toString().toLowerCase() === 'pendente') {
      pendentesCount++;
      const numeroLimpo = Telefone.toString().replace(/\D/g, '');

      if (numeroLimpo.length < 10) { // Validação básica de tamanho
        console.warn(`⚠️ Número de telefone inválido para ${Nome} (ID: ${ID}): ${Telefone}. Pulando.`);
        errosFormato++;
        persistenceService.registrarMensagemEnviada(boleto, 'erro_telefone_invalido');
        continue;
      }

      if (persistenceService.verificarMensagemEnviada(boleto)) {
        console.log(`⏭️ Mensagem já enviada hoje para ${Nome} (ID: ${ID}, Tel: ${numeroLimpo}).`);
        jaEnviadosCount++;
        continue;
      }

      const mensagem = gerarMensagem(boleto);
      if (mensagem.startsWith("Erro: Formato de data inválido")) {
        console.warn(`⚠️ ${mensagem} (ID: ${ID}). Pulando.`);
        errosFormato++;
        persistenceService.registrarMensagemEnviada(boleto, 'erro_data_invalida');
        continue;
      }

      console.log(`🔄 Tentando enviar mensagem para ${Nome} (ID: ${ID}, Tel: ${numeroLimpo}). Mensagem: "${mensagem.substring(0, 50)}..."`);

      let tentativas = 0;
      let enviadoComSucesso = false;
      const MAX_TENTATIVAS = 3;

      while (tentativas < MAX_TENTATIVAS && !enviadoComSucesso) {
        tentativas++;
        console.log(`...> Tentativa ${tentativas}/${MAX_TENTATIVAS} para ${Nome} (ID: ${ID})`);
        try {
          enviadoComSucesso = await sendMessage(numeroLimpo, mensagem);
        } catch (error) {
          console.error(`💥 Erro interno na função sendMessage para ${Nome} (ID: ${ID}):`, error.message);
          // sendMessage já loga seus próprios erros, aqui apenas logamos que a chamada falhou.
        }

        if (!enviadoComSucesso && tentativas < MAX_TENTATIVAS) {
          console.log(`...> Falha na tentativa ${tentativas}. Aguardando 5 segundos antes da próxima...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Delay de 5s
        }
      }

      if (enviadoComSucesso) {
        persistenceService.registrarMensagemEnviada(boleto, 'enviado');
        enviadosCount++;
        console.log(`✅ Mensagem enviada com sucesso para ${Nome} (ID: ${ID}) após ${tentativas} tentativa(s).`);
      } else {
        persistenceService.registrarMensagemEnviada(boleto, 'falha');
        falhasCount++;
        console.error(`❌ Falha no envio para ${Nome} (ID: ${ID}) após ${tentativas} tentativas.`);
      }

      // Pequeno delay entre mensagens diferentes para evitar bloqueios ou sobrecarga
      if (dados.indexOf(boleto) < dados.length -1) { // Não atrasa após o último
        console.log('⏱️ Aguardando 3 segundos antes do próximo boleto...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } else {
        // console.log(`ℹ️ Boleto para ${Nome} (ID: ${ID}) não está pendente (Status: ${Status}). Pulando.`);
    }
  }

  console.log(`
📊 Relatório Final do Processamento de Boletos:
-------------------------------------------------
- Total de registros no arquivo: ${dados.length}
- Boletos com status 'Pendente': ${pendentesCount}
- Mensagens enviadas com sucesso: ${enviadosCount}
- Mensagens já enviadas hoje (puladas): ${jaEnviadosCount}
- Falhas no envio (após retentativas): ${falhasCount}
- Boletos com dados/formato incorreto (pulados): ${errosFormato}
-------------------------------------------------
  `);

  const statsGerais = persistenceService.obterEstatisticas();
  console.log(`
📈 Estatísticas Gerais do Sistema (do arquivo de histórico):
- Total de mensagens enviadas com sucesso (histórico): ${statsGerais.totalEnviadasComSucesso}
- Total de falhas registradas (histórico): ${statsGerais.totalFalhas}
- Envios com sucesso hoje (histórico): ${statsGerais.enviosHojeComSucesso}
- Falhas hoje (histórico): ${statsGerais.falhasHoje}
- Última execução registrada: ${statsGerais.ultimoEnvio || 'Nenhuma execução anterior'}
- Contagem por status (histórico): ${JSON.stringify(statsGerais.statusContagem)}
-------------------------------------------------
  `);

  console.log('✅ Processamento de boletos concluído.');
  return { enviadosCount, falhasCount, pendentesCount, jaEnviadosCount, errosFormato };
}

module.exports = processaBoletos;