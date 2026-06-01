import { prismaWrite } from './write.js';
import { prismaReplicas } from './read.js';

let currentReplicaIndex = 0;

function getNextReplica() {
  const replica = prismaReplicas[currentReplicaIndex];
  currentReplicaIndex = (currentReplicaIndex + 1) % prismaReplicas.length;
  return replica;
}

const COLOR_RESET = '\x1b[0m';
const COLOR_WRITE = '\x1b[1;33m';
const COLOR_READ = '\x1b[1;36m';

function logWrite(operation) {
  console.log(`${COLOR_WRITE}[WRITE] ${operation} -> PRIMARY${COLOR_RESET}`);
}

function logRead(operation, replicaName) {
  console.log(`${COLOR_READ}[READ] ${operation} -> REPLICA ${replicaName}${COLOR_RESET}`);
}

export async function syncLocalReplicas() {
  const isLocal = process.env.DATABASE_READ_1_URL && process.env.DATABASE_READ_1_URL.includes('localhost');
  if (!isLocal) return;

  try {
    const clientes = await prismaWrite.cliente.findMany();
    const produtos = await prismaWrite.produto.findMany();
    const pedidos = await prismaWrite.pedido.findMany();
    const itens = await prismaWrite.pedidoItem.findMany();

    for (const replica of prismaReplicas) {
      if (replica.client === prismaWrite) continue;

      try {
        await replica.client.$transaction([
          replica.client.pedidoItem.deleteMany(),
          replica.client.pedido.deleteMany(),
          replica.client.produto.deleteMany(),
          replica.client.cliente.deleteMany(),
          
          replica.client.cliente.createMany({ data: clientes }),
          replica.client.produto.createMany({ data: produtos }),
          replica.client.pedido.createMany({ data: pedidos }),
          replica.client.pedidoItem.createMany({ data: itens })
        ]);
      } catch (replicaError) {
      }
    }
  } catch (error) {
  }
}

export const prisma = new Proxy(prismaWrite, {
  get(target, prop) {
    if (prop === '$transaction') {
      return async (args, options) => {
        logWrite('TRANSACTION');
        
        let result;
        if (typeof args === 'function') {
          result = await target.$transaction(args, options);
        } else {
          result = await target.$transaction(args, options);
        }

        await syncLocalReplicas();
        return result;
      };
    }

    if (prop === '$queryRaw' || prop === '$queryRawUnsafe') {
      return (...args) => {
        const replica = getNextReplica();
        logRead('SELECT', replica.name);
        return replica.client[prop](...args);
      };
    }

    if (prop === '$executeRaw' || prop === '$executeRawUnsafe') {
      return async (...args) => {
        logWrite('UPDATE');
        const result = await target[prop](...args);
        await syncLocalReplicas();
        return result;
      };
    }

    if (prop === '$primary') return prismaWrite;
    if (prop === '$replicas') return prismaReplicas;

    if (typeof target[prop] === 'object' && target[prop] !== null) {
      return new Proxy(target[prop], {
        get(modelTarget, action) {
          if (typeof modelTarget[action] === 'function') {
            return async (...args) => {
              const queryArgs = args[0] || {};

              if (['create', 'createMany'].includes(action)) {
                logWrite('INSERT');
                const result = await prismaWrite[prop][action](...args);
                await syncLocalReplicas();
                return result;
              }

              if (['update', 'updateMany', 'upsert'].includes(action)) {
                logWrite('UPDATE');
                const result = await prismaWrite[prop][action](...args);
                await syncLocalReplicas();
                return result;
              }

              if (['delete', 'deleteMany'].includes(action)) {
                logWrite('DELETE');
                const result = await prismaWrite[prop][action](...args);
                await syncLocalReplicas();
                return result;
              }

              const replica = getNextReplica();

              if (action === 'count') {
                logRead('COUNT', replica.name);
                return replica.client[prop][action](...args);
              }

              if (['aggregate', 'groupBy'].includes(action)) {
                if (queryArgs._sum) {
                  logRead('SUM', replica.name);
                } else if (queryArgs._avg) {
                  logRead('AVG', replica.name);
                } else if (queryArgs._count) {
                  logRead('COUNT', replica.name);
                } else {
                  logRead('SELECT', replica.name);
                }
                return replica.client[prop][action](...args);
              }

              if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany'].includes(action)) {
                const hasJoin = queryArgs.include && Object.keys(queryArgs.include).length > 0;
                if (hasJoin) {
                  logRead('JOIN', replica.name);
                } else {
                  logRead('SELECT', replica.name);
                }
                return replica.client[prop][action](...args);
              }

              logRead('SELECT', replica.name);
              return replica.client[prop][action](...args);
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
