import { create } from 'zustand'
import { OKRSet, ChatMessage, ValidationResult } from '@/app/types/okr'

interface OKRState {
  // Stato corrente
  currentOKR: OKRSet | null
  isLoading: boolean
  error: string | null
  
  // Chat e messaggi
  messages: ChatMessage[]
  
  // Contesto
  context: {
    team: string
    period: string
    objective?: string
  }
  
  // Azioni
  setContext: (context: { team: string; period: string; objective?: string }) => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCurrentOKR: (okr: OKRSet | null) => void
  clearChat: () => void
}

export const useOKRStore = create<OKRState>((set, get) => ({
  currentOKR: null,
  isLoading: false,
  error: null,
  messages: [],
  context: {
    team: '',
    period: ''
  },

  setContext: (context) => set({ context }),
  
  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date()
    }
    set((state) => ({
      messages: [...state.messages, newMessage]
    }))
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setCurrentOKR: (okr) => set({ currentOKR: okr }),
  
  clearChat: () => set({ 
    messages: [], 
    currentOKR: null, 
    error: null 
  })
}))

// Hook per le azioni API
export const useOKRActions = () => {
  const store = useOKRStore()
  
  const generateOKR = async (userRequest: string) => {
    try {
      store.setLoading(true)
      store.setError(null)
      
      // Aggiungi messaggio utente
      store.addMessage({
        role: 'user',
        content: userRequest
      })
      
      const response = await fetch('/api/okr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userRequest,
          context: {
            team: store.context.team || '',
            period: store.context.period || '',
            objective: store.context.objective || undefined
          }
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore nella generazione')
      }
      
      // Aggiungi messaggio AI
      store.addMessage({
        role: 'assistant',
        content: 'OKR generati con successo: cosa ne dici? 😊',
        okrSetId: data.data.okrSet.id
      })
      
      store.setCurrentOKR(data.data.okrSet)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      store.setError(errorMessage)
      store.addMessage({
        role: 'assistant',
        content: `Errore: ${errorMessage}`
      })
    } finally {
      store.setLoading(false)
    }
  }
  
  const iterateOKR = async (userRequest: string) => {
    try {
      // Reset parziale dello stato
      store.setError(null)
      store.setLoading(true)
      
      if (!store.currentOKR) {
        throw new Error('Nessun OKR corrente da iterare')
      }
      
      // Aggiungi messaggio utente
      store.addMessage({
        role: 'user',
        content: userRequest
      })
      
      // Semplifichiamo la struttura dei dati inviati
      const simplifiedOKR = {
        id: store.currentOKR.id,
        team: store.currentOKR.team || '',
        period: store.currentOKR.period || '',
        objectives: store.currentOKR.objectives.map(obj => ({
          id: obj.id,
          title: obj.title,
          description: obj.description || ''
        })),
        keyResults: store.currentOKR.keyResults.map(kr => ({
          id: kr.id,
          objectiveId: kr.objectiveId,
          title: kr.title,
          forecast: kr.forecast || '',
          moon: kr.moon || '',
          unit: kr.unit || ''
        })),
        risks: store.currentOKR.risks.map(risk => ({
          id: risk.id,
          keyResultId: risk.keyResultId,
          title: risk.title,
          description: risk.description || '',
          probability: risk.probability || 'medium',
          impact: risk.impact || 'medium'
        })),
        initiatives: store.currentOKR.initiatives.map(init => ({
          id: init.id,
          riskId: init.riskId,
          title: init.title,
          description: init.description || '',
          priority: init.priority || 'medium',
          status: init.status || 'not_started'
        }))
      }
      
      const response = await fetch('/api/okr/iterate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentOKR: simplifiedOKR,
          userRequest
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Errore nell\'iterazione')
      }
      
      // Aggiungi messaggio AI
      store.addMessage({
        role: 'assistant',
        content: 'Ho aggiornato gli OKR: ti piacciono le modifiche? 😊',
        okrSetId: data.data.okrSet.id
      })
      
      store.setCurrentOKR(data.data.okrSet)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      console.error('Errore nell\'iterazione:', errorMessage)
      store.setError(errorMessage)
      store.addMessage({
        role: 'assistant',
        content: `Errore: ${errorMessage}`
      })
    } finally {
      store.setLoading(false)
    }
  }
  
  return {
    generateOKR,
    iterateOKR
  }
} 