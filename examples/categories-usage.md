# Utilizzo delle Categorie OKR

Questo documento mostra come utilizzare le nuove funzionalità delle categorie per generare risposte parziali degli OKR.

## Categorie Disponibili

- `objectives`: Genera solo gli Objectives
- `key_results`: Genera solo i Key Results  
- `risks`: Genera solo i Rischi
- `initiatives`: Genera solo le Iniziative

## Esempi di Utilizzo

### 1. Generazione Completa (Comportamento Predefinito)

```typescript
const context: GenerationContext = {
  team: "Marketing",
  period: "Q1 2024",
  objective: "Aumentare la visibilità del brand"
}

const result = await generator.generateOKR("Genera OKR per il team marketing", context)
// Genera: objectives, key_results, risks, initiatives
```

### 2. Solo Objectives e Key Results

```typescript
const context: GenerationContext = {
  team: "Marketing", 
  period: "Q1 2024",
  categories: ['objectives', 'key_results']
}

const result = await generator.generateOKR("Genera solo obiettivi e risultati chiave", context)
// Genera solo: objectives, key_results
```

### 3. Solo Rischi per Key Results Esistenti

```typescript
const context: GenerationContext = {
  team: "Marketing",
  period: "Q1 2024", 
  categories: ['risks']
}

const result = await generator.generateOKR("Identifica i rischi per i nostri key results", context)
// Genera solo: risks
```

### 4. Solo Iniziative di Mitigazione

```typescript
const context: GenerationContext = {
  team: "Marketing",
  period: "Q1 2024",
  categories: ['initiatives']
}

const result = await generator.generateOKR("Proponi iniziative per mitigare i rischi", context)
// Genera solo: initiatives
```

### 5. Iterazione con Categorie Specifiche

```typescript
// Modifica solo gli objectives esistenti
const result = await generator.iterateOKR(
  currentOKR, 
  "Rifinisci gli obiettivi per renderli più ambiziosi",
  ['objectives']
)

// Aggiungi nuovi key results
const result = await generator.iterateOKR(
  currentOKR,
  "Aggiungi un nuovo key result per la customer satisfaction", 
  ['key_results']
)
```

## Struttura delle Risposte

Le risposte parziali mantengono la stessa struttura YAML, ma includono solo le sezioni richieste:

### Risposta Completa
```yaml
objectives:
  - id: "obj_1"
    title: "Titolo dell'Objective"
    description: "Descrizione qualitativa e ispirazionale"

key_results:
  - id: "kr_1"
    objective_id: "obj_1"
    title: "Titolo del Key Result"
    unit: "unità"

risks:
  - id: "risk_1"
    key_result_id: "kr_1"
    title: "Titolo del Rischio"
    description: "Descrizione del rischio"
    is_external: false

initiatives:
  - id: "init_1"
    risk_id: "risk_1"
    title: "Titolo dell'Iniziativa"
    description: "Descrizione dell'iniziativa"
```

### Risposta Parziale (solo objectives e key_results)
```yaml
objectives:
  - id: "obj_1"
    title: "Titolo dell'Objective"
    description: "Descrizione qualitativa e ispirazionale"

key_results:
  - id: "kr_1"
    objective_id: "obj_1"
    title: "Titolo del Key Result"
    unit: "unità"
```

## Validazione

La validazione viene applicata solo alle categorie generate:
- Se generi solo `objectives`, non viene validata la presenza di `key_results`
- Se generi solo `risks`, non viene validata la presenza di `initiatives`
- Le relazioni vengono validate solo se sono presenti entrambe le categorie correlate

## Best Practices

1. **Inizia con gli Objectives**: Genera prima gli obiettivi, poi i key results
2. **Aggiungi Rischi Progressivamente**: Una volta definiti i key results, identifica i rischi
3. **Mitiga i Rischi**: Infine, genera le iniziative per mitigare i rischi identificati
4. **Itera Selettivamente**: Usa le categorie per raffinare parti specifiche senza ricominciare da capo

## Integrazione con l'API

Le API routes supportano già le categorie:

```typescript
// POST /api/okr/generate
{
  "input": "Genera solo obiettivi per il team sales",
  "context": {
    "team": "Sales",
    "period": "Q1 2024",
    "categories": ["objectives"]
  }
}

// POST /api/okr/iterate  
{
  "input": "Modifica solo i key results",
  "currentOKR": {...},
  "categories": ["key_results"]
}
``` 