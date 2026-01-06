# Backend Installatie Handleiding

Deze handleiding legt uit hoe je de backend van de VIP Guest Research Tool instelt.

## Vereisten

- **Node.js** versie 18 of hoger
- **npm** (komt met Node.js)
- Een **OpenAI API key** (verplicht)
- Optioneel: API keys voor zoekmachines (Brave Search, Google Knowledge Graph)
- Optioneel: 2Captcha API key (voor Google Search functionaliteit)
- Optioneel: Proxy URL (voor web scraping)

## Stap 1: Dependencies Installeren

Open een terminal in de `backend` folder en installeer alle dependencies:

```bash
cd backend
npm install
```

Dit kan enkele minuten duren, vooral voor packages zoals `puppeteer` en `better-sqlite3`.

## Stap 2: Environment Variables Instellen

1. Kopieer het `.env.example` bestand naar `.env`:

```bash
# Op Windows (PowerShell):
Copy-Item .env.example .env

# Op Mac/Linux:
cp .env.example .env
```

2. Open het `.env` bestand en vul de volgende waarden in:

### Verplichte Variabelen

- **`OPENAI_API_KEY`**: Je OpenAI API key (verkrijgbaar op https://platform.openai.com/api-keys)
  - Deze is verplicht voor AI-functionaliteiten zoals VIP scoring en query generatie

### Optionele Variabelen (maar aanbevolen)

- **`TWO_CAPTCHA_API_KEY`**: Voor Google Search functionaliteit
  - Verkrijgbaar op https://2captcha.com
  - Zonder deze key werkt Google Search niet

- **`BRAVE_SEARCH_API_KEY`**: Voor Brave Search functionaliteit
  - Verkrijgbaar op https://brave.com/search/api/
  - Alternatief voor Google Search

- **`GOOGLE_KNOWLEDGE_GRAPH_API_KEY`**: Voor Google Knowledge Graph API
  - Verkrijgbaar op https://console.cloud.google.com/
  - Gebruikt voor bedrijfsinformatie

- **`PROXY_URL`**: Proxy URL voor web scraping
  - Format: `http://username:password@proxy.example.com:port`
  - Optioneel, maar kan helpen bij rate limiting

### Server Configuratie

- **`PORT`**: De poort waarop de server draait (standaard: 3001)
- **`DATABASE_PATH`**: Pad naar de SQLite database (standaard: `./data/database.sqlite`)
- **`FRONTEND_URL`**: URL van de frontend (standaard: `http://localhost:5173`)
- **`LANDING_URL`**: URL van de landing page (standaard: `http://localhost:3000`)

## Stap 3: Database Initialiseren

De database wordt automatisch aangemaakt wanneer je de server start. De database wordt opgeslagen in de `data/` folder.

Als je de database handmatig wilt initialiseren, start dan de server eenmalig:

```bash
npm start
```

Stop de server daarna (Ctrl+C) en start hem opnieuw in development mode.

## Stap 4: Server Starten

### Development Mode (met auto-reload)

```bash
npm run dev
```

De server draait nu op `http://localhost:3001` (of de poort die je in `.env` hebt ingesteld).

### Production Mode

```bash
npm start
```

## Stap 5: Testen

Test of de server werkt door naar `http://localhost:3001/api/guests` te gaan. Je zou een lege array `[]` moeten zien.

Je kunt ook de API testen met:

```bash
# Test de guests endpoint
curl http://localhost:3001/api/guests

# Of in PowerShell:
Invoke-WebRequest -Uri http://localhost:3001/api/guests
```

## API Endpoints

De backend biedt de volgende endpoints:

- `GET /api/guests` - Lijst van alle gasten
- `POST /api/guests` - Nieuwe gast toevoegen
- `GET /api/guests/:id` - Specifieke gast ophalen
- `PUT /api/guests/:id` - Gast bijwerken
- `DELETE /api/guests/:id` - Gast verwijderen
- `POST /api/import` - Excel bestand importeren
- `POST /api/research/:guestId` - Onderzoek starten voor een gast
- `GET /api/reports/:guestId` - Rapport genereren
- `GET /api/analytics` - Analytics data ophalen

## Troubleshooting

### Probleem: "Cannot find module 'better-sqlite3'"

**Oplossing**: Installeer dependencies opnieuw:
```bash
npm install
```

### Probleem: "EACCES: permission denied" bij database

**Oplossing**: Controleer of de `data/` folder schrijfrechten heeft.

### Probleem: OpenAI API errors

**Oplossing**: 
- Controleer of je API key correct is in `.env`
- Controleer of je account credits heeft op https://platform.openai.com/account/usage

### Probleem: CORS errors in de frontend

**Oplossing**: 
- Zorg dat `FRONTEND_URL` in `.env` overeenkomt met de URL waar je frontend draait
- Standaard is dit `http://localhost:5173` voor Vite

### Probleem: Port al in gebruik

**Oplossing**: 
- Wijzig `PORT` in `.env` naar een andere poort (bijv. 3002)
- Of stop het proces dat poort 3001 gebruikt

## Volgende Stappen

Nadat de backend draait, kun je:

1. De frontend starten (zie `frontend/README.md`)
2. Gasten toevoegen via de API of frontend
3. Onderzoek starten voor gasten
4. Rapporten genereren

## Support

Voor vragen of problemen, check de logs in `debug.log` of start de server met logging:

```bash
# Windows
.\start-with-logging.bat

# Of met PowerShell
.\start-debug.ps1
```

