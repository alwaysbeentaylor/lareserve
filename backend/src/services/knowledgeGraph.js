/**
 * Google Knowledge Graph Service
 * Detects famous people and returns structured Wikipedia-level data
 * Free tier: 100,000 calls/month
 */

class KnowledgeGraphService {
    constructor() {
        this.apiKey = null;
        this.cache = new Map(); // Simple in-memory cache
    }

    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY;
        }
        return this.apiKey;
    }

    /**
     * Search for a person in Google Knowledge Graph
     * @param {string} fullName - Full name of the person
     * @returns {Object|null} - Knowledge Graph data or null if not found/not famous
     */
    async searchPerson(fullName) {
        // TEMPORARILY DISABLED: To avoid API Key errors
        // console.log(`⚠️ Knowledge Graph disabled for: ${fullName}`);
        return null;

        /*
        const apiKey = this.getApiKey();
        if (!apiKey) {
            console.log('⚠️ Knowledge Graph API key not configured');
            return null;
        }

        // Check cache first
        const cacheKey = fullName.toLowerCase().trim();
        if (this.cache.has(cacheKey)) {
            console.log(`📚 Knowledge Graph cache hit for: ${fullName}`);
            return this.cache.get(cacheKey);
        }

        try {
            const url = new URL('https://kgsearch.googleapis.com/v1/entities:search');
            url.searchParams.set('query', fullName);
            url.searchParams.set('types', 'Person');
            url.searchParams.set('limit', '5');
            url.searchParams.set('indent', 'true');
            url.searchParams.set('key', apiKey);

            console.log(`🔍 Knowledge Graph search: ${fullName}`);

            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.error) {
                console.error('Knowledge Graph API error:', data.error);
                return null;
            }

            if (!data.itemListElement || data.itemListElement.length === 0) {
                console.log(`📚 Knowledge Graph: ${fullName} not found (not famous)`);
                this.cache.set(cacheKey, null);
                return null;
            }

            // Process results - find best match
            const results = data.itemListElement
                .map(item => this.parseResult(item, fullName))
                .filter(r => r !== null && r.resultScore > 50);

            if (results.length === 0) {
                console.log(`📚 Knowledge Graph: ${fullName} - no confident match`);
                this.cache.set(cacheKey, null);
                return null;
            }

            // Return best match
            const best = results[0];
            console.log(`📚 Knowledge Graph found: ${best.name} (${best.types?.join(', ')}) - Score: ${best.resultScore}`);

            this.cache.set(cacheKey, best);
            return best;

        } catch (error) {
            console.error('Knowledge Graph search error:', error);
            return null;
        }
        }
        */
    }

    /**
     * Parse a Knowledge Graph result into a clean object
     */
    parseResult(item, searchName) {
        const result = item.result;
        const score = item.resultScore || 0;

        if (!result) return null;

        // Check if name reasonably matches
        const resultName = (result.name || '').toLowerCase();
        const searchParts = searchName.toLowerCase().split(/\s+/);
        const matchesName = searchParts.some(part =>
            part.length > 2 && resultName.includes(part)
        );

        if (!matchesName && score < 100) {
            return null;
        }

        // Extract types (e.g., "Person", "Musician", "Entrepreneur")
        const types = result['@type'] || [];
        const typeArray = Array.isArray(types) ? types : [types];

        // Get category from types
        let category = null;
        if (typeArray.some(t => ['Musician', 'MusicGroup', 'Singer'].includes(t))) {
            category = 'entertainment';
        } else if (typeArray.some(t => ['Athlete', 'SportsTeam'].includes(t))) {
            category = 'sports';
        } else if (typeArray.some(t => ['Politician', 'GovernmentOrganization'].includes(t))) {
            category = 'politics';
        } else if (typeArray.some(t => ['Actor', 'Director', 'TVPersonality'].includes(t))) {
            category = 'entertainment';
        } else if (typeArray.some(t => ['BusinessPerson', 'Organization'].includes(t))) {
            category = 'business';
        }

        return {
            isKnown: true,
            resultScore: score,
            name: result.name,
            description: result.description || null,
            detailedDescription: result.detailedDescription?.articleBody || null,
            wikipediaUrl: result.detailedDescription?.url || null,
            image: result.image?.contentUrl || null,
            types: typeArray.filter(t => t !== 'Thing'),
            category: category,
            url: result.url || null
        };
    }

    /**
     * Check if a person is famous/notable based on Knowledge Graph
     * Returns enhanced celebrity info if found
     */
    async detectCelebrity(fullName) {
        const kgResult = await this.searchPerson(fullName);

        if (!kgResult) {
            return {
                isCelebrity: false,
                source: 'knowledge_graph',
                confidence: 0,
                category: null,
                knownFor: null
            };
        }

        // High score in Knowledge Graph = definitely famous
        const confidence = Math.min(kgResult.resultScore / 1000, 1);

        return {
            isCelebrity: true,
            source: 'knowledge_graph',
            confidence: confidence,
            category: kgResult.category,
            knownFor: kgResult.description,
            detailedDescription: kgResult.detailedDescription,
            wikipediaUrl: kgResult.wikipediaUrl,
            officialImage: kgResult.image,
            types: kgResult.types
        };
    }

    /**
     * Clear cache (useful for testing)
     */
    clearCache() {
        this.cache.clear();
    }
}

module.exports = new KnowledgeGraphService();
