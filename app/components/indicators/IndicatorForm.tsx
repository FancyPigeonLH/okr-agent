'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Checkbox } from '@/app/components/ui/checkbox'
import { X, Save, AlertCircle, Search, CheckCircle, Info, Calendar, TrendingUp, Sparkles } from 'lucide-react'

interface IndicatorFormProps {
  onClose: () => void
  onSubmit: (data: IndicatorSubmitData) => void
  isLoading?: boolean
  companyId: string
  onUseSuggestedIndicator?: (indicatorId: string) => void
}

export interface IndicatorFormData {
  description: string
  periodicity: number
  symbol: string
  isReverse: boolean
  referencePeriod: string
}

// Interfaccia per i dati da inviare al server (senza referencePeriod)
export interface IndicatorSubmitData {
  description: string
  periodicity: number
  symbol: string
  isReverse: boolean
}

type SimilarIndicator = {
  id: string
  description: string
  symbol: string
  periodicity: number
  similarity: number
  isReverse: boolean
}

type AISuggestion = {
  symbol: string
  periodicity: number
  isReverse: boolean
  referencePeriod: string
  confidence: number
  reasoning: string
}

// Opzioni per il periodo di riferimento
const REFERENCE_PERIODS = [
  {
    value: 'last_period',
    label: 'Ultimo periodo',
    description: 'Il periodo di tempo è l\'ultimo ciclo di misurazione completato',
    example: 'Fatturato dell\'ultimo mese (se periodicità mensile) o dell\'ultimo trimestre (se periodicità trimestrale)'
  },
  {
    value: 'ytd',
    label: 'Year to Date (YTD)',
    description: 'Dall\'inizio dell\'anno corrente al termine del periodo di riferimento',
    example: 'Fatturato cumulativo da gennaio al periodo corrente'
  },
  {
    value: 'last_12_periods',
    label: 'Last Twelve Months (LTM)',
    description: 'Ultimi 12 mesi rolling',
    example: 'Fatturato degli ultimi 12 mesi (aprile 2024 - marzo 2025)'
  }
]

export function IndicatorForm({ onClose, onSubmit, isLoading = false, companyId, onUseSuggestedIndicator }: IndicatorFormProps) {
  const [formData, setFormData] = useState<IndicatorFormData>({
    description: '',
    periodicity: 30, // Default mensile
    symbol: '',
    isReverse: false,
    referencePeriod: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [similarIndicators, setSimilarIndicators] = useState<SimilarIndicator[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSimilarResults, setShowSimilarResults] = useState(false)
  const [hasUsedSuggestion, setHasUsedSuggestion] = useState(false)
  const [searchCompleted, setSearchCompleted] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false)
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)
  const [isDescriptionManuallyEdited, setIsDescriptionManuallyEdited] = useState(false)

  // Ricerca indicatori simili quando la descrizione cambia manualmente
  useEffect(() => {
    const searchSimilarIndicators = async () => {
      // Non fare ricerca se l'utente ha già usato un suggerimento o se la descrizione non è stata modificata manualmente
      if (hasUsedSuggestion || !isDescriptionManuallyEdited) {
        return
      }

      if (!formData.description.trim() || formData.description.length < 3) {
        setSimilarIndicators([])
        setShowSimilarResults(false)
        setSearchCompleted(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch('/api/indicators/similar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: formData.description,
            companyId: companyId
          })
        })

        if (response.ok) {
          const data = await response.json()
          setSimilarIndicators(data.similarIndicators || [])
          setShowSimilarResults(data.similarIndicators && data.similarIndicators.length > 0)
          setSearchCompleted(true)
        }
      } catch (error) {
        console.error('Errore nella ricerca di indicatori simili:', error)
        setSearchCompleted(true)
      } finally {
        setIsSearching(false)
      }
    }

    // Debounce per evitare troppe chiamate
    const timeoutId = setTimeout(searchSimilarIndicators, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData.description, companyId, hasUsedSuggestion, isDescriptionManuallyEdited])

  // Funzione per richiedere suggerimento AI
  const requestAISuggestion = async () => {
    if (!formData.description.trim() || formData.description.length < 3) {
      return
    }

    // Nascondi i risultati della ricerca intelligente quando si avvia l'analisi AI
    setShowSimilarResults(false)
    setSearchCompleted(false)

    setIsGeneratingSuggestion(true)
    try {
      const response = await fetch('/api/indicators/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: formData.description
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiSuggestion(data.suggestion)
        setShowAiSuggestion(true)
      } else {
        console.error('Errore nella richiesta di suggerimento AI')
      }
    } catch (error) {
      console.error('Errore nella richiesta di suggerimento AI:', error)
    } finally {
      setIsGeneratingSuggestion(false)
    }
  }

  // Funzione per applicare il suggerimento AI
  const applyAISuggestion = () => {
    if (!aiSuggestion) return

    // Valida il simbolo prima di applicarlo
    let validSymbol = aiSuggestion.symbol
    if (aiSuggestion.symbol.length > 2) {
      // Mappa di conversione per simboli troppo lunghi
      const symbolMap: Record<string, string> = {
        'clienti': '#',
        'reclami': '#',
        'ordini': '#',
        'unità': '#',
        'pezzi': '#',
        'giorni': 'gg',
        'ore': 'h',
        'minuti': 'min',
        'secondi': 's',
        'euro': '€',
        'dollari': '$',
        'chilogrammi': 'kg',
        'chilometri': 'km',
        'metri': 'm',
        'litri': 'l',
        'percentuale': '%',
        'percento': '%'
      }
      
      const lowerSymbol = aiSuggestion.symbol.toLowerCase()
      validSymbol = symbolMap[lowerSymbol] || '#'
    }

    setFormData(prev => {
      // Aggiorna la descrizione in base al periodo di riferimento suggerito
      let updatedDescription = prev.description
      if (aiSuggestion.referencePeriod) {
        // Rimuovi eventuali periodi di riferimento già presenti
        const baseDescription = prev.description.replace(/\s*\([^)]*\)\s*$/, '').trim()
        updatedDescription = updateDescriptionWithReferencePeriod(baseDescription, aiSuggestion.referencePeriod)
      }

      return {
        ...prev,
        description: updatedDescription,
        symbol: validSymbol,
        periodicity: aiSuggestion.periodicity,
        isReverse: aiSuggestion.isReverse,
        referencePeriod: aiSuggestion.referencePeriod
      }
    })
    setShowAiSuggestion(false)
    setHasUsedSuggestion(true) // Marca che è stato usato un suggerimento
    setIsDescriptionManuallyEdited(false) // Marca che la descrizione è stata aggiornata automaticamente
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validazione
    const newErrors: Record<string, string> = {}
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descrizione è obbligatoria'
    }
    
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Il simbolo è obbligatorio'
    }
    
    if (formData.periodicity <= 0) {
      newErrors.periodicity = 'La periodicità deve essere maggiore di 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    
    // Rimuovi referencePeriod dai dati da inviare (non viene salvato nel database)
    const dataToSubmit = {
      description: formData.description,
      periodicity: formData.periodicity,
      symbol: formData.symbol,
      isReverse: formData.isReverse
    }
    onSubmit(dataToSubmit as IndicatorSubmitData)
  }

  const handleInputChange = (field: keyof IndicatorFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Rimuovi l'errore quando l'utente inizia a digitare
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Se l'utente modifica manualmente la descrizione, resetta il flag hasUsedSuggestion
    if (field === 'description') {
      setHasUsedSuggestion(false)
      setIsDescriptionManuallyEdited(true)
      // Nascondi il suggerimento AI se l'utente modifica la descrizione
      setShowAiSuggestion(false)
      setAiSuggestion(null)
    }
    
    // Se l'utente modifica manualmente altri campi dopo aver ricevuto un suggerimento AI, nascondi il suggerimento
    if (showAiSuggestion && field !== 'description') {
      setShowAiSuggestion(false)
    }
  }

  const handleUseSimilarIndicator = (similarIndicator: SimilarIndicator) => {
    setFormData(prev => ({
      ...prev,
      description: similarIndicator.description,
      symbol: similarIndicator.symbol,
      periodicity: similarIndicator.periodicity,
      isReverse: similarIndicator.isReverse,
      referencePeriod: '' // Non resettare il periodo di riferimento
    }))
    setShowSimilarResults(false)
    setSearchCompleted(false)
    setHasUsedSuggestion(true) // Marca che è stato usato un suggerimento
    // Nascondi il suggerimento AI se l'utente usa un indicatore simile
    setShowAiSuggestion(false)
    setAiSuggestion(null)
    if (onUseSuggestedIndicator) {
      onUseSuggestedIndicator(similarIndicator.id)
    }
  }

  // Funzione per aggiornare la descrizione in base al periodo di riferimento
  const updateDescriptionWithReferencePeriod = (baseDescription: string, referencePeriod: string) => {
    if (!baseDescription.trim() || !referencePeriod) return baseDescription

    const period = REFERENCE_PERIODS.find(p => p.value === referencePeriod)
    if (!period) return baseDescription

    // Se la descrizione è già molto specifica, non la modifichiamo
    if (baseDescription.length > 100) return baseDescription

    // Rimuovi eventuali periodi di riferimento già presenti nella descrizione
    const cleanDescription = baseDescription.replace(/\s*\([^)]*\)\s*$/, '').trim()
    
    // Per "ultimo periodo", usa la periodicità specifica
    if (referencePeriod === 'last_period') {
      const periodicityLabel = getPeriodicityLabel(formData.periodicity)
      return `${cleanDescription} (${periodicityLabel})`
    }
    
    // Per gli altri periodi, usa il label standard
    return `${cleanDescription} (${period.label.toLowerCase()})`
  }

  // Funzione helper per ottenere il label della periodicità
  const getPeriodicityLabel = (periodicity: number): string => {
    switch (periodicity) {
      case 7: return 'ultima settimana'
      case 30: return 'ultimo mese'
      case 90: return 'ultimo trimestre'
      case 180: return 'ultimo semestre'
      case 365: return 'ultimo anno'
      default: return 'ultimo periodo'
    }
  }

  // Aggiorna la descrizione quando cambia il periodo di riferimento
  const handleReferencePeriodChange = (referencePeriod: string) => {
    setFormData(prev => {
      const updatedData: IndicatorFormData = { ...prev, referencePeriod }
      
      // Aggiorna la descrizione se non è stata modificata manualmente dopo l'ultimo suggerimento
      if (!hasUsedSuggestion && prev.description.trim() && referencePeriod) {
        // Rimuovi eventuali periodi di riferimento già presenti
        const baseDescription = prev.description.replace(/\s*\([^)]*\)\s*$/, '').trim()
        updatedData.description = updateDescriptionWithReferencePeriod(baseDescription, referencePeriod)
        // Marca che la descrizione è stata aggiornata automaticamente, non manualmente
        setIsDescriptionManuallyEdited(false)
      }
      
      return updatedData
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold text-[#3a88ff]">
            Nuovo Indicatore
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Descrizione */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Descrizione *
                </label>
                {formData.description.trim().length >= 3 && !hasUsedSuggestion && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={requestAISuggestion}
                    disabled={isGeneratingSuggestion || isLoading}
                    className="text-[#3a88ff] border-[#3a88ff] hover:bg-[#3a88ff] hover:text-white transition-all duration-300"
                  >
                    {isGeneratingSuggestion ? (
                      <>
                        <Sparkles className="mr-1 h-3 w-3 animate-spin" />
                        Analizzando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1 h-3 w-3" />
                        Analisi AI
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="relative">
                <textarea
                  id="description"
                  placeholder="Inserisci una descrizione dettagliata dell'indicatore..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`min-h-[100px] w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3a88ff] focus:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.description ? 'border-red-500' : 'border-slate-200'
                  }`}
                  disabled={isLoading}
                />
                {isSearching && (
                  <div className="absolute top-2 right-2">
                    <Search className="h-4 w-4 animate-spin text-[#3a88ff]" />
                  </div>
                )}
              </div>
              
              {/* Messaggio di ricerca in corso */}
              {isSearching && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <Search className="h-4 w-4 animate-spin" />
                  <span>Ricerca indicatori simili in corso...</span>
                </div>
              )}
              {errors.description && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </div>
              )}
            </div>

            {/* Risultati ricerca indicatori simili */}
            {showSimilarResults && similarIndicators.length > 0 && (
              <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Indicatori simili trovati ({similarIndicators.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {similarIndicators.slice(0, 3).map((indicator) => (
                    <div key={indicator.id} className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{indicator.description}</p>
                        <div className="flex gap-2 mt-1 text-xs text-slate-500">
                          <span>Simbolo: {indicator.symbol}</span>
                          <span>•</span>
                          <span>Periodicità: {indicator.periodicity} giorni</span>
                          <span>•</span>
                          <span>Similarità: {Math.round(indicator.similarity * 100)}%</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseSimilarIndicator(indicator)}
                        className="ml-2 text-amber-700 border-amber-300 hover:bg-amber-100"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Usa
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-700">
                  Se uno di questi indicatori è simile a quello che vuoi creare, puoi usarlo come base o verificare se esiste già.
                </p>
              </div>
            )}

            {/* Messaggio quando non ci sono risultati */}
            {searchCompleted && !isSearching && formData.description.length >= 3 && similarIndicators.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <span>
                  Nessun indicatore simile trovato. Procediamo alla creazione dell'indicatore "<strong>{formData.description}</strong>": 
                  <strong className="ml-1">sfrutta l'Analisi AI</strong> per individuare le caratteristiche migliori!
                </span>
              </div>
            )}

            {/* Suggerimento AI */}
            {showAiSuggestion && aiSuggestion && (
              <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Suggerimento AI ({Math.round(aiSuggestion.confidence * 100)}% confidenza)
                  </span>
                </div>
                
                <div className="bg-white border border-purple-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Simbolo:</span>
                      <span className={`ml-2 ${aiSuggestion.symbol.length > 2 ? 'text-red-600' : 'text-purple-700'}`}>
                        {aiSuggestion.symbol}
                        {aiSuggestion.symbol.length > 2 && (
                          <span className="text-xs text-red-500 ml-1">(troppo lungo)</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Periodicità:</span>
                      <span className="ml-2 text-purple-700">
                        {aiSuggestion.periodicity === 7 && 'Settimanale (7 giorni)'}
                        {aiSuggestion.periodicity === 30 && 'Mensile (30 giorni)'}
                        {aiSuggestion.periodicity === 90 && 'Trimestrale (90 giorni)'}
                        {aiSuggestion.periodicity === 180 && 'Semestrale (180 giorni)'}
                        {aiSuggestion.periodicity === 365 && 'Annuale (365 giorni)'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Indicatore inverso:</span>
                      <span className="ml-2 text-purple-700">
                        {aiSuggestion.isReverse ? 'Sì' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Periodo di riferimento:</span>
                      <span className="ml-2 text-purple-700">
                        {aiSuggestion.referencePeriod === 'last_period' && 'Ultimo periodo'}
                        {aiSuggestion.referencePeriod === 'ytd' && 'Year to Date (YTD)'}
                        {aiSuggestion.referencePeriod === 'last_12_periods' && 'Last Twelve Months (LTM)'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-purple-700 bg-purple-100 p-3 rounded border border-purple-200">
                    <strong>Ragionamento:</strong> {aiSuggestion.reasoning}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyAISuggestion}
                      className="text-purple-700 border-purple-300 hover:bg-purple-100"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Applica suggerimento
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAiSuggestion(false)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      Ignora
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Simbolo */}
            <div className="space-y-2">
              <label htmlFor="symbol" className="text-sm font-medium text-slate-700">
                Simbolo *
              </label>
              <input
                id="symbol"
                type="text"
                placeholder="es. %, €, kg, ore..."
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value)}
                className={`h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3a88ff] focus:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.symbol ? 'border-red-500' : 'border-slate-200'
                }`}
                disabled={isLoading}
              />
              {errors.symbol && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.symbol}
                </div>
              )}
            </div>

            {/* Periodicità */}
            <div className="space-y-2">
              <div>
                <label htmlFor="periodicity" className="text-sm font-medium text-slate-700">
                  Periodicità (giorni) *
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Ogni quanto vuoi misurare questo indicatore?
                </p>
              </div>
              <select
                id="periodicity"
                value={formData.periodicity}
                onChange={(e) => handleInputChange('periodicity', parseInt(e.target.value))}
                className={`h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3a88ff] focus:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.periodicity ? 'border-red-500' : 'border-slate-200'
                }`}
                disabled={isLoading}
              >
                <option value="7">Settimanale (7 giorni)</option>
                <option value="30">Mensile (30 giorni)</option>
                <option value="90">Trimestrale (90 giorni)</option>
                <option value="180">Semestrale (180 giorni)</option>
                <option value="365">Annuale (365 giorni)</option>
              </select>
              {errors.periodicity && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.periodicity}
                </div>
              )}
            </div>

            {/* Periodo di Riferimento */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#3a88ff]" />
                  <label className="text-sm font-medium text-slate-700">
                    Periodo di Riferimento
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Scegli il periodo di tempo su cui calcolare l&apos;indicatore
                </p>
              </div>
              
              {/* Suggerimento prima delle alternative */}
              <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Suggerimento:</strong> Il periodo di riferimento aiuta a definire meglio la descrizione dell&apos;indicatore. 
                  Scegli l&apos;opzione che meglio rappresenta come vuoi analizzare i tuoi dati nel tempo.</p>
                </div>
              </div>
              
              <div className="grid gap-3">
                {REFERENCE_PERIODS.map((period) => (
                  <div
                    key={period.value}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.referencePeriod === period.value
                        ? 'border-[#3a88ff] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleReferencePeriodChange(period.value)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                        formData.referencePeriod === period.value
                          ? 'border-[#3a88ff] bg-[#3a88ff]'
                          : 'border-slate-300'
                      }`}>
                        {formData.referencePeriod === period.value && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            {period.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {period.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-2 italic">
                          Esempio: {period.example}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inverso */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isReverse"
                checked={formData.isReverse}
                onCheckedChange={(checked) => handleInputChange('isReverse', checked as boolean)}
                disabled={isLoading}
              />
              <label htmlFor="isReverse" className="text-sm font-medium text-slate-700">
                Indicatore inverso
              </label>
            </div>
            
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <p><strong>Indicatore inverso:</strong> Seleziona questa opzione se valori più bassi dell&apos;indicatore sono migliori (es. errori, costi, tempo).</p>
            </div>

            {/* Pulsanti */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading || isSearching}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="bg-[#3a88ff] hover:bg-[#3a88ff]/90"
                disabled={isLoading || isSearching}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creando...
                  </>
                ) : isSearching ? (
                  <>
                    <Search className="mr-2 h-4 w-4 animate-spin" />
                    Ricerca in corso...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crea Indicatore
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 