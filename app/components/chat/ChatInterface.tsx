'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Send, Loader2, Settings2, MessageSquare } from 'lucide-react'
import { useOKRStore, useOKRActions } from '@/app/lib/store/okr-store'
import { OkrDisplay } from '@/app/components/okr/OkrDisplay'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const { messages, currentOKR, isLoading, context, setContext } = useOKRStore()
  const { generateOKR, iterateOKR } = useOKRActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setInput('')

    if (currentOKR) {
      await iterateOKR(userInput)
    } else {
      await generateOKR(userInput)
    }
  }

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSettings(false)
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar con contesto */}
      <div className="w-80 border-r bg-white shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Contesto</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="hover:bg-slate-100"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>

          {showSettings ? (
            <form onSubmit={handleContextSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Team
                </label>
                <input
                  type="text"
                  value={context.team}
                  onChange={(e) => setContext({ ...context, team: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="es. Aumentare l'engagement degli utenti"
                />
              </div>
              <Button type="submit" className="w-full">
                Salva Contesto
              </Button>
            </form>
          ) : (
            <div className="space-y-2 text-sm rounded-lg bg-slate-50 p-3">
              <div>
                <span className="font-medium">Team:</span> {context.team || 'Non impostato'}
              </div>
              <div>
                <span className="font-medium">Periodo:</span> {context.period || 'Non impostato'}
              </div>
              {context.objective && (
                <div>
                  <span className="font-medium">Obiettivo:</span> {context.objective}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 space-y-4">
            <h3 className="text-sm font-medium">Esempi di richieste:</h3>
            <div className="space-y-2">
              <button
                onClick={() => setInput('Definisci OKR per aumentare le vendite')}
                className="w-full text-left p-2.5 text-sm bg-white border rounded-lg hover:bg-slate-50 transition-colors"
              >
                "Definisci OKR per aumentare le vendite"
              </button>
              <button
                onClick={() => setInput('Crea OKR per migliorare la customer satisfaction')}
                className="w-full text-left p-2.5 text-sm bg-white border rounded-lg hover:bg-slate-50 transition-colors"
              >
                "Crea OKR per migliorare la customer satisfaction"
              </button>
              <button
                onClick={() => setInput('Genera OKR per l\'espansione del mercato')}
                className="w-full text-left p-2.5 text-sm bg-white border rounded-lg hover:bg-slate-50 transition-colors"
              >
                "Genera OKR per l'espansione del mercato"
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat principale */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-bold">LinkHub AI - Coach OKR</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Chiedi al tuo coach OKR di aiutarti a definire Objectives, Key Results, Rischi e Iniziative
          </p>
        </div>

        {/* Area messaggi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="p-4 rounded-full bg-blue-50">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-900">
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
                  className={`max-w-2xl px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-slate-600">Generando OKR...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4">
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
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="sm">
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
        <div className="w-96 border-l bg-white overflow-y-auto">
          <div className="p-4">
            <OkrDisplay okrSet={currentOKR} />
          </div>
        </div>
      )}
    </div>
  )
} 