/**
 * Brave Search API Service
 * 2000 free requests per month
 * Reference: https://api.search.brave.com/app/documentation/web-search/get-started
 */

class BraveSearchService {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://api.search.brave.com/res/v1/web/search';
        this.lastRequestTime = 0;
        this.minInterval = 100; // 100ms = 10 requests per second (Safe buffer for 20req/s key)
        this.requestQueue = Promise.resolve();
    }

    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = process.env.BRAVE_SEARCH_API_KEY || null;
        }
        return this.apiKey;
    }

    isConfigured() {
        return !!this.getApiKey();
    }

    async search(query, count = 10, country = null) {
        // Use a queue to strictly respect rate limits globally
        return this.requestQueue = this.requestQueue.then(async () => {
            const now = Date.now();
            const timeSinceLast = now - this.lastRequestTime;
            if (timeSinceLast < this.minInterval) {
                await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLast));
            }
            this.lastRequestTime = Date.now();

            if (!this.isConfigured()) {
                console.warn('⚠️ Brave Search API Key not configured');
                return [];
            }

            console.log(`🦁 Brave Search: "${query}"`);

            try {
                const params = new URLSearchParams({
                    q: query,
                    count: count.toString(),
                    safesearch: 'off'
                });

                // Add country context if provided (e.g. 'BE', 'NL')
                if (country) {
                    params.append('country', country.toUpperCase());
                }

                const response = await fetch(`${this.baseUrl}?${params}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip',
                        'X-Subscription-Token': this.getApiKey()
                    },
                    signal: AbortSignal.timeout(10000)
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        console.error('🦁 Brave Search: Rate limit exceeded (1 req/sec)');
                    } else if (response.status === 403) {
                        console.error('🦁 Brave Search: Invalid API key or quota exhausted');
                    }
                    throw new Error(`Brave Search error: ${response.status}`);
                }

                const data = await response.json();

                return (data.web?.results || []).map(r => ({
                    link: r.url,
                    title: r.title,
                    snippet: r.description,
                    source: 'brave'
                }));

            } catch (error) {
                console.error('🦁 Brave Search error:', error.message);
                return [];
            }
        });
    }

    /**
     * Multi-query comprehensive search for a guest
     */
    async multiSearch(guest) {
        const name = guest.full_name;
        const country = guest.country || '';
        const company = guest.company || '';

        const queries = [
            `"${name}" ${country} linkedin`.trim(),
            `"${name}" ${company} professional profile`.trim(),
            `"${name}" current role`.trim()
        ];

        console.log(`🚀 Brave Search: Running ${queries.length} searches for ${name}...`);

        const allResults = [];
        const seenUrls = new Set();

        for (const query of queries) {
            try {
                // search() method now handles its own throttling
                const results = await this.search(query, 5);
                for (const result of results) {
                    if (!seenUrls.has(result.link)) {
                        seenUrls.add(result.link);
                        allResults.push(result);
                    }
                }
            } catch (error) {
                console.error(`Brave query failed: ${query}`, error.message);
            }
        }

        // If no results found with exact quotes, try fuzzy search (no quotes) to handle typos
        if (allResults.length === 0) {
            console.log(`🦁 Brave Search: No exact match, trying fuzzy search for ${name}...`);
            const fuzzyQueries = [
                `${name} ${country} linkedin`,
                `${name} ${company} profile`
            ];

            for (const query of fuzzyQueries) {
                try {
                    const results = await this.search(query, 5);
                    for (const result of results) {
                        if (!seenUrls.has(result.link)) {
                            seenUrls.add(result.link);
                            allResults.push(result);
                        }
                    }
                } catch (error) {
                    console.error(`Brave fuzzy query failed: ${query}`, error.message);
                }
            }
        }

        return allResults;
    }
}

module.exports = new BraveSearchService();
