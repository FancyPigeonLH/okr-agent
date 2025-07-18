import { NextRequest, NextResponse } from 'next/server'
import { OKRGenerator } from '@/app/lib/ai/gemini'
import { OKRCategory } from '@/app/types/okr'

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json()

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'userInput è richiesto e deve essere una stringa' },
        { status: 400 }
      )
    }

    const generator = new OKRGenerator()
    const analysis = await generator.analyzeCategories(userInput)

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Errore nell\'analisi delle categorie:', error)
    
    // Fallback sicuro
    const fallbackAnalysis = {
      categories: ['objectives', 'key_results', 'risks', 'initiatives'] as OKRCategory[],
      reasoning: {
        objectives: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
        key_results: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
        risks: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
        initiatives: 'Analisi AI non disponibile - categoria inclusa per sicurezza'
      },
      confidence: {
        objectives: 0.5,
        key_results: 0.5,
        risks: 0.5,
        initiatives: 0.5
      }
    }

    return NextResponse.json(fallbackAnalysis)
  }
} 