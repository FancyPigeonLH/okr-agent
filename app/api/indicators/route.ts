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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, symbol, periodicity, isReverse, companyId, assigneeId } = body

    // Validazione dei campi obbligatori
    if (!description || !symbol || !periodicity || !companyId) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori (description, symbol, periodicity, companyId)' },
        { status: 400 }
      )
    }

    // Validazione della periodicità
    if (periodicity <= 0) {
      return NextResponse.json(
        { error: 'La periodicità deve essere maggiore di 0' },
        { status: 400 }
      )
    }

    // Genera uno slug unico per l'indicatore
    const baseSlug = `${description.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)}-${Date.now()}`
    const slug = baseSlug.replace(/-+/g, '-').replace(/^-|-$/g, '')

    // Se assigneeId è vuoto, cerca un utente di default per la company
    let finalAssigneeId = assigneeId
    if (!assigneeId || assigneeId.trim() === '') {
      const defaultUser = await prisma.user.findFirst({
        where: {
          memberships: {
            some: {
              team: {
                companyId: companyId
              }
            }
          }
        },
        select: { id: true }
      })
      
      if (!defaultUser) {
        return NextResponse.json(
          { error: 'Nessun utente trovato per la company. Impossibile creare l\'indicatore.' },
          { status: 400 }
        )
      }
      
      finalAssigneeId = defaultUser.id
    }

    // Crea l'indicatore nel database
    const newIndicator = await prisma.indicator.create({
      data: {
        description: description.trim(),
        symbol: symbol.trim(),
        periodicity: periodicity,
        isReverse: isReverse || false,
        companyId: companyId,
        assigneeId: finalAssigneeId,
        slug: slug
      },
      select: {
        id: true,
        description: true,
        symbol: true,
        periodicity: true,
        isReverse: true,
        createdAt: true,
        companyId: true,
        assignee: {
          select: {
            id: true,
            name: true,
            surname: true
          }
        }
      }
    })

    return NextResponse.json(newIndicator, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione dell\'indicatore:', error)
    
    // Gestione errori specifici di Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Un indicatore con questa descrizione esiste già' },
          { status: 409 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Company ID o Assignee ID non validi' },
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