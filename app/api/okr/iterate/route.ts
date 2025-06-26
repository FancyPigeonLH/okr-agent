import { NextRequest, NextResponse } from 'next/server'
import { OKRGenerator } from '@/app/lib/ai/gemini'
import { OKRSet } from '@/app/types/okr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentOKR, userRequest } = body

    if (!currentOKR || !userRequest) {
      return NextResponse.json(
        { error: 'OKR corrente e richiesta sono obbligatori' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key di Gemini non configurata' },
        { status: 500 }
      )
    }

    const generator = new OKRGenerator()
    const result = await generator.iterateOKR(currentOKR as OKRSet, userRequest)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Errore nell\'iterazione OKR:', error)
    return NextResponse.json(
      { 
        error: 'Errore nell\'iterazione OKR',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
} 