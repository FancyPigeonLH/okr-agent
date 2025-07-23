'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { BarChart3, Edit, Trash2, Loader2 } from 'lucide-react'

interface Indicator {
  id: string
  description: string
  symbol: string
  periodicity: number
  isReverse: boolean
  createdAt: string
  assignee: {
    id: string
    name: string
    surname: string
  } | null
}

interface IndicatorsTableProps {
  companyId: string | null
}

export function IndicatorsTable({ companyId }: IndicatorsTableProps) {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) {
      setIndicators([])
      return
    }

    const fetchIndicators = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/indicators?companyId=${companyId}`)
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento degli indicatori')
        }
        
        const data = await response.json()
        setIndicators(data)
      } catch (err) {
        console.error('Errore nel caricamento degli indicatori:', err)
        setError('Errore nel caricamento degli indicatori')
      } finally {
        setIsLoading(false)
      }
    }

    fetchIndicators()
  }, [companyId])

  const getPeriodicityText = (periodicity: number) => {
    switch (periodicity) {
      case 1: return 'Giornaliera'
      case 7: return 'Settimanale'
      case 30: return 'Mensile'
      case 90: return 'Trimestrale'
      case 180: return 'Semestrale'
      case 365: return 'Annuale'
      default: return `${periodicity} giorni`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!companyId) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Indicatori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#3a88ff]" />
            <span className="ml-2 text-slate-600">Caricamento indicatori...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Indicatori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-[#3a88ff] hover:bg-[#3a88ff]/90"
            >
              Riprova
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (indicators.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Indicatori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium mb-2">Nessun indicatore trovato</p>
            <p className="text-sm">Clicca su "Nuovo Indicatore" per iniziare a creare indicatori KPI.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indicatori ({indicators.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-700">Descrizione</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Simbolo</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Periodicità</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Assegnato a</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Data creazione</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((indicator) => (
                <tr key={indicator.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-slate-900 line-clamp-2">
                        {indicator.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {indicator.symbol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600">
                      {getPeriodicityText(indicator.periodicity)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      indicator.isReverse 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {indicator.isReverse ? 'Inverso' : 'Normale'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {indicator.assignee ? (
                      <span className="text-sm text-slate-600">
                        {indicator.assignee.name} {indicator.assignee.surname}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">Non assegnato</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600">
                      {formatDate(indicator.createdAt)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-slate-100"
                        title="Modifica"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        title="Elimina"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 