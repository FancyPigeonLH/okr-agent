import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Test the connection by trying to count users
    const userCount = await prisma.user.count()
    console.log('Connessione al database riuscita!')
    console.log(`Numero di utenti nel database: ${userCount}`)
  } catch (error) {
    console.error('Errore di connessione al database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 