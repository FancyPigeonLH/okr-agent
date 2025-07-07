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

    const teams = await prisma.team.findMany({
      where: {
        companyId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        type: true,
        impact: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Errore nel recupero dei team:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei team' },
      { status: 500 }
    )
  }
} 