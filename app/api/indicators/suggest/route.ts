import { NextRequest, NextResponse } from 'next/server'
import { suggestIndicatorFields } from '@/app/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Descrizione richiesta e deve essere una stringa' },
        { status: 400 }
      )
    }

    if (description.trim().length < 3) {
      return NextResponse.json(
        { error: 'La descrizione deve contenere almeno 3 caratteri' },
        { status: 400 }
      )
    }

    const suggestion = await suggestIndicatorFields(description.trim())

    return NextResponse.json({
      suggestion,
      success: true
    })

  } catch (error) {
    console.error('Errore nel suggerimento indicatori:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
} 