'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { OKRCategory } from '@/app/types/okr'

import { Brain, CheckCircle, XCircle, AlertCircle, ArrowRight, Building2, Users2, User2, ListChecks, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryDebuggerProps {
  userInput: string
  onCategoriesConfirm: (categories: OKRCategory[]) => void
  onCancel: () => void
  context?: {
    company?: { name: string }
    team?: { name: string }
    user?: { fullName: string, initiatives?: { id: string, description: string }[] }
  }
}

const categoryLabels: Record<OKRCategory, { label: string; description: string; color: string }> = {
  objectives: {
    label: 'Obiettivi',
    description: 'Risultati qualitativi da raggiungere',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  key_results: {
    label: 'Key Results',
    description: 'Metriche quantitative per misurare il successo',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  risks: {
    label: 'Rischi',
    description: 'Potenziali ostacoli e minacce',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  kpis: {
    label: 'KPI',
    description: 'Indicatori di soglia di allerta per i rischi',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  initiatives: {
    label: 'Iniziative',
    description: 'Azioni concrete per raggiungere gli obiettivi',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  }
}

export function CategoryDebugger({ userInput, onCategoriesConfirm, onCancel, context }: CategoryDebuggerProps) {
  const [detectedCategories, setDetectedCategories] = useState<OKRCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<OKRCategory[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysisReasoning, setAnalysisReasoning] = useState<Record<OKRCategory, string>>({
    objectives: '',
    key_results: '',
    risks: '',
    kpis: '',
    initiatives: ''
  })
  const [confidenceScores, setConfidenceScores] = useState<Record<OKRCategory, number>>({
    objectives: 0,
    key_results: 0,
    risks: 0,
    kpis: 0,
    initiatives: 0
  })
  const [isVisible, setIsVisible] = useState(false)
  const [analysisError, setAnalysisError] = useState<string>('')
  
  // Nuovi stati per timer e UI
  const [timeLeft, setTimeLeft] = useState(10)
  const [isAnalysisCollapsed, setIsAnalysisCollapsed] = useState(true)
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const [manuallyInteractedCategories, setManuallyInteractedCategories] = useState<Set<OKRCategory>>(new Set())
  const autoConfirmTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Mostra il componente con un'animazione
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Reset delle interazioni manuali quando cambia l'input
    setManuallyInteractedCategories(new Set())
    
    // Analizza il prompt con Gemini
    const analyzePrompt = async () => {
      setIsAnalyzing(true)
      setAnalysisError('')
      
      try {
        // Chiama l'API route per l'analisi
        const response = await fetch('/api/okr/analyze-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userInput })
        })

        if (!response.ok) {
          throw new Error(`Errore API: ${response.status}`)
        }

        const analysis = await response.json()
        
        let finalDetectedCategories = analysis.categories
        let finalAnalysisReasoning = analysis.reasoning
        let finalConfidenceScores = analysis.confidence
        
        // Pre-seleziona le categorie con logica intelligente
        const selectedCategories = analysis.categories.filter((category: OKRCategory) => {
          const confidence = analysis.confidence[category]
          
          // Per KPI, usa una soglia più bassa (70%) perché sono più specifici
          if (category === 'kpis') {
            return confidence >= 0.7
          }
          
          // Per le altre categorie, mantieni la soglia alta (90%)
          return confidence >= 0.9
        })
        
        // Logica di fallback intelligente
        let finalSelectedCategories = selectedCategories
        
        // Se il prompt menziona esplicitamente KPI ma non sono stati rilevati dall'AI,
        // li aggiungiamo comunque
        const kpiKeywords = ['kpi', 'indicatore', 'soglia', 'allerta', 'monitoraggio', 'threshold', 'alert']
        const hasKpiKeywords = kpiKeywords.some(keyword => 
          userInput.toLowerCase().includes(keyword.toLowerCase())
        )
        
        if (hasKpiKeywords && !finalSelectedCategories.includes('kpis')) {
          // Se l'AI ha rilevato KPI ma con confidenza bassa, li aggiungiamo
          if (analysis.categories.includes('kpis')) {
            finalSelectedCategories = [...finalSelectedCategories, 'kpis']
          }
          // Se l'AI non ha rilevato KPI ma il prompt li menziona, li aggiungiamo comunque
          else {
            finalSelectedCategories = [...finalSelectedCategories, 'kpis']
            // Aggiungiamo anche KPI ai detected categories per la visualizzazione
            finalDetectedCategories = [...finalDetectedCategories, 'kpis']
            finalAnalysisReasoning = {
              ...finalAnalysisReasoning,
              kpis: 'Rilevato tramite analisi del prompt - richiesta esplicita di KPI'
            }
            finalConfidenceScores = {
              ...finalConfidenceScores,
              kpis: 0.8 // Confidence artificiale per KPI rilevati tramite parole chiave
            }
          }
        }
        
        // Se nessuna categoria è stata selezionata automaticamente, 
        // seleziona almeno objectives e key_results come fallback
        if (finalSelectedCategories.length === 0) {
          const fallbackCategories = analysis.categories.filter((category: OKRCategory) => 
            ['objectives', 'key_results'].includes(category)
          )
          setSelectedCategories(fallbackCategories.length > 0 ? fallbackCategories : ['objectives', 'key_results'])
        } else {
          setSelectedCategories(finalSelectedCategories)
        }
        
        // Imposta i valori finali per la visualizzazione
        setDetectedCategories(finalDetectedCategories)
        setAnalysisReasoning(finalAnalysisReasoning)
        setConfidenceScores(finalConfidenceScores)
        
      } catch (error) {
        console.error('Errore nell\'analisi AI:', error)
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
        
        if (errorMessage.includes('API key') || errorMessage.includes('non disponibile')) {
          setAnalysisError('API key Gemini non configurata. Utilizzo analisi di fallback.')
        } else {
          setAnalysisError('Errore nell\'analisi AI. Utilizzo fallback.')
        }
        
        // Fallback: usa tutte le categorie
        const allCategories: OKRCategory[] = ['objectives', 'key_results', 'risks', 'kpis', 'initiatives']
        setDetectedCategories(allCategories)
        setSelectedCategories(allCategories)
        setAnalysisReasoning({
          objectives: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
          key_results: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
          risks: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
          kpis: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
          initiatives: 'Analisi AI non disponibile - categoria inclusa per sicurezza'
        })
        setConfidenceScores({
          objectives: 0.5,
          key_results: 0.5,
          risks: 0.5,
          kpis: 0.5,
          initiatives: 0.5
        })
      } finally {
        setIsAnalyzing(false)
      }
    }

    analyzePrompt()
  }, [userInput])

  // Timer di auto-conferma
  useEffect(() => {
    if (!isAnalyzing && !hasConfirmed && selectedCategories.length > 0) {
      // Reset timer
      setTimeLeft(10)
      
      // Avvia countdown
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-conferma
            if (!hasConfirmed) {
              setHasConfirmed(true)
              onCategoriesConfirm(selectedCategories)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Timer di auto-conferma
      autoConfirmTimerRef.current = setTimeout(() => {
        if (!hasConfirmed) {
          setHasConfirmed(true)
          onCategoriesConfirm(selectedCategories)
        }
      }, 10000)

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
        }
        if (autoConfirmTimerRef.current) {
          clearTimeout(autoConfirmTimerRef.current)
        }
      }
    }
  }, [isAnalyzing, hasConfirmed, selectedCategories, onCategoriesConfirm])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
      if (autoConfirmTimerRef.current) {
        clearTimeout(autoConfirmTimerRef.current)
      }
    }
  }, [])

  const handleCategoryToggle = (category: OKRCategory) => {
    // Reset timer quando l'utente interagisce
    setTimeLeft(10)
    if (autoConfirmTimerRef.current) {
      clearTimeout(autoConfirmTimerRef.current)
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }
    
    // Marca questa categoria come interagita manualmente
    setManuallyInteractedCategories(prev => new Set([...prev, category]))
    
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleConfirm = () => {
    if (!hasConfirmed) {
      setHasConfirmed(true)
      onCategoriesConfirm(selectedCategories)
    }
  }

  const handleSelectAll = () => {
    // Reset timer quando l'utente interagisce
    setTimeLeft(10)
    if (autoConfirmTimerRef.current) {
      clearTimeout(autoConfirmTimerRef.current)
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }
    
    setSelectedCategories(['objectives', 'key_results', 'risks', 'kpis', 'initiatives'])
  }

  const handleSelectNone = () => {
    // Reset timer quando l'utente interagisce
    setTimeLeft(10)
    if (autoConfirmTimerRef.current) {
      clearTimeout(autoConfirmTimerRef.current)
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }
    
    setSelectedCategories([])
  }

  return (
    <Card className={cn(
      "w-full max-w-2xl mx-auto border-2 border-[#3a88ff]/20 shadow-lg transition-all duration-500 ease-out",
      isVisible 
        ? "opacity-100 translate-y-0" 
        : "opacity-0 translate-y-4"
    )}>
      <CardHeader className="bg-gradient-to-r from-[#3a88ff]/5 to-[#3a88ff]/10">
        <CardTitle className="flex items-center gap-2 text-[#3a88ff]">
          <Brain className="h-5 w-5" />
          Analisi Intelligente del Prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Recap contesto utente */}
        {context && (context.company || context.team || (context.user && context.user.fullName)) && (
          <div className="bg-[#eaf3ff] border border-[#3a88ff]/20 rounded-lg p-4 mb-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#3a88ff]">Contesto attivo:</span>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-1">
              {context.company && (
                <span className="flex items-center gap-1 text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
                  <Building2 className="h-4 w-4" />
                  {context.company.name}
                </span>
              )}
              {context.team && (
                <span className="flex items-center gap-1 text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
                  <Users2 className="h-4 w-4" />
                  {context.team.name}
                </span>
              )}
              {context.user && context.user.fullName && (
                <span className="flex items-center gap-1 text-sm text-purple-700 bg-purple-100 px-2 py-1 rounded">
                  <User2 className="h-4 w-4" />
                  {context.user.fullName}
                </span>
              )}
            </div>
            {context.user && context.user.initiatives && context.user.initiatives.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <ListChecks className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-700">Iniziative assegnate:</span>
                <ul className="flex flex-wrap gap-2 ml-2">
                  {context.user.initiatives.slice(0, 3).map(init => (
                    <li key={init.id} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                      {init.description}
                    </li>
                  ))}
                  {context.user.initiatives.length > 3 && (
                    <li className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs">
                      +{context.user.initiatives.length - 3} altre
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Input dell'utente */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">📝 Il tuo prompt:</h3>
          <p className="text-gray-900 italic">&ldquo;{userInput}&rdquo;</p>
        </div>

        {/* Analisi in corso */}
        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3a88ff]"></div>
              <span className="text-[#3a88ff] font-medium">Analisi del prompt tramite AI</span>
            </div>
          </div>
        )}

        {/* Risultati dell'analisi */}
        {!isAnalyzing && (
          <>
            {/* Sezione analisi collassabile */}
            <div className="bg-blue-50 rounded-lg border border-blue-200">
              <button
                onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
              >
                <h3 className="font-medium text-blue-800 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Analisi degli elementi della struttura OKR
                </h3>
                {isAnalysisCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-blue-600" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-blue-600" />
                )}
              </button>
              
              {!isAnalysisCollapsed && (
                <div className="px-4 pb-4 text-sm">
                  <div className="space-y-2">
                    {detectedCategories.length > 0 ? (
                      detectedCategories.map(category => (
                        <div key={category} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-blue-800">
                              {categoryLabels[category].label}:
                            </span>
                            <span className="text-blue-700 ml-1">
                              {analysisReasoning[category] || 'Analisi non disponibile'}
                            </span>
                            <span className="text-blue-600 ml-2 text-xs">
                              (Confidenza: {confidenceScores[category] && !isNaN(confidenceScores[category]) ? `${Math.round(confidenceScores[category] * 100)}%` : 'N/A'})
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-blue-700">
                        🔍 Nessuna categoria rilevata dall'analisi AI
                      </div>
                    )}
                    {analysisError && (
                      <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-2 rounded">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{analysisError}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Categorie rilevate */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Elementi OKR rilevati
              </h3>
              <div className="mb-3 text-xs text-gray-600 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Alta confidenza (≥90%) - Pre-selezionato
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-gray-400" />
                  Bassa confidenza (&lt;90%) - Selezionabile manualmente
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(categoryLabels) as OKRCategory[]).map((category) => {
                  const isDetected = detectedCategories.includes(category)
                  const isSelected = selectedCategories.includes(category)
                  const hasHighConfidence = confidenceScores[category] >= 0.9
                  
                  // Determina l'aspetto della card basato su selezione e confidenza
                  // Se l'utente ha interagito manualmente, rispetta la sua scelta
                  // Altrimenti, usa la confidenza AI per pre-selezionare
                  const hasBeenManuallyInteracted = manuallyInteractedCategories.has(category)
                  const shouldShowAsActive = isSelected || (isDetected && hasHighConfidence && !hasBeenManuallyInteracted)
                  
                  return (
                    <div
                      key={category}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all cursor-pointer',
                        shouldShowAsActive 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 bg-gray-50',
                        isSelected && 'ring-2 ring-[#3a88ff] ring-opacity-50'
                      )}
                      onClick={() => handleCategoryToggle(category)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleCategoryToggle(category)}
                          className="h-4 w-4"
                        />
                        <span className="font-medium text-sm">
                          {categoryLabels[category].label}
                        </span>
                        {shouldShowAsActive ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="mt-1">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={cn(
                                "h-1.5 rounded-full transition-all",
                                shouldShowAsActive 
                                  ? "bg-green-500" 
                                  : "bg-gray-400"
                              )}
                              style={{ 
                                width: shouldShowAsActive 
                                  ? `${Math.max(Math.round((confidenceScores[category] || 0) * 100), 10)}%` 
                                  : `${Math.round((confidenceScores[category] || 0) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {confidenceScores[category] && !isNaN(confidenceScores[category]) && confidenceScores[category] > 0 ? `${Math.round(confidenceScores[category] * 100)}%` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Azioni rapide */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex-1"
              >
                Seleziona tutti
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectNone}
                className="flex-1"
              >
                Deseleziona tutti
              </Button>
            </div>

            {/* Timer di auto-conferma */}
            {!hasConfirmed && selectedCategories.length > 0 && timeLeft > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                  <Clock className="h-5 w-5" />
                  <span>
                    Auto-conferma in {timeLeft} secondi
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Azioni */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={hasConfirmed}
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCategories.length === 0 || hasConfirmed}
            className="flex-1 bg-[#3a88ff] hover:bg-[#3a88ff]/90"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Conferma
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 