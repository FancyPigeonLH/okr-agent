import { create } from 'zustand'
import { OKRCategory, PartialOKRSet } from '@/app/types/okr'

type Company = {
  id: string
  name: string
  mission: string
  vision: string
}

type Team = {
  id: string
  name: string
  type: string
  impact: number
}

type Initiative = {
  id: string
  description: string
}

type User = {
  id: string
  name: string
  surname: string
  fullName: string
  email: string
  initiatives: Initiative[]
}

type Message =
  | { id: string, role: 'user', content: string }
  | { id: string, role: 'assistant', content: string, okr?: PartialOKRSet }

interface OKRContext {
  selectedCompany: Company | null
  selectedTeam: Team | null
  selectedUser: User | null
}

interface OKRState {
  messages: Message[]
  currentOKR: PartialOKRSet | null
  isLoading: boolean
  context: OKRContext
  error: string | null
  setContext: (context: Partial<OKRContext>) => void
  setError: (error: string | null) => void
}

export const useOKRStore = create<OKRState>((set) => ({
  messages: [],
  currentOKR: null,
  isLoading: false,
  error: null,
  context: {
    selectedCompany: null,
    selectedTeam: null,
    selectedUser: null
  },
  setContext: (newContext) =>
    set((state) => ({
      context: { ...state.context, ...newContext },
    })),
  setError: (error) => set({ error }),
}))

export const useOKRActions = () => {
  const generateOKR = async (input: string, categories?: OKRCategory[], options?: { skipUserMessage?: boolean }) => {
    const store = useOKRStore.getState()
    set({ isLoading: true, error: null })

    // DEBUG: Verifica cosa viene inviato all'API
    const finalCategories = categories || ['objectives', 'key_results', 'risks', 'initiatives']
    console.log('🚀 DEBUG API GENERATE:')
    console.log('📝 Input:', input)
    console.log('🎯 Categorie ricevute:', categories)
    console.log('✅ Categorie finali inviate:', finalCategories)
    console.log('---')

    try {
      const response = await fetch('/api/okr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          context: {
            ...store.context,
            categories: finalCategories
          },
        }),
      })

      if (!response.ok) {
        // Prova a leggere il testo della risposta per errori specifici
        const text = await response.text()
        if (response.status === 503 || text.toLowerCase().includes('overload') || text.toLowerCase().includes('service unavailable')) {
          set({ isLoading: false, error: 'Il sistema AI è temporaneamente sovraccarico. Riprova tra qualche minuto.' })
          return
        }
        throw new Error('Errore nella generazione degli OKR')
      }

      const data = await response.json()
      set((state) => ({
        messages: [
          ...state.messages,
          ...(options?.skipUserMessage
            ? []
            : [{ id: Date.now().toString(), role: 'user', content: input } as Message]),
          { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message, okr: data.okr },
        ],
        currentOKR: data.okr,
        isLoading: false,
      }))
    } catch (error) {
      // Gestione errore overload anche qui
      const msg = String(error).toLowerCase()
      if (msg.includes('overload') || msg.includes('service unavailable') || msg.includes('503')) {
        set({ isLoading: false, error: 'Il sistema AI è temporaneamente sovraccarico. Riprova tra qualche minuto.' })
        return
      }
      set({ isLoading: false, error: 'Errore nella generazione degli OKR' })
      console.error('Errore:', error)
    }
  }

  const iterateOKR = async (input: string, categories?: OKRCategory[], options?: { skipUserMessage?: boolean }) => {
    const store = useOKRStore.getState()
    set({ isLoading: true, error: null })

    // Se non c'è un currentOKR, mostra errore user-friendly
    if (!store.currentOKR) {
      set({ isLoading: false, error: 'Non puoi iterare: nessun OKR generato precedentemente.' })
      return
    }

    try {
      const response = await fetch('/api/okr/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          context: store.context,
          currentOKR: store.currentOKR,
          categories: categories || ['objectives', 'key_results', 'risks', 'initiatives']
        }),
      })

      if (!response.ok) throw new Error('Errore nell\'iterazione degli OKR')

      const data = await response.json()
      set((state) => ({
        messages: [
          ...state.messages,
          ...(options?.skipUserMessage
            ? []
            : [{ id: Date.now().toString(), role: 'user', content: input } as Message]),
          { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message, okr: data.okr },
        ],
        currentOKR: data.okr,
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false, error: 'Errore nell\'iterazione degli OKR' })
      console.error('Errore:', error)
    }
  }

  return { generateOKR, iterateOKR }
}

const set = useOKRStore.setState 