// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Certifique-se de que dotenv está configurado em server.js ou aqui

// A Connection String do Render já inclui todas as informações.
// Certifique-se de ter uma variável de ambiente DATABASE_URL no Render
// com o valor da "Internal Connection String" fornecida pelo Render.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("ERRO FATAL: Variável de ambiente DATABASE_URL não definida.");
  console.error("Configure-a no Render com a Internal Connection String do seu PostgreSQL.");
  console.error("A aplicação não funcionará corretamente sem o banco de dados.");
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  // Em um ambiente de produção real, você poderia fazer process.exit(1) aqui,
  // mas para permitir que o Render tente iniciar (e mostrar logs), vamos apenas logar.
}

const pool = new Pool({
  connectionString: connectionString,
  // Se estiver usando o PostgreSQL do Render e conectando de um serviço do Render na mesma região,
  // o SSL geralmente é tratado. Para conexões externas ou outros provedores, pode ser necessário:
  // ssl: {
  //   rejectUnauthorized: false // Apenas se o provedor exigir e você entender as implicações
  // }
});

pool.on('connect', () => {
  console.log('🔗 Conectado ao banco de dados PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na conexão com o banco de dados:', err);
  // process.exit(-1); // Em produção, considere encerrar se o pool de conexões falhar catastroficamente
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(), // Para transações, se necessário
};