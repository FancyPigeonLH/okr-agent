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

type Team = {
  id: string
  name: string
  type: string
  impact: number
}

interface TeamContextProps {
  selectedTeam: Team | null
  onTeamSelect: (team: Team | null) => void
  companyId: string | null
  disabled?: boolean
}

export function TeamContext({ selectedTeam, onTeamSelect, companyId, disabled = false }: TeamContextProps) {
  const [open, setOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    const fetchTeams = async () => {
      if (!companyId) {
        setTeams([])
        return
      }

      try {
        const response = await fetch(`/api/companies/teams?companyId=${companyId}`)
        const data = await response.json()
        setTeams(data)
      } catch (error) {
        console.error('Errore nel caricamento dei team:', error)
      }
    }

    fetchTeams()
  }, [companyId])

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none text-[#3a88ff]">
        Seleziona Team (opzionale)
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
            {selectedTeam ? selectedTeam.name : "Seleziona team..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command className="max-h-[300px] overflow-auto">
            <CommandInput placeholder="Cerca team..." />
            <CommandEmpty>Nessun team trovato.</CommandEmpty>
            <CommandGroup>
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  onSelect={() => {
                    onTeamSelect(team)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTeam?.id === team.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-xs text-slate-500">
                        Tipo: {team.type} • Impact: {team.impact}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
} 