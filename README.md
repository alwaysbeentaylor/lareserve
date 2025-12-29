# La Reserve - VIP Guest Research Tool

Een VIP-gastonderzoekstool voor luxe hotels. Automatisch LinkedIn-profielen zoeken en VIP-scores berekenen.

## Features

- 🔍 LinkedIn profiel zoeken via SerpAPI
- 🤖 AI-gebaseerde VIP score berekening (OpenAI)
- 📊 Bedrijfsgrootte en eigenaar/werknemer status
- 👤 Gastbeheer met CRUD operaties
- 📄 PDF export van gastprofielen

## Tech Stack

- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + Vite
- **AI**: OpenAI GPT-4o-mini
- **Search**: SerpAPI (LinkedIn via Google)

## Installatie

```bash
# Clone repository
git clone https://github.com/yourusername/la-reserve.git
cd la-reserve

# Backend setup
cd backend
npm install
cp .env.example .env
# Vul je API keys in .env

# Frontend setup
cd ../frontend
npm install
```

## Environment Variables

Maak een `.env` bestand in de backend folder:

```env
PORT=3001
DATABASE_PATH=./data/database.sqlite
OPENAI_API_KEY=your_openai_key
SERPAPI_KEY=your_serpapi_key
```

## Development

```bash
# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 5173)
cd frontend && npm run dev
```

## Deployment

### Vercel

1. Push naar GitHub
2. Importeer in Vercel
3. Voeg environment variables toe
4. Deploy

## API Endpoints

- `GET /api/guests` - Lijst van gasten
- `POST /api/guests` - Nieuwe gast toevoegen
- `POST /api/research/:guestId` - Start onderzoek
- `PUT /api/research/:guestId/select-linkedin` - Selecteer LinkedIn profiel

## License

MIT
