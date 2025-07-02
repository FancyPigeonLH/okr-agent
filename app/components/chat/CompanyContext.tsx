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

type Company = {
  id: string
  name: string
  mission: string
  vision: string
}

interface CompanyContextProps {
  selectedCompany: Company | null
  onCompanySelect: (company: Company | null) => void
}

export function CompanyContext({ selectedCompany, onCompanySelect }: CompanyContextProps) {
  const [open, setOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    // Funzione per caricare le company dal database
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies')
        const data = await response.json()
        setCompanies(data)
      } catch (error) {
        console.error('Errore nel caricamento delle company:', error)
      }
    }

    fetchCompanies()
  }, [])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none text-[#3a88ff]">
          Seleziona Company
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between border-[#3a88ff]/20 hover:bg-[#3a88ff]/5 hover:text-[#3a88ff]"
            >
              {selectedCompany ? selectedCompany.name : "Seleziona company..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Cerca company..." />
              <CommandEmpty>Nessuna company trovata.</CommandEmpty>
              <CommandGroup>
                {companies.map((company) => (
                  <CommandItem
                    key={company.id}
                    onSelect={() => {
                      onCompanySelect(company)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCompany?.id === company.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {company.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedCompany && (
        <div className="space-y-3 rounded-lg bg-[#3a88ff]/5 p-4 border border-[#3a88ff]/10">
          <div>
            <h3 className="text-sm font-semibold text-[#3a88ff] mb-1">Mission</h3>
            <p className="text-sm text-slate-600">{selectedCompany.mission}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#3a88ff] mb-1">Vision</h3>
            <p className="text-sm text-slate-600">{selectedCompany.vision}</p>
          </div>
        </div>
      )}
    </div>
  )
} 