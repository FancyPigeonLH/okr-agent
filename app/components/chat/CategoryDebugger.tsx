'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { OKRCategory } from '@/app/types/okr'
import { detectOKRCategories } from '@/lib/utils'
import { Brain, CheckCircle, XCircle, AlertCircle, ArrowRight, Building2, Users2, User2, ListChecks } from 'lucide-react'
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
  const [analysisReasoning, setAnalysisReasoning] = useState<string>('')

  useEffect(() => {
    // Simula l'analisi del prompt
    const analyzePrompt = async () => {
      setIsAnalyzing(true)
      
      // Simula un delay per mostrare l'analisi in corso
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Analizza il prompt
      const detected = detectOKRCategories(userInput, false)
      setDetectedCategories(detected)
      
      // Genera il ragionamento
      const reasoning = generateReasoning(userInput, detected)
      setAnalysisReasoning(reasoning)
      
      // Pre-seleziona le categorie rilevate
      setSelectedCategories(detected)
      
      setIsAnalyzing(false)
    }

    analyzePrompt()
  }, [userInput])

  const generateReasoning = (input: string, categories: OKRCategory[]): string => {
    const lowerInput = input.toLowerCase()
    const reasons: string[] = []

    if (categories.includes('objectives')) {
      if (/(obiettivo|obiettivi|objective|objectives|raggiungere)/.test(lowerInput)) {
        reasons.push('✅ Rilevato riferimento a "obiettivi"/"objectives" (singolare/plurale) o "raggiungere"')
      }
      if (/(qualitativo|qualitativi|qualitative)/.test(lowerInput)) {
        reasons.push('✅ Rilevato riferimento a risultati "qualitativi"')
      }
    }

    if (categories.includes('key_results')) {
      if (/(key result|key results|keyresult|keyresults|kpi|metric[ahie]?|misura|misure)/.test(lowerInput)) {
        reasons.push('✅ Rilevato riferimento a "key result(s)", "KPI", "metriche", "misure"')
      }
      if (/(quantitativo|quantitativi|quantitative|%)/.test(lowerInput)) {
        reasons.push('✅ Rilevato riferimento a risultati "quantitativi" o percentuali')
      }
    }

    if (categories.includes('risks')) {
      if (/(rischio|rischi|risk|risks|ostacolo|ostacoli)/.test(lowerInput)) {
        reasons.push('✅ Rilevato riferimento a "rischi"/"risks" (singolare/plurale) o "ostacoli"')
      }
      if (/(problema|problemi|minaccia|minacce|difficoltà|difficolta)/.test(lowerInput)) {
        reasons.push('✅ Rilevato riferimento a "problemi", "minacce" o "difficoltà"')
      }
    }

    if (categories.includes('initiatives')) {
      if (/(iniziativa|iniziative|azione|azioni|progetto|progetti|initiative|initiatives)/.test(lowerInput)) {
        reasons.push('✅ Rilevato riferimento a "iniziative", "azioni", "progetti"')
      }
      if (/(fare|implementare|eseguire)/.test(lowerInput)) {
        reasons.push('✅ Rilevato riferimento ad azioni concrete')
      }
    }

    if (reasons.length === 0) {
      reasons.push('🔍 Nessuna parola chiave specifica rilevata, ma il contesto suggerisce la necessità di categorie complete')
    }

    return reasons.join('\n')
  }

  const handleCategoryToggle = (category: OKRCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleConfirm = () => {
    onCategoriesConfirm(selectedCategories)
  }

  const handleSelectAll = () => {
    setSelectedCategories(['objectives', 'key_results', 'risks', 'initiatives'])
  }

  const handleSelectNone = () => {
    setSelectedCategories([])
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-[#3a88ff]/20 shadow-lg">
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
          <p className="text-gray-900 italic">"{userInput}"</p>
        </div>

        {/* Analisi in corso */}
        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3a88ff]"></div>
              <span className="text-[#3a88ff] font-medium">Analizzando il prompt...</span>
            </div>
          </div>
        )}

        {/* Risultati dell'analisi */}
        {!isAnalyzing && (
          <>
            {/* Ragionamento */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Analisi degli elementi della struttura OKR
              </h3>
              <pre className="text-sm text-blue-700 whitespace-pre-wrap font-mono">
                {analysisReasoning}
              </pre>
            </div>

            {/* Categorie rilevate */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Elementi OKR rilevati
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(categoryLabels) as OKRCategory[]).map((category) => {
                  const isDetected = detectedCategories.includes(category)
                  const isSelected = selectedCategories.includes(category)
                  
                  return (
                    <div
                      key={category}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all cursor-pointer',
                        isDetected 
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
                        {isDetected ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
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

            {/* Contatore */}
            <div className="text-center">
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                selectedCategories.length === 0 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              )}>
                {selectedCategories.length === 0 
                  ? '⚠️ Nessun elemento selezionato' 
                  : `✅ ${selectedCategories.length} elementi selezionati`
                }
              </span>
            </div>
          </>
        )}

        {/* Azioni */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCategories.length === 0}
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