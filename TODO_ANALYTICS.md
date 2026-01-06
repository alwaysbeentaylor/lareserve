# 🔔 TODO - Analytics Dashboard afmaken

**Gemaakt op**: 3 januari 2026

## Acties nodig:

### 1. Google Analytics ID instellen
Open `landing/components/AnalyticsProvider.jsx` en vervang op regel 8:
```javascript
const GA_MEASUREMENT_ID = 'G-JOUW_GA4_ID';
```

Of maak een `.env.local` bestand in de `landing` folder:
```
NEXT_PUBLIC_GA_ID=G-JOUW_GA4_ID
```

### 2. Backend CORS updaten voor productie
Voeg toe aan `backend/.env`:
```
LANDING_URL=https://jouw-landing-url.vercel.app
```

### 3. Backend deployen
Push naar GitHub zodat Render de nieuwe analytics endpoints activeert.

### 4. Dashboard testen
Bezoek: https://jouw-site.vercel.app/dashboard

---

> Verwijder dit bestand als je klaar bent!
