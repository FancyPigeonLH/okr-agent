import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const indicatorId = searchParams.get('indicatorId')
    const companyId = searchParams.get('companyId')

    if (!indicatorId || !companyId) {
      return NextResponse.json(
        { error: 'indicatorId e companyId sono richiesti' },
        { status: 400 }
      )
    }

    // Conta i team che usano questo indicatore come Key Result
    const keyResultTeams = await prisma.keyResult.findMany({
      where: {
        indicatorId: indicatorId,
        deletedAt: null,
        objective: {
          deletedAt: null,
          team: {
            companyId: companyId,
            deletedAt: null
          }
        }
      },
      include: {
        objective: {
          include: {
            team: true
          }
        }
      }
    })

    // Estrai i team unici
    const uniqueTeams = new Set(keyResultTeams.map(kr => kr.objective.team.id))
    const teamCount = uniqueTeams.size

    // Ottieni anche i dettagli dei team per mostrare i nomi
    const teams = await prisma.team.findMany({
      where: {
        id: { in: Array.from(uniqueTeams) },
        companyId: companyId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    })

    return NextResponse.json({
      teamCount,
      teams: teams.map(team => ({ id: team.id, name: team.name }))
    })

  } catch (error) {
    console.error('Errore nel recupero dell\'utilizzo dell\'indicatore:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
} 