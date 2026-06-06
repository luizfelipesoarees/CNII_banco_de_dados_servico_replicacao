import prisma from '../db/proxy.js';
import dotenv from 'dotenv';
import { buildQueryOptions } from '../utils/queryBuilder.js';

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

export async function listProdutos(options = {}) {
  const query = buildQueryOptions(options, GROUP_NAME);
  return prisma.produto.findMany(query);
}

export async function updateProduto(id, data) {
  return prisma.produto.update({
    where: { id: parseInt(id) },
    data
  });
}

export async function getProdutosBaixoEstoque(limite = 5, options = {}) {
  const where = {
    estoque: {
      lt: parseInt(limite)
    }
  };
  if (options.filtrarGrupo === 'true') {
    where.criado_por = GROUP_NAME;
  }
  return prisma.produto.findMany({ where });
}
