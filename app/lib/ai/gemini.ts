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
    
    return {
      id: `okr_${Date.now()}`,
      team: context.team,
      period: context.period,
      objectives: (data.objectives || []).map((obj: any, index: number) => ({
        id: obj.id || `obj_${index + 1}`,
        title: obj.title,
        description: obj.description || '',
        isQualitative: true,
        isTimeBound: true,
        isInspirational: true
      })),
      keyResults: (data.key_results || []).map((kr: any, index: number) => ({
        id: kr.id || `kr_${index + 1}`,
        objectiveId: kr.objective_id,
        title: kr.title,
        forecast: kr.forecast || '',
        moon: kr.moon || '',
        unit: kr.unit || '',
        isQuantitative: true,
        isMeasurable: true,
        isSpecific: true,
        isAmbitious: true
      })),
      risks: (data.risks || []).map((risk: any, index: number) => ({
        id: risk.id || `risk_${index + 1}`,
        title: risk.title,
        description: risk.description,
        probability: risk.probability || 'medium',
        impact: risk.impact || 'medium',
        isExternal: risk.is_external || false,
        isInternal: !risk.is_external
      })),
      initiatives: (data.initiatives || []).map((init: any, index: number) => ({
        id: init.id || `init_${index + 1}`,
        riskId: init.risk_id,
        title: init.title,
        description: init.description || '',
        status: init.status || 'not_started',
        priority: init.priority || 'medium',
        isMitigative: true
      })),
      createdAt: now,
      updatedAt: now
    }
  }

  private convertOKRSetToYAML(okrSet: OKRSet): string {
    const data = {
      objectives: okrSet.objectives.map(obj => ({
        id: obj.id,
        title: obj.title,
        description: obj.description
      })),
      key_results: okrSet.keyResults.map(kr => ({
        id: kr.id,
        objective_id: kr.objectiveId,
        title: kr.title,
        forecast: kr.forecast,
        moon: kr.moon,
        unit: kr.unit
      })),
      risks: okrSet.risks.map(risk => ({
        id: risk.id,
        title: risk.title,
        description: risk.description,
        probability: risk.probability,
        impact: risk.impact,
        is_external: risk.isExternal
      })),
      initiatives: okrSet.initiatives.map(init => ({
        id: init.id,
        risk_id: init.riskId,
        title: init.title,
        description: init.description,
        priority: init.priority,
        status: init.status
      }))
    }

    return yaml.dump(data)
  }
} 