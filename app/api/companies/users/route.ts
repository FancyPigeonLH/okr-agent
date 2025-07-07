import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID non fornito' }, { status: 400 })
    }

    // Ottiene gli utenti che hanno membership in team della company
    const users = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            team: {
              companyId,
              deletedAt: null
            }
          }
        },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        // Includi le iniziative attive assegnate all'utente
        assignedInitiatives: {
          where: {
            deletedAt: null,
            finishedAt: null,
            team: {
              companyId
            }
          },
          select: {
            id: true,
            description: true,
            status: true,
            checkInDays: true,
            isNew: true,
            relativeImpact: true,
            overallImpact: true
          }
        }
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ]
    })

    // Trasforma i risultati per corrispondere al tipo User
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || '',
      surname: user.surname || '',
      fullName: `${user.name || ''} ${user.surname || ''}`.trim(),
      email: user.email || '',
      initiatives: user.assignedInitiatives
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero degli utenti' },
      { status: 500 }
    )
  }
} 