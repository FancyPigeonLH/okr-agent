'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Send, Loader2, Settings2, MessageSquare } from 'lucide-react'
import { useOKRStore, useOKRActions } from '@/app/lib/store/okr-store'
import { OkrDisplay } from '@/app/components/okr/OkrDisplay'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const { messages, currentOKR, isLoading, context, setContext, error, setError } = useOKRStore()
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
    
    // Genera la richiesta automatica basata sul contesto
    let autoRequest = `Definisci OKR per il team ${context.team} nel periodo ${context.period}`
    if (context.objective) {
      autoRequest = `Definisci OKR per ${context.objective} per il team ${context.team} nel periodo ${context.period}`
    }
    
    setInput(autoRequest)
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
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Team
                </label>
                <input
                  type="text"
                  value={context.team}
                  onChange={(e) => setContext({ ...context, team: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-[#3a88ff]/20 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3a88ff] focus-visible:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="es. Marketing, Sales, Engineering"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Periodo
                </label>
                <input
                  type="text"
                  value={context.period}
                  onChange={(e) => setContext({ ...context, period: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-[#3a88ff]/20 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3a88ff] focus-visible:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="es. Q1 2024, H1 2024"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Obiettivo (opzionale)
                </label>
                <input
                  type="text"
                  value={context.objective || ''}
                  onChange={(e) => setContext({ ...context, objective: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-[#3a88ff]/20 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3a88ff] focus-visible:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="es. Aumentare l'engagement degli utenti"
                />
              </div>
              <Button type="submit" className="w-full bg-[#3a88ff] hover:bg-[#3a88ff]/90 text-white transition-colors duration-200 shadow-sm hover:shadow-md">
                Salva Contesto
              </Button>
            </form>
          ) : (
            <div className="space-y-2 text-sm rounded-lg bg-[#3a88ff]/5 p-3 border border-[#3a88ff]/10 mt-4">
              <div>
                <span className="font-medium text-[#3a88ff]">Team:</span> {context.team || 'Non impostato'}
              </div>
              <div>
                <span className="font-medium text-[#3a88ff]">Periodo:</span> {context.period || 'Non impostato'}
              </div>
              {context.objective && (
                <div>
                  <span className="font-medium text-[#3a88ff]">Obiettivo:</span> {context.objective}
                </div>
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
                <p className="text-sm text-slate-500 mt-1">
                  Assicurati di aver impostato il team e il periodo nel contesto.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-2 rounded-lg shadow-sm ${
                    message.role === 'user'
                      ? 'bg-[#3a88ff] text-white shadow-[#3a88ff]/10'
                      : 'bg-[#3a88ff]/5 text-slate-900 border border-[#3a88ff]/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
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
                  : "Descrivi i tuoi OKR o obiettivi..."
              }
              className="flex h-9 w-full rounded-md border border-[#3a88ff]/20 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3a88ff] focus-visible:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()} 
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

      {/* Pannello OKR */}
      {currentOKR && (
        <div className="w-96 border-l border-[#3a88ff]/10 bg-white overflow-y-auto">
          <div className="p-4">
            <OkrDisplay okrSet={currentOKR} />
          </div>
        </div>
      )}
    </div>
  )
} 