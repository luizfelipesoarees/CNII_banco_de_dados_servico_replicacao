import { Router } from 'express';
import { getProdutosBaixoEstoque, createProduto, listProdutos } from '../services/produtoService.js';

const router = Router();

/**
 * @swagger
 * /produtos/baixo-estoque:
 *   get:
 *     summary: Produtos com estoque baixo
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 5
 *       - $ref: '#/components/parameters/filtrarGrupoParam'
 *     responses:
 *       200:
 *         description: Produtos
 */
router.get('/baixo-estoque', async (req, res) => {
  const { limite } = req.query;
  try {
    const produtos = await getProdutosBaixoEstoque(limite || 5, req.query);
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Listar produtos
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/sizeParam'
 *       - $ref: '#/components/parameters/orderByParam'
 *       - $ref: '#/components/parameters/filtrarGrupoParam'
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get('/', async (req, res) => {
  try {
    const produtos = await listProdutos(req.query);
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Criar produto
 *     responses:
 *       201:
 *         description: Produto criado
 */
router.post('/', async (req, res) => {
  const { descricao, categoria, valor, estoque } = req.body;
  try {
    const produto = await createProduto({ descricao, categoria, valor, estoque });
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
