const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Modelo de boleto
const boletoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  telefone: { type: String, required: true },
  vencimento: { type: Date, required: true },
  valor: { type: Number, required: true },
  status: { type: String, default: 'Pendente' },
  createdAt: { type: Date, default: Date.now }
});

const Boleto = mongoose.model('Boleto', boletoSchema);

// Rotas
app.get('/api/boletos', async (req, res) => {
  try {
    const boletos = await Boleto.find();
    res.json(boletos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar boletos' });
  }
});

app.post('/api/boletos', async (req, res) => {
  const novoBoleto = req.body;
  
  if (!novoBoleto.nome || !novoBoleto.telefone || !novoBoleto.vencimento || !novoBoleto.valor) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }
  
  try {
    const boleto = new Boleto(novoBoleto);
    await boleto.save();
    res.status(201).json(boleto);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao salvar boleto' });
  }
});

app.put('/api/boletos/:id', async (req, res) => {
  const { id } = req.params;
  const dadosAtualizados = req.body;
  
  try {
    const boleto = await Boleto.findByIdAndUpdate(
      id, 
      dadosAtualizados, 
      { new: true }
    );
    if (!boleto) {
      return res.status(404).json({ mensagem: 'Boleto não encontrado' });
    }
    res.json(boleto);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao atualizar boleto' });
  }
});

app.delete('/api/boletos/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const boleto = await Boleto.findByIdAndDelete(id);
    if (!boleto) {
      return res.status(404).json({ mensagem: 'Boleto não encontrado' });
    }
    res.json({ mensagem: 'Boleto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao remover boleto' });
  }
});

app.post('/api/enviar-mensagens', async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ mensagem: 'IDs dos boletos são obrigatórios' });
  }
  
  try {
    const boletosParaEnvio = await Boleto.find({ _id: { $in: ids } });
    
    if (boletosParaEnvio.length === 0) {
      return res.status(400).json({ mensagem: 'Nenhum boleto válido para envio' });
    }
    
    // Simulação de envio de mensagens
    console.log('Enviando mensagens para:', boletosParaEnvio);
    
    // Atualizar status para 'Enviado'
    await Boleto.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'Enviado' } }
    );
    
    res.json({ 
      mensagem: `${boletosParaEnvio.length} mensagens enviadas com sucesso`,
      boletos: boletosParaEnvio
    });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao processar envio de mensagens' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const boletos = await Boleto.find();
    
    // Estatísticas simples
    const total = boletos.length;
    const pendentes = boletos.filter(b => b.status === 'Pendente').length;
    const enviados = boletos.filter(b => b.status === 'Enviado').length;
    const pagos = boletos.filter(b => b.status === 'Pago').length;
    
    // Cálculo de valor total
    const valorTotal = boletos.reduce((acc, curr) => acc + curr.valor, 0);
    const valorPendente = boletos
      .filter(b => b.status === 'Pendente')
      .reduce((acc, curr) => acc + curr.valor, 0);
    
    res.json({
      total,
      pendentes,
      enviados,
      pagos,
      valorTotal: valorTotal.toFixed(2),
      valorPendente: valorPendente.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar dados do dashboard' });
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