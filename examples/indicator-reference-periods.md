# Periodi di Riferimento per gli Indicator

## Panoramica

Il nuovo sistema di creazione indicatori include un campo **Periodo di Riferimento** che aiuta l'utente a definire meglio come confrontare i dati nel tempo.

## Come Funziona

### 1. Selezione del Periodo di Riferimento

L'utente può scegliere tra diverse opzioni (nessuna pre-selezionata per evitare bias):

- **Mese su mese**: Il periodo di tempo è il mese di riferimento appena trascorso
- **Year to Date (YTD)**: Dall'inizio dell'anno corrente al termine del mese di riferimento
- **Last Twelve Months (LTM)**: Ultimi 12 mesi rolling

### 2. Aggiornamento Automatico della Descrizione

Quando l'utente seleziona un periodo di riferimento, la descrizione dell'indicatore viene automaticamente aggiornata per includere il contesto temporale.

**Esempio:**
- Descrizione originale: "Fatturato"
- Con periodo "YTD": "Fatturato (year to date (ytd))"
- Con periodo "Mese su mese": "Fatturato (mese su mese)"

### 3. Non Salvato nel Database

Il periodo di riferimento **NON** viene salvato nel database. Serve solo per:
- Guidare l'utente nella creazione di descrizioni più precise
- Migliorare la qualità degli indicatori creati
- Fornire esempi concreti di utilizzo

## Esempi Pratici

### Scenario 1: Fatturato Aziendale
- **Indicatore**: Fatturato
- **Periodicità**: Mensile (30 giorni)
- **Periodo di Riferimento**: YTD
- **Descrizione risultante**: "Fatturato (year to date (ytd))"
- **Significato**: Fatturato cumulativo dall'inizio dell'anno

### Scenario 2: Tasso di Conversione
- **Indicatore**: Tasso di conversione
- **Periodicità**: Settimanale (7 giorni)
- **Periodo di Riferimento**: Mese su mese
- **Descrizione risultante**: "Tasso di conversione (mese su mese)"
- **Significato**: Tasso di conversione del mese di riferimento

### Scenario 3: Customer Satisfaction
- **Indicatore**: Customer Satisfaction Score
- **Periodicità**: Trimestrale (90 giorni)
- **Periodo di Riferimento**: LTM
- **Descrizione risultante**: "Customer Satisfaction Score (last twelve months (ltm))"
- **Significato**: Customer satisfaction degli ultimi 12 mesi

## Vantaggi

1. **Descrizioni più precise**: Gli indicatori hanno descrizioni che includono il contesto temporale
2. **Guida l'utente**: L'utente capisce meglio come definire il suo indicatore
3. **Esempi concreti**: Ogni opzione include esempi pratici
4. **Flessibilità**: L'utente può sempre modificare manualmente la descrizione
5. **Non invasivo**: Non cambia la struttura del database esistente
6. **Ricerca intelligente**: Sistema di feedback visivo per la ricerca di indicatori simili

## Sistema di Ricerca Intelligente

### Come Funziona
- **Debounce**: La ricerca si attiva solo dopo 1 secondo di pausa nella digitazione
- **Limite Minimo**: La ricerca parte con almeno 3 caratteri (es. "NPS")
- **Feedback Visivo**: 
  - Icona di ricerca animata nel campo descrizione
  - Messaggio informativo "Ricerca indicatori simili in corso..."
  - Pulsante submit disabilitato con testo "Ricerca in corso..."
- **Risultati**:
  - Se trova indicatori simili: mostra fino a 3 suggerimenti
  - Se non trova nulla: mostra messaggio verde "Nessun indicatore simile trovato"
- **Stati di Ricerca**:
  - `isSearching`: ricerca in corso
  - `searchCompleted`: ricerca completata
  - `showSimilarResults`: mostra risultati se presenti

### Esperienza Utente
1. L'utente inizia a digitare la descrizione (minimo 3 caratteri)
2. Dopo 1 secondo di pausa, parte la ricerca automatica
3. L'interfaccia mostra chiaramente che la ricerca è in corso
4. L'utente non può procedere finché la ricerca non è completata
5. Vengono mostrati i risultati o un messaggio verde di "nessun risultato"
6. L'utente può scegliere di usare un suggerimento o continuare con la creazione
7. L'utente può selezionare un periodo di riferimento (nessuno pre-selezionato)

## Implementazione Tecnica

- Il campo `referencePeriod` è presente solo nel form
- Viene rimosso prima dell'invio al server
- La logica di aggiornamento della descrizione è intelligente (non modifica descrizioni già molto specifiche)
- Include un sistema di "suggerimenti usati" per evitare conflitti
- **Ricerca Intelligente**: Sistema di ricerca automatica con feedback visivo
  - Debounce di 1 secondo per evitare troppe chiamate
  - Indicatore di ricerca in corso con messaggio informativo
  - Disabilitazione temporanea del submit durante la ricerca
  - Messaggio quando non ci sono risultati trovati 