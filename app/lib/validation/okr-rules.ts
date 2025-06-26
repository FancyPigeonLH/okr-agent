import { Objective, KeyResult, Risk, Initiative, OKRSet, ValidationResult } from '@/app/types/okr'

export const LINKHUB_RULES = {
  objectives: {
    maxLength: 100,
    minLength: 10,
    mustBeQualitative: true,
    mustBeTimeBound: true,
    mustBeInspirational: true,
    forbiddenWords: ['numero', 'percentuale', '%', '€', '$', 'quantità', 'totale']
  },
  keyResults: {
    minPerObjective: 3,
    maxPerObjective: 5,
    mustBeQuantitative: true,
    mustBeMeasurable: true,
    mustBeSpecific: true,
    mustBeAmbitious: true,
    requiredPatterns: [
      /\d+/, // deve contenere numeri
      /(percentuale|%|€|\$|numero|totale|quantità)/i // deve essere quantitativo
    ]
  },
  risks: {
    minPerOKR: 2,
    maxPerOKR: 5,
    mustHaveMitigation: true,
    mustBeRelevant: true,
    format: 'if-then' // formato "se...allora..."
  },
  initiatives: {
    minPerKeyResult: 1,
    maxPerKeyResult: 3,
    mustBeActionable: true,
    mustBeSpecific: true
  }
}

export function validateObjective(objective: Objective): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Controllo lunghezza
  if (objective.title.length > LINKHUB_RULES.objectives.maxLength) {
    errors.push(`L'Objective è troppo lungo (max ${LINKHUB_RULES.objectives.maxLength} caratteri)`)
  }

  if (objective.title.length < LINKHUB_RULES.objectives.minLength) {
    errors.push(`L'Objective è troppo corto (min ${LINKHUB_RULES.objectives.minLength} caratteri)`)
  }

  // Controllo parole vietate (numeri/quantità)
  const hasForbiddenWords = LINKHUB_RULES.objectives.forbiddenWords.some(word => 
    objective.title.toLowerCase().includes(word.toLowerCase())
  )
  if (hasForbiddenWords) {
    errors.push('L\'Objective non deve contenere numeri o quantità (sono per i Key Results)')
  }

  // Controllo verbi d'azione
  const actionVerbs = ['aumentare', 'migliorare', 'ridurre', 'ottimizzare', 'espandere', 'consolidare', 'innovare']
  const hasActionVerb = actionVerbs.some(verb => 
    objective.title.toLowerCase().includes(verb)
  )
  if (!hasActionVerb) {
    warnings.push('L\'Objective dovrebbe contenere un verbo d\'azione')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateKeyResult(keyResult: KeyResult): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Controllo presenza numeri
  const hasNumbers = /\d+/.test(keyResult.title)
  if (!hasNumbers) {
    errors.push('Il Key Result deve essere quantitativo e contenere numeri')
  }

  // Controllo pattern quantitativi
  const hasQuantitativePattern = LINKHUB_RULES.keyResults.requiredPatterns.some(pattern => 
    pattern.test(keyResult.title)
  )
  if (!hasQuantitativePattern) {
    errors.push('Il Key Result deve essere misurabile e specifico')
  }

  // Controllo ambizione (valori realistici ma sfidanti)
  const numbers = keyResult.title.match(/\d+/g)
  if (numbers) {
    const percentage = numbers.find(num => keyResult.title.includes('%'))
    if (percentage) {
      const value = parseInt(percentage)
      if (value < 5 || value > 200) {
        warnings.push('La percentuale dovrebbe essere realistica ma sfidante (5-200%)')
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateRisk(risk: Risk): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Controllo formato if-then
  const hasIfThen = risk.description.toLowerCase().includes('se') && 
                   (risk.description.toLowerCase().includes('allora') || 
                    risk.description.toLowerCase().includes('rischio'))
  if (!hasIfThen) {
    warnings.push('Il rischio dovrebbe essere formulato come "se...allora..."')
  }

  // Controllo mitigazione
  if (!risk.mitigation || risk.mitigation.trim().length < 10) {
    errors.push('Il rischio deve avere una strategia di mitigazione')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateInitiative(initiative: Initiative): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Controllo azionabilità
  const actionVerbs = ['implementare', 'lanciare', 'sviluppare', 'creare', 'ottimizzare', 'migliorare']
  const hasActionVerb = actionVerbs.some(verb => 
    initiative.title.toLowerCase().includes(verb)
  )
  if (!hasActionVerb) {
    warnings.push('L\'iniziativa dovrebbe contenere un verbo d\'azione')
  }

  // Controllo specificità
  if (initiative.title.length < 15) {
    warnings.push('L\'iniziativa dovrebbe essere più specifica')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateOKRSet(okrSet: OKRSet): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Controllo numero di Key Results per Objective
  okrSet.objectives.forEach(objective => {
    const keyResultsForObjective = okrSet.keyResults.filter(kr => kr.objectiveId === objective.id)
    
    if (keyResultsForObjective.length < LINKHUB_RULES.keyResults.minPerObjective) {
      errors.push(`L'Objective "${objective.title}" deve avere almeno ${LINKHUB_RULES.keyResults.minPerObjective} Key Results`)
    }
    
    if (keyResultsForObjective.length > LINKHUB_RULES.keyResults.maxPerObjective) {
      warnings.push(`L'Objective "${objective.title}" ha troppi Key Results (max ${LINKHUB_RULES.keyResults.maxPerObjective})`)
    }
  })

  // Controllo numero di Rischi
  if (okrSet.risks.length < LINKHUB_RULES.risks.minPerOKR) {
    warnings.push(`Dovrebbero essere identificati almeno ${LINKHUB_RULES.risks.minPerOKR} rischi`)
  }

  // Controllo numero di Iniziative per Key Result
  okrSet.keyResults.forEach(keyResult => {
    const initiativesForKR = okrSet.initiatives.filter(init => init.keyResultId === keyResult.id)
    
    if (initiativesForKR.length < LINKHUB_RULES.initiatives.minPerKeyResult) {
      warnings.push(`Il Key Result "${keyResult.title}" dovrebbe avere almeno ${LINKHUB_RULES.initiatives.minPerKeyResult} iniziativa`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
} 