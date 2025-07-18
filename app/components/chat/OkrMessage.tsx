import { OKRSet, PartialOKRSet } from '@/app/types/okr'
import { Button } from '@/app/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface OkrMessageProps {
  okrSet: OKRSet | PartialOKRSet
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

  // Gestisce sia OKRSet che PartialOKRSet
  const objectives = 'objectives' in okrSet && okrSet.objectives ? okrSet.objectives : []
  const keyResults = 'keyResults' in okrSet && okrSet.keyResults ? okrSet.keyResults : []
  const risks = 'risks' in okrSet && okrSet.risks ? okrSet.risks : []
  const kpis = 'kpis' in okrSet && okrSet.kpis ? okrSet.kpis : []
  const initiatives = 'initiatives' in okrSet && okrSet.initiatives ? okrSet.initiatives : []

  return (
    <div className="space-y-6 text-slate-900">
      {/* Objectives */}
      {objectives.length > 0 && (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-blue-600">Objectives</h3>
          {objectives.map((objective) => (
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
      )}

      {/* Key Results */}
      {keyResults.length > 0 && (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-green-600">Key Results</h3>
          {objectives.length > 0 ? (
            // Se abbiamo objectives, raggruppa per objective
            objectives.map((objective) => {
              const objectiveKeyResults = keyResults.filter(kr => kr.objectiveId === objective.id)
          return (
            <div key={objective.id} className="space-y-3">
              <h4 className="font-medium text-slate-900">{objective.title}</h4>
                  {objectiveKeyResults.map((keyResult) => (
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
            })
          ) : (
            // Se non abbiamo objectives, mostra tutti i key results
            keyResults.map((keyResult) => (
              <div key={keyResult.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
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
            ))
          )}
      </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-red-600">Rischi</h3>
          {keyResults.length > 0 ? (
            // Se abbiamo key results, raggruppa per key result
            keyResults.map((keyResult) => {
              const keyResultRisks = risks.filter(risk => risk.keyResultId === keyResult.id)
              return (
                <div key={keyResult.id} className="space-y-3">
                  <h4 className="font-medium text-slate-900">{keyResult.title}</h4>
                  {keyResultRisks.map((risk) => (
                    <div key={risk.id} className="bg-red-50 border border-red-200 rounded-lg p-4 ml-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-900">{risk.title}</h5>
                          <p className="text-sm text-slate-600 mt-1">{risk.description}</p>
                        </div>
                        <CopyButton text={risk.title} itemId={risk.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            // Se non abbiamo key results, mostra tutti i rischi
            risks.map((risk) => (
          <div key={risk.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">{risk.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{risk.description}</p>
              </div>
              <CopyButton text={risk.title} itemId={risk.id} />
            </div>
          </div>
            ))
          )}
      </div>
      )}

      {/* KPIs */}
      {kpis.length > 0 && (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-orange-600">KPI</h3>
          {risks.length > 0 ? (
            // Se abbiamo risks, raggruppa per risk
            risks.map((risk) => {
              const riskKPIs = kpis.filter(kpi => kpi.riskId === risk.id)
              return (
                <div key={risk.id} className="space-y-3">
                  <h4 className="font-medium text-slate-900">{risk.title}</h4>
                  {riskKPIs.map((kpi) => (
                    <div key={kpi.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 ml-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-900">{kpi.title}</h5>
                          <div className="flex gap-4 mt-2 text-sm text-slate-600">
                            <span>Unità: {kpi.unit}</span>
                          </div>
                        </div>
                        <CopyButton text={kpi.title} itemId={kpi.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            // Se non abbiamo risks, mostra tutti i KPI
            kpis.map((kpi) => (
              <div key={kpi.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{kpi.title}</h4>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                      <span>Unità: {kpi.unit}</span>
                    </div>
                  </div>
                  <CopyButton text={kpi.title} itemId={kpi.id} />
                </div>
              </div>
            ))
          )}
      </div>
      )}

      {/* Initiatives */}
      {initiatives.length > 0 && (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-purple-600">Iniziative</h3>
          {risks.length > 0 ? (
            // Se abbiamo risks, raggruppa per risk
            risks.map((risk) => {
              const riskInitiatives = initiatives.filter(init => init.riskId === risk.id)
          return (
            <div key={risk.id} className="space-y-3">
              <h4 className="font-medium text-slate-900">{risk.title}</h4>
                  {riskInitiatives.map((initiative) => (
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
            })
          ) : (
            // Se non abbiamo risks, mostra tutte le iniziative
            initiatives.map((initiative) => (
              <div key={initiative.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">{initiative.description}</p>
                  </div>
                  <CopyButton text={initiative.description || ''} itemId={initiative.id} />
                </div>
              </div>
            ))
          )}
      </div>
      )}
    </div>
  )
} 