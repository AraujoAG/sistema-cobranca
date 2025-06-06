// backend/controllers/clientesController.js
const db = require('../config/db');

exports.listarClientes = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clientes ORDER BY nome ASC');
    const clientesFormatados = rows.map(cliente => ({...cliente, ID: cliente.id }));
    res.json(clientesFormatados);
  } catch (error) {
    console.error('Erro em listarClientes:', error);
    res.status(500).json({ erro: 'Erro ao listar clientes', detalhes: error.message });
  }
};

exports.adicionarCliente = async (req, res) => {
  try {
    const { Nome, Telefone, Vencimento, Valor, Status = 'Pendente' } = req.body;
    if (!Nome || !Telefone || !Vencimento || !Valor) {
      return res.status(400).json({ erro: 'Dados incompletos.' });
    }
    let telefoneFormatado = String(Telefone).replace(/\D/g, '');
    if (telefoneFormatado.length >= 10 && telefoneFormatado.length <= 11 && !telefoneFormatado.startsWith('55')) {
        telefoneFormatado = '55' + telefoneFormatado;
    }
    const query = `
      INSERT INTO clientes (nome, telefone, vencimento, valor, status) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `;
    const values = [Nome, telefoneFormatado, Vencimento, parseFloat(Valor), Status];
    const { rows } = await db.query(query, values);
    const clienteAdicionado = {...rows[0], ID: rows[0].id };
    res.status(201).json({ mensagem: 'Cliente adicionado com sucesso', cliente: clienteAdicionado });
  } catch (error) {
    console.error('Erro em adicionarCliente:', error);
    res.status(500).json({ erro: 'Erro ao adicionar cliente', detalhes: error.message });
  }
};

exports.atualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { Nome, Telefone, Vencimento, Valor, Status } = req.body;
    if (!Nome || !Telefone || !Vencimento || Valor === undefined || !Status) {
        return res.status(400).json({ erro: 'Dados incompletos para atualização.' });
    }
    let telefoneFormatado = String(Telefone).replace(/\D/g, '');
    if (telefoneFormatado.length >= 10 && telefoneFormatado.length <= 11 && !telefoneFormatado.startsWith('55')) {
        telefoneFormatado = '55' + telefoneFormatado;
    }
    const query = `
      UPDATE clientes 
      SET nome = $1, telefone = $2, vencimento = $3, valor = $4, status = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [Nome, telefoneFormatado, Vencimento, parseFloat(Valor), Status, id];
    const { rows, rowCount } = await db.query(query, values);
    if (rowCount === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    const clienteAtualizado = {...rows[0], ID: rows[0].id };
    res.json({ mensagem: 'Cliente atualizado com sucesso', cliente: clienteAtualizado });
  } catch (error) {
    console.error('Erro em atualizarCliente:', error);
    res.status(500).json({ erro: 'Erro ao atualizar cliente', detalhes: error.message });
  }
};

exports.removerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM clientes WHERE id = $1;';
    const { rowCount } = await db.query(query, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json({ mensagem: 'Cliente removido com sucesso' });
  } catch (error) {
    console.error('Erro em removerCliente:', error);
    res.status(500).json({ erro: 'Erro ao remover cliente', detalhes: error.message });
  }
};

exports.obterClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows, rowCount } = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    const cliente = {...rows[0], ID: rows[0].id };
    res.json(cliente);
  } catch (error) {
    console.error('Erro em obterClientePorId:', error);
    res.status(500).json({ erro: 'Erro ao obter dados do cliente', detalhes: error.message });
  }
};