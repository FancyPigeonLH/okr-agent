# Test KPI - Esempi di utilizzo

## Esempio 1: KPI per rischio di costi
```
Genera OKR per il team Marketing con focus sui KPI di monitoraggio dei costi
```

**Risultato atteso:**
- Objectives: Obiettivi di marketing
- Key Results: Metriche di successo
- Risks: Rischio di superamento budget
- KPIs: "Costi mensili > 10.000€", "ROI < 2.5"
- Initiatives: Azioni di mitigazione

## Esempio 2: KPI per rischio di performance
```
Crea OKR per il team Sviluppo con indicatori di allerta per i tempi di risposta
```

**Risultato atteso:**
- Objectives: Obiettivi di sviluppo
- Key Results: Metriche di performance
- Risks: Rischio di degradazione performance
- KPIs: "Tempo di risposta API > 500ms", "Errori 5xx > 1%"
- Initiatives: Azioni di ottimizzazione

## Esempio 3: Solo KPI
```
Genera solo i KPI per monitorare i rischi del progetto e-commerce
```

**Risultato atteso:**
- Solo KPIs: Indicatori di soglia per vari rischi del progetto
- Nessun altro elemento OKR

## Struttura KPI nel YAML
```yaml
kpis:
  - id: "kpi_1"
    risk_id: "risk_1"
    title: "Monitoraggio costi mensili"
    metric: "Costi mensili"
    threshold: "10000"
    operator: ">"
    unit: "€"
```

## Validazione KPI
- ✅ Deve avere metrica, operatore, soglia e unità
- ✅ La soglia deve essere numerica
- ✅ L'operatore deve essere uno di: >, <, >=, <=, =, !=
- ✅ Deve essere associato a un rischio esistente
- ⚠️ I KPI sono opzionali (non tutti i rischi devono averne uno) 