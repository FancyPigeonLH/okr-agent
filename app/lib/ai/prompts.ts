/**
 * Prompt generator per LinkHub AI - Coach OKR
 * 
 * Questo modulo fornisce funzioni per generare prompt per l'AI che seguono le .linkhubrules.
 * 
 * FUNZIONALITÀ CATEGORIE:
 * - È possibile specificare categorie specifiche per generare solo parti degli OKR
 * - Categorie disponibili: 'objectives', 'key_results', 'risks', 'initiatives'
 * - Se non specificate, vengono generate tutte le categorie
 * 
 * ESEMPI DI UTILIZZO:
 * 
 * // Genera solo Objectives e Key Results
 * const context: GenerationContext = {
 *   team: "Marketing",
 *   period: "Q1 2024",
 *   categories: ['objectives', 'key_results']
 * }
 * 
 * // Genera solo Rischi per Key Results esistenti
 * const context: GenerationContext = {
 *   team: "Marketing", 
 *   period: "Q1 2024",
 *   categories: ['risks']
 * }
 * 
 * // Genera tutto (comportamento predefinito)
 * const context: GenerationContext = {
 *   team: "Marketing",
 *   period: "Q1 2024"
 *   // categories non specificato = tutte le categorie
 * }
 */

import { OKRCategory, GenerationContext } from '../../types/okr'

export const SYSTEM_PROMPT = `Sei LinkHub AI, un coach OKR brutale e diretto.
Il tuo compito è aiutare gli utenti a definire Objectives, Key Results, Rischi e Iniziative seguendo rigorosamente le .linkhubrules e il metodo OKR.

Non generare output che non rispettino le regole. Sei un coach severo che non accetta compromessi sulla qualità degli OKR.`

export const LINKHUB_RULES_PROMPT = `
.linkhubrules:

OBJECTIVES:
1. Gli Objectives devono essere qualitativi, ispirazionali e senza periodicità (no time-bound).
2. Gli Objectives NON devono contenere numeri o quantità (sono per i Key Results).
3. Ogni elemento deve essere giustificato brevemente.

KEY RESULTS:
1. I Key Results devono essere quantitativi, misurabili, specifici (metodo SMART).
2. Massimo 3 Key Results in totale.
3. I Key Results devono essere espressi come nomi di metriche (es: "Produzione giornaliera" e NON "Aumentare la produzione giornaliera").
4. Ogni elemento deve essere giustificato brevemente.

RISCHI:
1. Ogni Key Result deve avere da 1 a 3 Rischi specifici che ne minacciano il raggiungimento.
2. Ogni elemento deve essere giustificato brevemente.

INIZIATIVE:
1. Le Iniziative sono azioni mitigative concrete per gestire i Rischi identificati.
2. Le Iniziative devono derivare direttamente dai Rischi, descrivendo azioni concrete per mitigarli.
3. Ogni Iniziativa deve avere una descrizione chiara che spiega come l'azione mitiga il rischio associato.
4. La descrizione di ogni Iniziativa DEVE iniziare con un verbo all'infinito (es: "Implementare...", "Chiamare...", "Creare...").
5. Ogni elemento deve essere giustificato brevemente.
`

// Regole separate per ogni categoria
export const OBJECTIVES_RULES = `
OBJECTIVES RULES:
1. Gli Objectives devono essere qualitativi, ispirazionali e senza periodicità (no time-bound).
2. Gli Objectives NON devono contenere numeri o quantità (sono per i Key Results).
3. Ogni elemento deve essere giustificato brevemente.
`

export const KEY_RESULTS_RULES = `
KEY RESULTS RULES:
1. I Key Results devono essere quantitativi, misurabili, specifici (metodo SMART).
2. Massimo 3 Key Results in totale.
3. I Key Results devono essere espressi come nomi di metriche (es: "Produzione giornaliera" e NON "Aumentare la produzione giornaliera").
4. Ogni elemento deve essere giustificato brevemente.
`

export const RISKS_RULES = `
RISKS RULES:
1. Ogni Key Result deve avere da 1 a 3 Rischi specifici che ne minacciano il raggiungimento.
2. Ogni elemento deve essere giustificato brevemente.
`

export const INITIATIVES_RULES = `
INITIATIVES RULES:
1. Le Iniziative sono azioni mitigative concrete per gestire i Rischi identificati.
2. Le Iniziative devono derivare direttamente dai Rischi, descrivendo azioni concrete per mitigarli.
3. Ogni Iniziativa deve avere una descrizione chiara che spiega come l'azione mitiga il rischio associato.
4. La descrizione di ogni Iniziativa DEVE iniziare con un verbo all'infinito (es: "Implementare...", "Chiamare...", "Creare...").
5. Ogni elemento deve essere giustificato brevemente.
`

// Helper per selezionare le regole in base alle categorie richieste
export function getRulesForCategories(categories: OKRCategory[]) {
  const rulesMap: Record<OKRCategory, string> = {
    objectives: OBJECTIVES_RULES,
    key_results: KEY_RESULTS_RULES,
    risks: RISKS_RULES,
    initiatives: INITIATIVES_RULES
  }
  
  return categories.map(cat => rulesMap[cat]).join('\n\n')
}

export function generateInitialPrompt(userRequest: string, context: GenerationContext) {
  const requestedCategories = context.categories || ['objectives', 'key_results', 'risks', 'initiatives']
  const relevantRules = getRulesForCategories(requestedCategories)
  
  return `${SYSTEM_PROMPT}

${relevantRules}

Contesto:
- Team: ${context.team}
- Periodo: ${context.period}
${context.objective ? `- Obiettivo fornito dall'utente: "${context.objective}"` : ''}
- Categorie richieste: ${requestedCategories.join(', ')}

Richiesta dell'utente: ${userRequest}

IMPORTANTE:
1. Se è stato fornito un obiettivo nel contesto, DEVI utilizzarlo come base per l'Objective principale o adattarlo mantenendone l'essenza.
2. Genera SOLO le sezioni richieste nelle categorie specificate.
3. Per OGNI Key Result DEVI generare almeno un Rischio associato (se le categorie lo richiedono).
4. Per OGNI Rischio DEVI generare almeno un'Iniziativa di mitigazione (se le categorie lo richiedono).
5. NON omettere mai Rischi e Iniziative se sono nelle categorie richieste.
6. DEVI utilizzare ESATTAMENTE questa struttura YAML, includendo SOLO le sezioni richieste:

${generateYamlStructure(requestedCategories)}

ATTENZIONE:
- I nomi dei campi DEVONO essere ESATTAMENTE come mostrato sopra
- TUTTI i campi sono OBBLIGATORI per le sezioni incluse
- Gli ID devono seguire il formato mostrato (obj_X, kr_X, risk_X, init_X)
- Le relazioni tra elementi devono essere mantenute usando gli ID corretti
- NON aggiungere campi extra
- NON modificare i nomi dei campi
- NON omettere nessun campo delle sezioni richieste

Genera ora gli OKR seguendo RIGOROSAMENTE questa struttura e le regole specificate per le categorie richieste.`
}

// Helper per generare la struttura YAML in base alle categorie richieste
function generateYamlStructure(categories: OKRCategory[]) {
  const structure = []
  
  if (categories.includes('objectives')) {
    structure.push(`objectives:
  - id: "obj_1"
    title: "Titolo dell'Objective"
    description: "Descrizione qualitativa e ispirazionale"`)
  }

  if (categories.includes('key_results')) {
    structure.push(`key_results:
  - id: "kr_1"
    objective_id: "obj_1"
    title: "Titolo del Key Result"
    unit: "unità"`)
  }

  if (categories.includes('risks')) {
    structure.push(`risks:
  - id: "risk_1"
    key_result_id: "kr_1"
    title: "Titolo del Rischio"
    description: "Descrizione del rischio"
    is_external: false`)
  }

  if (categories.includes('initiatives')) {
    structure.push(`initiatives:
  - id: "init_1"
    risk_id: "risk_1"
    title: "Titolo dell'Iniziativa"
    description: "Descrizione dell'iniziativa"`)
  }
  
  return `\`\`\`yaml
${structure.join('\n\n')}
\`\`\``
}

export function generateCorrectionPrompt(
  previousOutput: string,
  validationErrors: string[],
  userFeedback?: string,
  categories?: OKRCategory[]
) {
  const requestedCategories = categories || ['objectives', 'key_results', 'risks', 'initiatives']
  const relevantRules = getRulesForCategories(requestedCategories)
  
  return `${SYSTEM_PROMPT}

${relevantRules}

L'output precedente non ha rispettato le seguenti regole:
${validationErrors.map(error => `- ${error}`).join('\n')}

${userFeedback ? `Feedback aggiuntivo dell'utente: ${userFeedback}` : ''}

Output precedente da correggere:
\`\`\`yaml
${previousOutput}
\`\`\`

Correggi l'output precedente per rispettare rigorosamente le regole elencate sopra.
Mantieni il formato YAML e la stessa struttura.
Assicurati che tutti gli errori di validazione siano risolti.
Genera SOLO le sezioni richieste nelle categorie specificate: ${requestedCategories.join(', ')}.`
}

export function generateIterationPrompt(
  currentOKR: string,
  userRequest: string,
  categories?: OKRCategory[]
) {
  const requestedCategories = categories || ['objectives', 'key_results', 'risks', 'initiatives']
  const relevantRules = getRulesForCategories(requestedCategories)
  
  return `${SYSTEM_PROMPT}

${relevantRules}

L'utente vuole iterare sui seguenti OKR:
\`\`\`yaml
${currentOKR}
\`\`\`

Richiesta di iterazione: ${userRequest}

IMPORTANTE:
1. DEVI mantenere la stessa struttura YAML dell'input
2. DEVI mantenere gli stessi nomi dei campi
3. DEVI includere TUTTI i campi delle sezioni richieste, anche se non li modifichi
4. Per OGNI Key Result DEVE esserci almeno un Rischio associato (se le categorie lo richiedono)
5. Per OGNI Rischio DEVE esserci almeno un'Iniziativa di mitigazione (se le categorie lo richiedono)
6. Gli ID devono seguire il formato mostrato (obj_X, kr_X, risk_X, init_X)
7. Le relazioni tra elementi devono essere mantenute usando gli ID corretti
8. Genera SOLO le sezioni richieste nelle categorie specificate: ${requestedCategories.join(', ')}

La struttura YAML DEVE essere ESATTAMENTE questa (solo per le sezioni richieste):

${generateYamlStructure(requestedCategories)}

Modifica gli OKR esistenti secondo la richiesta dell'utente, mantenendo il rispetto delle regole specificate e la struttura YAML esatta.
NON omettere MAI nessuna sezione o campo delle categorie richieste.`
} 