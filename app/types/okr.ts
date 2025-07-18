export type OKRCategory = 'objectives' | 'key_results' | 'risks' | 'kpis' | 'initiatives'

export interface Objective {
  id: string
  title: string
  description: string
  isQualitative: boolean
  isTimeBound: boolean
  isInspirational: boolean
}

export interface KeyResult {
  id: string
  objectiveId: string
  title: string
  unit: string
  isQuantitative: boolean
  isMeasurable: boolean
  isSpecific: boolean
  isAmbitious: boolean
}

export interface Risk {
  id: string
  keyResultId: string
  title: string
  description: string
  isExternal: boolean
  isInternal: boolean
}

export interface Initiative {
  id: string
  riskId: string
  description: string
  isMitigative: boolean
}

export interface KPI {
  id: string
  riskId: string
  title: string
  unit: string
  isAlert: boolean
  isQuantitative: boolean
}

export interface OKRSet {
  id: string
  team: string
  objectives: Objective[]
  keyResults: KeyResult[]
  risks: Risk[]
  kpis: KPI[]
  initiatives: Initiative[]
  createdAt: Date
  updatedAt: Date
}

// Interfaccia per risposte parziali
export interface PartialOKRSet {
  objectives?: Objective[]
  keyResults?: KeyResult[]
  risks?: Risk[]
  kpis?: KPI[]
  initiatives?: Initiative[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  okrSetId?: string
  categories?: OKRCategory[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Interfaccia per il contesto di generazione
export interface GenerationContext {
  team: string
  objective?: string
  categories?: OKRCategory[]
} 