const OpenAI = require('openai');

/**
 * Company Scraper service for guest research
 * Vercel-compatible: uses SerpAPI and standard fetch instead of Puppeteer
 */

class CompanyScraperService {
    constructor() {
        this.openai = null;
    }

    getOpenAI() {
        if (!this.openai && process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
        return this.openai;
    }

    /**
     * Search for company information using SerpAPI
     * Returns structured info and website URL
     * @param companyName - Company name to search
     * @param context - Optional context (guestCountry, guestCity) to filter results by region
     */
    async searchCompany(companyName, context = {}) {
        if (!process.env.SERPAPI_KEY || !companyName) {
            return null;
        }

        try {
            const { guestCountry, guestCity } = context;
            console.log(`🏢 Searching company info for: ${companyName}${guestCountry ? ` (context: ${guestCountry})` : ''}`);

            // Build a regional/context-aware search query
            let query = `"${companyName}" company`;
            if (guestCountry) {
                query += ` ${guestCountry}`;
            }
            if (guestCity) {
                query += ` ${guestCity}`;
            }
            query += ' headquarters industry';

            const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=8`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error('SerpAPI company search error:', data.error);
                return null;
            }

            // Blocklist: Aggregator and data-selling sites to exclude
            const blockedDomains = [
                'privco.com', 'zoominfo.com', 'crunchbase.com', 'dnb.com',
                'apollo.io', 'leadiq.com', 'lusha.com', 'rocketreach.co',
                'owler.com', 'craft.co', 'pitchbook.com', 'cbinsights.com',
                'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
                'yelp.com', 'tripadvisor.com', 'glassdoor.com', 'indeed.com',
                'bloomberg.com/profile', 'reuters.com/companies'
            ];

            // 1. Try to get info from knowledge_graph
            let info = {
                name: companyName,
                website: null,
                industry: null,
                description: null,
                size: null,
                headquarters: null,
                matchesContext: false,
                rawResults: data
            };

            if (data.knowledge_graph) {
                const kg = data.knowledge_graph;
                info.website = kg.website || kg.links?.find(l => l.title === 'Website')?.link;
                info.industry = kg.type || kg.industry;
                info.description = kg.description;
                info.headquarters = kg.headquarters;

                // Check if headquarters matches guest's region
                if (guestCountry && kg.headquarters) {
                    const hq = kg.headquarters.toLowerCase();
                    const country = guestCountry.toLowerCase();
                    // European context check
                    const europeanCountries = ['germany', 'france', 'netherlands', 'belgium', 'austria', 'switzerland', 'italy', 'spain', 'uk', 'united kingdom', 'portugal', 'poland', 'czech', 'denmark', 'sweden', 'norway', 'finland', 'ireland', 'luxembourg', 'monaco', 'duitsland', 'frankrijk', 'nederland', 'belgie', 'oostenrijk', 'zwitserland', 'italie', 'spanje'];
                    const isEuropeanContext = europeanCountries.some(c => country.includes(c));
                    const isEuropeanHQ = europeanCountries.some(c => hq.includes(c));

                    if (isEuropeanContext && !isEuropeanHQ && (hq.includes('usa') || hq.includes('united states') || hq.includes('california') || hq.includes('new york'))) {
                        console.log(`⚠️ Skipping non-European result for European context: HQ in ${kg.headquarters}`);
                        // Don't use this knowledge graph, try organic results instead
                        info.website = null;
                        info.description = null;
                    } else {
                        info.matchesContext = true;
                    }
                }

                if (kg.employees) info.size = kg.employees;
            }

            // 2. If no website from knowledge graph, try first organic result (filtered)
            if (!info.website && data.organic_results) {
                const results = data.organic_results;
                // Filter out blocked domains and aggregator sites
                const filteredResults = results.filter(r => {
                    if (!r.link) return false;
                    const link = r.link.toLowerCase();
                    return !blockedDomains.some(domain => link.includes(domain));
                });

                // For European context, prefer .de, .nl, .fr, .eu domains
                let bestResult = null;
                if (guestCountry) {
                    const countryLower = guestCountry.toLowerCase();
                    const europeanTLDs = ['.de', '.nl', '.fr', '.be', '.at', '.ch', '.it', '.es', '.uk', '.co.uk', '.eu', '.pt', '.pl', '.cz', '.dk', '.se', '.no', '.fi', '.ie', '.lu'];
                    bestResult = filteredResults.find(r =>
                        europeanTLDs.some(tld => r.link.toLowerCase().includes(tld))
                    );
                }

                // Fallback to first filtered result
                if (!bestResult && filteredResults.length > 0) {
                    bestResult = filteredResults[0];
                }

                if (bestResult) {
                    info.website = bestResult.link;
                    if (!info.description) info.description = bestResult.snippet;
                }
            }

            // 3. Use AI to consolidate information from snippets if Knowledge Graph was sparse
            const openai = this.getOpenAI();
            if (openai && data.organic_results) {
                const context = data.organic_results.slice(0, 3).map(r =>
                    `Title: ${r.title}\nSnippet: ${r.snippet}`
                ).join('\n\n');

                const prompt = `Based on these search results for "${companyName}", identify:
1. Exact industry
2. Estimated company size (Micro/Small/Medium/Large)
3. Brief description of what they do
4. Their main website URL

Search Results:
${context}

Return JSON: { "industry": string, "size": string, "description": string, "website": string }`;

                const aiResponse = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are an expert business analyst.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                });

                const consolidated = JSON.parse(aiResponse.choices[0].message.content);
                if (!info.industry) info.industry = consolidated.industry;
                if (!info.size) info.size = consolidated.size;
                if (!info.description) info.description = consolidated.description;
                if (!info.website) info.website = consolidated.website;
            }

            return info;
        } catch (error) {
            console.error('Company scraper error:', error);
            return null;
        }
    }

    /**
     * Optional: Fetch website content directly for deeper analysis (without browser)
     */
    async scrapeWebsite(url) {
        if (!url) return null;

        try {
            console.log(`🌐 Fetching website content: ${url}`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                redirect: 'follow',
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) return null;

            const html = await response.text();

            // Simple text extraction (strip script/style tags and then basic HTML tags)
            const cleanText = html
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 5000); // Send first 5k chars to AI

            const openai = this.getOpenAI();
            if (openai && cleanText.length > 100) {
                const prompt = `Analyze this company website content and provide a professional summary:
${cleanText}

Return JSON:
{
  "mission": "Core mission or value proposition",
  "products_services": ["list", "of", "main", "offerings"],
  "target_market": "Who they serve",
  "tone": "Professional/Innovative/Formal/etc",
  "key_executives": ["mentions of leadership if found"]
}`;

                const aiResponse = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a business research assistant.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                });

                return JSON.parse(aiResponse.choices[0].message.content);
            }

            return null;
        } catch (error) {
            console.error(`Error scraping website ${url}:`, error.message);
            return null;
        }
    }
}

module.exports = new CompanyScraperService();
