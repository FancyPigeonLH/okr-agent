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

    const objectives = await prisma.objective.findMany({
      where: {
        team: {
          companyId: companyId
        },
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(objectives)
  } catch (error) {
    console.error('Errore nel recupero degli obiettivi:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
} 