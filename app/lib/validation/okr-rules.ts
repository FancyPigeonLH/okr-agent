import { Objective, KeyResult, Risk, Initiative, OKRSet, ValidationResult } from '@/app/types/okr'

export const LINKHUB_RULES = {
  objectives: {
    maxLength: 100,
    minLength: 10,
    mustBeQualitative: true,
    mustBeTimeBound: false, // Gli objectives NON devono essere time-bound
    mustBeInspirational: true,
    forbiddenWords: ['numero', 'percentuale', '%', '€', '$', 'quantità', 'totale']
  },
  keyResults: {
    minPerObjective: 1, // Esattamente 1 Key Result per Objective
    maxPerObjective: 1, // Esattamente 1 Key Result per Objective
    mustBeQuantitative: true,
    mustBeMeasurable: true,
    mustBeSpecific: true,
    mustBeAmbitious: true,
    forbiddenVerbs: ['aumentare', 'migliorare', 'ridurre', 'ottimizzare', 'espandere', 'consolidare', 'innovare'],
    requiredPatterns: [
      /\d+/, // deve contenere numeri
      /(percentuale|%|€|\$|numero|totale|quantità)/i // deve essere quantitativo
    ]
  },
  risks: {
    minPerKeyResult: 1,
    maxPerKeyResult: 3,
    mustHaveMitigation: true,
    mustBeRelevant: true,
    format: 'if-then' // formato "se...allora..."
  },
  initiatives: {
    minPerRisk: 1,
    maxPerRisk: 3,
    mustBeActionable: true,
    mustBeSpecific: true,
    mustBeMitigative: true,
    infinitiveVerbs: ['implementare', 'creare', 'sviluppare', 'definire', 'stabilire', 'organizzare', 
      'pianificare', 'avviare', 'introdurre', 'migliorare', 'ottimizzare', 'automatizzare', 'monitorare',
      'documentare', 'formare', 'addestrare', 'configurare', 'installare', 'aggiornare', 'verificare',
      'testare', 'validare', 'analizzare', 'chiamare', 'contattare']
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

  // Controllo verbi all'infinito non permessi
  const hasInfinitiveVerb = LINKHUB_RULES.keyResults.forbiddenVerbs.some(verb => 
    keyResult.title.toLowerCase().includes(verb)
  )
  if (hasInfinitiveVerb) {
    errors.push('Il Key Result deve essere espresso come nome di metrica (es: "Produzione giornaliera" e NON "Aumentare la produzione giornaliera")')
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

  // Controllo lunghezza descrizione
  if (risk.description.trim().length < 10) {
    errors.push('La descrizione del rischio deve essere dettagliata')
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

  // Controllo che la descrizione inizi con un verbo all'infinito
  const startsWithInfinitiveVerb = LINKHUB_RULES.initiatives.infinitiveVerbs.some(verb => 
    initiative.description.toLowerCase().startsWith(verb.toLowerCase())
  )
  if (!startsWithInfinitiveVerb) {
    errors.push('La descrizione dell\'iniziativa deve iniziare con un verbo all\'infinito (es: "Implementare...", "Creare...", "Sviluppare...")')
  }

  // Controllo specificità
  if (initiative.description.length < 15) {
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

  // Controllo numero di Rischi per Key Result
  okrSet.keyResults.forEach(keyResult => {
    const risksForKeyResult = okrSet.risks.filter(risk => risk.keyResultId === keyResult.id)
    
    if (risksForKeyResult.length < LINKHUB_RULES.risks.minPerKeyResult) {
      errors.push(`Il Key Result "${keyResult.title}" deve avere almeno ${LINKHUB_RULES.risks.minPerKeyResult} rischio`)
    }

    if (risksForKeyResult.length > LINKHUB_RULES.risks.maxPerKeyResult) {
      warnings.push(`Il Key Result "${keyResult.title}" ha troppi rischi (max ${LINKHUB_RULES.risks.maxPerKeyResult})`)
    }
  })

  // Controllo numero di Iniziative per Rischio
  okrSet.risks.forEach(risk => {
    const initiativesForRisk = okrSet.initiatives.filter(init => init.riskId === risk.id)
    
    if (initiativesForRisk.length < LINKHUB_RULES.initiatives.minPerRisk) {
      errors.push(`Il Rischio "${risk.title}" deve avere almeno ${LINKHUB_RULES.initiatives.minPerRisk} iniziativa mitigativa`)
    }

    if (initiativesForRisk.length > LINKHUB_RULES.initiatives.maxPerRisk) {
      warnings.push(`Il Rischio "${risk.title}" ha troppe iniziative (max ${LINKHUB_RULES.initiatives.maxPerRisk})`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
} 