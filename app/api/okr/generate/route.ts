import { NextRequest, NextResponse } from 'next/server'
import { OKRGenerator } from '@/app/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input, context } = body

    if (!input || !context) {
      return NextResponse.json(
        { error: 'Input e contesto sono obbligatori' },
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
    const result = await generator.generateOKR(input, context)

    return NextResponse.json({
      message: 'OKR generati con successo! Cosa ne pensi? 😊',
      okr: result.okrSet
    })

  } catch (error) {
    console.error('Errore nella generazione OKR:', error)
    return NextResponse.json(
      { 
        error: 'Errore nella generazione OKR',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
} 