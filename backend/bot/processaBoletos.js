// backend/bot/processaBoletos.js
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const persistenceService = require('./persistenceService');
const { sendMessage } = require('./sendMessage');

// Função para gerar mensagem personalizada com base no tempo de atraso
function gerarMensagem(boleto) {
  const { Nome, Vencimento, Valor } = boleto;
  
  // Calculando quantos dias faltam ou passaram desde o vencimento
  const partes = Vencimento.split('/');
  const dataVencimento = new Date(partes[2], partes[1] - 1, partes[0]);
  const hoje = new Date();
  
  const diferencaDias = Math.floor((dataVencimento - hoje) / (1000 * 60 * 60 * 24));
  
  // Formatando o valor para exibição
  const valorFormatado = parseFloat(Valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  // Mensagens diferentes baseadas no tempo até o vencimento
  let mensagem = '';
  
  if (diferencaDias > 0) {
    // Ainda não venceu
    mensagem = `Olá ${Nome}, é a Alta Linha Móveis! 

Gostaríamos de lembrá-lo que seu boleto no valor de ${valorFormatado} vence em ${diferencaDias === 1 ? 'um dia' : diferencaDias + ' dias'} (${Vencimento}).

Caso já tenha efetuado o pagamento, por gentileza desconsidere esta mensagem.

Qualquer dúvida estamos à disposição!

Atenciosamente,
*Equipe Alta Linha Móveis*
📞 (15) 3222-3333`;
  
  } else if (diferencaDias === 0) {
    // Vence hoje
    mensagem = `Olá ${Nome}, é a Alta Linha Móveis!

Gostaríamos de informar que seu boleto no valor de ${valorFormatado} vence HOJE (${Vencimento}).

Para sua comodidade, você pode realizar o pagamento até o final do dia para evitar juros e multas.

Caso já tenha efetuado o pagamento, por gentileza desconsidere esta mensagem.

Atenciosamente,
*Equipe Alta Linha Móveis*
📞 (15) 3222-3333`;
  
  } else {
    // Já venceu
    const diasAtraso = Math.abs(diferencaDias);
    mensagem = `Olá ${Nome}, é a Alta Linha Móveis!

Notamos que seu boleto no valor de ${valorFormatado} com vencimento em ${Vencimento} encontra-se em aberto ${diasAtraso === 1 ? 'há um dia' : `há ${diasAtraso} dias`}.

Para regularizar sua situação e evitar maiores encargos, solicitamos que entre em contato conosco para negociação ou efetue o pagamento o quanto antes.

Caso já tenha efetuado o pagamento recentemente, por favor, desconsidere esta mensagem.

Atenciosamente,
*Equipe Alta Linha Móveis*
📞 (15) 3222-3333`;
  }
  
  return mensagem;
}

// No método processaBoletos, adicionar tratamento de erro mais robusto:
async function processaBoletos() {
  try {
    console.log('Iniciando o processamento de boletos...');
    const workbook = xlsx.readFile(path.join(__dirname, 'boletos.xlsx'));
    const planilha = workbook.Sheets[workbook.SheetNames[0]];
    const dados = xlsx.utils.sheet_to_json(planilha);
    
    console.log(`Encontrados ${dados.length} registros para processar`);
    
    let enviadosCount = 0;
    let pendentesCount = 0;
    let jaEnviadosCount = 0;
    let falhasCount = 0;
    
    for (const boleto of dados) {
      const { Nome, Telefone, Vencimento, Valor, Status } = boleto;
      
      // Validação básica
      if (!Nome || !Telefone || !Vencimento || !Valor || !Status) {
        console.warn('⚠️ Dados incompletos no boleto:', boleto);
        continue;
      }
      
      // Só manda se estiver pendente
      if (Status.toLowerCase() === 'pendente') {
        pendentesCount++;
        const numeroFormatado = Telefone.toString().replace(/\D/g, '');
        
        // Verifica se o número está no formato correto para o WhatsApp
        if (numeroFormatado.length < 10) {
          console.warn(`⚠️ Número de telefone inválido para ${Nome}: ${Telefone}`);
          falhasCount++;
          continue;
        }
        
        // Verifica se já foi enviada mensagem hoje para este boleto
        if (persistenceService.verificarMensagemEnviada(boleto)) {
          console.log(`⏭️ Mensagem já enviada hoje para ${Nome} (${numeroFormatado})`);
          jaEnviadosCount++;
          continue;
        }
        
        // Gera mensagem personalizada com base no tempo de atraso
        const mensagem = gerarMensagem(boleto);
        
        console.log(`🔄 Tentando enviar mensagem para ${Nome} (${numeroFormatado})`);
        console.log(`Mensagem a ser enviada: ${mensagem.substring(0, 50)}...`);
        
        try {
          // Tentativa de envio com retentativas
          let tentativas = 0;
          let enviado = false;
          
          while (tentativas < 3 && !enviado) {
            tentativas++;
            console.log(`Tentativa ${tentativas} de envio para ${Nome}`);
            
            enviado = await sendMessage(numeroFormatado, mensagem);
            
            if (!enviado && tentativas < 3) {
              console.log(`Aguardando 5 segundos antes da próxima tentativa...`);
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
          
          if (enviado) {
            // Registra no histórico como enviado com sucesso
            persistenceService.registrarMensagemEnviada(boleto, 'enviado');
            enviadosCount++;
            console.log(`✅ Mensagem enviada com sucesso para ${Nome} após ${tentativas} tentativa(s)`);
          } else {
            // Registra falha no envio
            persistenceService.registrarMensagemEnviada(boleto, 'falha');
            falhasCount++;
            console.error(`❌ Falha no envio para ${Nome} após ${tentativas} tentativas`);
          }
        } catch (error) {
          console.error(`❌ Erro ao enviar para ${Nome}:`, error.message);
          persistenceService.registrarMensagemEnviada(boleto, 'erro');
          falhasCount++;
        }
        
        // Pequeno delay entre mensagens para evitar bloqueio
        console.log('Aguardando 3 segundos antes do próximo envio...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Exibe estatísticas do processamento atual
    console.log(`
📊 Relatório de Processamento:
- Total de boletos processados: ${dados.length}
- Boletos pendentes: ${pendentesCount}
- Mensagens enviadas com sucesso: ${enviadosCount}
- Mensagens já enviadas hoje: ${jaEnviadosCount}
- Falhas no envio: ${falhasCount}
    `);
    
    // Exibe estatísticas gerais do sistema
    const stats = persistenceService.obterEstatisticas();
    console.log(`
📈 Estatísticas Gerais:
- Total de mensagens enviadas até hoje: ${stats.totalEnviadas}
- Mensagens enviadas hoje: ${stats.enviosHoje}
- Último processamento: ${stats.ultimoEnvio || 'Primeiro processamento'}
    `);
    
    console.log(`✅ Processamento concluído.`);
    return { enviadosCount, falhasCount };
  } catch (err) {
    console.error('❌ Erro ao processar boletos:', err);
    throw err; // Propaga o erro para tratamento adequado
  }
}

module.exports = processaBoletos;