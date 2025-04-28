// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Configurar EJS como view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Obter origens permitidas do ambiente
const origensPermitidas = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.RENDER_URL || 'https://sistema-cobranca-frontend.onrender.com',
  'http://localhost:5000' // Para desenvolvimento local
];

console.log('Origens permitidas CORS:', origensPermitidas);

// Configuração CORS
app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origem (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    // Verifica se a origem está na lista permitida
    if (origensPermitidas.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Requisição de origem não permitida: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Importante para permitir cookies
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
const viewsDir = path.join(__dirname, 'views');
const publicDir = path.join(__dirname, 'public');

ensureDirectoryExistence(botDir);
ensureDirectoryExistence(controllersDir);
ensureDirectoryExistence(routesDir);
ensureDirectoryExistence(viewsDir);
ensureDirectoryExistence(publicDir);

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

// Rota para o dashboard web
app.get('/', (req, res) => {
  try {
    const persistenceService = require('./bot/persistenceService');
    const path = require('path');
    const xlsx = require('xlsx');
    
    // Inicializa o serviço de persistência
    persistenceService.initializeHistoricoFile();
    
    // Ler dados do Excel
    const arquivoBoletos = path.join(__dirname, 'bot', 'boletos.xlsx');
    const workbook = xlsx.readFile(arquivoBoletos);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const boletos = xlsx.utils.sheet_to_json(sheet);
    
    // Obter estatísticas
    const stats = persistenceService.obterEstatisticas();
    
    // Render da view dashboard
    res.render('dashboard/index', { 
      boletos, 
      stats, 
      whatsappStatus: 'Conectado',
      persistenceService
    });
  } catch (error) {
    console.error('Erro ao renderizar dashboard:', error);
    res.status(500).send('Erro ao carregar dashboard: ' + error.message);
  }
});

// Rota para disparar mensagens manualmente
app.post('/disparar-mensagens', async (req, res) => {
  try {
    const processaBoletos = require('./bot/processaBoletos');
    await processaBoletos();
    res.redirect('/?success=true');
  } catch (error) {
    console.error('Erro ao disparar mensagens:', error);
    res.redirect('/?error=true');
  }
});

// Rota para adicionar boletos pela interface
app.post('/boletos/adicionar', (req, res) => {
  try {
    const { nome, telefone, vencimento, valor } = req.body;
    
    // Formatar e validar os dados
    if (!nome || !telefone || !vencimento || !valor) {
      return res.redirect('/?error=true');
    }
    
    // Adicionar boleto usando o controller
    const clientesController = require('./controllers/clientesController');
    
    // Preparar o objeto de boleto
    const novoBoleto = {
      Nome: nome,
      Telefone: telefone,
      Vencimento: vencimento,
      Valor: parseFloat(valor),
      Status: 'Pendente'
    };
    
    // Adicionar ao Excel (chamando a função diretamente)
    clientesController.adicionarCliente({
      body: novoBoleto
    }, {
      status: () => {
        return {
          json: () => res.redirect('/?success=true')
        };
      },
      json: () => res.redirect('/?success=true')
    });
    
  } catch (error) {
    console.error('Erro ao adicionar boleto:', error);
    res.redirect('/?error=true');
  }
});

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