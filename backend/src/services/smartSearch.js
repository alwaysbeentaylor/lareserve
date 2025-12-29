const OpenAI = require('openai');

/**
 * Smart Search service for guest research
 * Focuses on LinkedIn as primary source via SerpAPI
 */

class SmartSearchService {
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
     * Search for LinkedIn profile using SerpAPI (Google Search)
     * Returns all candidates for manual selection if multiple found
     */
    async searchLinkedIn(guest) {
        if (!process.env.SERPAPI_KEY) {
            console.log('SerpAPI not configured, skipping LinkedIn search');
            return { candidates: [], bestMatch: null, needsReview: false };
        }

        try {
            // Build search query for LinkedIn
            let query = `site:linkedin.com/in "${guest.full_name}"`;
            if (guest.company) query += ` "${guest.company}"`;
            if (guest.country) query += ` ${guest.country}`;

            const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=5`;

            console.log(`🔍 LinkedIn search for: ${guest.full_name}`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error('SerpAPI error:', data.error);
                return { candidates: [], bestMatch: null, needsReview: false };
            }

            // Find ALL LinkedIn profiles in organic results
            const linkedinResults = data.organic_results?.filter(r =>
                r.link?.includes('linkedin.com/in/')
            ) || [];

            const candidates = linkedinResults.map((result, index) => {
                // Extract job title from title (format: "Name - Title - Company | LinkedIn")
                let jobTitle = null;
                let company = null;
                const titleMatch = result.title?.match(/[-–—]\s*(.+?)(?:\s*[-–—]\s*(.+?))?(?:\s*\||\s*-\s*LinkedIn|$)/);
                if (titleMatch) {
                    jobTitle = titleMatch[1]?.trim();
                    company = titleMatch[2]?.trim();
                }

                return {
                    id: index,
                    url: result.link,
                    title: result.title,
                    snippet: result.snippet,
                    thumbnail: result.thumbnail || null,
                    jobTitle: jobTitle,
                    company: company
                };
            });

            console.log(`📋 Found ${candidates.length} LinkedIn candidate(s)`);

            if (candidates.length === 0) {
                return { candidates: [], bestMatch: null, needsReview: false };
            }

            // If only 1 candidate, use it. Otherwise mark for review
            const needsReview = candidates.length > 1;
            const bestMatch = candidates[0];

            if (needsReview) {
                console.log(`⚠️ Multiple LinkedIn profiles found - manual review needed`);
            } else {
                console.log(`✅ Single LinkedIn match: ${bestMatch.url}`);
            }

            return { candidates, bestMatch, needsReview };
        } catch (error) {
            console.error('SerpAPI LinkedIn search error:', error);
            return { candidates: [], bestMatch: null, needsReview: false };
        }
    }

    /**
     * Use OpenAI to analyze LinkedIn info and calculate VIP score
     */
    async analyzeWithAI(guest, linkedinInfo) {
        const openai = this.getOpenAI();
        if (!openai) {
            console.log('OpenAI not configured, using basic scoring');
            return this.basicAnalysis(linkedinInfo);
        }

        try {
            // Build context from LinkedIn
            const linkedinContext = linkedinInfo.bestMatch ? `
LinkedIn profiel gevonden:
- Titel: ${linkedinInfo.bestMatch.title}
- Snippet: ${linkedinInfo.bestMatch.snippet}
- Functie: ${linkedinInfo.bestMatch.jobTitle || 'Onbekend'}
- Bedrijf: ${linkedinInfo.bestMatch.company || 'Onbekend'}` : 'Geen LinkedIn profiel gevonden.';

            const prompt = `Je bent een VIP-gastanalist voor een luxe hotel. Analyseer de volgende informatie en bepaal een VIP-score.

Gastnaam: ${guest.full_name}
Land: ${guest.country || 'Onbekend'}
${guest.company ? `Bedrijf: ${guest.company}` : ''}
${guest.notes ? `Extra info: ${guest.notes}` : ''}

${linkedinContext}

Geef je antwoord ALLEEN in het volgende JSON-formaat:
{
  "vip_score": [1-10 getal, waarbij 10 = extreem VIP/CEO's van grote bedrijven/miljardairs],
  "industry": "[sector of null]",
  "company_size": "[Micro (1-10)/Klein (10-50)/Middelgroot (50-250)/Groot (250+) of null]",
  "is_owner": [true als eigenaar/oprichter/CEO/partner, false als werknemer, null als onbekend],
  "employment_type": "[Eigenaar/Oprichter/CEO/Partner/Directeur/Manager/Werknemer/Zelfstandige of null]",
  "notable_info": "[korte samenvatting voor hotel personeel, max 150 tekens]",
  "influence_level": "[Laag/Gemiddeld/Hoog/VIP]",
  "net_worth_estimate": "[geschat vermogen of null als onbekend]"
}

Focus op: bedrijfspositie, bedrijfsgrootte, of persoon eigenaar of werknemer is.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Je bent een expert in het identificeren van VIP-gasten. Geef ALLEEN valide JSON terug.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 400
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return this.basicAnalysis(linkedinInfo);

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return this.basicAnalysis(linkedinInfo);

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('OpenAI analysis error:', error);
            return this.basicAnalysis(linkedinInfo);
        }
    }

    /**
     * Basic analysis when AI is not available
     */
    basicAnalysis(linkedinInfo) {
        if (linkedinInfo?.bestMatch) {
            return {
                vip_score: 6,
                industry: null,
                notable_info: linkedinInfo.bestMatch.snippet?.substring(0, 150),
                influence_level: 'Gemiddeld',
                net_worth_estimate: null
            };
        }
        return {
            vip_score: 5,
            industry: null,
            notable_info: null,
            influence_level: 'Gemiddeld',
            net_worth_estimate: null
        };
    }

    /**
     * Main search function for guest research
     * Focuses on LinkedIn as primary source
     */
    async searchGuest(guest) {
        console.log(`🔍 Researching: ${guest.full_name}`);

        // Search LinkedIn via SerpAPI
        const linkedinInfo = await this.searchLinkedIn(guest);
        console.log(`💼 LinkedIn: ${linkedinInfo.bestMatch ? 'Found' : 'Not found'}`);

        // Analyze with AI
        const analysis = await this.analyzeWithAI(guest, linkedinInfo);
        console.log(`🤖 AI Analysis: VIP Score ${analysis.vip_score}`);

        // Get best LinkedIn data
        const bestMatch = linkedinInfo.bestMatch;

        // Build results object
        return {
            profilePhotoUrl: bestMatch?.thumbnail || null,
            jobTitle: bestMatch?.jobTitle || null,
            companyName: bestMatch?.company || guest.company,
            companySize: analysis.company_size || null,
            isOwner: analysis.is_owner,
            employmentType: analysis.employment_type || null,
            industry: analysis.industry,
            linkedinUrl: bestMatch?.url || null,
            linkedinConnections: null,
            linkedinCandidates: linkedinInfo.candidates,
            needsLinkedInReview: linkedinInfo.needsReview,
            instagramUrl: null,
            instagramHandle: null,
            twitterUrl: null,
            twitterHandle: null,
            facebookUrl: null,
            youtubeUrl: null,
            websiteUrl: null,
            notableInfo: analysis.notable_info,
            pressMentions: null,
            netWorthEstimate: analysis.net_worth_estimate,
            followersEstimate: null,
            vipScore: analysis.vip_score,
            influenceLevel: analysis.influence_level,
            rawResults: [
                { type: 'linkedin_search', data: linkedinInfo },
                { type: 'ai_analysis', data: analysis }
            ]
        };
    }
}

module.exports = new SmartSearchService();
