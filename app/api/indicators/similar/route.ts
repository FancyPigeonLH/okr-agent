import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateSimilarIndicators } from '@/app/lib/ai/gemini'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, companyId } = body

    if (!description || !companyId) {
      return NextResponse.json(
        { error: 'Descrizione e Company ID sono richiesti' },
        { status: 400 }
      )
    }

    // Recupera tutti gli indicatori della company
    const existingIndicators = await prisma.indicator.findMany({
      where: {
        companyId: companyId,
        deletedAt: null
      },
      select: {
        id: true,
        description: true,
        symbol: true,
        periodicity: true,
        isReverse: true
      }
    })

    if (existingIndicators.length === 0) {
      return NextResponse.json({
        similarIndicators: []
      })
    }

    // Usa Gemini per analizzare la similarità
    const similarIndicators = await generateSimilarIndicators(
      description,
      existingIndicators
    )

    return NextResponse.json({
      similarIndicators: similarIndicators
    })

  } catch (error) {
    console.error('Errore nella ricerca di indicatori simili:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
} 