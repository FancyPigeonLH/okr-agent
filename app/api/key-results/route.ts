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

    const keyResults = await prisma.keyResult.findMany({
      where: {
        indicator: {
          companyId: companyId
        },
        deletedAt: null
      },
      select: {
        id: true,
        finalForecastValue: true,
        finalTargetValue: true,
        finalForecastTargetDate: true,
        weight: true,
        impact: true,
        createdAt: true,
        indicator: {
          select: {
            id: true,
            description: true,
            symbol: true
          }
        },
        objective: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(keyResults)
  } catch (error) {
    console.error('Errore nel recupero dei Key Results:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { indicatorId, objectiveId, weight, impact, finalForecastValue, finalTargetValue, finalForecastTargetDate } = body

    // Validazione dei campi obbligatori
    if (!indicatorId || !objectiveId || !finalForecastValue || !finalTargetValue || !finalForecastTargetDate) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori (indicatorId, objectiveId, finalForecastValue, finalTargetValue, finalForecastTargetDate)' },
        { status: 400 }
      )
    }

    // Validazione dei valori numerici
    if (finalForecastValue <= 0 || finalTargetValue <= 0) {
      return NextResponse.json(
        { error: 'I valori forecast e target devono essere maggiori di 0' },
        { status: 400 }
      )
    }

    // Genera uno slug unico per il Key Result
    const baseSlug = `key-result-${Date.now()}`
    const slug = baseSlug.replace(/-+/g, '-').replace(/^-|-$/g, '')

    // Crea il Key Result nel database
    const newKeyResult = await prisma.keyResult.create({
      data: {
        indicatorId: indicatorId,
        objectiveId: objectiveId,
        weight: weight || 1.0,
        impact: impact || 0,
        finalForecastValue: finalForecastValue,
        finalTargetValue: finalTargetValue,
        finalForecastTargetDate: new Date(finalForecastTargetDate),
        slug: slug
      },
      select: {
        id: true,
        finalForecastValue: true,
        finalTargetValue: true,
        finalForecastTargetDate: true,
        weight: true,
        impact: true,
        createdAt: true,
        indicator: {
          select: {
            id: true,
            description: true,
            symbol: true
          }
        },
        objective: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    })

    return NextResponse.json(newKeyResult, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione del Key Result:', error)
    
    // Gestione errori specifici di Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Un Key Result con questo slug esiste già' },
          { status: 409 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Indicator ID o Objective ID non validi' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
} 