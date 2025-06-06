// Adicione estas 3 linhas no topo do seu server.js
console.log('--- INICIANDO DEBUG DE VARIAVEL DE AMBIENTE ---');
console.log('Valor recebido para DATABASE_URL:', process.env.DATABASE_URL);
console.log('--- FIM DO DEBUG ---');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const origensPermitidas = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://sistema-cobranca-frontend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origensPermitidas.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy does not allow access from the specified origin.'));
    }
  }
}));

app.use(express.json());

const clientesRoutes = require('./routes/clientes');
const cobrancasRoutes = require('./routes/cobrancas');
const dashboardRoutes = require('./routes/dashboard');
const whatsappRoutes = require('./routes/whatsappRoutes');

app.get('/api/test', (req, res) => {
  res.json({ message: 'API está funcionando!' });
});

app.use('/api/clientes', clientesRoutes);
app.use('/api/cobrancas', cobrancasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err.stack);
  res.status(500).json({
    erro: 'Algo deu errado!',
    detalhes: err.message
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);

  const whatsappService = require('./services/whatsappService');
  whatsappService.initializeClient();

  const { main: botMainFunction } = require('./bot/index');
  botMainFunction().catch(err => console.error('Erro ao iniciar tarefas agendadas:', err));
});