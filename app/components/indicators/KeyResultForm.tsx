'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { X, Save, AlertCircle, ChevronsUpDown, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/app/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { IndicatorForm, type IndicatorSubmitData } from './IndicatorForm'

interface KeyResultFormProps {
  onClose: () => void
  onSubmit: (data: KeyResultFormData) => void
  isLoading?: boolean
  companyId: string
}

export interface KeyResultFormData {
  indicatorId: string
  objectiveId: string
  weight: number
  impact: number
  finalForecastValue: number
  finalTargetValue: number
  finalForecastTargetDate: string
}

type Indicator = {
  id: string
  description: string
  symbol: string
}

type Objective = {
  id: string
  title: string
  description: string
  team: {
    id: string
    name: string
  }
}

export function KeyResultForm({ onClose, onSubmit, isLoading = false, companyId }: KeyResultFormProps) {
  const [formData, setFormData] = useState<KeyResultFormData>({
    indicatorId: '',
    objectiveId: '',
    weight: 1.0,
    impact: 0,
    finalForecastValue: 0,
    finalTargetValue: 0,
    finalForecastTargetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default a 30 giorni da oggi
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null)
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null)
  const [indicatorOpen, setIndicatorOpen] = useState(false)
  const [objectiveOpen, setObjectiveOpen] = useState(false)
  const [showIndicatorForm, setShowIndicatorForm] = useState(false)
  const [isCreatingIndicator, setIsCreatingIndicator] = useState(false)

  // Carica indicatori e obiettivi
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica indicatori
        const indicatorsResponse = await fetch(`/api/indicators?companyId=${companyId}`)
        const indicatorsData = await indicatorsResponse.json()
        setIndicators(indicatorsData)

        // Carica obiettivi
        const objectivesResponse = await fetch(`/api/objectives?companyId=${companyId}`)
        const objectivesData = await objectivesResponse.json()
        setObjectives(objectivesData)
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error)
      }
    }

    fetchData()
  }, [companyId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validazione
    const newErrors: Record<string, string> = {}
    
    if (!formData.indicatorId) {
      newErrors.indicatorId = 'Seleziona un indicatore'
    }
    
    if (!formData.objectiveId) {
      newErrors.objectiveId = 'Seleziona un obiettivo'
    }
    
    if (formData.finalForecastValue <= 0) {
      newErrors.finalForecastValue = 'Il valore forecast deve essere maggiore di 0'
    }
    
    if (formData.finalTargetValue <= 0) {
      newErrors.finalTargetValue = 'Il valore target deve essere maggiore di 0'
    }

    if (!formData.finalForecastTargetDate) {
      newErrors.finalForecastTargetDate = 'Seleziona una data target'
    }

    if (formData.weight <= 0) {
      newErrors.weight = 'Il peso deve essere maggiore di 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    onSubmit(formData)
  }

  const handleInputChange = (field: keyof KeyResultFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Rimuovi l'errore quando l'utente inizia a digitare
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleCreateIndicator = async (indicatorData: IndicatorSubmitData) => {
    setIsCreatingIndicator(true)
    try {
      const response = await fetch('/api/indicators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...indicatorData,
          companyId: companyId,
          assigneeId: '' // Questo verrà gestito dal backend con un default
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante la creazione dell\'indicatore')
      }

      const newIndicator = await response.json()
      console.log('Indicatore creato con successo:', newIndicator)
      
      // Aggiungi il nuovo indicatore alla lista
      const newIndicatorForDropdown = {
        id: newIndicator.id,
        description: newIndicator.description,
        symbol: newIndicator.symbol
      }
      
      setIndicators(prev => [newIndicatorForDropdown, ...prev])
      setSelectedIndicator(newIndicatorForDropdown)
      handleInputChange('indicatorId', newIndicator.id)
      setShowIndicatorForm(false)
    } catch (error) {
      console.error('Errore durante la creazione dell\'indicatore:', error)
      alert(error instanceof Error ? error.message : 'Errore durante la creazione dell\'indicatore')
    } finally {
      setIsCreatingIndicator(false)
    }
  }

  const handleUseSuggestedIndicator = (indicatorId: string) => {
    const indicator = indicators.find(ind => ind.id === indicatorId)
    if (indicator) {
      setSelectedIndicator(indicator)
      handleInputChange('indicatorId', indicator.id)
    }
    setShowIndicatorForm(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold text-[#3a88ff]">
              Nuovo Key Result
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
              {/* Selettore Indicatore */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Indicatore *
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIndicatorForm(true)}
                    className="text-[#3a88ff] border-[#3a88ff] hover:bg-[#3a88ff]/10"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Indicatore
                  </Button>
                </div>
                <Popover open={indicatorOpen} onOpenChange={setIndicatorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={indicatorOpen}
                      className="w-full justify-between border-slate-200 hover:bg-slate-50"
                    >
                      {selectedIndicator ? selectedIndicator.description : "Seleziona indicatore..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cerca indicatore..." />
                      <CommandEmpty>Nessun indicatore trovato.</CommandEmpty>
                      <CommandGroup>
                        {indicators.map((indicator) => (
                          <CommandItem
                            key={indicator.id}
                            onSelect={() => {
                              setSelectedIndicator(indicator)
                              handleInputChange('indicatorId', indicator.id)
                              setIndicatorOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedIndicator?.id === indicator.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{indicator.description}</div>
                              <div className="text-xs text-slate-500">Simbolo: {indicator.symbol}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.indicatorId && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.indicatorId}
                  </div>
                )}
              </div>

              {/* Selettore Obiettivo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Obiettivo *
                </label>
                <Popover open={objectiveOpen} onOpenChange={setObjectiveOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={objectiveOpen}
                      className="w-full justify-between border-slate-200 hover:bg-slate-50"
                    >
                      {selectedObjective ? selectedObjective.title : "Seleziona obiettivo..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cerca obiettivo..." />
                      <CommandEmpty>Nessun obiettivo trovato.</CommandEmpty>
                      <CommandGroup>
                        {objectives.map((objective) => (
                          <CommandItem
                            key={objective.id}
                            onSelect={() => {
                              setSelectedObjective(objective)
                              handleInputChange('objectiveId', objective.id)
                              setObjectiveOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedObjective?.id === objective.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{objective.title}</div>
                              <div className="text-xs text-slate-500">Descrizione: {objective.description}</div>
                              <div className="text-xs text-slate-500">Team: {objective.team.name}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.objectiveId && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.objectiveId}
                  </div>
                )}
              </div>

              {/* Valore Forecast */}
              <div className="space-y-2">
                <label htmlFor="finalForecastValue" className="text-sm font-medium text-slate-700">
                  Valore Forecast *
                </label>
                <input
                  id="finalForecastValue"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.finalForecastValue}
                  onChange={(e) => handleInputChange('finalForecastValue', parseFloat(e.target.value) || 0)}
                  className={`h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3a88ff] focus:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.finalForecastValue ? 'border-red-500' : 'border-slate-200'
                  }`}
                  disabled={isLoading}
                />
                {errors.finalForecastValue && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.finalForecastValue}
                  </div>
                )}
              </div>

              {/* Valore Target */}
              <div className="space-y-2">
                <label htmlFor="finalTargetValue" className="text-sm font-medium text-slate-700">
                  Valore Target *
                </label>
                <input
                  id="finalTargetValue"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.finalTargetValue}
                  onChange={(e) => handleInputChange('finalTargetValue', parseFloat(e.target.value) || 0)}
                  className={`h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3a88ff] focus:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.finalTargetValue ? 'border-red-500' : 'border-slate-200'
                  }`}
                  disabled={isLoading}
                />
                {errors.finalTargetValue && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.finalTargetValue}
                  </div>
                )}
              </div>

              {/* Data Target */}
              <div className="space-y-2">
                <label htmlFor="finalForecastTargetDate" className="text-sm font-medium text-slate-700">
                  Data Target *
                </label>
                <input
                  id="finalForecastTargetDate"
                  type="date"
                  value={formData.finalForecastTargetDate}
                  onChange={(e) => handleInputChange('finalForecastTargetDate', e.target.value)}
                  className={`h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3a88ff] focus:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.finalForecastTargetDate ? 'border-red-500' : 'border-slate-200'
                  }`}
                  disabled={isLoading}
                />
                {errors.finalForecastTargetDate && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.finalForecastTargetDate}
                  </div>
                )}
              </div>

              {/* Peso */}
              <div className="space-y-2">
                <label htmlFor="weight" className="text-sm font-medium text-slate-700">
                  Peso *
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  className={`h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3a88ff] focus:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.weight ? 'border-red-500' : 'border-slate-200'
                  }`}
                  disabled={isLoading}
                />
                {errors.weight && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.weight}
                  </div>
                )}
              </div>

              {/* Pulsanti */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  className="bg-[#3a88ff] hover:bg-[#3a88ff]/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Crea Key Result
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Form modale per creare nuovo indicatore */}
      {showIndicatorForm && (
        <IndicatorForm
          onClose={() => setShowIndicatorForm(false)}
          onSubmit={handleCreateIndicator}
          isLoading={isCreatingIndicator}
          companyId={companyId}
          onUseSuggestedIndicator={handleUseSuggestedIndicator}
        />
      )}
    </>
  )
} 