import prisma from '../db/proxy.js';
import dotenv from 'dotenv';

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

export async function listClientes() {
  return prisma.cliente.findMany();
}

export async function getClienteById(id) {
  return prisma.cliente.findUnique({
    where: { id: parseInt(id) }
  });
}
