import { create } from 'zustand'

type Company = {
  id: string
  name: string
  mission: string
  vision: string
}

interface OKRContext {
  selectedCompany: Company | null
}

interface OKRState {
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>
  currentOKR: any | null
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
    selectedCompany: null
  },
  setContext: (newContext) =>
    set((state) => ({
      context: { ...state.context, ...newContext },
    })),
  setError: (error) => set({ error }),
}))

export const useOKRActions = () => {
  const generateOKR = async (input: string) => {
    const store = useOKRStore.getState()
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/okr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          context: store.context,
        }),
      })

      if (!response.ok) throw new Error('Errore nella generazione degli OKR')

      const data = await response.json()
      set((state) => ({
        messages: [
          ...state.messages,
          { id: Date.now().toString(), role: 'user', content: input },
          { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message },
        ],
        currentOKR: data.okr,
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false, error: 'Errore nella generazione degli OKR' })
      console.error('Errore:', error)
    }
  }

  const iterateOKR = async (input: string) => {
    const store = useOKRStore.getState()
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/okr/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          context: store.context,
          currentOKR: store.currentOKR,
        }),
      })

      if (!response.ok) throw new Error('Errore nell\'iterazione degli OKR')

      const data = await response.json()
      set((state) => ({
        messages: [
          ...state.messages,
          { id: Date.now().toString(), role: 'user', content: input },
          { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message },
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