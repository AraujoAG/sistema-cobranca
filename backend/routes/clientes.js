// backend/routes/clientes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

router.get('/', clientesController.listarClientes);
router.post('/', clientesController.adicionarCliente);
router.get('/:id', clientesController.obterClientePorId);
router.put('/:id', clientesController.atualizarCliente);
router.delete('/:id', clientesController.removerCliente);

module.exports = router;