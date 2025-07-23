'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Checkbox } from '@/app/components/ui/checkbox'
import { X, Save, AlertCircle } from 'lucide-react'

interface IndicatorFormProps {
  onClose: () => void
  onSubmit: (data: IndicatorFormData) => void
  isLoading?: boolean
}

export interface IndicatorFormData {
  description: string
  periodicity: number
  symbol: string
  isReverse: boolean
}

export function IndicatorForm({ onClose, onSubmit, isLoading = false }: IndicatorFormProps) {
  const [formData, setFormData] = useState<IndicatorFormData>({
    description: '',
    periodicity: 30,
    symbol: '',
    isReverse: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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
    onSubmit(formData)
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
              <label htmlFor="description" className="text-sm font-medium text-slate-700">
                Descrizione *
              </label>
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
              {errors.description && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </div>
              )}
            </div>

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
              <label htmlFor="periodicity" className="text-sm font-medium text-slate-700">
                Periodicità (giorni) *
              </label>
              <select
                id="periodicity"
                value={formData.periodicity}
                onChange={(e) => handleInputChange('periodicity', parseInt(e.target.value))}
                className={`h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3a88ff] focus:border-[#3a88ff] disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.periodicity ? 'border-red-500' : 'border-slate-200'
                }`}
                disabled={isLoading}
              >
                <option value="1">Giornaliera (1 giorno)</option>
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
              <p><strong>Indicatore inverso:</strong> Seleziona questa opzione se valori più bassi dell'indicatore sono migliori (es. errori, costi, tempo).</p>
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