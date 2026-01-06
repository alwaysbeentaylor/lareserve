const OpenAI = require('openai');
const googleSearch = require('./googleSearch');

/**
 * Company Scraper service for guest research
 * Uses Google Search and Brave for reliable web searching
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

        // VALIDATION: Skip invalid/placeholder company names
        const invalidCompanyNames = [
            'unknown', 'onbekend', 'null', 'n/a', 'none', 'not found',
            'niet gevonden', 'undefined', '-', '', 'company', 'bedrijf',
            'employer', 'werkgever', 'organization', 'organisatie'
        ];

        const normalizedName = companyName.toLowerCase().trim();
        if (invalidCompanyNames.includes(normalizedName) || normalizedName.length < 2) {
            console.log(`⏭️ Skipping company search - invalid name: "${companyName}"`);
            return null;
        }

        try {
            const { guestCountry, guestCity } = context;
            console.log(`🏢 Searching company info for: ${companyName}${guestCountry ? ` (context: ${guestCountry})` : ''}`);

            // Search for official website - avoid LinkedIn/social media
            const query = `"${companyName}" ${guestCountry || ''} ${guestCity || ''} official website -linkedin -facebook -twitter`.trim();

            // Google Search only (avoid Brave fallback to keep flow consistent)
            const results = await googleSearch.search(query, 10);

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
                'unknown', 'not found', 'n/a', 'null',
                // Other aggregators
                'opencorporates.com', 'companieshouse.gov.uk', 'kvk.nl',
                'bloomberg.com/profile', 'reuters.com/companies'
            ];

            // Filter for the most representative result (preferring official website)
            const filteredResults = results.filter(r => {
                if (!r.link) return false;
                const link = r.link.toLowerCase();
                return !blockedDomains.some(domain => link.includes(domain));
            });

            // Prefer filtered results, but if none exist, reject entirely
            if (filteredResults.length === 0) {
                console.log(`⚠️ All results were blocked domains for: ${companyName}`);
                console.log(`📋 Results were: ${results.map(r => r.link).join(', ')}`);
                return null;
            }

            const bestResult = filteredResults[0];

            let info = {
                name: companyName,
                website: bestResult.link || null,
                industry: null,
                description: bestResult.snippet || '',
                size: null,
                headquarters: null,
                rawResults: results
            };

            // Use AI to consolidate ALL information from snippets (no scraping needed)
            const openai = this.getOpenAI();
            if (openai) {
                const contextText = results.slice(0, 5).map(r =>
                    `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`
                ).join('\n\n');

                const prompt = `Based on these search results for "${companyName}", extract ALL available information:
1. Exact industry
2. Estimated company size (Micro/Small/Medium/Large)
3. Brief description of what they do
4. Their main website URL (extract from the URLs if visible)
5. Mission/vision (if mentioned in snippets)
6. Products or services (if mentioned)
7. Target market/customers (if mentioned)

Search Results:
${contextText}

CRITICAL RULES:
1. Only return info that is CLEARLY stated in the snippets - DO NOT make up information
2. Website URL must match the company name logically
3. If info is not found, return null for that field
4. Extract as much as possible from snippets - they often contain rich information

Return JSON: { 
    "industry": string|null, 
    "size": string|null, 
    "description": string|null, 
    "website": string|null,
    "mission": string|null,
    "products_services": [string]|null,
    "target_market": string|null
}`;

                const aiResponse = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are an expert business analyst. Extract maximum factual information from search snippets. Never hallucinate.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                });

                const consolidated = JSON.parse(aiResponse.choices[0].message.content);
                info.industry = consolidated.industry || info.industry;
                info.size = consolidated.size || info.size;
                info.description = consolidated.description || info.description;
                
                // Add deep_info directly from snippets (no scraping needed!)
                if (consolidated.mission || consolidated.products_services || consolidated.target_market) {
                    info.deep_info = {
                        mission: consolidated.mission || null,
                        products_services: consolidated.products_services || [],
                        target_market: consolidated.target_market || null
                    };
                    console.log(`✅ Extracted company details from snippets (no scraping needed)`);
                }

                // Validate website URL - reject placeholders and mismatched domains
                const aiWebsite = consolidated.website;

                // Reject bad URLs immediately
                const rejectPatterns = [
                    'null', 'n/a', 'unknown', 'notfound', 'example.com', 'placeholder',
                    'linkedin.com', 'wikipedia.org', 'facebook.com', 'twitter.com',
                    'instagram.com', 'youtube.com', 'tripadvisor.', 'booking.com',
                    'expedia.com', 'hotels.com', 'yelp.com', 'glassdoor.com'
                ];

                const isRejectedUrl = !aiWebsite ||
                    rejectPatterns.some(pattern => aiWebsite.toLowerCase().includes(pattern));

                if (!isRejectedUrl) {
                    // Extract domain for validation
                    const domain = aiWebsite.toLowerCase()
                        .replace(/^https?:\/\//, '')
                        .replace(/^www\./, '')
                        .split('/')[0];

                    // Simple word match first (for most cases)
                    const companyWords = companyName.toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '')
                        .split(/\s+/)
                        .filter(word => word.length > 2);

                    const domainMatchesCompany = companyWords.some(word => domain.includes(word));

                    if (domainMatchesCompany) {
                        console.log(`✅ Website domain "${domain}" matches company "${companyName}"`);
                        info.website = aiWebsite;
                    } else {
                        // For abbreviations (like AH for Albert Heijn), trust the AI's judgment
                        // if it came from a search specifically for this company
                        console.log(`🤔 Website "${domain}" might be abbreviation for "${companyName}" - accepting AI choice`);
                        info.website = aiWebsite;
                    }
                } else {
                    console.log(`❌ Rejected invalid/blocked website: ${aiWebsite}`);
                }
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
            const text = await googleSearch.fetchPageContent(url, 5000);

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
