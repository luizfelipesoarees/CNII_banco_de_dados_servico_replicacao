import prisma from '../db/proxy.js';

export async function getRelatorioVendas() {
  const result = await prisma.pedido.aggregate({
    _count: {
      id: true
    },
    _sum: {
      valor_total: true
    },
    _avg: {
      valor_total: true
    }
  });

  return {
    quantidade_total_pedidos: result._count.id || 0,
    valor_total_vendido: parseFloat(result._sum.valor_total || 0),
    valor_medio_pedidos: parseFloat(result._avg.valor_total || 0)
  };
}
