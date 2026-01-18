import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const connectionString = `${process.env.DATABASE_URL}`
const path = connectionString.replace('file:', '')

// The factory takes the URL and returns a factory object that 
// PrismaClient (in version 7) will use to establish a connection.
const adapter = new PrismaBetterSqlite3({ url: path })

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter: adapter as any })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
