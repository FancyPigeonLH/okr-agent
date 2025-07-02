'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2, Settings2, MessageSquare } from 'lucide-react'
import { useOKRStore, useOKRActions } from '@/app/lib/store/okr-store'
import { OkrMessage } from './OkrMessage'
import { CompanyContext } from './CompanyContext'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const { messages, currentOKR, isLoading, context, setContext, error } = useOKRStore()
  const { generateOKR, iterateOKR } = useOKRActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setInput('')

    try {
      if (currentOKR) {
        await iterateOKR(userInput)
      } else {
        await generateOKR(userInput)
      }
    } catch (error) {
      console.error('Errore durante l\'operazione:', error)
    }
  }

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Genera la richiesta automatica basata sul contesto della company
    if (context.selectedCompany) {
      const autoRequest = `Genera degli OKR per un membro di ${context.selectedCompany.name}`
      setInput(autoRequest)
    }
    
    setShowSettings(false)
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar con contesto */}
      <div className="w-80 border-r border-[#3a88ff]/10 bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-[#3a88ff]">Contesto</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="hover:bg-[#3a88ff]/10 text-[#3a88ff] transition-colors duration-200"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>

          {showSettings ? (
            <form onSubmit={handleContextSubmit} className="space-y-4 mt-4">
              <CompanyContext
                selectedCompany={context.selectedCompany}
                onCompanySelect={(company) => setContext({ selectedCompany: company })}
              />
              <Button 
                type="submit" 
                className="w-full bg-[#3a88ff] hover:bg-[#3a88ff]/90 text-white transition-colors duration-200 shadow-sm hover:shadow-md"
                disabled={!context.selectedCompany}
              >
                Genera Prompt
              </Button>
            </form>
          ) : (
            <div className="space-y-2 text-sm rounded-lg bg-[#3a88ff]/5 p-3 border border-[#3a88ff]/10 mt-4">
              {context.selectedCompany ? (
                <>
                  <div>
                    <span className="font-medium text-[#3a88ff]">Company:</span> {context.selectedCompany.name}
                  </div>
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
                <p className="text-slate-500">Seleziona una company per iniziare</p>
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
            messages.map((message, index) => (
              <div
                key={message.id}
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
                  {message.role === 'assistant' && currentOKR && index === messages.length - 1 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <OkrMessage okrSet={currentOKR} />
                    </div>
                  )}
                </div>
              </div>
            ))
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

        {/* Input */}
        <div className="border-t border-[#3a88ff]/10 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                currentOKR
                  ? "Chiedi di modificare gli OKR esistenti..."
                  : "Chiedi di generare nuovi OKR..."
              }
              className="flex h-9 w-full rounded-md border border-[#3a88ff]/20 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3a88ff] focus-visible:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || !context.selectedCompany}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim() || !context.selectedCompany} 
              size="sm" 
              className="bg-[#3a88ff] hover:bg-[#3a88ff]/90 text-white transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
} 