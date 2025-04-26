// backend/controllers/clientesController.js
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Arquivo Excel dos boletos
const arquivoBoletos = path.join(__dirname, '../bot/boletos.xlsx');

// Função auxiliar para ler os dados do Excel
function lerDadosExcel() {
  try {
    const workbook = xlsx.readFile(arquivoBoletos);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error('Erro ao ler arquivo Excel:', error);
    return [];
  }
}

// Função auxiliar para escrever os dados no Excel
function escreverDadosExcel(dados) {
  try {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(dados);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Boletos');
    xlsx.writeFile(workbook, arquivoBoletos);
    return true;
  } catch (error) {
    console.error('Erro ao escrever arquivo Excel:', error);
    return false;
  }
}

exports.listarClientes = (req, res) => {
  try {
    const clientes = lerDadosExcel();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar clientes', detalhes: error.message });
  }
};

exports.adicionarCliente = (req, res) => {
  try {
    const novoCliente = req.body;
    
    // Validar dados
    if (!novoCliente.Nome || !novoCliente.Telefone || !novoCliente.Vencimento || !novoCliente.Valor) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }
    
    // Formatar telefone (remover caracteres não numéricos)
    novoCliente.Telefone = novoCliente.Telefone.replace(/\D/g, '');
    
    // Ler dados atuais
    const clientes = lerDadosExcel();
    
    // Adicionar ID único
    novoCliente.ID = Date.now().toString();
    
    // Adicionar novo cliente
    clientes.push(novoCliente);
    
    // Salvar dados atualizados
    if (escreverDadosExcel(clientes)) {
      res.status(201).json({ mensagem: 'Cliente adicionado com sucesso', cliente: novoCliente });
    } else {
      res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao adicionar cliente', detalhes: error.message });
  }
};

exports.atualizarCliente = (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    
    // Ler dados atuais
    const clientes = lerDadosExcel();
    
    // Encontrar índice do cliente
    const index = clientes.findIndex(cliente => cliente.ID === id);
    
    if (index === -1) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    // Atualizar dados
    clientes[index] = { ...clientes[index], ...dadosAtualizados };
    
    // Salvar dados atualizados
    if (escreverDadosExcel(clientes)) {
      res.json({ mensagem: 'Cliente atualizado com sucesso', cliente: clientes[index] });
    } else {
      res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar cliente', detalhes: error.message });
  }
};

exports.removerCliente = (req, res) => {
  try {
    const { id } = req.params;
    
    // Ler dados atuais
    const clientes = lerDadosExcel();
    
    // Filtrar clientes removendo o selecionado
    const clientesFiltrados = clientes.filter(cliente => cliente.ID !== id);
    
    if (clientesFiltrados.length === clientes.length) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    // Salvar dados atualizados
    if (escreverDadosExcel(clientesFiltrados)) {
      res.json({ mensagem: 'Cliente removido com sucesso' });
    } else {
      res.status(500).json({ erro: 'Erro ao salvar dados' });
    }
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover cliente', detalhes: error.message });
  }
};