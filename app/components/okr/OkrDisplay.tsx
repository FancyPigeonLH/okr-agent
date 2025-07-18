'use client'

import { OKRSet } from '@/app/types/okr'
import { Button } from '@/app/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface OkrDisplayProps {
  okrSet: OKRSet
}

export function OkrDisplay({ okrSet }: OkrDisplayProps) {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems(prev => new Set(prev).add(itemId))
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('Errore nella copia:', error)
    }
  }

  const CopyButton = ({ text, itemId }: { text: string; itemId: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, itemId)}
      className="ml-2 h-8 w-8 p-0"
    >
      {copiedItems.has(itemId) ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">OKR - {okrSet.team}</h2>
        <p className="text-muted-foreground">
          Creato il: {okrSet.createdAt.toLocaleDateString('it-IT')}
        </p>
      </div>

      {/* Objectives */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-blue-600">Objectives</h3>
        {okrSet.objectives.map((objective) => (
          <div key={objective.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">{objective.title}</h4>
                {objective.description && (
                  <p className="text-sm text-blue-700 mt-1">{objective.description}</p>
                )}
              </div>
              <CopyButton text={objective.title} itemId={objective.id} />
            </div>
          </div>
        ))}
      </div>

      {/* Key Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">Key Results</h3>
        {okrSet.objectives.map((objective) => {
          const keyResults = okrSet.keyResults.filter(kr => kr.objectiveId === objective.id)
          return (
            <div key={objective.id} className="space-y-3">
              <h4 className="font-medium text-gray-700">{objective.title}</h4>
              {keyResults.map((keyResult) => (
                <div key={keyResult.id} className="bg-green-50 border border-green-200 rounded-lg p-4 ml-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-green-900">{keyResult.title}</h5>
                      <div className="flex gap-4 mt-2 text-sm text-green-700">
                        <span>Unità: {keyResult.unit}</span>
                      </div>
                    </div>
                    <CopyButton text={keyResult.title} itemId={keyResult.id} />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Risks */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">Rischi</h3>
        {okrSet.risks.map((risk) => (
          <div key={risk.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-red-900">{risk.title}</h4>
                <p className="text-sm text-red-700 mt-1">{risk.description}</p>
              </div>
              <CopyButton text={risk.title} itemId={risk.id} />
            </div>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-orange-600">KPI</h3>
        {okrSet.risks.map((risk) => {
          const riskKPIs = okrSet.kpis.filter(kpi => kpi.riskId === risk.id)
          return (
            <div key={risk.id} className="space-y-3">
              <h4 className="font-medium text-gray-700">{risk.title}</h4>
              {riskKPIs.map((kpi) => (
                <div key={kpi.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 ml-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-orange-900">{kpi.title}</h5>
                      <div className="flex gap-4 mt-2 text-sm text-orange-700">
                        <span>Unità: {kpi.unit}</span>
                      </div>
                    </div>
                    <CopyButton text={kpi.title} itemId={kpi.id} />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Initiatives */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-purple-600">Iniziative</h3>
        {okrSet.risks.map((risk) => {
          const initiatives = okrSet.initiatives.filter(init => init.riskId === risk.id)
          return (
            <div key={risk.id} className="space-y-3">
              <h4 className="font-medium text-gray-700">{risk.title}</h4>
              {initiatives.map((initiative) => (
                <div key={initiative.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4 ml-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-purple-700">{initiative.description}</p>
                    </div>
                    <CopyButton text={initiative.description || ''} itemId={initiative.id} />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
} 