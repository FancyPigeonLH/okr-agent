'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { OKRCategory } from '@/app/types/okr'
import { cn } from '@/lib/utils'

interface CategorySelectorProps {
  selectedCategories: OKRCategory[]
  onCategoriesChange: (categories: OKRCategory[]) => void
  onConfirm: () => void
  onCancel: () => void
  compact?: boolean
}

const categoryLabels: Record<OKRCategory, { label: string; description: string }> = {
  objectives: {
    label: 'Obiettivi',
    description: 'Risultati qualitativi da raggiungere'
  },
  key_results: {
    label: 'Key Results',
    description: 'Metriche quantitative per misurare il successo'
  },
  risks: {
    label: 'Rischi',
    description: 'Potenziali ostacoli e minacce'
  },
  kpis: {
    label: 'KPI',
    description: 'Indicatori di soglia di allerta per i rischi'
  },
  initiatives: {
    label: 'Iniziative',
    description: 'Azioni concrete per raggiungere gli obiettivi'
  }
}

export function CategorySelector({
  selectedCategories,
  onCategoriesChange,
  onConfirm,
  onCancel,
  compact = false
}: CategorySelectorProps) {
  const [localCategories, setLocalCategories] = useState<OKRCategory[]>(selectedCategories)

  useEffect(() => {
    setLocalCategories(selectedCategories)
  }, [selectedCategories])

  // Auto-rilevamento delle categorie quando cambia l'input
  // DISABILITATO: causava reset continui delle categorie
  // useEffect(() => {
  //   if (autoUpdate && currentInput.trim()) {
  //     const detectedCategories = detectOKRCategories(currentInput)
  //     console.log('🔄 AUTO-RILEVAMENTO CATEGORIE:')
  //     console.log('📝 Input corrente:', currentInput)
  //     console.log('🎯 Categorie rilevate:', detectedCategories)
  //     console.log('---')
  //     
  //     if (detectedCategories.length > 0) {
  //       setLocalCategories(detectedCategories)
  //       onCategoriesChange(detectedCategories)
  //     }
  //   }
  // }, [currentInput, autoUpdate, onCategoriesChange])

  const handleCategoryToggle = (category: OKRCategory) => {
    const newCategories = localCategories.includes(category)
      ? localCategories.filter(c => c !== category)
      : [...localCategories, category]
    setLocalCategories(newCategories)
    onCategoriesChange(newCategories)
  }

  const handleConfirm = () => {
    onCategoriesChange(localCategories)
    onConfirm()
  }

  const handleSelectAll = () => {
    setLocalCategories(['objectives', 'key_results', 'risks', 'initiatives'])
  }

  const handleSelectNone = () => {
    setLocalCategories([])
  }

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[#3a88ff]">Categorie OKR</h3>
            {localCategories.length === 0 && (
              <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                Seleziona almeno una categoria
              </span>
            )}
            {localCategories.length > 0 && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                {localCategories.length} selezionate
              </span>
            )}
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs px-2 py-1 h-7"
            >
              Tutte
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              className="text-xs px-2 py-1 h-7"
            >
              Nessuna
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryLabels) as OKRCategory[]).map((category) => (
            <div
              key={category}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all cursor-pointer',
                localCategories.includes(category)
                  ? 'border-[#3a88ff] bg-[#3a88ff]/10 text-[#3a88ff] shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
              onClick={() => handleCategoryToggle(category)}
            >
              <Checkbox
                id={`compact-${category}`}
                checked={localCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
                className="h-3 w-3"
              />
              <label
                htmlFor={`compact-${category}`}
                className="text-sm font-medium cursor-pointer"
              >
                {categoryLabels[category].label}
              </label>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">
          Seleziona le categorie OKR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {(Object.keys(categoryLabels) as OKRCategory[]).map((category) => (
            <div
              key={category}
              className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                localCategories.includes(category)
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Checkbox
                id={category}
                checked={localCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor={category}
                  className="text-sm font-medium cursor-pointer"
                >
                  {categoryLabels[category].label}
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  {categoryLabels[category].description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="flex-1"
          >
            Tutte
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectNone}
            className="flex-1"
          >
            Nessuna
          </Button>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={localCategories.length === 0}
            className="flex-1"
          >
            Conferma ({localCategories.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 