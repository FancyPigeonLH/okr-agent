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
  forecast: string
  moon: string
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
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  isExternal: boolean
  isInternal: boolean
}

export interface Initiative {
  id: string
  riskId: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  startDate?: Date
  endDate?: Date
  isMitigative: boolean
}

export interface OKRSet {
  id: string
  team: string
  period: string
  objectives: Objective[]
  keyResults: KeyResult[]
  risks: Risk[]
  initiatives: Initiative[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  okrSetId?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
} 