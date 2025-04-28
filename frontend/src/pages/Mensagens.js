// frontend/src/pages/Mensagens.js
// Atualize a função de disparo de mensagens

const dispararMensagens = async () => {
  try {
    setEnviando(true);
    setSucesso('');
    setErro('');
    
    console.log('Iniciando disparo de mensagens...');
    console.log('Clientes selecionados:', clientesSelecionados);
    
    if (clientesSelecionados.length === 0) {
      // Dispara para todos
      console.log('Disparando para todos os clientes');
      const response = await api.post('/cobrancas/disparar');
      console.log('Resposta:', response.data);
      setSucesso('Processo de cobrança iniciado para todos os clientes!');
    } else {
      // Dispara individualmente para cada selecionado
      console.log(`Disparando para ${clientesSelecionados.length} clientes selecionados`);
      
      // Envio sequencial para evitar sobrecarga
      for (const id of clientesSelecionados) {
        console.log(`Enviando para cliente ID: ${id}`);
        await api.post('/cobrancas/disparar-individual', { id });
      }
      
      setSucesso(`Mensagens enviadas com sucesso para ${clientesSelecionados.length} clientes!`);
    }
    
    setEnviando(false);
    
    // Recarrega o histórico
    console.log('Recarregando histórico...');
    const historicoRes = await api.get('/cobrancas/historico');
    setHistorico(historicoRes.data);
    
    // Limpa seleção
    setClientesSelecionados([]);
  } catch (error) {
    console.error('Erro completo:', error);
    
    let mensagemErro = 'Erro ao enviar mensagens';
    
    if (error.response) {
      mensagemErro = `Erro ${error.response.status}: ${error.response.data.erro || 'Falha na requisição'}`;
    } else if (error.request) {
      mensagemErro = 'Sem resposta do servidor. Verifique sua conexão de rede.';
    } else {
      mensagemErro = `Erro: ${error.message}`;
    }
    
    setErro(mensagemErro);
    setEnviando(false);
  }
};