import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type Initiative = {
  id: string
  description: string
  status: number
  checkInDays: number
  isNew: boolean
  relativeImpact: number
  overallImpact: number
}

type User = {
  id: string
  name: string
  surname: string
  fullName: string
  email: string
  initiatives: Initiative[]
}

interface UserContextProps {
  selectedUser: User | null
  onUserSelect: (user: User | null) => void
  companyId: string | null
  disabled?: boolean
}

export function UserContext({ selectedUser, onUserSelect, companyId, disabled = false }: UserContextProps) {
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
        setUsers(data)
      } catch (error) {
        console.error('Errore nel caricamento degli utenti:', error)
      }
    }

    fetchUsers()
  }, [companyId])

  // Funzione per formattare lo stato dell'iniziativa
  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Non iniziata'
      case 1: return 'In corso'
      case 2: return 'Completata'
      default: return 'Stato sconosciuto'
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none text-[#3a88ff]">
        Seleziona Utente (opzionale)
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
                  className="flex flex-col py-2 px-2"
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                  {user.initiatives.length > 0 && (
                    <div className="mt-2 pl-6 border-t pt-2">
                      <div className="text-xs font-medium text-slate-700 mb-1">
                        Iniziative assegnate ({user.initiatives.length}):
                      </div>
                      <ul className="space-y-1">
                        {user.initiatives.map((initiative) => (
                          <li key={initiative.id} className="text-xs text-slate-600">
                            • {initiative.description.substring(0, 50)}
                            {initiative.description.length > 50 ? '...' : ''} 
                            <span className="text-[#3a88ff]">
                              ({getStatusText(initiative.status)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Mostra le iniziative dell'utente selezionato */}
      {selectedUser && selectedUser.initiatives.length > 0 && (
        <div className="mt-4 p-3 bg-[#3a88ff]/5 rounded-lg border border-[#3a88ff]/10">
          <h4 className="text-sm font-medium text-[#3a88ff] mb-2">
            Iniziative di {selectedUser.fullName}
          </h4>
          <ul className="space-y-2">
            {selectedUser.initiatives.map((initiative) => (
              <li key={initiative.id} className="text-sm">
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className="text-slate-700">{initiative.description}</p>
                    <div className="flex gap-2 mt-1 text-xs text-slate-500">
                      <span>Stato: {getStatusText(initiative.status)}</span>
                      <span>•</span>
                      <span>Impact: {initiative.overallImpact}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 