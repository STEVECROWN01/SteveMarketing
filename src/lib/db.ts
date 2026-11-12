import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Client Prisma paresseux : l'instanciation n'a lieu qu'à la première
 * utilisation. Sur un environnement sans base configurée (serverless
 * sans DATABASE_URL), l'erreur est levée au sein du try/catch de la
 * route appelante — jamais au chargement du module — ce qui permet la
 * dégradation contrôlée (relais email, refus honnête) prévue par
 * l'API des demandes.
 */
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query'],
    })
  }
  return globalForPrisma.prisma
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
