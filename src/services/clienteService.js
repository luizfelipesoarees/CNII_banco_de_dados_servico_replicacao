import prisma from '../db/proxy.js';
import dotenv from 'dotenv';
import { buildQueryOptions } from '../utils/queryBuilder.js';

dotenv.config();

const GROUP_NAME = process.env.GROUP_NAME || 'Grupo_Fabio';

export async function createCliente({ nome, email }) {
  return prisma.cliente.create({
    data: {
      nome,
      email,
      criado_por: GROUP_NAME
    }
  });
}

export async function listClientes(options = {}) {
  const query = buildQueryOptions(options, GROUP_NAME);
  const [data, totalElements] = await Promise.all([
    prisma.cliente.findMany(query),
    prisma.cliente.count({ where: query.where })
  ]);
  
  const take = query.take || 10;
  const page = options.page ? parseInt(options.page, 10) : 1;
  const totalPages = Math.ceil(totalElements / take);

  return {
    data,
    totalElements,
    totalPages,
    currentPage: page,
    pageSize: take
  };
}

export async function updateCliente(id, data) {
  return prisma.cliente.update({
    where: { id: parseInt(id) },
    data
  });
}

export async function getClienteById(id) {
  return prisma.cliente.findUnique({
    where: { id: parseInt(id) }
  });
}
