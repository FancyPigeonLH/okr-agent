# OKR Agent - Coach AI per OKR

Un coach AI intelligente che aiuta a definire Objectives, Key Results, Rischi e Iniziative seguendo il framework OKR.

## 🚀 Getting Started

### Prerequisiti

- Node.js 18+ 
- npm, yarn, pnpm o bun

### Installazione

1. **Clona il repository**
```bash
git clone <repository-url>
cd okr-agent
```

2. **Installa le dipendenze**
```bash
npm install
```

3. **Configura l'API Key Gemini**

Crea un file `.env` nella root del progetto:

```bash
# Gemini API Key
# Ottieni la tua API key da: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

**Come ottenere l'API Key Gemini:**
1. Vai su [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Accedi con il tuo account Google
3. Clicca su "Create API Key"
4. Copia la chiave e incollala nel file `.env`

4. **Avvia il server di sviluppo**
```bash
npm run dev
```

5. **Apri il browser**
Vai su [http://localhost:3000](http://localhost:3000)

## 🎯 Funzionalità

### Analisi Intelligente dei Prompt
- **AI-Powered**: Utilizza Gemini per analizzare semanticamente le richieste dell'utente
- **Categorie Automatiche**: Rileva automaticamente quali elementi OKR sono rilevanti
- **Livelli di Confidenza**: Mostra quanto l'AI è sicura della sua analisi

### Generazione OKR
- **Objectives**: Obiettivi qualitativi e ispirazionali
- **Key Results**: Metriche quantitative e misurabili
- **Rischi**: Identificazione di potenziali ostacoli
- **Iniziative**: Azioni concrete per mitigare i rischi

### Contesto Dinamico
- **Company Context**: Seleziona l'azienda di riferimento
- **Team Context**: Specifica il team coinvolto
- **User Context**: Personalizza per utenti specifici

## 🛠️ Tecnologie

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, Shadcn UI, Radix UI
- **AI**: Google Gemini 1.5 Flash
- **State Management**: Zustand
- **Styling**: Stylus (CSS Modules)

## 📁 Struttura del Progetto

```
okr-agent/
├── app/
│   ├── components/
│   │   ├── chat/          # Interfaccia chat e debugger
│   │   ├── okr/           # Visualizzazione OKR
│   │   └── ui/            # Componenti UI base
│   ├── lib/
│   │   ├── ai/            # Integrazione Gemini
│   │   ├── store/         # State management
│   │   └── validation/    # Regole di validazione
│   └── types/             # Definizioni TypeScript
├── prisma/                # Schema database
└── public/                # Asset statici
```

## 🔧 Sviluppo

### Script Disponibili

```bash
npm run dev          # Server di sviluppo
npm run build        # Build di produzione
npm run start        # Avvia server di produzione
npm run lint         # Controllo linting
```

### Configurazione

Il progetto utilizza:
- **ESLint** per il linting del codice
- **Prettier** per la formattazione
- **TypeScript** per il type checking

## 🚨 Risoluzione Problemi

### Errore API Key
Se vedi l'errore "GEMINI_API_KEY non trovata":
1. Verifica che il file `.env` esista nella root
2. Controlla che la chiave sia corretta
3. Riavvia il server di sviluppo

### Fallback Mode
Se l'AI non è disponibile, l'app utilizza automaticamente un'analisi di fallback che include tutte le categorie OKR.

## 📝 Licenza

MIT License
