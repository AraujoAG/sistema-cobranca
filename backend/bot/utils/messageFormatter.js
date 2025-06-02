// backend/bot/utils/messageFormatter.js

/**
 * Gera uma mensagem personalizada para o boleto.
 * @param {object} boleto - O objeto do boleto contendo Nome, Vencimento, Valor.
 * @returns {string} A mensagem formatada.
 */
function gerarMensagem(boleto) {
  const { Nome, Vencimento, Valor } = boleto;

  // Calculando quantos dias faltam ou passaram desde o vencimento
  // Certifique-se que Vencimento está no formato DD/MM/AAAA
  const partesData = Vencimento.split('/');
  if (partesData.length !== 3) {
    console.error(`Formato de data inválido para ${Nome}: ${Vencimento}. Esperado DD/MM/AAAA.`);
    // Retorna uma mensagem de erro ou lida com isso como preferir
    return `Erro: Formato de data inválido para o boleto de ${Nome}.`;
  }
  // new Date(ano, mêsIndex (0-11), dia)
  const dataVencimento = new Date(parseInt(partesData[2], 10), parseInt(partesData[1], 10) - 1, parseInt(partesData[0], 10));

  const hoje = new Date();
  // Zera as horas para comparar apenas as datas
  hoje.setHours(0, 0, 0, 0);
  dataVencimento.setHours(0, 0, 0, 0);

  const umDiaEmMilissegundos = 1000 * 60 * 60 * 24;
  const diferencaDias = Math.floor((dataVencimento.getTime() - hoje.getTime()) / umDiaEmMilissegundos);

  // Formatando o valor para exibição
  const valorNumerico = parseFloat(Valor);
  const valorFormatado = !isNaN(valorNumerico)
    ? valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : "Valor Inválido";

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

module.exports = { gerarMensagem };