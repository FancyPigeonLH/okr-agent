import { NextRequest, NextResponse } from 'next/server'
import { OKRGenerator } from '@/app/lib/ai/gemini'
import { GenerationContext } from '@/app/types/okr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input, context } = body

    // DEBUG: Verifica cosa riceve l'API
    console.log('📡 DEBUG API RICEVUTE:')
    console.log('📝 Input ricevuto:', input)
    console.log('🎯 Categorie ricevute:', context.categories)
    console.log('---')

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

    // Valida e normalizza il contesto
    const generationContext: GenerationContext = {
      team: context.team,
      objective: context.objective,
      categories: context.categories || ['objectives', 'key_results', 'risks', 'initiatives']
    }

    const generator = new OKRGenerator()
    const result = await generator.generateOKR(input, generationContext)

    return NextResponse.json({
      message: 'OKR generati con successo! Cosa ne pensi? 😊',
      okr: result.okrSet,
      categories: generationContext.categories
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