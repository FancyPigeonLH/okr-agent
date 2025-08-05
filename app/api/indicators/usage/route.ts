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

    // Conta i team che usano questo indicatore come KPI (rischi)
    const riskTeams = await prisma.risk.findMany({
      where: {
        indicatorId: indicatorId,
        deletedAt: null,
        keyResult: {
          deletedAt: null,
          objective: {
            deletedAt: null,
            team: {
              companyId: companyId,
              deletedAt: null
            }
          }
        }
      },
      include: {
        keyResult: {
          include: {
            objective: {
              include: {
                team: true
              }
            }
          }
        }
      }
    })

    // Estrai i team unici per Key Result
    const uniqueKeyResultTeams = new Set(keyResultTeams.map(kr => kr.objective.team.id))
    const keyResultTeamCount = uniqueKeyResultTeams.size

    // Estrai i team unici per KPI
    const uniqueRiskTeams = new Set(riskTeams.map(risk => risk.keyResult.objective.team.id))
    const kpiTeamCount = uniqueRiskTeams.size

    // Combina tutti i team unici per il conteggio totale
    const allUniqueTeams = new Set([...Array.from(uniqueKeyResultTeams), ...Array.from(uniqueRiskTeams)])
    const totalTeamCount = allUniqueTeams.size

    // Ottieni i dettagli dei team per Key Result
    const keyResultTeamDetails = await prisma.team.findMany({
      where: {
        id: { in: Array.from(uniqueKeyResultTeams) },
        companyId: companyId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    })

    // Ottieni i dettagli dei team per KPI
    const kpiTeamDetails = await prisma.team.findMany({
      where: {
        id: { in: Array.from(uniqueRiskTeams) },
        companyId: companyId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    })

    return NextResponse.json({
      keyResultTeamCount,
      kpiTeamCount,
      totalTeamCount,
      keyResultTeams: keyResultTeamDetails.map(team => ({ id: team.id, name: team.name })),
      kpiTeams: kpiTeamDetails.map(team => ({ id: team.id, name: team.name }))
    })

  } catch (error) {
    console.error('Errore nel recupero dell\'utilizzo dell\'indicatore:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
} 