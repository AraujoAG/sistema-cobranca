// backend/controllers/clientesController.js
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Arquivo Excel dos boletos
const arquivoBoletos = path.join(__dirname, '../bot/boletos.xlsx');

// Função auxiliar para criar o arquivo Excel se não existir
function garantirArquivoExcel() {
  try {
    console.log('Verificando arquivo Excel:', arquivoBoletos);
    
    if (!fs.existsSync(arquivoBoletos)) {
      console.log('Arquivo não existe, criando...');
      
      // Criar diretório se não existir
      const dir = path.dirname(arquivoBoletos);
      if (!fs.existsSync(dir)) {
        console.log('Criando diretório:', dir);
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Criar arquivo Excel com cabeçalhos corretos
      const workbook = xlsx.utils.book_new();
      const data = [];
      const worksheet = xlsx.utils.json_to_sheet(data);
      
      // Adiciona os cabeçalhos manualmente
      xlsx.utils.sheet_add_aoa(worksheet, [['ID', 'Nome', 'Telefone', 'Vencimento', 'Valor', 'Status']], { origin: 'A1' });
      
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Boletos');
      xlsx.writeFile(workbook, arquivoBoletos);
      
      console.log('Arquivo Excel criado com sucesso');
    } else {
      console.log('Arquivo Excel já existe');
    }
  } catch (error) {
    console.error('Erro ao garantir arquivo Excel:', error);
    throw error;
  }
}

// Função auxiliar para ler os dados do Excel
function lerDadosExcel() {
  try {
    garantirArquivoExcel();
    
    console.log('Lendo arquivo Excel...');
    const workbook = xlsx.readFile(arquivoBoletos);
    const sheetName = workbook.SheetNames[0] || 'Boletos';
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.log('Planilha não encontrada, retornando array vazio');
      return [];
    }
    
    const dados = xlsx.utils.sheet_to_json(worksheet);
    console.log('Dados lidos:', dados.length, 'registros');
    
    // Garante que retorne um array mesmo se vazio
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error('Erro ao ler arquivo Excel:', error);
    return [];
  }
}

// Função auxiliar para escrever os dados no Excel
function escreverDadosExcel(dados) {
  try {
    garantirArquivoExcel();
    
    console.log('Escrevendo dados no Excel:', dados.length, 'registros');
    
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(dados);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Boletos');
    xlsx.writeFile(workbook, arquivoBoletos);
    
    console.log('Dados escritos com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao escrever arquivo Excel:', error);
    return false;
  }
}

exports.listarClientes = (req, res) => {
  try {
    console.log('Listando clientes...');
    const clientes = lerDadosExcel();
    res.json(clientes);
  } catch (error) {
    console.error('Erro em listarClientes:', error);
    res.status(500).json({ erro: 'Erro ao listar clientes', detalhes: error.message });
  }
};

exports.adicionarCliente = (req, res) => {
  try {
    console.log('Adicionando cliente...');
    console.log('Dados recebidos:', req.body);
    
    const novoCliente = req.body;
    
    // Validar dados
    if (!novoCliente.Nome || !novoCliente.Telefone || !novoCliente.Vencimento || !novoCliente.Valor) {
      console.log('Dados incompletos:', novoCliente);
      return res.status(400).json({ erro: 'Dados incompletos' });
    }
    
    // Formatar telefone (remover caracteres não numéricos)
    novoCliente.Telefone = novoCliente.Telefone.replace(/\D/g, '');
    
    // Ler dados atuais
    const clientes = lerDadosExcel();
    
    // Adicionar ID único
    novoCliente.ID = Date.now().toString();
    
    // Adicionar campo Status se não existir
    if (!novoCliente.Status) {
      novoCliente.Status = 'Pendente';
    }
    
    console.log('Cliente a ser adicionado:', novoCliente);
    
    // Adicionar novo cliente
    clientes.push(novoCliente);
    
    // Salvar dados atualizados
    if (escreverDadosExcel(clientes)) {
      console.log('Cliente adicionado com sucesso');
      res.status(201).json({ mensagem: 'Cliente adicionado com sucesso', cliente: novoCliente });
    } else {
      console.log('Falha ao salvar dados');
      res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
  } catch (error) {
    console.error('Erro em adicionarCliente:', error);
    res.status(500).json({ erro: 'Erro ao adicionar cliente', detalhes: error.message });
  }
};

exports.atualizarCliente = (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    
    console.log('Atualizando cliente:', id);
    console.log('Dados recebidos:', dadosAtualizados);
    
    // Ler dados atuais
    const clientes = lerDadosExcel();
    
    // Encontrar índice do cliente
    const index = clientes.findIndex(cliente => cliente.ID === id);
    
    if (index === -1) {
      console.log('Cliente não encontrado:', id);
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    // Atualizar dados
    clientes[index] = { ...clientes[index], ...dadosAtualizados };
    
    // Salvar dados atualizados
    if (escreverDadosExcel(clientes)) {
      console.log('Cliente atualizado com sucesso');
      res.json({ mensagem: 'Cliente atualizado com sucesso', cliente: clientes[index] });
    } else {
      console.log('Falha ao salvar dados');
      res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
  } catch (error) {
    console.error('Erro em atualizarCliente:', error);
    res.status(500).json({ erro: 'Erro ao atualizar cliente', detalhes: error.message });
  }
};

exports.removerCliente = (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Removendo cliente:', id);
    
    // Ler dados atuais
    const clientes = lerDadosExcel();
    
    // Filtrar clientes removendo o selecionado
    const clientesFiltrados = clientes.filter(cliente => cliente.ID !== id);
    
    if (clientesFiltrados.length === clientes.length) {
      console.log('Cliente não encontrado:', id);
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    // Salvar dados atualizados
    if (escreverDadosExcel(clientesFiltrados)) {
      console.log('Cliente removido com sucesso');
      res.json({ mensagem: 'Cliente removido com sucesso' });
    } else {
      console.log('Falha ao salvar dados');
      res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
  } catch (error) {
    console.error('Erro em removerCliente:', error);
    res.status(500).json({ erro: 'Erro ao remover cliente', detalhes: error.message });
  }
};