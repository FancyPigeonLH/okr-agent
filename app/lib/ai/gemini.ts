import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateInitialPrompt, generateCorrectionPrompt, generateIterationPrompt } from './prompts'
import { OKRSet, ValidationResult, OKRCategory, GenerationContext, PartialOKRSet } from '@/app/types/okr'
import { validateOKRSet } from '@/app/lib/validation/okr-rules'
import yaml from 'js-yaml'

// Verifica la presenza della API key
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY non trovata nel file .env. Assicurati di averla configurata correttamente.')
}

// Inizializza Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export class OKRGenerator {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  private maxIterations = 3

  async generateOKR(
    userRequest: string,
    context: GenerationContext
  ): Promise<{ okrSet: PartialOKRSet; iterations: number; validationResult: ValidationResult }> {
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
    try {
      // Converti OKRSet in YAML per il prompt
      const yamlContent = this.convertOKRSetToYAML(currentOKR)
      const prompt = generateIterationPrompt(yamlContent, userRequest, categories)

      // Genera con Gemini
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const output = response.text()

      // Estrai e parsa YAML
      const yamlMatch = output.match(/```yaml\n([\s\S]*?)\n```/)
      if (!yamlMatch) {
        throw new Error('Output non contiene YAML valido')
      }

      const newYamlContent = yamlMatch[1]
      const parsedData = yaml.load(newYamlContent) as unknown
      const partialOKRSet = this.parseYAMLToPartialOKRSet(parsedData, {
        team: currentOKR.team,
        period: currentOKR.period,
        categories
      })

      return {
        okrSet: partialOKRSet,
        validationResult: validateOKRSet(this.convertPartialToFullOKRSet(partialOKRSet, {
          team: currentOKR.team,
          period: currentOKR.period
        }))
      }

    } catch (error) {
      console.error('Errore nell\'iterazione OKR:', error)
      throw new Error(`Errore nell'iterazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  private parseYAMLToPartialOKRSet(data: unknown, context: GenerationContext): PartialOKRSet {
    const requestedCategories = context.categories || ['objectives', 'key_results', 'risks', 'initiatives']
    const partialOKRSet: PartialOKRSet = {}
    
    // Normalizza i dati in ingresso con controlli di tipo più sicuri
    const dataObj = data as Record<string, unknown>
    const normalizedData = {
      objectives: Array.isArray(dataObj?.objectives) ? dataObj.objectives as Record<string, unknown>[] : [],
      key_results: Array.isArray(dataObj?.key_results) ? dataObj.key_results as Record<string, unknown>[] : [],
      risks: Array.isArray(dataObj?.risks) ? dataObj.risks as Record<string, unknown>[] : [],
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

  private validateRelationships(data: { objectives: Record<string, unknown>[]; key_results: Record<string, unknown>[]; risks: Record<string, unknown>[]; initiatives: Record<string, unknown>[] }, categories: OKRCategory[]) {
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

    if (categories.includes('initiatives') && categories.includes('risks')) {
      const riskIds = new Set(data.risks.map((risk: Record<string, unknown>) => risk.id as string))
      data.initiatives.forEach((init: Record<string, unknown>) => {
        if (!riskIds.has(init.risk_id as string)) {
          throw new Error(`Initiative ${init.id as string} fa riferimento a un Risk inesistente: ${init.risk_id as string}`)
        }
      })
    }
  }

  private convertPartialToFullOKRSet(partialOKRSet: PartialOKRSet, context: { team: string; period: string }): OKRSet {
    const now = new Date()
    
    return {
      id: `okr_${Date.now()}`,
      team: context.team,
      period: context.period,
      objectives: partialOKRSet.objectives || [],
      keyResults: partialOKRSet.keyResults || [],
      risks: partialOKRSet.risks || [],
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
      initiatives: (okrSet.initiatives || []).map(init => ({
        id: init.id,
        risk_id: init.riskId,
        description: init.description
      }))
    }

    return yaml.dump(yamlData)
  }
} 