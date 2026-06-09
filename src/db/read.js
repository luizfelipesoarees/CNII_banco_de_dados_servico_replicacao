import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { prismaWrites } from './write.js';

dotenv.config();

const replicaUrls = Object.keys(process.env)
  .filter(key => key.startsWith('DATABASE_READ_') && process.env[key])
  .map(key => ({
    name: key.replace('DATABASE_READ_', 'REPLICA_'),
    url: process.env[key]
  }));

export const prismaReplicas = [];

if (replicaUrls.length === 0) {
  console.warn('⚠️ Nenhuma réplica configurada. Usando o PRIMARY para operações de leitura.');
  prismaReplicas.push({
    name: 'PRIMARY (Fallback)',
    client: prismaWrites[0].client
  });
} else {
  replicaUrls.forEach(rep => {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: rep.url
        }
      }
    });
    prismaReplicas.push({
      name: rep.name,
      client
    });
    console.log(`✅ Cliente [READ] conectado com sucesso à ${rep.name}.`);
  });
}
