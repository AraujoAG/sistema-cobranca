// frontend/src/pages/Mensagens.js
// (Modificar apenas o método dispararMensagemIndividual)

const dispararMensagemIndividual = async (id) => {
  try {
    setEnviando(true);
    setSucesso('');
    setErro('');
    
    console.log('Enviando mensagem para cliente ID:', id);
    
    const response = await api.post('/cobrancas/disparar-individual', { id });
    
    // Verificar resposta
    if (response.data && response.data.mensagem) {
      setSucesso(`Mensagem enviada com sucesso! ${response.data.tentativas > 1 ? `(${response.data.tentativas} tentativas)` : ''}`);
    } else {
      // Resposta inesperada
      console.warn('Resposta inesperada:', response);
      setSucesso('Operação concluída, mas com resposta inesperada do servidor');
    }
    
    setEnviando(false);
    
    // Recarrega o histórico
    const historicoRes = await api.get('/cobrancas/historico');
    setHistorico(historicoRes.data);
  } catch (error) {
    console.error('Erro completo:', error);
    
    let mensagemErro = 'Erro ao enviar mensagem';
    
    // Extrair detalhes do erro se disponíveis
    if (error.response) {
      // O servidor respondeu com status de erro
      const { data, status } = error.response;
      mensagemErro = `Erro ${status}: ${data.erro || 'Falha na requisição'}`;
      
      if (data.detalhes) {
        mensagemErro += ` - ${data.detalhes}`;
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      mensagemErro = 'Sem resposta do servidor. Verifique sua conexão de rede.';
    } else {
      // Erro na configuração da requisição
      mensagemErro = `Erro: ${error.message}`;
    }
    
    setErro(mensagemErro);
    setEnviando(false);
  }
};