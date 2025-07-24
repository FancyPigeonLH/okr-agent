import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateInitialPrompt, generateCorrectionPrompt, generateIterationPrompt, generateCategoryAnalysisPrompt } from './prompts'
import { OKRSet, ValidationResult, OKRCategory, GenerationContext, PartialOKRSet, KPI } from '@/app/types/okr'
import { validateOKRSet } from '@/app/lib/validation/okr-rules'
import yaml from 'js-yaml'

// Inizializza Gemini solo se siamo lato server
let genAI: GoogleGenerativeAI | null = null

if (typeof window === 'undefined') {
  // Siamo lato server
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non trovata nel file .env. Assicurati di averla configurata correttamente.')
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

type ExistingIndicator = {
  id: string
  description: string
  symbol: string
  periodicity: number
  isReverse: boolean
}

type SimilarIndicator = {
  id: string
  description: string
  symbol: string
  periodicity: number
  isReverse: boolean
  similarity: number
}

export async function generateSimilarIndicators(
  newDescription: string,
  existingIndicators: ExistingIndicator[]
): Promise<SimilarIndicator[]> {
  if (!genAI) {
    throw new Error('Modello AI non disponibile - verifica la configurazione della API key')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
Analizza la similarità semantica tra la descrizione di un nuovo indicatore e una lista di indicatori esistenti.

NUOVO INDICATORE:
"${newDescription}"

INDICATORI ESISTENTI:
${existingIndicators.map((indicator, index) => `
${index + 1}. ID: ${indicator.id}
   Descrizione: "${indicator.description}"
   Simbolo: ${indicator.symbol}
   Periodicità: ${indicator.periodicity} giorni
   Inverso: ${indicator.isReverse}
`).join('\n')}

ISTRUZIONI:
1. Analizza la similarità semantica tra il nuovo indicatore e ciascun indicatore esistente
2. Considera: concetti simili, metriche correlate, obiettivi simili, terminologia comune
3. Assegna un punteggio di similarità da 0.0 (completamente diverso) a 1.0 (identico)
4. Restituisci solo gli indicatori con similarità >= 0.3 (30%)
5. Ordina per similarità decrescente

Rispondi SOLO con un JSON valido nel seguente formato:
{
  "similarIndicators": [
    {
      "id": "id_indicatore",
      "description": "descrizione originale",
      "symbol": "simbolo originale",
      "periodicity": numero_periodicità,
      "isReverse": true/false,
      "similarity": 0.85
    }
  ]
}

Non includere spiegazioni o testo aggiuntivo, solo il JSON.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const output = response.text()

    // Estrai JSON dall'output
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Output non contiene JSON valido:', output)
      return []
    }

    const data = JSON.parse(jsonMatch[0])
    
    // Valida e normalizza la risposta
    if (!data.similarIndicators || !Array.isArray(data.similarIndicators)) {
      return []
    }

    return data.similarIndicators
      .filter((item: any) => 
        item.id && 
        item.description && 
        item.symbol && 
        typeof item.periodicity === 'number' &&
        typeof item.isReverse === 'boolean' &&
        typeof item.similarity === 'number' &&
        item.similarity >= 0.3
      )
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 5) // Limita a 5 risultati

  } catch (error) {
    console.error('Errore nella generazione di indicatori simili:', error)
    return []
  }
}

export class OKRGenerator {
  private model = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash' }) || null
  private maxIterations = 3

  async generateOKR(
    userRequest: string,
    context: GenerationContext
  ): Promise<{ okrSet: PartialOKRSet; iterations: number; validationResult: ValidationResult }> {
    if (!this.model) {
      throw new Error('Modello AI non disponibile - verifica la configurazione della API key')
    }
    
    // DEBUG: Verifica cosa riceve il generatore AI
    console.log('🤖 DEBUG GENERATORE AI:')
    console.log('📝 Richiesta utente:', userRequest)
    console.log('🎯 Categorie richieste:', context.categories)
    console.log('---')
    
    let currentPrompt = generateInitialPrompt(userRequest, context)
    let iterations = 0
    let lastOutput = ''
    let validationResult: ValidationResult

    do {
      iterations++
      
      try {
        // Genera OKR con Gemini
        const result = await this.model.generateContent(currentPrompt)
        const response = await result.response
        lastOutput = response.text()

        // Estrai YAML dall'output
        const yamlMatch = lastOutput.match(/```yaml\n([\s\S]*?)\n```/)
        if (!yamlMatch) {
          throw new Error('Output non contiene YAML valido')
        }

        const yamlContent = yamlMatch[1]
        
        // Parsa YAML in PartialOKRSet
        const parsedData = yaml.load(yamlContent) as unknown
        const partialOKRSet = this.parseYAMLToPartialOKRSet(parsedData, context)

        // Valida l'output (per ora usiamo la validazione completa, ma potremmo creare una validazione parziale)
        const fullOKRSet = this.convertPartialToFullOKRSet(partialOKRSet, context)
        validationResult = validateOKRSet(fullOKRSet)

        // Se non è valido e non abbiamo superato il limite di iterazioni, genera un nuovo prompt
        if (!validationResult.isValid && iterations < this.maxIterations) {
          currentPrompt = generateCorrectionPrompt(yamlContent, validationResult.errors, undefined, context.categories)
        }

      } catch (error) {
        console.error('Errore nella generazione OKR:', error)
        throw new Error(`Errore nella generazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
      }

    } while (!validationResult.isValid && iterations < this.maxIterations)

    // Parsa l'output finale
    const yamlMatch = lastOutput.match(/```yaml\n([\s\S]*?)\n```/)
    if (!yamlMatch) {
      throw new Error('Output finale non contiene YAML valido')
    }

    const yamlContent = yamlMatch[1]
    const parsedData = yaml.load(yamlContent) as unknown
    const partialOKRSet = this.parseYAMLToPartialOKRSet(parsedData, context)

    return {
      okrSet: partialOKRSet,
      iterations,
      validationResult: validateOKRSet(this.convertPartialToFullOKRSet(partialOKRSet, context))
    }
  }

  async iterateOKR(
    currentOKR: OKRSet,
    userRequest: string,
    categories?: OKRCategory[]
  ): Promise<{ okrSet: PartialOKRSet; validationResult: ValidationResult }> {
    if (!this.model) {
      throw new Error('Modello AI non disponibile - verifica la configurazione della API key')
    }
    
    const prompt = generateIterationPrompt(this.convertOKRSetToYAML(currentOKR), userRequest, categories)
    
    let output: string = ''
    try {
      const result = await this.model.generateContent(prompt)
      output = result.response.text()

      // Estrai e parsa YAML
      const yamlMatch = output.match(/```yaml\n([\s\S]*?)\n```/)
      if (!yamlMatch) {
        throw new Error('Output non contiene YAML valido')
      }

      const newYamlContent = yamlMatch[1]
      const parsedData = yaml.load(newYamlContent) as unknown
      const partialOKRSet = this.parseYAMLToPartialOKRSet(parsedData, {
        team: currentOKR.team,
        categories
      })

      return {
        okrSet: partialOKRSet,
        validationResult: validateOKRSet(this.convertPartialToFullOKRSet(partialOKRSet, {
          team: currentOKR.team
        }))
      }

    } catch (error) {
      console.error('Errore nell\'iterazione OKR:', error)
      
      // Se è un errore YAML, prova a pulire e riprovare
      if (error instanceof Error && error.message.includes('bad indentation') && output) {
        console.log('Tentativo di pulizia YAML...')
        try {
          // Estrai di nuovo il contenuto e prova a pulirlo
          const yamlMatch = output.match(/```yaml\n([\s\S]*?)\n```/)
          if (yamlMatch) {
            let cleanedYaml = yamlMatch[1]
            
            // Rimuovi righe problematiche con caratteri spezzati
            cleanedYaml = cleanedYaml
              .split('\n')
              .filter((line: string) => !line.includes('...') && line.trim().length > 0)
              .join('\n')
            
            // Prova a parsare il YAML pulito
            const parsedData = yaml.load(cleanedYaml) as unknown
            const partialOKRSet = this.parseYAMLToPartialOKRSet(parsedData, {
              team: currentOKR.team,
              categories
            })

            return {
              okrSet: partialOKRSet,
              validationResult: validateOKRSet(this.convertPartialToFullOKRSet(partialOKRSet, {
                team: currentOKR.team
              }))
            }
          }
        } catch (retryError) {
          console.error('Anche il retry è fallito:', retryError)
        }
      }
      
      throw new Error(`Errore nell'iterazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  async analyzeCategories(userInput: string): Promise<{
    categories: OKRCategory[]
    reasoning: Record<OKRCategory, string>
    confidence: Record<OKRCategory, number>
  }> {
    if (!this.model) {
      throw new Error('Modello AI non disponibile - verifica la configurazione della API key')
    }
    
    try {
      const prompt = generateCategoryAnalysisPrompt(userInput)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const output = response.text()

      // Estrai JSON dall'output
      const jsonMatch = output.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Output non contiene JSON valido')
      }

      const analysis = JSON.parse(jsonMatch[0])
      
      // Valida e normalizza la risposta
      const categories = Array.isArray(analysis.categories) 
        ? analysis.categories.filter((cat: string) => 
            ['objectives', 'key_results', 'risks', 'initiatives'].includes(cat)
          ) as OKRCategory[]
        : []

      const reasoning = analysis.reasoning || {}
      const confidence = analysis.confidence || {}

      return {
        categories,
        reasoning,
        confidence
      }

    } catch (error) {
      console.error('Errore nell\'analisi delle categorie:', error)
      
      // Fallback: ritorna tutte le categorie se l'analisi fallisce
      return {
        categories: ['objectives', 'key_results', 'risks', 'kpis', 'initiatives'],
        reasoning: {
          objectives: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
          key_results: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
          risks: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
          kpis: 'Analisi AI non disponibile - categoria inclusa per sicurezza',
          initiatives: 'Analisi AI non disponibile - categoria inclusa per sicurezza'
        },
        confidence: {
          objectives: 0.5,
          key_results: 0.5,
          risks: 0.5,
          kpis: 0.5,
          initiatives: 0.5
        }
      }
    }
  }

  private parseYAMLToPartialOKRSet(data: unknown, context: GenerationContext): PartialOKRSet {
    const requestedCategories = context.categories || ['objectives', 'key_results', 'risks', 'kpis', 'initiatives']
    const partialOKRSet: PartialOKRSet = {}
    
    // Normalizza i dati in ingresso con controlli di tipo più sicuri
    const dataObj = data as Record<string, unknown>
    const normalizedData = {
      objectives: Array.isArray(dataObj?.objectives) ? dataObj.objectives as Record<string, unknown>[] : [],
      key_results: Array.isArray(dataObj?.key_results) ? dataObj.key_results as Record<string, unknown>[] : [],
      risks: Array.isArray(dataObj?.risks) ? dataObj.risks as Record<string, unknown>[] : [],
      kpis: Array.isArray(dataObj?.kpis) ? dataObj.kpis as Record<string, unknown>[] : [],
      initiatives: Array.isArray(dataObj?.initiatives) ? dataObj.initiatives as Record<string, unknown>[] : []
    }
    
    // Verifica che ogni elemento abbia i campi richiesti
    const validateFields = (item: Record<string, unknown>, requiredFields: string[], itemType: string) => {
      const missingFields = requiredFields.filter(field => !item[field])
      if (missingFields.length > 0) {
        throw new Error(`Campo obbligatorio mancante in ${itemType}: ${missingFields.join(', ')}`)
      }
    }

    // Processa solo le categorie richieste
    if (requestedCategories.includes('objectives')) {
      if (normalizedData.objectives.length === 0) {
        throw new Error('YAML non valido: mancano objectives richiesti')
      }
      normalizedData.objectives.forEach((obj: Record<string, unknown>) => {
        validateFields(obj, ['id', 'title'], 'objective')
      })
      partialOKRSet.objectives = normalizedData.objectives.map((obj: Record<string, unknown>) => ({
        id: obj.id as string,
        title: obj.title as string,
        description: (obj.description as string) || '',
        isQualitative: true,
        isTimeBound: true,
        isInspirational: true
      }))
    }

    if (requestedCategories.includes('key_results')) {
      if (normalizedData.key_results.length === 0) {
        throw new Error('YAML non valido: mancano key_results richiesti')
      }
      normalizedData.key_results.forEach((kr: Record<string, unknown>) => {
        validateFields(kr, ['id', 'objective_id', 'title', 'unit'], 'key result')
      })
      partialOKRSet.keyResults = normalizedData.key_results.map((kr: Record<string, unknown>) => ({
        id: kr.id as string,
        objectiveId: kr.objective_id as string,
        title: kr.title as string,
        unit: kr.unit as string,
        isQuantitative: true,
        isMeasurable: true,
        isSpecific: true,
        isAmbitious: true
      }))
    }

    if (requestedCategories.includes('risks')) {
      if (normalizedData.risks.length === 0) {
        throw new Error('YAML non valido: mancano risks richiesti')
      }
      normalizedData.risks.forEach((risk: Record<string, unknown>) => {
        validateFields(risk, ['id', 'key_result_id', 'title', 'description'], 'risk')
      })
      partialOKRSet.risks = normalizedData.risks.map((risk: Record<string, unknown>) => ({
        id: risk.id as string,
        keyResultId: risk.key_result_id as string,
        title: risk.title as string,
        description: risk.description as string,
        isExternal: (risk.is_external as boolean) || false,
        isInternal: !(risk.is_external as boolean)
      }))
    }

    if (requestedCategories.includes('kpis')) {
      // I KPI sono opzionali, quindi non lanciamo errore se non ci sono
      if (normalizedData.kpis.length > 0) {
        normalizedData.kpis.forEach((kpi: Record<string, unknown>) => {
          validateFields(kpi, ['id', 'risk_id', 'title', 'unit'], 'kpi')
        })
        partialOKRSet.kpis = normalizedData.kpis.map((kpi: Record<string, unknown>) => ({
          id: kpi.id as string,
          riskId: kpi.risk_id as string,
          title: kpi.title as string,
          unit: kpi.unit as string,
          isAlert: true,
          isQuantitative: true
        }))
      }
    }

    if (requestedCategories.includes('initiatives')) {
      if (normalizedData.initiatives.length === 0) {
        throw new Error('YAML non valido: mancano initiatives richieste')
      }
      normalizedData.initiatives.forEach((init: Record<string, unknown>) => {
        validateFields(init, ['id', 'risk_id', 'description'], 'initiative')
      })
      partialOKRSet.initiatives = normalizedData.initiatives.map((init: Record<string, unknown>) => ({
        id: init.id as string,
        riskId: init.risk_id as string,
        description: init.description as string,
        isMitigative: true
      }))
    }

    // Verifica le relazioni solo se sono presenti entrambe le categorie correlate
    this.validateRelationships(normalizedData, requestedCategories)
    
    return partialOKRSet
  }

  private validateRelationships(data: { objectives: Record<string, unknown>[]; key_results: Record<string, unknown>[]; risks: Record<string, unknown>[]; kpis: Record<string, unknown>[]; initiatives: Record<string, unknown>[] }, categories: OKRCategory[]) {
    // Verifica relazioni solo se sono presenti entrambe le categorie correlate
    if (categories.includes('key_results') && categories.includes('objectives')) {
      const objectiveIds = new Set(data.objectives.map((obj: Record<string, unknown>) => obj.id as string))
      data.key_results.forEach((kr: Record<string, unknown>) => {
        if (!objectiveIds.has(kr.objective_id as string)) {
          throw new Error(`Key Result ${kr.id as string} fa riferimento a un Objective inesistente: ${kr.objective_id as string}`)
        }
      })
    }

    if (categories.includes('risks') && categories.includes('key_results')) {
      const keyResultIds = new Set(data.key_results.map((kr: Record<string, unknown>) => kr.id as string))
      data.risks.forEach((risk: Record<string, unknown>) => {
        if (!keyResultIds.has(risk.key_result_id as string)) {
          throw new Error(`Risk ${risk.id as string} fa riferimento a un Key Result inesistente: ${risk.key_result_id as string}`)
        }
      })
    }

    if (categories.includes('kpis') && categories.includes('risks')) {
      const riskIds = new Set(data.risks.map((risk: Record<string, unknown>) => risk.id as string))
      data.kpis.forEach((kpi: Record<string, unknown>) => {
        if (!riskIds.has(kpi.risk_id as string)) {
          throw new Error(`KPI ${kpi.id as string} fa riferimento a un Risk inesistente: ${kpi.risk_id as string}`)
        }
      })
    }

    if (categories.includes('initiatives') && categories.includes('risks')) {
      const riskIds = new Set(data.risks.map((risk: Record<string, unknown>) => risk.id as string))
      data.initiatives.forEach((init: Record<string, unknown>) => {
        if (!riskIds.has(init.risk_id as string)) {
          throw new Error(`Initiative ${init.id as string} fa riferimento a un Risk inesistente: ${init.risk_id as string}`)
        }
      })
    }
  }

  private convertPartialToFullOKRSet(partialOKRSet: PartialOKRSet, context: { team: string }): OKRSet {
    const now = new Date()
    
    return {
      id: `okr_${Date.now()}`,
      team: context.team,
      objectives: partialOKRSet.objectives || [],
      keyResults: partialOKRSet.keyResults || [],
      risks: partialOKRSet.risks || [],
      kpis: partialOKRSet.kpis || [],
      initiatives: partialOKRSet.initiatives || [],
      createdAt: now,
      updatedAt: now
    }
  }

  private convertOKRSetToYAML(okrSet: OKRSet): string {
    const yamlData = {
      objectives: (okrSet.objectives || []).map(obj => ({
        id: obj.id,
        title: obj.title,
        description: obj.description
      })),
      key_results: (okrSet.keyResults || []).map(kr => ({
        id: kr.id,
        objective_id: kr.objectiveId,
        title: kr.title,
        unit: kr.unit
      })),
      risks: (okrSet.risks || []).map(risk => ({
        id: risk.id,
        key_result_id: risk.keyResultId,
        title: risk.title,
        description: risk.description,
        is_external: risk.isExternal
      })),
      kpis: (okrSet.kpis || []).map(kpi => ({
        id: kpi.id,
        risk_id: kpi.riskId,
        title: kpi.title,
        unit: kpi.unit
      })),
      initiatives: (okrSet.initiatives || []).map(init => ({
        id: init.id,
        risk_id: init.riskId,
        description: init.description
      }))
    }

    return yaml.dump(yamlData)
  }
} 