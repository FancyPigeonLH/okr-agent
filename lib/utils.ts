import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { OKRCategory } from '@/app/types/okr'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rileva automaticamente le categorie OKR dalla richiesta dell'utente
 */
export function detectOKRCategories(userRequest: string, completeCorrelated: boolean = true): OKRCategory[] {
  const request = userRequest.toLowerCase()
  // Se contiene 'okr', restituisci tutte le categorie
  if (request.includes('okr')) {
    return ['objectives', 'key_results', 'risks', 'initiatives']
  }
  const categories: OKRCategory[] = []

  // Obiettivi
  if (/(obiettivo|obiettivi|objective|objectives|raggiungere|target|scopo|meta|risultato finale)/.test(request)) {
    categories.push('objectives')
  }
  // Key Results
  if (/(key result|key results|keyresult|keyresults|risultato chiave|kpi|metric[ahie]?|indicatore|misura|misure|target numerico|obiettivo quantitativo|quantitativo|quantitativi|quantitative|%)/.test(request)) {
    categories.push('key_results')
  }
  // Rischi
  if (/(rischio|rischi|risk|risks|minaccia|minacce|problema|problemi|ostacolo|ostacoli|difficoltà|difficolta|pericolo)/.test(request)) {
    categories.push('risks')
  }
  // Iniziative
  if (/(iniziativa|iniziative|initiative|initiatives|azione|azioni|attività|piano|strategia|implementazione|esecuzione|progetto|progetti|fare|implementare|eseguire)/.test(request)) {
    categories.push('initiatives')
  }

  // Se non rileva nulla specifico, assume tutto
  if (categories.length === 0) {
    return ['objectives', 'key_results', 'risks', 'initiatives']
  }

  if (!completeCorrelated) {
    return categories
  }

  // Se rileva solo objectives, aggiunge key_results (logicamente correlati)
  if (categories.includes('objectives') && !categories.includes('key_results')) {
    categories.push('key_results')
  }

  // Se rileva solo key_results, aggiunge objectives (logicamente correlati)
  if (categories.includes('key_results') && !categories.includes('objectives')) {
    categories.push('objectives')
  }

  // Se rileva risks, aggiunge initiatives (logicamente correlati)
  if (categories.includes('risks') && !categories.includes('initiatives')) {
    categories.push('initiatives')
  }

  return categories
}

/**
 * Determina se mostrare il selettore di categorie
 */
export function shouldShowCategorySelector(userRequest: string): boolean {
  const request = userRequest.toLowerCase()
  
  // Mostra selettore se l'utente chiede esplicitamente di scegliere
  if (
    request.includes('scegli') ||
    request.includes('seleziona') ||
    request.includes('solo') ||
    request.includes('soltanto') ||
    request.includes('esclusivamente') ||
    request.includes('specificamente')
  ) {
    return true
  }

  // Mostra selettore se la richiesta è molto generica
  if (
    request.includes('okr') ||
    request.includes('genera') ||
    request.includes('crea') ||
    request.length < 20
  ) {
    return true
  }

  return false
}
