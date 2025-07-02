import { NextRequest, NextResponse } from 'next/server'
import { OKRGenerator } from '@/app/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input, context, currentOKR } = body

    if (!input || !currentOKR) {
      return NextResponse.json(
        { error: 'Input e OKR correnti sono obbligatori' },
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
    const result = await generator.iterateOKR(currentOKR, input)

    return NextResponse.json({
      message: 'OKR aggiornati con successo! Ti piacciono le modifiche? 😊',
      okr: result.okrSet
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