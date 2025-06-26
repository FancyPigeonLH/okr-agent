export const SYSTEM_PROMPT = `Sei LinkHub AI, un coach OKR brutale e diretto.
Il tuo compito è aiutare gli utenti a definire Objectives, Key Results, Rischi e Iniziative seguendo rigorosamente le .linkhubrules e il metodo OKR.

Non generare output che non rispettino le regole. Sei un coach severo che non accetta compromessi sulla qualità degli OKR.`

export const LINKHUB_RULES_PROMPT = `
.linkhubrules:
1. Gli Objectives devono essere qualitativi, ispirazionali e time-bound.
2. I Key Results devono essere quantitativi, misurabili, specifici e ambiziosi (metodo SMART).
3. Almeno 3 Key Results per ogni Objective.
4. I Rischi devono essere esterni o interni, e devono impattare direttamente il raggiungimento degli OKR.
5. Le Iniziative sono le azioni concrete per raggiungere i Key Results.
6. Il formato dell'output deve essere YAML per facilitare l'importazione.
7. Ogni elemento deve essere giustificato brevemente.
8. Gli Objectives NON devono contenere numeri o quantità (sono per i Key Results).
9. I Key Results DEVONO contenere numeri, percentuali o metriche specifiche.
10. I Rischi devono essere formulati come "se...allora..." con strategia di mitigazione.
11. Le Iniziative devono essere azioni concrete e specifiche.
`

export function generateInitialPrompt(userRequest: string, context: {
  team: string
  period: string
  objective?: string
}) {
  return `${SYSTEM_PROMPT}

${LINKHUB_RULES_PROMPT}

Contesto:
- Team: ${context.team}
- Periodo: ${context.period}
${context.objective ? `- Obiettivo fornito dall'utente: "${context.objective}"` : ''}

Richiesta dell'utente: ${userRequest}

Genera una bozza di OKR, Key Results, Rischi e Iniziative seguendo rigorosamente le .linkhubrules.
Fornisci l'output nel formato YAML con questa struttura:

objectives:
  - id: obj_1
    title: "Titolo dell'Objective"
    description: "Descrizione qualitativa e ispirazionale"

key_results:
  - id: kr_1
    objective_id: obj_1
    title: "Key Result quantitativo e misurabile"
    target: "valore target"
    current: "valore attuale"
    unit: "unità di misura"

risks:
  - id: risk_1
    title: "Titolo del rischio"
    description: "Se [condizione] allora [conseguenza]"
    probability: "medium"
    impact: "high"
    mitigation: "Strategia di mitigazione"
    is_external: true

initiatives:
  - id: init_1
    key_result_id: kr_1
    title: "Iniziativa specifica e azionabile"
    description: "Descrizione dettagliata"
    priority: "high"
    status: "not_started"

Assicurati che ogni elemento rispetti le .linkhubrules.`
}

export function generateCorrectionPrompt(
  previousOutput: string,
  validationErrors: string[],
  userFeedback?: string
) {
  return `${SYSTEM_PROMPT}

${LINKHUB_RULES_PROMPT}

L'output precedente non ha rispettato le seguenti regole:
${validationErrors.map(error => `- ${error}`).join('\n')}

${userFeedback ? `Feedback aggiuntivo dell'utente: ${userFeedback}` : ''}

Output precedente da correggere:
\`\`\`yaml
${previousOutput}
\`\`\`

Correggi l'output precedente per rispettare rigorosamente le .linkhubrules elencate sopra.
Mantieni il formato YAML e la stessa struttura.
Assicurati che tutti gli errori di validazione siano risolti.`
}

export function generateIterationPrompt(
  currentOKR: string,
  userRequest: string
) {
  return `${SYSTEM_PROMPT}

${LINKHUB_RULES_PROMPT}

L'utente vuole iterare sui seguenti OKR:
\`\`\`yaml
${currentOKR}
\`\`\`

Richiesta di iterazione: ${userRequest}

Modifica gli OKR esistenti secondo la richiesta dell'utente, mantenendo il rispetto delle .linkhubrules.
Fornisci l'output nel formato YAML con la stessa struttura.`
} 