import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID è richiesto' },
        { status: 400 }
      )
    }

    const indicators = await prisma.indicator.findMany({
      where: {
        companyId: companyId,
        deletedAt: null
      },
      select: {
        id: true,
        description: true,
        symbol: true,
        periodicity: true,
        isReverse: true,
        createdAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
            surname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(indicators)
  } catch (error) {
    console.error('Errore nel recupero degli indicatori:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
} 