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
          context: store.context
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore nella generazione')
      }
      
      // Aggiungi messaggio AI
      store.addMessage({
        role: 'assistant',
        content: `OKR generati con successo in ${data.data.iterations} iterazioni!`,
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
      store.setLoading(true)
      store.setError(null)
      
      if (!store.currentOKR) {
        throw new Error('Nessun OKR corrente da iterare')
      }
      
      // Aggiungi messaggio utente
      store.addMessage({
        role: 'user',
        content: userRequest
      })
      
      const response = await fetch('/api/okr/iterate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentOKR: store.currentOKR,
          userRequest
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore nell\'iterazione')
      }
      
      // Aggiungi messaggio AI
      store.addMessage({
        role: 'assistant',
        content: 'OKR aggiornati con successo!',
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
  
  return {
    generateOKR,
    iterateOKR
  }
} 