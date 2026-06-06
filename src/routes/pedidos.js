import { Router } from 'express';
import { getPedidoCompleto, createPedido, listPedidos, getItensPedido } from '../services/pedidoService.js';

const router = Router();

/**
 * @swagger
 * /pedidos/{id}:
 *   get:
 *     summary: Obter pedido completo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await getPedidoCompleto(id, req.query);
    if (!pedido) {
      return res.status(404).json({ error: `Pedido com ID ${id} não encontrado.` });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /pedidos/{id}/itens:
 *   get:
 *     summary: Buscar itens do pedido
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de itens do pedido
 */
router.get('/:id/itens', async (req, res) => {
  const { id } = req.params;
  try {
    const itens = await getItensPedido(id, req.query);
    const itensFormatados = itens.map(item => ({
      PedidoItem: item.id,
      Produto: item.produto.descricao,
      Quantidade: item.quantidade,
      ValorUnitario: item.valor_unitario
    }));
    res.json(itensFormatados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Listar pedidos
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/sizeParam'
 *       - $ref: '#/components/parameters/orderByParam'
 *       - $ref: '#/components/parameters/filtrarGrupoParam'
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
router.get('/', async (req, res) => {
  try {
    const pedidos = await listPedidos(req.query);
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Criar pedido
 *     responses:
 *       201:
 *         description: Pedido criado
 */
router.post('/', async (req, res) => {
  const { cliente_id, itens } = req.body;
  try {
    const pedido = await createPedido({ cliente_id, itens });
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
