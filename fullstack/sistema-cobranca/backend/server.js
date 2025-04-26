const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Definir caminho para o arquivo Excel
const BOLETOS_FILE = path.join(__dirname, 'data', 'boletos.xlsx');

// Garantir que o diretório data existe
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Criar arquivo Excel inicial se não existir
if (!fs.existsSync(BOLETOS_FILE)) {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([
    { nome: 'Cliente Exemplo', telefone: '11999999999', vencimento: '2025-05-10', valor: 299.99, status: 'Pendente' }
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'Boletos');
  xlsx.writeFile(wb, BOLETOS_FILE);
}

// Funções auxiliares
function lerBoletos() {
  try {
    const workbook = xlsx.readFile(BOLETOS_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error('Erro ao ler arquivo Excel:', error);
    return [];
  }
}

function salvarBoletos(boletos) {
  try {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(boletos);
    xlsx.utils.book_append_sheet(wb, ws, 'Boletos');
    xlsx.writeFile(wb, BOLETOS_FILE);
    return true;
  } catch (error) {
    console.error('Erro ao salvar arquivo Excel:', error);
    return false;
  }
}

// Rotas
app.get('/api/boletos', (req, res) => {
  const boletos = lerBoletos();
  res.json(boletos);
});

app.post('/api/boletos', (req, res) => {
  const novoBoleto = req.body;
  
  if (!novoBoleto.nome || !novoBoleto.telefone || !novoBoleto.vencimento || !novoBoleto.valor) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }
  
  const boletos = lerBoletos();
  novoBoleto.status = novoBoleto.status || 'Pendente';
  boletos.push(novoBoleto);
  
  if (salvarBoletos(boletos)) {
    res.status(201).json(novoBoleto);
  } else {
    res.status(500).json({ mensagem: 'Erro ao salvar boleto' });
  }
});

app.put('/api/boletos/:id', (req, res) => {
  const { id } = req.params;
  const dadosAtualizados = req.body;
  
  const boletos = lerBoletos();
  if (id >= boletos.length || id < 0) {
    return res.status(404).json({ mensagem: 'Boleto não encontrado' });
  }
  
  boletos[id] = { ...boletos[id], ...dadosAtualizados };
  
  if (salvarBoletos(boletos)) {
    res.json(boletos[id]);
  } else {
    res.status(500).json({ mensagem: 'Erro ao atualizar boleto' });
  }
});

app.delete('/api/boletos/:id', (req, res) => {
  const { id } = req.params;
  
  const boletos = lerBoletos();
  if (id >= boletos.length || id < 0) {
    return res.status(404).json({ mensagem: 'Boleto não encontrado' });
  }
  
  boletos.splice(id, 1);
  
  if (salvarBoletos(boletos)) {
    res.json({ mensagem: 'Boleto removido com sucesso' });
  } else {
    res.status(500).json({ mensagem: 'Erro ao remover boleto' });
  }
});

app.post('/api/enviar-mensagens', (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ mensagem: 'IDs dos boletos são obrigatórios' });
  }
  
  const boletos = lerBoletos();
  const boletosParaEnvio = [];
  
  ids.forEach(id => {
    if (id >= 0 && id < boletos.length) {
      boletosParaEnvio.push(boletos[id]);
      boletos[id].status = 'Enviado';
    }
  });
  
  if (boletosParaEnvio.length === 0) {
    return res.status(400).json({ mensagem: 'Nenhum boleto válido para envio' });
  }
  
  // Simulação de envio de mensagens
  console.log('Enviando mensagens para:', boletosParaEnvio);
  
  if (salvarBoletos(boletos)) {
    res.json({ 
      mensagem: `${boletosParaEnvio.length} mensagens enviadas com sucesso`,
      boletos: boletosParaEnvio
    });
  } else {
    res.status(500).json({ mensagem: 'Erro ao processar envio de mensagens' });
  }
});

app.get('/api/dashboard', (req, res) => {
  const boletos = lerBoletos();
  
  // Estatísticas simples
  const total = boletos.length;
  const pendentes = boletos.filter(b => b.status === 'Pendente').length;
  const enviados = boletos.filter(b => b.status === 'Enviado').length;
  const pagos = boletos.filter(b => b.status === 'Pago').length;
  
  // Cálculo de valor total
  const valorTotal = boletos.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
  const valorPendente = boletos
    .filter(b => b.status === 'Pendente')
    .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
  
  res.json({
    total,
    pendentes,
    enviados,
    pagos,
    valorTotal: valorTotal.toFixed(2),
    valorPendente: valorPendente.toFixed(2)
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
