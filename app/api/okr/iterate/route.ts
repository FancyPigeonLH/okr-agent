import { NextRequest, NextResponse } from 'next/server'
import { OKRGenerator } from '@/app/lib/ai/gemini'
import { OKRSet } from '@/app/types/okr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentOKR, userRequest } = body

    // Validazione più robusta
    if (!currentOKR?.id || !userRequest) {
      return NextResponse.json(
        { error: 'OKR corrente (con ID) e richiesta sono obbligatori' },
        { status: 400 }
      )
    }

    // Verifica che l'OKR abbia la struttura minima necessaria
    if (!Array.isArray(currentOKR.objectives) || !Array.isArray(currentOKR.keyResults) || 
        !Array.isArray(currentOKR.risks) || !Array.isArray(currentOKR.initiatives)) {
      return NextResponse.json(
        { error: 'OKR non valido: mancano gli array necessari' },
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
    
    try {
      const result = await generator.iterateOKR(currentOKR as OKRSet, userRequest)
      return NextResponse.json({
        success: true,
        data: result
      })
    } catch (iterationError) {
      console.error('Errore specifico nell\'iterazione:', iterationError)
      return NextResponse.json(
        { 
          error: 'Errore nell\'iterazione OKR',
          details: iterationError instanceof Error ? iterationError.message : 'Errore durante l\'iterazione'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Errore generico nell\'API:', error)
    return NextResponse.json(
      { 
        error: 'Errore nell\'iterazione OKR',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
} 