const OpenAI = require('openai');
const braveSearch = require('./braveSearch');
const duckDuckGo = require('./duckDuckGo');

/**
 * Company Scraper service for guest research
 * Uses DuckDuckGo and Brave for reliable web searching and deep scraping
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
        if (!companyName) {
            return null;
        }

        try {
            const { guestCountry, guestCity } = context;
            console.log(`🏢 Searching company info for: ${companyName}${guestCountry ? ` (context: ${guestCountry})` : ''}`);

            const query = `"${companyName}" company ${guestCountry || ''} ${guestCity || ''} headquarters industry`.trim();

            // DuckDuckGo first (FREE)
            let results = await duckDuckGo.search(query);
            if (results.length === 0) {
                console.log(`🔍 Falling back to Brave for company search: ${companyName}`);
                results = await braveSearch.search(query, 5);
            }

            if (results.length === 0) {
                console.log(`❌ No company info found for: ${companyName}`);
                return null;
            }

            // Blocklist: Aggregator and data-selling sites to exclude
            const blockedDomains = [
                // Data aggregators
                'privco.com', 'zoominfo.com', 'crunchbase.com', 'dnb.com',
                'apollo.io', 'leadiq.com', 'lusha.com', 'rocketreach.co',
                'owler.com', 'craft.co', 'pitchbook.com', 'cbinsights.com',
                // Credit/Financial data sites (junk for our purposes)
                'creditsafe.com', 'creditriskmonitor.com', 'kompass.com',
                // Generic directories
                'linkedin.com', 'facebook.com', 'twitter.com', 'x.com',
                'yellowpages.', 'yelp.com', 'tripadvisor.com',
                'glassdoor.com', 'indeed.com', 'monster.com',
                // Placeholder/unknown domains
                'unknowncompany.com', 'example.com', 'placeholder.com',
                // Other aggregators
                'opencorporates.com', 'companieshouse.gov.uk', 'kvk.nl',
                'bloomberg.com/profile', 'reuters.com/companies'
            ];

            // Filter for the most representative result (preferring official website)
            const filteredResults = results.filter(r => {
                const link = r.link.toLowerCase();
                return !blockedDomains.some(domain => link.includes(domain));
            });

            const bestResult = filteredResults[0] || results[0];

            let info = {
                name: companyName,
                website: bestResult.link,
                industry: null,
                description: bestResult.snippet,
                size: null,
                headquarters: null,
                rawResults: results
            };

            // Use AI to consolidate information from snippets
            const openai = this.getOpenAI();
            if (openai) {
                const contextText = results.slice(0, 3).map(r =>
                    `Title: ${r.title}\nSnippet: ${r.snippet}`
                ).join('\n\n');

                const prompt = `Based on these search results for "${companyName}", identify:
1. Exact industry
2. Estimated company size (Micro/Small/Medium/Large)
3. Brief description of what they do
4. Their main website URL

Search Results:
${contextText}

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
                info.industry = consolidated.industry || info.industry;
                info.size = consolidated.size || info.size;
                info.description = consolidated.description || info.description;
                info.website = consolidated.website || info.website;
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
            console.log(`🏢 Deep scraping company website: ${url}`);
            const text = await duckDuckGo.fetchPageContent(url, 5000);

            if (!text || text.length < 200) {
                console.log('⚠️ Website content too short or failed to fetch');
                return null;
            }

            const openai = this.getOpenAI();
            if (!openai) return null;

            const prompt = `Extract structured business info from this company website text:
            
            URL: ${url}
            
            TEXT:
            ${text.substring(0, 4000)}
            
            Return JSON:
            {
                "mission": "Brief company mission/vision",
                "products_services": ["service 1", "service 2", ...],
                "target_market": "Who are their customers?",
                "key_people": ["Founders/Leaders mentioned"],
                "tone_of_voice": "Professional/Creative/Traditional/etc"
            }`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a business analyst.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error('Scrape website error:', error);
            return null;
        }
    }
}

module.exports = new CompanyScraperService();
