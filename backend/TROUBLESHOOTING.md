# Troubleshooting - Research vindt niets

Als de research functionaliteit niets vindt (geen LinkedIn, geen naam, niets), controleer het volgende:

## 1. Environment Variables op Render

Zorg dat de volgende environment variables zijn ingesteld in je Render dashboard:

### Verplicht:
- ✅ `OPENAI_API_KEY` - Voor AI analyse en VIP scoring
- ✅ `TWO_CAPTCHA_API_KEY` - **KRITIEK** voor Google Search functionaliteit

### Optioneel (aanbevolen):
- `BRAVE_SEARCH_API_KEY` - Alternatief voor Google Search
- `GOOGLE_KNOWLEDGE_GRAPH_API_KEY` - Voor bedrijfsinformatie
- `PROXY_URL` - Voor web scraping (kan helpen bij rate limiting)

## 2. 2Captcha API Key Controleren

De Google Search service gebruikt 2Captcha om reCAPTCHA's op te lossen. Zonder een werkende API key zal Google Search **altijd falen**.

### Stappen om te controleren:

1. **Check of de key is ingesteld:**
   - Ga naar je Render dashboard
   - Klik op je backend service
   - Ga naar "Environment"
   - Controleer of `TWO_CAPTCHA_API_KEY` is ingesteld

2. **Test je 2Captcha key:**
   ```bash
   # In je backend folder, voer uit:
   node test-apis.js
   ```
   Dit test alle API keys inclusief 2Captcha.

3. **Check je 2Captcha balance:**
   - Ga naar https://2captcha.com
   - Log in op je account
   - Check of je credits hebt
   - Zonder credits werkt de API niet

## 3. Render Logs Controleren

1. Ga naar je Render dashboard
2. Klik op je backend service
3. Ga naar "Logs"
4. Zoek naar de volgende error messages:

### Als je ziet:
- `❌ CRITICAL: TWO_CAPTCHA_API_KEY not set!`
  → **Oplossing:** Voeg `TWO_CAPTCHA_API_KEY` toe in Render environment variables

- `🔒 Google reCAPTCHA detected!`
  → Dit is normaal, maar als het blijft falen:
  - Check of je 2Captcha balance voldoende is
  - Check of je 2Captcha API key correct is

- `⚠️ No results found for query`
  → Dit betekent dat Google Search geen resultaten teruggeeft. Mogelijke oorzaken:
  - Captcha niet opgelost
  - Proxy problemen
  - Rate limiting

- `❌ CRITICAL: No search results found at all!`
  → Dit betekent dat alle search queries faalden. Check:
  1. TWO_CAPTCHA_API_KEY is ingesteld
  2. 2Captcha balance is voldoende
  3. Network connectivity (Render kan internet bereiken)

## 4. Test de API Direct

Test of de research endpoint werkt:

```bash
# Vervang YOUR_RENDER_URL met je Render backend URL
curl -X POST https://YOUR_RENDER_URL/api/research/1 \
  -H "Content-Type: application/json" \
  -d '{"forceRefresh": true}'
```

Als dit een error geeft, check de error message in de response.

## 5. Veelvoorkomende Problemen

### Probleem: "Research timeout"
**Oorzaak:** De research duurt langer dan 180 seconden
**Oplossing:** 
- Dit kan gebeuren als Google Search traag is of captcha's niet worden opgelost
- Check je 2Captcha balance
- Probeer opnieuw

### Probleem: "No results found"
**Oorzaak:** Google Search faalt of vindt niets
**Oplossing:**
1. Check Render logs voor specifieke errors
2. Verify TWO_CAPTCHA_API_KEY is correct
3. Check 2Captcha balance
4. Als de gast echt niet online te vinden is, is dit normaal

### Probleem: "2Captcha API key probleem"
**Oorzaak:** TWO_CAPTCHA_API_KEY niet ingesteld of ongeldig
**Oplossing:**
1. Ga naar Render → Environment Variables
2. Voeg toe: `TWO_CAPTCHA_API_KEY` = je 2Captcha API key
3. Herstart je Render service

## 6. Debug Mode

Voor meer gedetailleerde logging, check de Render logs tijdens een research:

1. Start een research via de frontend
2. Ga direct naar Render logs
3. Zoek naar:
   - `🚀 ========== FAST FINDER:` - Start van research
   - `🔍 Step 1: Building priority search queries...` - Queries worden gebouwd
   - `🔎 Query X/Y:` - Elke query die wordt uitgevoerd
   - `📊 Query returned X results` - Aantal resultaten per query
   - `❌ CRITICAL:` - Kritieke errors

## 7. Alternatieve Oplossingen

Als Google Search niet werkt, overweeg:

1. **Brave Search API gebruiken:**
   - Voeg `BRAVE_SEARCH_API_KEY` toe
   - De service zal automatisch Brave Search gebruiken als fallback

2. **Proxy gebruiken:**
   - Voeg `PROXY_URL` toe voor betere rate limiting
   - Format: `http://username:password@proxy.example.com:port`

## 8. Contact

Als niets werkt na het controleren van bovenstaande punten:

1. Check Render logs voor specifieke error messages
2. Test je API keys met `node test-apis.js`
3. Verify dat alle environment variables correct zijn ingesteld
4. Check of je Render service genoeg resources heeft (memory, CPU)

## Quick Checklist

- [ ] `OPENAI_API_KEY` is ingesteld in Render
- [ ] `TWO_CAPTCHA_API_KEY` is ingesteld in Render
- [ ] 2Captcha account heeft credits
- [ ] Render logs tonen geen kritieke errors
- [ ] Backend service draait (check health endpoint: `/api/health`)
- [ ] Network connectivity werkt (Render kan internet bereiken)

