import { Router } from 'express';
import { getProdutosBaixoEstoque, createProduto, listProdutos } from '../services/produtoService.js';

const router = Router();

router.get('/baixo-estoque', async (req, res) => {
  const { limite } = req.query;
  try {
    const produtos = await getProdutosBaixoEstoque(limite || 5);
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const produtos = await listProdutos();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
