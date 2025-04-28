// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Configuração de CORS melhorada
app.use(cors({
  origin: ['https://sistema-cobranca-frontend.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Adicionar um log middleware para depuração
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Garante que as pastas necessárias existam
const ensureDirectoryExistence = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Criação das pastas necessárias
const botDir = path.join(__dirname, 'bot');
const controllersDir = path.join(__dirname, 'controllers');
const routesDir = path.join(__dirname, 'routes');

ensureDirectoryExistence(botDir);
ensureDirectoryExistence(controllersDir);
ensureDirectoryExistence(routesDir);

// Criar arquivo boletos.xlsx se não existir
const boletoFilePath = path.join(__dirname, 'bot', 'boletos.xlsx');
if (!fs.existsSync(boletoFilePath)) {
  const xlsx = require('xlsx');
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([]);
  xlsx.utils.book_append_sheet(wb, ws, 'Boletos');
  xlsx.writeFile(wb, boletoFilePath);
}

// Importar rotas
const clientesRoutes = require('./routes/clientes');
const cobrancasRoutes = require('./routes/cobrancas');
const dashboardRoutes = require('./routes/dashboard');

// Rota de teste/verificação de saúde
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API está funcionando!', 
    timestamp: new Date().toISOString() 
  });
});

// Usar rotas
app.use('/api/clientes', clientesRoutes);
app.use('/api/cobrancas', cobrancasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Servir o frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Rota para exibir o QR code
app.get('/qrcode', (req, res) => {
  if (global.qrCode) {
    res.send(`
      <html>
        <body>
          <h1>Escaneie o QR Code com o WhatsApp</h1>
          <img src="${global.qrCode}" alt="QR Code" />
        </body>
      </html>
    `);
  } else {
    res.send('QR Code ainda não disponível. Tente reiniciar o servidor.');
  }
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err.stack);
  res.status(500).json({ 
    erro: 'Algo deu errado!', 
    detalhes: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack 
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Configuração para manter o servidor aberto (evitar "dorme" no Render.com)
setInterval(() => {
  console.log('Keepalive ping');
}, 1000 * 60 * 14); // A cada 14 minutos (o Render "adormece" após 15 min)

module.exports = app;