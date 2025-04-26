const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Modelo de cliente
const clienteSchema = new mongoose.Schema({
  Nome: { type: String, required: true },
  Telefone: { type: String, required: true },
  Vencimento: { type: String, required: true },
  Valor: { type: Number, required: true },
  Status: { type: String, default: 'Pendente' },
  createdAt: { type: Date, default: Date.now }
});

const Cliente = mongoose.model('Cliente', clienteSchema);

// Rotas de clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar clientes' });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { Nome, Telefone, Vencimento, Valor } = req.body;
    
    if (!Nome || !Telefone || !Vencimento || !Valor) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }
    
    const novoCliente = new Cliente({
      Nome,
      Telefone,
      Vencimento,
      Valor: parseFloat(Valor),
      Status: 'Pendente'
    });
    
    const clienteSalvo = await novoCliente.save();
    res.status(201).json(clienteSalvo);
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    res.status(500).json({ erro: 'Erro ao salvar cliente' });
  }
});

app.get('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar cliente' });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { Nome, Telefone, Vencimento, Valor } = req.body;
    
    const clienteAtualizado = await Cliente.findByIdAndUpdate(
      req.params.id,
      { Nome, Telefone, Vencimento, Valor: parseFloat(Valor) },
      { new: true }
    );
    
    if (!clienteAtualizado) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.json(clienteAtualizado);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    res.json({ mensagem: 'Cliente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover cliente' });
  }
});

// Rotas de cobrança
app.post('/api/cobrancas/disparar', async (req, res) => {
  try {
    const clientes = await Cliente.find();
    // Aqui você implementaria a lógica de envio de mensagens
    res.json({ mensagem: 'Mensagens disparadas com sucesso', total: clientes.length });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao disparar mensagens' });
  }
});

app.post('/api/cobrancas/disparar-individual', async (req, res) => {
  try {
    const { id } = req.body;
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    // Aqui você implementaria a lógica de envio de mensagem individual
    res.json({ mensagem: 'Mensagem enviada com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao enviar mensagem' });
  }
});

app.get('/api/cobrancas/historico', async (req, res) => {
  try {
    // Aqui você implementaria a lógica para buscar o histórico
    // Por enquanto, retorna um array vazio
    res.json([]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar histórico' });
  }
});

// Rota do dashboard
app.get('/api/dashboard/resumo', async (req, res) => {
  try {
    const clientes = await Cliente.find();
    
    const hoje = new Date();
    const boletosVencidos = clientes.filter(c => {
      const partes = c.Vencimento.split('/');
      const vencimento = new Date(partes[2], partes[1] - 1, partes[0]);
      return vencimento < hoje;
    }).length;
    
    const boletosAVencer = clientes.filter(c => {
      const partes = c.Vencimento.split('/');
      const vencimento = new Date(partes[2], partes[1] - 1, partes[0]);
      return vencimento >= hoje;
    }).length;
    
    const valorTotal = clientes.reduce((acc, curr) => acc + curr.Valor, 0);
    
    res.json({
      totalClientes: clientes.length,
      boletosVencidos,
      boletosAVencer,
      valorTotal,
      mensagensEnviadas: 0 // Você pode implementar uma lógica para contar mensagens enviadas
    });
  } catch (error) {
    console.error('Erro ao buscar resumo do dashboard:', error);
    res.status(500).json({ erro: 'Erro ao buscar resumo do dashboard' });
  }
});

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});