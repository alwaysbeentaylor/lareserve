# 🔍 Complete Search Flow - Stappen Analyse

## Tijdverdeling per stap (ongeveer 206 seconden totaal)

### **PHASE 1: ULTIMATE FINDER (searchGuest) - ~167 seconden**

#### **STEP 1: Knowledge Graph / Celebrity Check** ⏱️ ~2-5 sec
- ✅ **Snel** - GPT API call
- 💡 **Kan versnellen**: Skip als niet nodig
- 📝 **Wat het doet**: Checkt of persoon een bekende celebrity is

#### **STEP 2: AI Query Generation** ⏱️ ~3-5 sec
- ✅ **Snel** - OpenAI API call
- 💡 **Kan versnellen**: Minder queries genereren (nu 51 queries)
- 📝 **Wat het doet**: Genereert 51 zoekqueries voor Google

#### **STEP 3: Google Searches** ⏱️ ~120-150 sec ⚠️ **GROOTSTE BOTTLENECK**
- ❌ **LANGZAAM** - 8 queries parallel, maar met delays
- 💡 **Kan versnellen**: 
  - Delay verlagen (nu 0.5s, kan naar 0.2s)
  - Minder queries (nu 8, kan naar 5)
  - Early exit als LinkedIn gevonden
- 📝 **Wat het doet**: 
  - Voert 8 Google searches uit (parallel)
  - Elke search heeft 0.5s delay
  - reCAPTCHA oplossen kan 30-60 sec duren

#### **STEP 4: Platform Extraction** ⏱️ ~0.1 sec
- ✅ **Zeer snel** - Alleen filtering
- 📝 **Wat het doet**: Categoriseert resultaten (LinkedIn, Facebook, etc.)

#### **STEP 5: LinkedIn AI Matching** ⏱️ ~3-5 sec
- ✅ **Snel** - OpenAI API call
- 📝 **Wat het doet**: AI selecteert beste LinkedIn match

#### **STEP 6: Deep Scrape LinkedIn (optioneel)** ⏱️ ~5-10 sec
- ⚠️ **Alleen als job title/company ontbreekt**
- 💡 **Kan weglaten**: Skip als we al genoeg info hebben
- 📝 **Wat het doet**: Scrapt LinkedIn pagina voor extra info

---

### **PHASE 2: FINALIZE RESEARCH (finalizeResearch) - ~40 seconden**

#### **STEP 7: Email Domain Analysis** ⏱️ ~3-5 sec
- ⚠️ **Alleen als email beschikbaar**
- 💡 **Kan weglaten**: Niet kritisch voor basis info
- 📝 **Wat het doet**: Analyseert email domein (bedrijfsgrootte, etc.)

#### **STEP 8: Social Media Search** ⏱️ ~10-20 sec
- ⚠️ **Alleen voor celebrities/hoge VIP scores**
- 💡 **Kan weglaten**: Voor normale business guests wordt dit al geskipt
- 📝 **Wat het doet**: Zoekt Instagram/Twitter (alleen voor VIPs)

#### **STEP 9: News Search** ⏱️ ~5-10 sec
- ⚠️ **Altijd uitgevoerd**
- 💡 **Kan weglaten**: Niet kritisch voor basis info
- 📝 **Wat het doet**: Zoekt nieuwsartikelen over persoon

#### **STEP 10: Company Research** ⏱️ ~10-15 sec
- ⚠️ **Alleen als company bekend is**
- 💡 **Kan weglaten**: Niet nodig voor basis LinkedIn match
- 📝 **Wat het doet**: 
  - Zoekt bedrijfsinfo
  - Scrapt bedrijfswebsite (optioneel)

#### **STEP 11: AI Analysis** ⏱️ ~5-10 sec
- ✅ **Snel** - OpenAI API call
- 💡 **Kan versnellen**: Simpelere prompt
- 📝 **Wat het doet**: Genereert VIP score en volledig rapport

#### **STEP 12: Photo Selection** ⏱️ ~0.1 sec
- ✅ **Zeer snel** - Alleen logica
- 📝 **Wat het doet**: Selecteert beste profielfoto

---

## 🚀 Optimalisatie Suggesties voor 20 Seconden

### **OPTIE 1: Aggressief Minimalistisch (Focus op LinkedIn alleen)**
1. ✅ Skip Knowledge Graph (bespaar 2-5s)
2. ✅ Minder queries genereren: 5-10 in plaats van 51 (bespaar 1-2s)
3. ✅ **Alleen LinkedIn queries uitvoeren**: 2-3 queries max (bespaar 80-100s)
4. ✅ Skip deep scrape LinkedIn (bespaar 5-10s)
5. ✅ Skip email domain analysis (bespaar 3-5s)
6. ✅ Skip news search (bespaar 5-10s)
7. ✅ Skip company research (bespaar 10-15s)
8. ✅ Simpelere AI analysis (bespaar 2-3s)

**Totaal: ~15-20 seconden** ⚡

### **OPTIE 2: Balanced (LinkedIn + Basis Info)**
1. ✅ Skip Knowledge Graph (bespaar 2-5s)
2. ✅ Minder queries: 10 in plaats van 51 (bespaar 1-2s)
3. ✅ **Focus op priority queries**: LinkedIn + name+company (bespaar 60-80s)
4. ✅ Skip deep scrape LinkedIn (bespaar 5-10s)
5. ✅ Skip email domain analysis (bespaar 3-5s)
6. ✅ Skip news search (bespaar 5-10s)
7. ✅ Skip company research (bespaar 10-15s)
8. ✅ Simpelere AI analysis (bespaar 2-3s)

**Totaal: ~20-30 seconden** ⚡

### **OPTIE 3: Ultra-Fast Mode (Alleen Essentieel)**
1. ✅ Skip Knowledge Graph
2. ✅ **Alleen 2-3 LinkedIn queries** (parallel)
3. ✅ Skip alles behalve LinkedIn matching
4. ✅ Skip AI analysis (gebruik alleen snippet data)

**Totaal: ~10-15 seconden** ⚡⚡⚡

---

## 📊 Wat is echt nodig?

### **Voor Basis Functionaliteit:**
- ✅ LinkedIn profiel vinden
- ✅ Job title en company extracten
- ✅ Basis matching

### **Nice to Have (maar niet kritisch):**
- ⚠️ Company research
- ⚠️ News articles
- ⚠️ Email domain analysis
- ⚠️ Social media (voor business guests)
- ⚠️ Deep scraping
- ⚠️ Volledig AI rapport

---

## 🎯 Aanbeveling

**Implementeer "FAST MODE" met configuratie:**
- Alleen LinkedIn queries (2-3 queries)
- Skip company research
- Skip news search
- Skip email analysis
- Simpelere AI analysis
- Early exit zodra LinkedIn gevonden

**Verwachte tijd: 15-25 seconden** ⚡


