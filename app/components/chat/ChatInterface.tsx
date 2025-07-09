'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Send, Loader2, Settings2, MessageSquare, X } from 'lucide-react'
import { useOKRStore, useOKRActions } from '@/app/lib/store/okr-store'
import { OkrMessage } from './OkrMessage'
import { CompanyContext } from './CompanyContext'
import { TeamContext } from './TeamContext'
import { UserContext } from './UserContext'
import { CategorySelector } from './CategorySelector'
import { CategoryDebugger } from './CategoryDebugger'
import { detectOKRCategories } from '@/lib/utils'
import { OKRCategory } from '@/app/types/okr'
import React from 'react'

export function ChatInterface() {
  type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; okr?: any }
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<OKRCategory[]>([])
  const [showCategoryDebugger, setShowCategoryDebugger] = useState(false)
  const [pendingUserInput, setPendingUserInput] = useState('')
  const [isFirstInteraction, setIsFirstInteraction] = useState(true)
  const { messages, currentOKR, isLoading, context, setContext } = useOKRStore() as { messages: ChatMessage[], currentOKR: any, isLoading: boolean, context: any, setContext: any }
  const { generateOKR, iterateOKR } = useOKRActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setInput('')

    // Aggiungi subito il messaggio utente alla chat
    useOKRStore.setState(state => ({
      messages: [
        ...state.messages,
        { id: Date.now().toString(), role: 'user' as 'user', content: userInput }
      ]
    }))

    // Mostra il CategoryDebugger
    setPendingUserInput(userInput)
    setShowCategoryDebugger(true)
  }

  const handleCategoriesConfirm = async (categories: OKRCategory[]) => {
    setSelectedCategories(categories)
    setShowCategoryDebugger(false)
    setIsFirstInteraction(false)
    
    // Procedi con la generazione/iterazione
    try {
      if (currentOKR) {
        // Aggiorna solo la risposta dell'assistente
        await iterateOKR(pendingUserInput, categories, { skipUserMessage: true })
      } else {
        await generateOKR(pendingUserInput, categories, { skipUserMessage: true })
      }
    } catch (error) {
      console.error('Errore durante l\'operazione:', error)
    }
  }

  const handleCategoryDebuggerCancel = () => {
    setShowCategoryDebugger(false)
    setPendingUserInput('')
  }

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Ora NON generiamo più un prompt automatico. Solo chiudiamo il pannello.
    setShowSettings(false)
  }

  const handleResetContext = () => {
    setContext({
      selectedCompany: null,
      selectedTeam: null,
      selectedUser: null
    })
    setShowSettings(false)
  }



  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar con contesto */}
      <div className="w-80 border-r border-[#3a88ff]/10 bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-[#3a88ff]">Contesto</h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetContext}
                className="hover:bg-[#3a88ff]/10 text-[#3a88ff] transition-colors duration-200"
                title="Resetta filtri"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="hover:bg-[#3a88ff]/10 text-[#3a88ff] transition-colors duration-200"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showSettings ? (
            <form onSubmit={handleContextSubmit} className="space-y-4 mt-4">
              <CompanyContext
                selectedCompany={context.selectedCompany}
                onCompanySelect={(company) => {
                  setContext({ 
                    selectedCompany: company,
                    selectedTeam: null, // Reset team selection when company changes
                    selectedUser: null  // Reset user selection when company changes
                  })
                }}
              />
              <TeamContext
                selectedTeam={context.selectedTeam}
                onTeamSelect={(team) => {
                  setContext({ 
                    selectedTeam: team,
                    selectedUser: null // Reset user selection when team changes
                  })
                }}
                companyId={context.selectedCompany?.id || null}
                disabled={!context.selectedCompany}
              />
              <UserContext
                selectedUser={context.selectedUser}
                onUserSelect={(user) => setContext({ selectedUser: user })}
                companyId={context.selectedCompany?.id || null}
                disabled={!context.selectedCompany}
              />
              <Button 
                type="submit" 
                className="w-full bg-[#3a88ff] hover:bg-[#3a88ff]/90 text-white transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Usa Contesto
              </Button>
            </form>
          ) : (
            <div className="space-y-2 text-sm rounded-lg bg-[#3a88ff]/5 p-3 border border-[#3a88ff]/10 mt-4">
              {context.selectedCompany ? (
                <>
                  <div>
                    <span className="font-medium text-[#3a88ff]">Company:</span> {context.selectedCompany.name}
                  </div>
                  {context.selectedTeam && (
                    <div>
                      <span className="font-medium text-[#3a88ff]">Team:</span> {context.selectedTeam.name}
                    </div>
                  )}
                  {context.selectedUser && (
                    <div>
                      <span className="font-medium text-[#3a88ff]">Utente:</span> {context.selectedUser.fullName}
                      {context.selectedUser.initiatives.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium text-[#3a88ff]">Iniziative assegnate:</span>
                          <ul className="mt-1 space-y-1 text-xs text-slate-600">
                            {context.selectedUser.initiatives.map((initiative: { id: string; description: string }) => (
                              <li key={initiative.id}>• {initiative.description}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-[#3a88ff]">Mission:</span>
                    <p className="mt-1 text-slate-600">{context.selectedCompany.mission}</p>
                  </div>
                  <div>
                    <span className="font-medium text-[#3a88ff]">Vision:</span>
                    <p className="mt-1 text-slate-600">{context.selectedCompany.vision}</p>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">Nessun contesto selezionato. Puoi procedere con una richiesta libera o selezionare un contesto specifico.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat principale */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b bg-[#3a88ff] p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-5 w-5 text-white" />
            <h1 className="text-xl font-bold text-white">LinkHub AI - Coach OKR</h1>
          </div>
          <p className="text-sm text-white/90">
            Chiedi al tuo coach OKR di aiutarti a definire Objectives, Key Results, Rischi e Iniziative
          </p>
        </div>

        {/* Area messaggi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Debugger categorie SOLO se PRIMA richiesta */}
          {showCategoryDebugger && isFirstInteraction && (
            <div className="flex justify-center py-4">
              <CategoryDebugger
                userInput={pendingUserInput}
                onCategoriesConfirm={handleCategoriesConfirm}
                onCancel={handleCategoryDebuggerCancel}
              />
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="p-4 rounded-full bg-[#3a88ff]/10 shadow-inner">
                <MessageSquare className="h-8 w-8 text-[#3a88ff]" />
              </div>
              <div>
                <p className="text-lg font-medium text-[#3a88ff]">
                  Inizia a chattare con il tuo coach OKR!
                </p>
                <p className="text-slate-500">
                  Seleziona una company dal menu di contesto per iniziare.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isLastUserMsg =
                message.role === 'user' &&
                messages.slice(index + 1).findIndex(m => m.role === 'user') === -1

              return (
                <React.Fragment key={message.id}>
                  <div
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-4xl px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-[#3a88ff] text-white shadow-[#3a88ff]/10'
                          : 'bg-[#3a88ff]/5 text-slate-900 border border-[#3a88ff]/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {/* Mostra OkrMessage solo se il messaggio dell'assistente ha okr */}
                      {message.role === 'assistant' && message.okr && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <OkrMessage okrSet={message.okr} />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Mostra il CategoryDebugger DOPO l'ultimo messaggio utente se attivo e NON è la prima richiesta */}
                  {showCategoryDebugger && !isFirstInteraction && isLastUserMsg && messages.length > 0 && (
                    <div className="flex justify-center py-4">
                      <CategoryDebugger
                        userInput={pendingUserInput}
                        onCategoriesConfirm={handleCategoriesConfirm}
                        onCancel={handleCategoryDebuggerCancel}
                      />
                    </div>
                  )}
                </React.Fragment>
              )
            })
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#3a88ff]/5 px-4 py-2 rounded-lg border border-[#3a88ff]/10">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#3a88ff]" />
                  <span className="text-[#3a88ff]">Generando OKR...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Area input con selettore categorie */}
        <div className="border-t border-[#3a88ff]/10 bg-white">
          {/* Selettore categorie sopra l'input */}
          {!showCategoryDebugger && (
            <div className="p-4 pb-2">
              <CategorySelector
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                onConfirm={() => {}} // Non serve conferma, cambia immediatamente
                onCancel={() => {}} // Non serve annulla
                compact={true} // Modalità compatta
              />
            </div>
          )}
          
          {/* Input */}
          <div className="p-4 pt-2">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  currentOKR
                    ? "Chiedi di modificare gli OKR esistenti..."
                    : "Scrivi la tua richiesta per gli OKR..."
                }
                className="flex h-9 w-full rounded-md border border-[#3a88ff]/20 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3a88ff] focus-visible:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                size="sm" 
                className="bg-[#3a88ff] hover:bg-[#3a88ff]/90 text-white transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title="Invia messaggio"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 