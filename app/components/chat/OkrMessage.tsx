import { OKRSet } from '@/app/types/okr'
import { Button } from '@/app/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface OkrMessageProps {
  okrSet: OKRSet
}

export function OkrMessage({ okrSet }: OkrMessageProps) {
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
      className="ml-2 h-8 w-8 p-0 hover:bg-slate-100"
    >
      {copiedItems.has(itemId) ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 text-slate-500 hover:text-slate-900" />
      )}
    </Button>
  )

  return (
    <div className="space-y-6 text-slate-900">
      {/* Objectives */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-blue-600">Objectives</h3>
        {okrSet.objectives.map((objective) => (
          <div key={objective.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">{objective.title}</h4>
                {objective.description && (
                  <p className="text-sm text-slate-600 mt-1">{objective.description}</p>
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
              <h4 className="font-medium text-slate-900">{objective.title}</h4>
              {keyResults.map((keyResult) => (
                <div key={keyResult.id} className="bg-green-50 border border-green-200 rounded-lg p-4 ml-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-slate-900">{keyResult.title}</h5>
                      <div className="flex gap-4 mt-2 text-sm text-slate-600">
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
                <h4 className="font-medium text-slate-900">{risk.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{risk.description}</p>
              </div>
              <CopyButton text={risk.title} itemId={risk.id} />
            </div>
          </div>
        ))}
      </div>

      {/* Initiatives */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-purple-600">Iniziative</h3>
        {okrSet.risks.map((risk) => {
          const initiatives = okrSet.initiatives.filter(init => init.riskId === risk.id)
          return (
            <div key={risk.id} className="space-y-3">
              <h4 className="font-medium text-slate-900">{risk.title}</h4>
              {initiatives.map((initiative) => (
                <div key={initiative.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4 ml-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">{initiative.description}</p>
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