import { prismaWrites } from './write.js';
import { prismaReplicas } from './read.js';

let currentReadIndex = 0;
let currentWriteIndex = 0;

const COLOR_RESET = '\x1b[0m';
const COLOR_WRITE = '\x1b[1;33m';
const COLOR_READ = '\x1b[1;36m';
const COLOR_ERROR = '\x1b[1;31m';

function logWrite(operation, name) {
  console.log(`${COLOR_WRITE}[WRITE] ${operation} -> ${name}${COLOR_RESET}`);
}

function logRead(operation, name) {
  console.log(`${COLOR_READ}[READ] ${operation} -> REPLICA ${name}${COLOR_RESET}`);
}

async function executeReadWithFailover(operationName, args, method) {
  const totalReplicas = prismaReplicas.length;
  if (totalReplicas === 0) throw new Error('Nenhuma réplica de leitura configurada.');
  
  let attempts = 0;
  let startIndex = currentReadIndex;
  
  currentReadIndex = (currentReadIndex + 1) % totalReplicas;

  let lastError;
  while (attempts < totalReplicas) {
    const replicaIndex = (startIndex + attempts) % totalReplicas;
    const replica = prismaReplicas[replicaIndex];
    try {
      logRead(operationName, replica.name);
      return await method(replica.client);
    } catch (error) {
      console.warn(`${COLOR_ERROR}[AVISO] Falha na leitura da réplica ${replica.name}. Tentando próxima... Erro: ${error.message}${COLOR_RESET}`);
      lastError = error;
      attempts++;
    }
  }
  throw new Error(`Todas as réplicas de leitura falharam. Último erro: ${lastError?.message}`);
}

async function executeWriteWithFailover(operationName, args, method) {
  const totalWrites = prismaWrites.length;
  if (totalWrites === 0) throw new Error('Nenhum banco de escrita configurado.');

  let attempts = 0;
  let startIndex = currentWriteIndex;

  currentWriteIndex = (currentWriteIndex + 1) % totalWrites;

  let lastError;
  while (attempts < totalWrites) {
    const primaryIndex = (startIndex + attempts) % totalWrites;
    const primary = prismaWrites[primaryIndex];
    try {
      logWrite(operationName, primary.name);
      return await method(primary.client);
    } catch (error) {
      console.warn(`${COLOR_ERROR}[AVISO] Falha na escrita no banco ${primary.name}. Tentando próximo... Erro: ${error.message}${COLOR_RESET}`);
      lastError = error;
      attempts++;
    }
  }
  throw new Error(`Todos os bancos de escrita falharam. Último erro: ${lastError?.message}`);
}

export async function syncLocalReplicas() {
  if (process.env.SIMULATE_REPLICATION !== 'true') return;

  try {
    let clientes, produtos, pedidos, itens;
    
    // Lê os dados do primeiro banco de escrita disponível
    await executeWriteWithFailover('SYNC_READ', null, async (client) => {
      clientes = await client.cliente.findMany();
      produtos = await client.produto.findMany();
      pedidos = await client.pedido.findMany();
      itens = await client.pedidoItem.findMany();
    });

    const allNodes = [...prismaWrites, ...prismaReplicas];
    for (const node of allNodes) {
      try {
        await node.client.$transaction([
          node.client.pedidoItem.deleteMany(),
          node.client.pedido.deleteMany(),
          node.client.produto.deleteMany(),
          node.client.cliente.deleteMany(),
          
          node.client.cliente.createMany({ data: clientes }),
          node.client.produto.createMany({ data: produtos }),
          node.client.pedido.createMany({ data: pedidos }),
          node.client.pedidoItem.createMany({ data: itens })
        ]);
      } catch (replicaError) {
      }
    }
  } catch (error) {
  }
}

export const prisma = new Proxy(prismaWrites[0].client, {
  get(target, prop) {
    if (prop === '$transaction') {
      return async (args, options) => {
        return executeWriteWithFailover('TRANSACTION', args, async (client) => {
          let result;
          if (typeof args === 'function') {
            result = await client.$transaction(args, options);
          } else {
            result = await client.$transaction(args, options);
          }
          await syncLocalReplicas();
          return result;
        });
      };
    }

    if (prop === '$queryRaw' || prop === '$queryRawUnsafe') {
      return (...args) => {
        return executeReadWithFailover('SELECT', args, async (client) => {
          return client[prop](...args);
        });
      };
    }

    if (prop === '$executeRaw' || prop === '$executeRawUnsafe') {
      return async (...args) => {
        return executeWriteWithFailover('UPDATE', args, async (client) => {
          const result = await client[prop](...args);
          await syncLocalReplicas();
          return result;
        });
      };
    }

    if (prop === '$primary') return prismaWrites[0].client;
    if (prop === '$primaries') return prismaWrites;
    if (prop === '$replicas') return prismaReplicas;

    if (typeof target[prop] === 'object' && target[prop] !== null) {
      return new Proxy(target[prop], {
        get(modelTarget, action) {
          if (typeof modelTarget[action] === 'function') {
            return async (...args) => {
              const queryArgs = args[0] || {};

              if (['create', 'createMany'].includes(action)) {
                return executeWriteWithFailover('INSERT', args, async (client) => {
                  const result = await client[prop][action](...args);
                  await syncLocalReplicas();
                  return result;
                });
              }

              if (['update', 'updateMany', 'upsert'].includes(action)) {
                return executeWriteWithFailover('UPDATE', args, async (client) => {
                  const result = await client[prop][action](...args);
                  await syncLocalReplicas();
                  return result;
                });
              }

              if (['delete', 'deleteMany'].includes(action)) {
                return executeWriteWithFailover('DELETE', args, async (client) => {
                  const result = await client[prop][action](...args);
                  await syncLocalReplicas();
                  return result;
                });
              }

              let readOpName = 'SELECT';
              if (action === 'count') readOpName = 'COUNT';
              else if (['aggregate', 'groupBy'].includes(action)) {
                if (queryArgs._sum) readOpName = 'SUM';
                else if (queryArgs._avg) readOpName = 'AVG';
                else if (queryArgs._count) readOpName = 'COUNT';
              } else if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany'].includes(action)) {
                const hasJoin = queryArgs.include && Object.keys(queryArgs.include).length > 0;
                if (hasJoin) readOpName = 'JOIN';
              }

              return executeReadWithFailover(readOpName, args, async (client) => {
                return client[prop][action](...args);
              });
            };
          }
          return modelTarget[action];
        }
      });
    }

    return target[prop];
  }
});

export default prisma;
