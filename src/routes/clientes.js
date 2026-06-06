import { Router } from 'express';
import { createCliente, listClientes } from '../services/clienteService.js';
import { getHistoricoCliente as fetchHistorico } from '../services/pedidoService.js';

const router = Router();

/**
 * @swagger
 * /clientes/{id}/pedidos:
 *   get:
 *     summary: Histórico de pedidos de um cliente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/filtrarGrupoParam'
 *     responses:
 *       200:
 *         description: Histórico
 */
router.get('/:id/pedidos', async (req, res) => {
  const { id } = req.params;
  try {
    const historico = await fetchHistorico(id, req.query);
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Listar clientes
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/sizeParam'
 *       - $ref: '#/components/parameters/orderByParam'
 *       - $ref: '#/components/parameters/filtrarGrupoParam'
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', async (req, res) => {
  try {
    const clientes = await listClientes(req.query);
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Criar cliente
 *     responses:
 *       201:
 *         description: Cliente criado
 */
router.post('/', async (req, res) => {
  const { nome, email } = req.body;
  try {
    const cliente = await createCliente({ nome, email });
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
