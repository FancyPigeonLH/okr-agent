import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateInitialPrompt, generateCorrectionPrompt, generateIterationPrompt } from './prompts'
import { OKRSet, ValidationResult } from '@/app/types/okr'
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
    context: { team: string; period: string; objective?: string }
  ): Promise<{ okrSet: OKRSet; iterations: number; validationResult: ValidationResult }> {
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
        
        // Parsa YAML in OKRSet
        const parsedData = yaml.load(yamlContent) as any
        const okrSet = this.parseYAMLToOKRSet(parsedData, context)

        // Valida l'output
        validationResult = validateOKRSet(okrSet)

        // Se non è valido e non abbiamo superato il limite di iterazioni, genera un nuovo prompt
        if (!validationResult.isValid && iterations < this.maxIterations) {
          currentPrompt = generateCorrectionPrompt(yamlContent, validationResult.errors)
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
    const parsedData = yaml.load(yamlContent) as any
    const okrSet = this.parseYAMLToOKRSet(parsedData, context)

    return {
      okrSet,
      iterations,
      validationResult: validateOKRSet(okrSet)
    }
  }

  async iterateOKR(
    currentOKR: OKRSet,
    userRequest: string
  ): Promise<{ okrSet: OKRSet; validationResult: ValidationResult }> {
    try {
      // Converti OKRSet in YAML per il prompt
      const yamlContent = this.convertOKRSetToYAML(currentOKR)
      const prompt = generateIterationPrompt(yamlContent, userRequest)

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
      const parsedData = yaml.load(newYamlContent) as any
      const okrSet = this.parseYAMLToOKRSet(parsedData, {
        team: currentOKR.team,
        period: currentOKR.period
      })

      return {
        okrSet,
        validationResult: validateOKRSet(okrSet)
      }

    } catch (error) {
      console.error('Errore nell\'iterazione OKR:', error)
      throw new Error(`Errore nell'iterazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  private parseYAMLToOKRSet(data: any, context: { team: string; period: string }): OKRSet {
    const now = new Date()
    
    // Normalizza i dati in ingresso
    const normalizedData = {
      objectives: Array.isArray(data?.objectives) ? data.objectives : [],
      key_results: Array.isArray(data?.key_results) ? data.key_results : [],
      risks: Array.isArray(data?.risks) ? data.risks : [],
      initiatives: Array.isArray(data?.initiatives) ? data.initiatives : []
    }
    
    // Verifica la presenza di tutti i campi obbligatori
    if (normalizedData.objectives.length === 0 || 
        normalizedData.key_results.length === 0 || 
        normalizedData.risks.length === 0 || 
        normalizedData.initiatives.length === 0) {
      throw new Error('YAML non valido: mancano campi obbligatori o array vuoti (objectives, key_results, risks, initiatives)')
    }

    // Verifica che ogni elemento abbia i campi richiesti
    const validateFields = (item: any, requiredFields: string[], itemType: string) => {
      const missingFields = requiredFields.filter(field => !item[field])
      if (missingFields.length > 0) {
        throw new Error(`Campo obbligatorio mancante in ${itemType}: ${missingFields.join(', ')}`)
      }
    }

    // Valida ogni objective
    normalizedData.objectives.forEach((obj: any) => {
      validateFields(obj, ['id', 'title'], 'objective')
    })

    // Valida ogni key result
    normalizedData.key_results.forEach((kr: any) => {
      validateFields(kr, ['id', 'objective_id', 'title', 'unit'], 'key result')
    })

    // Valida ogni risk
    normalizedData.risks.forEach((risk: any) => {
      validateFields(risk, ['id', 'key_result_id', 'title', 'description'], 'risk')
    })

    // Valida ogni initiative
    normalizedData.initiatives.forEach((init: any) => {
      validateFields(init, ['id', 'risk_id', 'description'], 'initiative')
    })

    // Verifica le relazioni tra gli elementi
    const objectiveIds = new Set(normalizedData.objectives.map((obj: any) => obj.id))
    const keyResultIds = new Set(normalizedData.key_results.map((kr: any) => kr.id))
    const riskIds = new Set(normalizedData.risks.map((risk: any) => risk.id))

    // Verifica relazioni key results -> objectives
    normalizedData.key_results.forEach((kr: any) => {
      if (!objectiveIds.has(kr.objective_id)) {
        throw new Error(`Key Result ${kr.id} fa riferimento a un Objective inesistente: ${kr.objective_id}`)
      }
    })

    // Verifica relazioni risks -> key results
    normalizedData.risks.forEach((risk: any) => {
      if (!keyResultIds.has(risk.key_result_id)) {
        throw new Error(`Risk ${risk.id} fa riferimento a un Key Result inesistente: ${risk.key_result_id}`)
      }
    })

    // Verifica relazioni initiatives -> risks
    normalizedData.initiatives.forEach((init: any) => {
      if (!riskIds.has(init.risk_id)) {
        throw new Error(`Initiative ${init.id} fa riferimento a un Risk inesistente: ${init.risk_id}`)
      }
    })

    // Verifica che ogni Key Result abbia almeno un rischio
    normalizedData.key_results.forEach((kr: any) => {
      const risksForKR = normalizedData.risks.filter((r: any) => r.key_result_id === kr.id)
      if (risksForKR.length === 0) {
        throw new Error(`Key Result ${kr.id} non ha rischi associati`)
      }
    })

    // Verifica che ogni Rischio abbia almeno un'iniziativa
    normalizedData.risks.forEach((risk: any) => {
      const initiativesForRisk = normalizedData.initiatives.filter((i: any) => i.risk_id === risk.id)
      if (initiativesForRisk.length === 0) {
        throw new Error(`Risk ${risk.id} non ha iniziative associate`)
      }
    })
    
    return {
      id: `okr_${Date.now()}`,
      team: context.team,
      period: context.period,
      objectives: normalizedData.objectives.map((obj: any) => ({
        id: obj.id,
        title: obj.title,
        description: obj.description || '',
        isQualitative: true,
        isTimeBound: true,
        isInspirational: true
      })),
      keyResults: normalizedData.key_results.map((kr: any) => ({
        id: kr.id,
        objectiveId: kr.objective_id,
        title: kr.title,
        unit: kr.unit,
        isQuantitative: true,
        isMeasurable: true,
        isSpecific: true,
        isAmbitious: true
      })),
      risks: normalizedData.risks.map((risk: any) => ({
        id: risk.id,
        keyResultId: risk.key_result_id,
        title: risk.title,
        description: risk.description,
        isExternal: risk.is_external || false,
        isInternal: !risk.is_external
      })),
      initiatives: normalizedData.initiatives.map((init: any) => ({
        id: init.id,
        riskId: init.risk_id,
        description: init.description,
        isMitigative: true
      })),
      createdAt: now,
      updatedAt: now
    }
  }

  private convertOKRSetToYAML(okrSet: OKRSet): string {
    const yamlData = {
      objectives: okrSet.objectives.map(obj => ({
        id: obj.id,
        title: obj.title,
        description: obj.description
      })),
      key_results: okrSet.keyResults.map(kr => ({
        id: kr.id,
        objective_id: kr.objectiveId,
        title: kr.title,
        unit: kr.unit
      })),
      risks: okrSet.risks.map(risk => ({
        id: risk.id,
        key_result_id: risk.keyResultId,
        title: risk.title,
        description: risk.description,
        is_external: risk.isExternal
      })),
      initiatives: okrSet.initiatives.map(init => ({
        id: init.id,
        risk_id: init.riskId,
        description: init.description
      }))
    }

    return yaml.dump(yamlData)
  }
} 