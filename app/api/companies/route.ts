import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        mission: true,
        vision: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Errore nel recupero delle company:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero delle company' },
      { status: 500 }
    )
  }
} 