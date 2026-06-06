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
  return prisma.cliente.findMany(query);
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
