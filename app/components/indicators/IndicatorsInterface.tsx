'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { BarChart3, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CompanyContext } from '@/app/components/chat/CompanyContext'
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
import { IndicatorForm, type IndicatorFormData } from './IndicatorForm'
import { IndicatorsTable } from './IndicatorsTable'

type Company = {
  id: string
  name: string
  mission: string
  vision: string
}

type User = {
  id: string
  name: string
  surname: string
  fullName: string
  email: string
}

// Componente semplificato per selezionare l'utente (solo nome e cognome)
function UserSelector({ 
  selectedUser, 
  onUserSelect, 
  companyId, 
  disabled = false 
}: {
  selectedUser: User | null
  onUserSelect: (user: User | null) => void
  companyId: string | null
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!companyId) {
        setUsers([])
        return
      }

      try {
        const response = await fetch(`/api/companies/users?companyId=${companyId}`)
        const data = await response.json()
        // Semplifica i dati rimuovendo le iniziative
        const simplifiedUsers = data.map((user: any) => ({
          id: user.id,
          name: user.name,
          surname: user.surname,
          fullName: user.fullName,
          email: user.email
        }))
        setUsers(simplifiedUsers)
      } catch (error) {
        console.error('Errore nel caricamento degli utenti:', error)
      }
    }

    fetchUsers()
  }, [companyId])

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none text-[#3a88ff]">
        Seleziona Utente
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || !companyId}
            className="w-full justify-between border-[#3a88ff]/20 hover:bg-[#3a88ff]/5 hover:text-[#3a88ff] disabled:opacity-50"
          >
            {selectedUser ? selectedUser.fullName : "Seleziona utente..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command className="max-h-[300px] overflow-auto">
            <CommandInput placeholder="Cerca utente..." />
            <CommandEmpty>Nessun utente trovato.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    onUserSelect(user)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {user.fullName}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function IndicatorsInterface() {
  const [showForm, setShowForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleCreateIndicator = async (data: IndicatorFormData) => {
    if (!selectedCompany) {
      alert('Seleziona prima una company')
      return
    }

    if (!selectedUser) {
      alert('Seleziona prima un utente assegnato')
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
          companyId: selectedCompany.id,
          assigneeId: selectedUser.id
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
      {/* Sidebar semplificata */}
      <div className="w-80 border-r border-[#3a88ff]/10 bg-white shadow-sm">
        <div className="p-4">
          <h2 className="text-lg font-semibold tracking-tight text-[#3a88ff] mb-4">Seleziona Azienda</h2>
          
          <CompanyContext
            selectedCompany={selectedCompany}
            onCompanySelect={(company) => {
              setSelectedCompany(company)
              setSelectedUser(null) // Reset user selection when company changes
            }}
          />

          {selectedCompany && (
            <div className="mt-6">
              <UserSelector
                selectedUser={selectedUser}
                onUserSelect={setSelectedUser}
                companyId={selectedCompany.id}
                disabled={false}
              />
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
              disabled={!selectedCompany || !selectedUser}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Nuovo Indicatore
            </Button>
          </div>

          {selectedCompany ? (
            <IndicatorsTable key={refreshKey} companyId={selectedCompany.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>I tuoi indicatori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium mb-2">Seleziona una company</p>
                  <p className="text-sm">Seleziona una company dalla sidebar per visualizzare e creare indicatori.</p>
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
          companyId={selectedCompany!.id}
        />
      )}
    </div>
  )
} 