'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Settings2, X, Plus, BarChart3 } from 'lucide-react'
import { CompanyContext } from '@/app/components/chat/CompanyContext'
import { TeamContext } from '@/app/components/chat/TeamContext'
import { UserContext } from '@/app/components/chat/UserContext'
import { IndicatorForm, type IndicatorFormData } from './IndicatorForm'
import { IndicatorsTable } from './IndicatorsTable'

type Company = {
  id: string
  name: string
  mission: string
  vision: string
}

type Team = {
  id: string
  name: string
  type: string
  impact: number
}

type User = {
  id: string
  name: string
  surname: string
  fullName: string
  email: string
  initiatives: any[]
}

export function IndicatorsInterface() {
  const [showSettings, setShowSettings] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [context, setContext] = useState<{
    selectedCompany: Company | null
    selectedTeam: Team | null
    selectedUser: User | null
  }>({
    selectedCompany: null,
    selectedTeam: null,
    selectedUser: null
  })

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSettings(false)
  }

  const handleResetContext = () => {
    setContext({
      selectedCompany: null,
      selectedTeam: null,
      selectedUser: null
    })
    setShowSettings(false)
  }

  const handleCreateIndicator = async (data: IndicatorFormData) => {
    if (!context.selectedCompany) {
      alert('Seleziona prima una company')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/indicators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          companyId: context.selectedCompany.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante la creazione dell\'indicatore')
      }

      const newIndicator = await response.json()
      console.log('Indicatore creato con successo:', newIndicator)
      
      setShowForm(false)
      // Ricarica la lista degli indicatori
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Errore durante la creazione dell\'indicatore:', error)
      alert(error instanceof Error ? error.message : 'Errore durante la creazione dell\'indicatore')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar con contesto */}
      <div className="w-80 border-r border-[#3a88ff]/10 bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-[#3a88ff]">Contesto</h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetContext}
                className="hover:bg-[#3a88ff]/10 text-[#3a88ff] transition-colors duration-200"
                title="Resetta filtri"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="hover:bg-[#3a88ff]/10 text-[#3a88ff] transition-colors duration-200"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showSettings ? (
            <form onSubmit={handleContextSubmit} className="space-y-4 mt-4">
              <CompanyContext
                selectedCompany={context.selectedCompany}
                onCompanySelect={(company) => {
                  setContext({ 
                    selectedCompany: company,
                    selectedTeam: null,
                    selectedUser: null
                  })
                }}
              />
              <TeamContext
                selectedTeam={context.selectedTeam}
                onTeamSelect={(team) => {
                  setContext(prev => ({ 
                    ...prev,
                    selectedTeam: team,
                    selectedUser: null
                  }))
                }}
                companyId={context.selectedCompany?.id || null}
                disabled={!context.selectedCompany}
              />
              <UserContext
                selectedUser={context.selectedUser}
                onUserSelect={(user) => setContext(prev => ({ ...prev, selectedUser: user }))}
                companyId={context.selectedCompany?.id || null}
                disabled={!context.selectedCompany}
              />
              <Button 
                type="submit" 
                className="w-full bg-[#3a88ff] hover:bg-[#3a88ff]/90 text-white transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Usa Contesto
              </Button>
            </form>
          ) : (
            <div className="space-y-2 text-sm rounded-lg bg-[#3a88ff]/5 p-3 border border-[#3a88ff]/10 mt-4">
              {context.selectedCompany ? (
                <>
                  <div>
                    <span className="font-medium text-[#3a88ff]">Company:</span> {context.selectedCompany.name}
                  </div>
                  {context.selectedTeam && (
                    <div>
                      <span className="font-medium text-[#3a88ff]">Team:</span> {context.selectedTeam.name}
                    </div>
                  )}
                  {context.selectedUser && (
                    <div>
                      <span className="font-medium text-[#3a88ff]">Utente:</span> {context.selectedUser.fullName}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-[#3a88ff]">Mission:</span>
                    <p className="mt-1 text-slate-600">{context.selectedCompany.mission}</p>
                  </div>
                  <div>
                    <span className="font-medium text-[#3a88ff]">Vision:</span>
                    <p className="mt-1 text-slate-600">{context.selectedCompany.vision}</p>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">Nessun contesto selezionato. Seleziona una company per visualizzare i suoi indicatori.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b bg-[#3a88ff] p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-white" />
            <h1 className="text-xl font-bold text-white">Gestione Indicatori</h1>
          </div>
          <p className="text-sm text-white/90">
            Crea e gestisci gli indicatori KPI per la tua company
          </p>
        </div>

                {/* Contenuto */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Indicatori</h2>
            <Button 
              className="bg-[#3a88ff] hover:bg-[#3a88ff]/90"
              onClick={() => setShowForm(true)}
              disabled={!context.selectedCompany}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Indicatore
            </Button>
          </div>

          {context.selectedCompany ? (
            <IndicatorsTable key={refreshKey} companyId={context.selectedCompany.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>I tuoi indicatori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium mb-2">Seleziona una company</p>
                  <p className="text-sm">Seleziona una company dal menu di contesto per visualizzare e creare indicatori.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Form modale */}
      {showForm && (
        <IndicatorForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateIndicator}
          isLoading={isCreating}
        />
      )}
    </div>
  )
} 