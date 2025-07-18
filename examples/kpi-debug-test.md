# Test Rilevamento Automatico KPI

## Prompt che dovrebbero attivare i KPI automaticamente:

### 1. Parole chiave esplicite
```
Genera OKR per il team Marketing con KPI di monitoraggio costi
```
**Atteso:** KPI selezionato automaticamente

### 2. Richiesta di monitoraggio
```
Crea OKR per il team Sviluppo con indicatori di allerta per performance
```
**Atteso:** KPI selezionato automaticamente

### 3. Soglie e threshold
```
OKR per il team Sales con soglie di controllo per il budget
```
**Atteso:** KPI selezionato automaticamente

### 4. Monitoraggio implicito
```
Genera OKR per il team HR con focus su metriche di controllo
```
**Atteso:** KPI selezionato automaticamente

### 5. Allerte e warning
```
OKR per il team Operations con sistema di allerta per downtime
```
**Atteso:** KPI selezionato automaticamente

## Prompt che NON dovrebbero attivare i KPI:

### 1. Richiesta generica
```
Genera OKR per il team Marketing
```
**Atteso:** KPI NON selezionato automaticamente

### 2. Solo obiettivi
```
Crea solo gli obiettivi per il team Sviluppo
```
**Atteso:** KPI NON selezionato automaticamente

## Logica di selezione implementata:

1. **Soglia di confidenza KPI:** 70% (più bassa delle altre categorie)
2. **Soglia di confidenza altre categorie:** 90%
3. **Analisi AI:** L'API di Gemini analizza il prompt e determina le categorie rilevanti
4. **Fallback:** Se nessuna categoria è selezionata, vengono selezionati almeno objectives e key_results

## Test da eseguire:

1. Inserire i prompt sopra nel CategoryDebugger
2. Verificare che l'API di Gemini rilevi correttamente i KPI quando appropriato
3. Verificare che la logica di fallback funzioni
4. Verificare che il timer di auto-conferma si resetti quando si modifica la selezione 