import prisma from '../db/proxy.js';
import dotenv from 'dotenv';

dotenv.config();

const GROUP_NAME = process.env.GROUP_NAME || 'Grupo_Fabio';

export async function createProduto({ descricao, categoria, valor, estoque }) {
  return prisma.produto.create({
    data: {
      descricao,
      categoria,
      valor: parseFloat(valor),
      estoque: parseInt(estoque),
      criado_por: GROUP_NAME
    }
  });
}

export async function listProdutos() {
  return prisma.produto.findMany();
}

export async function getProdutosBaixoEstoque(limite = 5) {
  return prisma.produto.findMany({
    where: {
      estoque: {
        lt: parseInt(limite)
      }
    }
  });
}
