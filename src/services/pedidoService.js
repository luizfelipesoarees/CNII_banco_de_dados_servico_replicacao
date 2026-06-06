import prisma from '../db/proxy.js';
import dotenv from 'dotenv';
import { buildQueryOptions } from '../utils/queryBuilder.js';

dotenv.config();

const GROUP_NAME = process.env.GROUP_NAME || 'Grupo_Fabio';

export async function createPedido({ cliente_id, itens, status }) {
  if (!itens || itens.length === 0) {
    throw new Error('O pedido deve conter pelo menos um item.');
  }

  return prisma.$transaction(async (tx) => {
    let valor_total = 0;
    const itensValidados = [];

    for (const item of itens) {
      const produto = await tx.produto.findUnique({
        where: { id: parseInt(item.produto_id) }
      });

      if (!produto) {
        throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
      }

      if (produto.estoque < item.quantidade) {
        throw new Error(
          `Estoque insuficiente para o produto "${produto.descricao}". Estoque atual: ${produto.estoque}, Solicitado: ${item.quantidade}`
        );
      }

      const valorUnitario = parseFloat(produto.valor);
      const subtotal = valorUnitario * item.quantidade;
      valor_total += subtotal;

      await tx.produto.update({
        where: { id: produto.id },
        data: {
          estoque: produto.estoque - item.quantidade
        }
      });

      itensValidados.push({
        produto_id: produto.id,
        quantidade: item.quantidade,
        valor_unitario: valorUnitario
      });
    }

    const pedido = await tx.pedido.create({
      data: {
        cliente_id: parseInt(cliente_id),
        valor_total: valor_total,
        status: status || 'FINALIZADO',
        criado_por: GROUP_NAME
      }
    });

    for (const item of itensValidados) {
      await tx.pedidoItem.create({
        data: {
          pedido_id: pedido.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario
        }
      });
    }

    return pedido;
  });
}

export async function getPedidoCompleto(pedidoId, options = {}) {
  const where = { id: parseInt(pedidoId) };
  if (options.filtrarGrupo === 'true') {
    where.criado_por = GROUP_NAME;
  }
  return prisma.pedido.findFirst({
    where,
    include: {
      cliente: true,
      itens: {
        include: {
          produto: true
        }
      }
    }
  });
}

export async function getItensPedido(pedidoId, options = {}) {
  const where = { pedido_id: parseInt(pedidoId) };
  if (options.filtrarGrupo === 'true') {
    where.pedido = { criado_por: GROUP_NAME };
  }
  return prisma.pedidoItem.findMany({
    where,
    include: {
      produto: true
    }
  });
}

export async function getHistoricoCliente(clienteId, options = {}) {
  const where = { cliente_id: parseInt(clienteId) };
  if (options.filtrarGrupo === 'true') {
    where.criado_por = GROUP_NAME;
  }
  return prisma.pedido.findMany({
    where,
    include: {
      itens: {
        include: {
          produto: true
        }
      }
    },
    orderBy: { criado_em: 'desc' },
    take: 5
  });
}

export async function listPedidos(options = {}) {
  const query = buildQueryOptions(options, GROUP_NAME);
  return prisma.pedido.findMany(query);
}
