// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Verificar se as funções existem no controller
console.log('Funções do dashboardController:', Object.keys(dashboardController));

// Rotas para o dashboard
router.get('/resumo', dashboardController.obterResumo);
router.get('/estatisticas', dashboardController.obterEstatisticas);

module.exports = router;