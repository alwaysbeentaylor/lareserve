const OpenAI = require('openai');
const companyScraper = require('./companyScraper');
const knowledgeGraph = require('./knowledgeGraph');
const duckDuckGo = require('./duckDuckGo');
const braveSearch = require('./braveSearch');

/**
 * Format large numbers to human-readable format (e.g. 18K, 1.2M)
 */
function formatNumber(num) {
    if (!num || isNaN(num)) return null;
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

/**
 * Smart Search Service
 * for guest research
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
     * Helper to fetch with a timeout
     */
    async fetchWithTimeout(url, options = {}, timeout = 30000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    async searchLinkedIn(guest) {
        console.log(`🔍 LinkedIn search for ${guest.full_name} via Brave/DuckDuckGo...`);
        try {
            // Try Name + Company first
            let query = `site:linkedin.com/in "${guest.full_name}"`;
            if (guest.company) query += ` "${guest.company}"`;
            if (guest.country) query += ` ${guest.country}`;

            let candidates = [];

            // Hybrid Strategy: Search both Brave and DuckDuckGo to maximize coverage
            const countryISO = guest.country === 'Belgium' ? 'BE' : (guest.country === 'Netherlands' ? 'NL' : null);

            console.log(`🦁 Searching Brave for LinkedIn...`);
            let braveResults = await braveSearch.search(query, 5, countryISO);

            // Fuzzy Fallback for Brave
            if (braveResults.length < 2) {
                const fuzzyQuery = `site:linkedin.com/in ${guest.full_name} ${guest.country || ''} ${guest.company || ''}`.trim();
                const fuzzyBrave = await braveSearch.search(fuzzyQuery, 5, countryISO);
                braveResults = [...braveResults, ...fuzzyBrave];
            }

            console.log(`🦆 Searching DuckDuckGo for LinkedIn...`);
            const ddgResults = await duckDuckGo.search(query, 5);

            // Combine and de-duplicate by link
            const combinedMap = new Map();
            [...braveResults, ...ddgResults].forEach(r => {
                if (r.link && !combinedMap.has(r.link)) {
                    combinedMap.set(r.link, r);
                }
            });

            candidates = Array.from(combinedMap.values());
            console.log(`📋 Found ${candidates.length} unique LinkedIn candidate(s) via Hybrid search`);

            // If still no candidates, try a broader fallback
            if (candidates.length === 0 && (guest.company || guest.country)) {
                console.log(`🔍 Broadening LinkedIn search for ${guest.full_name}...`);
                const broadQuery = `site:linkedin.com/in "${guest.full_name}" ${guest.country || ''}`.trim();

                const broadResults = await braveSearch.search(broadQuery, 5, countryISO);
                const broadDDG = await duckDuckGo.search(broadQuery, 3);

                [...broadResults, ...broadDDG].forEach(r => {
                    if (r.link && !combinedMap.has(r.link)) {
                        combinedMap.set(r.link, r);
                    }
                });
                candidates = Array.from(combinedMap.values());
            }

            if (candidates.length > 0) {
                console.log(`📋 Found ${candidates.length} LinkedIn candidate(s)`);

                // NEW: Parse job title and company from LinkedIn search result title
                // Format: "Name - Job Title bij/at Company | LinkedIn"
                for (const candidate of candidates) {
                    if (candidate.title && candidate.link?.includes('linkedin.com/in/')) {
                        const parsed = this.parseLinkedInTitle(candidate.title, guest.full_name);
                        if (parsed) {
                            candidate.extractedJobTitle = parsed.jobTitle;
                            candidate.extractedCompany = parsed.company;
                            console.log(`💼 Extracted from LinkedIn title: ${parsed.jobTitle} @ ${parsed.company}`);
                        }
                    }
                }

                const verifiedResults = await this.verifyCandidatesWithAI(guest, candidates);
                return verifiedResults;
            }
        } catch (error) {
            console.error('LinkedIn search error:', error.message);
        }

        return { candidates: [], bestMatch: null, needsReview: false };
    }

    /**
     * Parse LinkedIn search result title to extract job title and company
     * Example: "Maxim Van Trimpont - Front Office Manager bij La Réserve Resort | LinkedIn"
     * Returns: { jobTitle: "Front Office Manager", company: "La Réserve Resort" }
     */
    parseLinkedInTitle(title, guestName) {
        if (!title) return null;

        // Remove "| LinkedIn" suffix
        let cleanTitle = title.replace(/\s*\|\s*LinkedIn.*$/i, '').trim();

        // Try to split by " - " to separate name from role
        const parts = cleanTitle.split(' - ');
        if (parts.length < 2) return null;

        // The first part should contain the name, rest is job info
        const jobPart = parts.slice(1).join(' - ').trim();
        if (!jobPart) return null;

        // Try to split job part by "bij", "at", "@" to get company
        const companyMatch = jobPart.match(/^(.+?)\s+(?:bij|at|@)\s+(.+)$/i);
        if (companyMatch) {
            let potentialCompany = companyMatch[2].trim();

            // Filter out "LinkedIn" and common locations as company names
            if (potentialCompany.toLowerCase().includes('linkedin') ||
                potentialCompany.match(/(Region|Area|Belgium|Netherlands|France|United Kingdom|USA)/i)) {
                return {
                    jobTitle: jobPart, // Fallback to full string if company detection is dubious
                    company: null
                };
            }

            return {
                jobTitle: companyMatch[1].trim(),
                company: potentialCompany
            };
        }

        // If no company separator found, the whole thing is the job title
        return {
            jobTitle: jobPart,
            company: null
        };
    }

    /**
     * Extract company information from email domain
     * Determines if guest is owner or employee based on company size and role
     */
    async extractCompanyFromEmail(guest) {
        if (!guest.email) return null;

        // Extract domain from email
        const emailParts = guest.email.split('@');
        if (emailParts.length !== 2) return null;

        const domain = emailParts[1].toLowerCase();

        // Skip common personal email domains
        const personalDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'msn.com', 'me.com', 'mail.com', 'protonmail.com'];
        if (personalDomains.includes(domain)) {
            console.log(`📧 Skipping personal email domain: ${domain}`);
            return null;
        }

        console.log(`📧 Analyzing business email domain: ${domain}`);

        try {
            // Step 1: Search for the company via Brave (fallback to DuckDuckGo)
            let companyResults = await braveSearch.search(`"${domain}" bedrijf company`, 5);
            if (companyResults.length === 0) {
                // Fallback to DuckDuckGo
                companyResults = await duckDuckGo.search(`"${domain}" bedrijf company`);
            }

            // Step 2: Scrape the company website directly
            const websiteUrl = `https://${domain}`;
            const websiteContent = await duckDuckGo.fetchPageContent(websiteUrl);

            if (!websiteContent && companyResults.length === 0) {
                console.log(`❌ No company info found for domain: ${domain}`);
                return null;
            }

            // Step 3: Use AI to analyze and determine owner/employee status
            const openai = this.getOpenAI();
            if (!openai) return { domain, websiteUrl, companyName: domain.split('.')[0] };

            const prompt = `Analyze this company information to determine:
1. The official company name
2. What industry/sector they operate in
3. Company size estimate (Micro/Klein/Middelgroot/Groot)
4. Whether "${guest.full_name}" is likely the OWNER/FOUNDER or an EMPLOYEE

GUEST INFO:
- Name: ${guest.full_name}
- Email: ${guest.email}
- Country: ${guest.country || 'Unknown'}

EMAIL DOMAIN: ${domain}
WEBSITE URL: ${websiteUrl}

${websiteContent ? `WEBSITE CONTENT:
${websiteContent.substring(0, 2000)}` : ''}

${companyResults.length > 0 ? `SEARCH RESULTS:
${companyResults.slice(0, 3).map(r => `- ${r.title}: ${r.snippet}`).join('\n')}` : ''}

OWNER INDICATORS (look for these):
- Name appears as founder/CEO/director on website
- Very small company (1-10 employees)
- Name matches company name pattern
- Mentioned in "about us" or "team" as leadership

Return JSON:
{
  "companyName": "Official company name",
  "industry": "Industry/sector",
  "companySize": "Micro/Klein/Middelgroot/Groot",
  "isOwner": true/false/null,
  "ownerConfidence": 0-1,
  "ownerReason": "Why you think owner or employee",
  "description": "Brief company description"
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a business analyst. Determine company details and ownership status from available data.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log(`🏢 Email domain analysis: ${result.companyName} (${result.companySize}) - ${result.isOwner ? '👑 OWNER' : '👔 Employee'}`);

            return {
                domain,
                websiteUrl,
                ...result,
                source: 'email_domain'
            };
        } catch (error) {
            console.error('Email domain analysis error:', error.message);
            return { domain, websiteUrl: `https://${domain}`, companyName: domain.split('.')[0] };
        }
    }

    /**
     * PRIMARY AI-Powered Search (Free-First Strategy)
     * Uses multi-query DuckDuckGo search with deep page scraping for rich data
     * Only falls back to SerpAPI if confidence is too low
     */
    async searchWithAI(guest) {
        console.log(`🧠 AI Research Engine: Starting intelligent hybrid search for ${guest.full_name}...`);

        try {
            // STEP 1: Hybrid Multi-query Search (Brave + DuckDuckGo)
            // We search BOTH because Brave's index can be stale for certain profiles (like LinkedIn)
            const countryISO = guest.country === 'Belgium' ? 'BE' : (guest.country === 'Netherlands' ? 'NL' : null);

            console.log(`🦁 Searching Brave...`);
            const braveResults = await braveSearch.multiSearch(guest, countryISO);

            console.log(`🦆 Searching DuckDuckGo...`);
            const ddgResults = await duckDuckGo.multiSearch(guest);

            // Combine and de-duplicate
            const combinedMap = new Map();
            [...braveResults, ...ddgResults].forEach(r => {
                if (r.link && !combinedMap.has(r.link)) {
                    combinedMap.set(r.link, r);
                }
            });

            let searchResults = Array.from(combinedMap.values());

            if (searchResults.length === 0) {
                console.log('❌ No results from any search engine');
                return null;
            }

            console.log(`🔍 Combined ${searchResults.length} unique results for AI evaluation`);

            // Step 2: AI selects the best match with confidence score
            let aiSelection = await this.selectBestMatchWithAI(guest, searchResults);

            // ITERATIVE RETRY: If no confident match found, or to double-check a suspicious result
            if ((!aiSelection || (aiSelection.confidence < 0.9)) && guest.country) {
                console.log(`🔄 No confident match for ${guest.full_name}. Retrying with strict country focus: ${guest.country}`);
                const focusedQuery = `"${guest.full_name}" ${guest.country} professional profile`;

                const retryBrave = await braveSearch.search(focusedQuery, 5, countryISO);
                const retryDDG = await duckDuckGo.search(focusedQuery, 5);

                const retryResults = [...retryBrave, ...retryDDG].filter(r => !combinedMap.has(r.link));

                if (retryResults.length > 0) {
                    // Evaluate new results combined with old ones
                    const combinedResultsList = [...searchResults, ...retryResults];
                    const newSelection = await this.selectBestMatchWithAI(guest, combinedResultsList);

                    if (newSelection && (!aiSelection || newSelection.confidence >= aiSelection.confidence)) {
                        aiSelection = newSelection;
                    }
                }
            }

            if (!aiSelection) {
                console.log('🤔 AI could not identify a confident match');
                return null;
            }

            // Step 3: Deep scrape the identified page for richer content
            if (aiSelection.url && !aiSelection.url.includes('linkedin.com')) {
                const deepContent = await duckDuckGo.fetchPageContent(aiSelection.url, 8000);
                if (deepContent) {
                    aiSelection.deepContent = deepContent;
                    console.log(`📄 Deep scraped ${aiSelection.url.substring(0, 50)}... (${deepContent.length} chars)`);
                }
            }

            return aiSelection;
        } catch (error) {
            console.error('AI Research error:', error);
            return null;
        }
    }

    /**
     * Legacy fallback (kept for backwards compatibility)
     * Now just calls the new AI-powered search
     */
    async searchGoogleFallback(guest) {
        return await this.searchWithAI(guest);
    }

    /**
     * Use AI to select the most likely match from general Google snippets
     */
    async selectBestMatchWithAI(guest, searchResults) {
        const openai = this.getOpenAI();
        if (!openai) return null;

        try {
            const resultsInfo = searchResults.map((r, i) =>
                `Result ${i}:
                Title: ${r.title}
                URL: ${r.link}
                Snippet: ${r.snippet}`
            ).join('\n\n');

            const prompt = `I need you to identify the correct person from these search results.
GUEST:
Name: ${guest.full_name}
Company: ${guest.company || 'Unknown'}
Country: ${guest.country || 'Unknown'}

SEARCH RESULTS:
${resultsInfo}

INSTRUCTIONS:
1. **PRIMARY GOAL**: Find the **LinkedIn** profile that belongs to this guest.
2. **GOLDEN RULE**: If a valid LinkedIn profile is strictly found (same name + region), select it IMMEDIATELY as the best match.
3. **PRIORITY**: LinkedIn >>>>> Facebook/Instagram/Pinterest. Only select social media if NO LinkedIn is found.
4. **LOCATION CHECK**: The result MUST match the guest's country (e.g. Belgium). Do not match a "Fleur Delie" in USA if the guest is in Belgium.
5. **STUDENTS**: If the guest appears to be a Student (on LinkedIn), this IS A VALID MATCH. Do not discard it just because they aren't a CEO.
6. **IMPOSTORS**: If the result is a namesake (e.g. historical figure, or wrong region), return bestIndex: null.

Return JSON:
{
  "bestIndex": [integer index of the match, or null],
  "confidence": [0.0 to 1.0],
  "extractedJobTitle": "[Job title if visible in snippet]",
  "extractedCompany": "[Company if visible in snippet]",
  "reason": "[Why you chose this result]"
}`;

            console.log(`🤖 AI matching guest against ${searchResults.length} results...`);
            searchResults.forEach((r, i) => {
                console.log(`  [${i}] ${r.title} - ${r.link}`);
            });
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert researcher. You prioritize professional sources (LinkedIn) above all else.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);

            if (result.bestIndex !== null && result.confidence >= 0.8 && !result.isHistorical) {
                const bestSource = searchResults[result.bestIndex];
                console.log(`✨ Google Fallback match found! ${bestSource.link} (Conf: ${result.confidence})`);

                // NEW: If this is a LinkedIn result, try to parse job title from the title
                let finalJobTitle = result.extractedJobTitle;
                let finalCompany = result.extractedCompany;

                if (bestSource.link?.includes('linkedin.com/in/') && bestSource.title) {
                    const parsed = this.parseLinkedInTitle(bestSource.title, guest.full_name);
                    if (parsed) {
                        // Prefer parsed title over AI extracted (more reliable)
                        if (parsed.jobTitle) finalJobTitle = parsed.jobTitle;
                        if (parsed.company) finalCompany = parsed.company;
                        console.log(`💼 Parsed from LinkedIn title: ${parsed.jobTitle} @ ${parsed.company}`);
                    }
                }

                return {
                    url: bestSource.link,
                    title: bestSource.title,
                    snippet: bestSource.snippet,
                    jobTitle: finalJobTitle,
                    company: finalCompany,
                    sourceType: 'google_fallback',
                    reason: result.reason,
                    confidence: result.confidence
                };
            }

            if (result.isHistorical) {
                console.log('🏛️ Discarding match because it refers to a historical figure.');
            }

            console.log('❌ No clear match found in Google fallback.');
            return null;
        } catch (error) {
            console.error('AI fallback selection error:', error);
            return null;
        }
    }



    /**
     * Search for Instagram profile using SerpAPI
     * Prioritizes verified/official accounts for celebrities
     * Returns comprehensive profile data including bio, location, etc.
     */
    async searchInstagram(guest) {
        try {
            // ============================================
            // STEP 1: DuckDuckGo/Brave Search (PRIMARY)
            // ============================================
            const primaryQueries = [
                `site:instagram.com "${guest.full_name}"`,
                `"${guest.full_name}" instagram profile`
            ];

            for (const query of primaryQueries) {
                // Try DuckDuckGo first (FREE)
                let results = await duckDuckGo.search(query);
                if (results.length === 0) {
                    console.log(`🔍 Falling back to Brave for Instagram: ${query}`);
                    results = await braveSearch.search(query, 5);
                }

                const instagramResults = results.filter(r =>
                    r.link?.includes('instagram.com/') &&
                    !r.link?.includes('/p/') &&
                    !r.link?.includes('/reel/')
                );

                for (const result of instagramResults) {
                    const handleMatch = result.link.match(/instagram\.com\/([^\/\?]+)/);
                    if (handleMatch && handleMatch[1] !== 'explore' && handleMatch[1] !== 'accounts') {
                        const handle = handleMatch[1];

                        // Verify with AI
                        const isMatch = await this.verifySocialProfile(guest, {
                            platform: 'Instagram',
                            handle: handle,
                            title: result.title,
                            snippet: result.snippet
                        });

                        if (isMatch) {
                            console.log(`📸 Instagram found: @${handle}`);
                            const profileData = await this.extractInstagramProfileData(handle, result, guest);
                            return profileData;
                        }
                    }
                }
            }

            // ============================================
            // STEP 2: FUZZY SEARCH - Try username without spaces
            // Many users have handles like "maximvantrimpont" not "Maxim Van Trimpont"
            // ============================================
            const nameNoSpaces = guest.full_name.toLowerCase().replace(/\s+/g, '');
            const fuzzyQueries = [
                `instagram.com/${nameNoSpaces}`,
                `"@${nameNoSpaces}" instagram`
            ];

            console.log(`📸 Trying fuzzy Instagram search: ${nameNoSpaces}`);

            for (const query of fuzzyQueries) {
                // DuckDuckGo first (FREE)
                let results = await duckDuckGo.search(query);
                if (results.length === 0) {
                    results = await braveSearch.search(query, 3);
                }

                const instagramResults = results.filter(r =>
                    r.link?.includes('instagram.com/') &&
                    !r.link?.includes('/p/') &&
                    !r.link?.includes('/reel/')
                );

                for (const result of instagramResults) {
                    const handleMatch = result.link.match(/instagram\.com\/([^\/\?]+)/);
                    if (handleMatch && handleMatch[1] !== 'explore' && handleMatch[1] !== 'accounts') {
                        const handle = handleMatch[1];

                        // Check if handle matches the name pattern
                        const handleLower = handle.toLowerCase().replace(/[._-]/g, '');
                        if (handleLower.includes(nameNoSpaces.substring(0, 8))) {
                            // If handle is an EXACT match of the name without spaces, skip AI verification
                            if (handleLower === nameNoSpaces) {
                                console.log(`📸 Instagram found via EXACT fuzzy match: @${handle}`);
                                const profileData = await this.extractInstagramProfileData(handle, result, guest);
                                return profileData;
                            }

                            // For partial matches, verify with AI
                            const isMatch = await this.verifySocialProfile(guest, {
                                platform: 'Instagram',
                                handle: handle,
                                title: result.title,
                                snippet: result.snippet
                            });

                            if (isMatch) {
                                console.log(`📸 Instagram found via fuzzy search: @${handle}`);
                                const profileData = await this.extractInstagramProfileData(handle, result, guest);
                                return profileData;
                            }
                        }
                    }
                }
            }

            console.log(`📸 No verified Instagram found for ${guest.full_name}`);
            return { url: null, handle: null, followers: null, bio: null, location: null, linkedTwitter: null };
        } catch (error) {
            console.error('Instagram search error:', error);
            return { url: null, handle: null, followers: null, bio: null, location: null, linkedTwitter: null };
        }
    }

    /**
     * Extract comprehensive Instagram profile data using SerpAPI and AI
     */
    async extractInstagramProfileData(handle, searchResult, guest) {
        const profileData = {
            url: `https://instagram.com/${handle}`,
            handle: handle,
            followers: null,
            following: null,
            posts: null,
            bio: null,
            location: null,
            linkedTwitter: null,
            linkedWebsite: null,
            jobTitle: null,
            company: null,
            verified: false
        };

        try {
            // Extract thumbnail from search result (profile photo)
            if (searchResult.thumbnail) {
                profileData.profilePhoto = searchResult.thumbnail;
                console.log(`📸 Found Instagram thumbnail: ${searchResult.thumbnail.substring(0, 50)}...`);
            }

            // Parse followers from snippet - support Dutch "4,7 mln. volgers" and English "4.7M followers"
            // Dutch: "4,7 mln. volgers" or "4.7 miljoen volgers"
            const dutchFollowersMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*(?:mln\.?|miljoen)\s*volgers/i);
            if (dutchFollowersMatch) {
                profileData.followers = this.parseFollowerCount(dutchFollowersMatch[0]);
                console.log(`📊 Dutch followers match: ${dutchFollowersMatch[0]} -> ${profileData.followers}`);
            } else {
                // English: "4.7M followers" or "4,700,000 followers"  
                const followersMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*[MKmk]?\s*[Ff]ollowers/i);
                if (followersMatch) {
                    profileData.followers = this.parseFollowerCount(followersMatch[0]);
                    console.log(`📊 English followers match: ${followersMatch[0]} -> ${profileData.followers}`);
                }
            }

            // Parse following count
            const followingMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*(?:volgend|[Ff]ollowing)/i);
            if (followingMatch) {
                profileData.following = this.parseFollowerCount(followingMatch[0]);
            }

            // Parse posts count - Dutch "berichten" or English "posts"
            const postsMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*(?:berichten|[Pp]osts)/i);
            if (postsMatch) {
                profileData.posts = this.parseFollowerCount(postsMatch[0]);
            }

            // Use AI to extract detailed profile information from the search result
            const openai = this.getOpenAI();
            if (openai) {
                const prompt = `Extract detailed profile information from this Instagram search result.

Title: ${searchResult.title || ''}
Snippet: ${searchResult.snippet || ''}
URL: ${searchResult.link || ''}

Extract the following information (return null for any field you cannot find):

Return JSON:
{
    "bio": "The profile bio/description",
    "location": "The location from the profile",
    "linkedTwitter": "Twitter handle or URL if mentioned in bio",
    "linkedWebsite": "Any website URL mentioned",
    "jobTitle": "Their profession or job title if mentioned",
    "company": "Company or team they work for",
    "verified": true/false if account appears to be verified/official
}`;

                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are an expert at extracting information from social media profiles. Be precise and only extract information that is clearly present.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                }, { timeout: 45000 });

                const extracted = JSON.parse(response.choices[0].message.content);

                // Merge extracted data
                if (extracted.bio) profileData.bio = extracted.bio;
                if (extracted.location) profileData.location = extracted.location;
                if (extracted.linkedTwitter) {
                    // Clean up Twitter reference
                    let tw = extracted.linkedTwitter;
                    if (tw.includes('twitter.com/') || tw.includes('x.com/')) {
                        const match = tw.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
                        if (match) tw = match[1];
                    }
                    profileData.linkedTwitter = tw.replace('@', '');
                }
                if (extracted.linkedWebsite) profileData.linkedWebsite = extracted.linkedWebsite;
                if (extracted.jobTitle) profileData.jobTitle = extracted.jobTitle;
                if (extracted.company) profileData.company = extracted.company;
                if (extracted.verified) profileData.verified = extracted.verified;
            }

        } catch (error) {
            console.error('Error extracting Instagram profile data:', error);
        }

        return profileData;
    }

    /**
     * Search for Twitter/X profile using SerpAPI
     * Prioritizes verified/official accounts for celebrities
     * Returns comprehensive profile data including bio, location, etc.
     */
    async searchTwitter(guest) {
        try {
            // ============================================
            // STEP 1: DuckDuckGo/Brave Search (PRIMARY)
            // ============================================
            const primaryQueries = [
                `site:x.com "${guest.full_name}"`,
                `site:twitter.com "${guest.full_name}"`,
                `"${guest.full_name}" twitter profile`
            ];

            for (const query of primaryQueries) {
                // DuckDuckGo first (FREE)
                let results = await duckDuckGo.search(query);
                if (results.length === 0) {
                    console.log(`🔍 Falling back to Brave for Twitter: ${query}`);
                    results = await braveSearch.search(query, 5);
                }

                const twitterResults = results.filter(r =>
                    (r.link?.includes('twitter.com/') || r.link?.includes('x.com/')) &&
                    !r.link?.includes('/status/')
                );

                for (const result of twitterResults) {
                    const handleMatch = result.link.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
                    if (handleMatch && !['search', 'explore', 'home', 'i', 'intent'].includes(handleMatch[1])) {
                        const handle = handleMatch[1];

                        // Verify with AI
                        const isMatch = await this.verifySocialProfile(guest, {
                            platform: 'Twitter/X',
                            handle: handle,
                            title: result.title,
                            snippet: result.snippet
                        });

                        if (isMatch) {
                            console.log(`🐦 Twitter/X found: @${handle}`);
                            const profileData = await this.extractTwitterProfileData(handle, result, guest);
                            return profileData;
                        }
                    }
                }
            }

            console.log(`🐦 No verified Twitter/X found for ${guest.full_name}`);
            return { url: null, handle: null, followers: null, bio: null, location: null, memberSince: null, linkedInstagram: null };
        } catch (error) {
            console.error('Twitter search error:', error);
            return { url: null, handle: null, followers: null, bio: null, location: null, memberSince: null, linkedInstagram: null };
        }
    }

    /**
     * Extract comprehensive Twitter profile data using SerpAPI and AI
     */
    async extractTwitterProfileData(handle, searchResult, guest) {
        const profileData = {
            url: `https://x.com/${handle}`,
            handle: handle,
            followers: null,
            following: null,
            bio: null,
            location: null,
            memberSince: null,
            linkedInstagram: null,
            linkedWebsite: null,
            jobTitle: null,
            company: null,
            verified: false
        };

        try {
            // Extract thumbnail from search result (profile photo)
            if (searchResult.thumbnail) {
                profileData.profilePhoto = searchResult.thumbnail;
                console.log(`📸 Found Twitter thumbnail: ${searchResult.thumbnail.substring(0, 50)}...`);
            }

            // Parse followers from snippet - support Dutch "4,7 mln. volgers" and English "4.7M followers"
            const dutchFollowersMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*(?:mln\.?|miljoen)\s*volgers/i);
            if (dutchFollowersMatch) {
                profileData.followers = this.parseFollowerCount(dutchFollowersMatch[0]);
                console.log(`📊 Dutch Twitter followers match: ${dutchFollowersMatch[0]} -> ${profileData.followers}`);
            } else {
                const followersMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*[MKmk]?\s*[Ff]ollowers/i);
                if (followersMatch) {
                    profileData.followers = this.parseFollowerCount(followersMatch[0]);
                }
            }

            // Parse following count
            const followingMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*(?:volgend|[MKmk]?\s*[Ff]ollowing)/i);
            if (followingMatch) {
                profileData.following = this.parseFollowerCount(followingMatch[0]);
            }

            // Use AI to extract detailed profile information from the search result
            const openai = this.getOpenAI();
            if (openai) {
                const prompt = `Extract detailed profile information from this Twitter/X search result.

Title: ${searchResult.title || ''}
Snippet: ${searchResult.snippet || ''}
URL: ${searchResult.link || ''}

Extract the following information (return null for any field you cannot find):

Return JSON:
{
    "bio": "The profile bio/description",
    "location": "The location from the profile",
    "memberSince": "When they joined (e.g., 'July 2013' or 'juli 2013')",
    "linkedInstagram": "Instagram handle or URL if mentioned in bio",
    "linkedWebsite": "Any website URL mentioned",
    "jobTitle": "Their profession or job title if mentioned",
    "company": "Company or team they work for (e.g., @sksturm means SK Sturm Graz)",
    "verified": true/false if account appears to be verified/official
}`;

                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are an expert at extracting information from social media profiles. Be precise and only extract information that is clearly present.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                }, { timeout: 45000 });

                const extracted = JSON.parse(response.choices[0].message.content);

                // Merge extracted data
                if (extracted.bio) profileData.bio = extracted.bio;
                if (extracted.location) profileData.location = extracted.location;
                if (extracted.memberSince) profileData.memberSince = extracted.memberSince;
                if (extracted.linkedInstagram) {
                    // Clean up Instagram reference
                    let ig = extracted.linkedInstagram;
                    if (ig.includes('instagram.com/')) {
                        const match = ig.match(/instagram\.com\/([^\/\?]+)/);
                        if (match) ig = match[1];
                    }
                    profileData.linkedInstagram = ig.replace('@', '');
                }
                if (extracted.linkedWebsite) profileData.linkedWebsite = extracted.linkedWebsite;
                if (extracted.jobTitle) profileData.jobTitle = extracted.jobTitle;
                if (extracted.company) profileData.company = extracted.company;
                if (extracted.verified) profileData.verified = extracted.verified;
            }

            // Try to find location
            if (!profileData.location) {
                const locationPatterns = [
                    /(?:📍|Located in|From|Based in)\s*([^,]+(?:,\s*[^,]+)?)/i,
                    /([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?(?:,\s*[A-Z]{2,})?)/
                ];
                for (const pattern of locationPatterns) {
                    const match = searchResult.snippet?.match(pattern); // snippet text from searchResult
                    if (match && match[1].length < 50) {
                        profileData.location = match[1].trim();
                        break;
                    }
                }
            }

            // Try to get more details with a dedicated Twitter profile search using DuckDuckGo
            const profileQuery = `site:x.com/${handle} OR site:twitter.com/${handle}`;
            const profileResults = await duckDuckGo.search(profileQuery);

            if (profileResults.length > 0) {
                // Look for the main profile result
                const mainProfile = profileResults.find(r =>
                    (r.link?.endsWith(`/${handle}`) || r.link?.includes(`/${handle}?`)) &&
                    !r.link?.includes('/status/')
                );

                if (mainProfile) {
                    // Extract additional info from the dedicated profile search
                    const snippetText = (mainProfile.snippet || '') + ' ' + (mainProfile.title || '');

                    // Try to find Instagram link in snippet
                    if (!profileData.linkedInstagram) {
                        const igMatch = snippetText.match(/instagram\.com\/([\w.]+)/i);
                        if (igMatch) profileData.linkedInstagram = igMatch[1];
                    }

                    // Try to find location
                    if (!profileData.location) {
                        const locationPatterns = [
                            /(?:📍|Located in|From|Based in)\s*([^,]+(?:,\s*[^,]+)?)/i,
                            /([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?(?:,\s*[A-Z]{2,})?)/
                        ];
                        for (const pattern of locationPatterns) {
                            const match = snippetText.match(pattern);
                            if (match && match[1].length < 50) {
                                profileData.location = match[1].trim();
                                break;
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error extracting Twitter profile data:', error);
        }

        return profileData;
    }

    /**
     * Verify a social media profile belongs to the guest using AI
     */
    async verifySocialProfile(guest, profile) {
        const openai = this.getOpenAI();
        if (!openai) {
            // Without AI, do basic name matching
            const text = (profile.title + ' ' + profile.snippet).toLowerCase();
            const nameParts = guest.full_name.toLowerCase().split(/\s+/);
            return nameParts.every(part => part.length < 3 || text.includes(part));
        }

        try {
            const prompt = `Is this ${profile.platform} profile for "${guest.full_name}"?

Profile handle: @${profile.handle}
Title: ${profile.title}
Snippet: ${profile.snippet}

IMPORTANT:
- For celebrities, the handle often won't match their full name (e.g., Drake uses @champagnepapi)
- Look for verified indicators, official mentions, or the name in the bio/title
- Be especially careful with common names - require strong evidence
- Some celebrities have deleted or locked accounts - if the info suggests this, return false

Return JSON: { "isMatch": true/false, "confidence": 0.0-1.0, "reason": "brief explanation" }`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert at identifying celebrity and public figure social media accounts. Be careful to distinguish between official accounts and fan accounts.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            }, { timeout: 45000 });

            const result = JSON.parse(response.choices[0].message.content);
            console.log(`🤖 Social verification for @${profile.handle}: ${result.isMatch ? 'Match' : 'No match'} (${Math.round(result.confidence * 100)}%) - ${result.reason}`);

            return result.isMatch && result.confidence >= 0.7;
        } catch (error) {
            console.error('Social profile verification error:', error);
            return false;
        }
    }

    /**
     * Parse follower count strings like "10M followers", "5.2K followers", "4,7 mln. volgers"
     * Supports both English (M/K) and Dutch (mln./miljoen, k/duizend) formats
     */
    parseFollowerCount(str) {
        if (!str) return null;

        // Log for debugging
        console.log(`📊 Parsing follower count from: "${str}"`);

        // Try Dutch format first: "4,7 mln." or "4.7 miljoen"
        const dutchMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:mln\.?|miljoen)/i);
        if (dutchMatch) {
            const num = parseFloat(dutchMatch[1].replace(',', '.')) * 1000000;
            console.log(`📊 Parsed Dutch millions: ${num}`);
            return Math.round(num);
        }

        // Try "duizend" or Dutch K format
        const dutchKMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:k|duizend)/i);
        if (dutchKMatch) {
            const num = parseFloat(dutchKMatch[1].replace(',', '.')) * 1000;
            console.log(`📊 Parsed Dutch thousands: ${num}`);
            return Math.round(num);
        }

        // Standard English format: 10M, 5.2K, 1.5M
        const englishMatch = str.match(/(\d+(?:[.,]\d+)?)\s*([MKmk])\b/);
        if (englishMatch) {
            let num = parseFloat(englishMatch[1].replace(',', '.'));
            const multiplier = englishMatch[2].toUpperCase();

            if (multiplier === 'M') num *= 1000000;
            else if (multiplier === 'K') num *= 1000;

            console.log(`📊 Parsed English format: ${num}`);
            return Math.round(num);
        }

        // Plain number (no suffix) - only use if it's a large number (likely followers not posts)
        const plainMatch = str.match(/(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(?:followers?|volgers?)/i);
        if (plainMatch) {
            // Remove thousand separators and parse
            const numStr = plainMatch[1].replace(/[.,](?=\d{3})/g, '');
            const num = parseInt(numStr, 10);
            console.log(`📊 Parsed plain number with followers keyword: ${num}`);
            return num;
        }

        // Fallback: just try to find a number followed by M/K anywhere
        const fallbackMatch = str.match(/(\d+(?:[.,]\d+)?)\s*([MKmk])/);
        if (fallbackMatch) {
            let num = parseFloat(fallbackMatch[1].replace(',', '.'));
            const multiplier = fallbackMatch[2].toUpperCase();

            if (multiplier === 'M') num *= 1000000;
            else if (multiplier === 'K') num *= 1000;

            console.log(`📊 Parsed fallback: ${num}`);
            return Math.round(num);
        }

        console.log(`📊 Could not parse follower count from: "${str}"`);
        return null;
    }

    /**
     * Detect if a person is likely a celebrity (for prioritizing social media search)
     * Uses GPT's training knowledge to identify famous people directly by name
     */
    async detectCelebrity(guest, linkedinInfo) {
        // STEP 1: Try Knowledge Graph first (most reliable, if enabled)
        const kgResult = await knowledgeGraph.detectCelebrity(guest.full_name);

        if (kgResult.isCelebrity && kgResult.confidence >= 0.5) {
            console.log(`📚 Celebrity detected via Knowledge Graph: ${kgResult.knownFor}`);
            return {
                isCelebrity: true,
                confidence: kgResult.confidence,
                category: kgResult.category,
                knownFor: kgResult.knownFor,
                detailedDescription: kgResult.detailedDescription,
                wikipediaUrl: kgResult.wikipediaUrl,
                officialImage: kgResult.officialImage,
                socialMediaPriority: this.inferSocialPriority(kgResult.category),
                source: 'knowledge_graph'
            };
        }

        // STEP 2: GPT-based detection (uses training knowledge directly)
        const openai = this.getOpenAI();
        if (!openai) return { isCelebrity: false, category: null, source: 'none' };

        try {
            console.log(`🧠 GPT celebrity check for: ${guest.full_name}`);

            const prompt = `You are identifying if "${guest.full_name}" is a FAMOUS person.

USE YOUR TRAINING KNOWLEDGE. You know millions of celebrities, athletes, musicians, actors, politicians, and famous business people.

CATEGORIES:
- entertainment: musicians, actors, directors, producers, comedians, artists
- sports: professional athletes, olympians, coaches, racing drivers
- media: TV hosts, journalists, YouTubers, major influencers (1M+ followers)
- politics: presidents, prime ministers, ministers, famous politicians
- business: ONLY globally famous CEOs (Elon Musk, Jeff Bezos level - NOT random company owners)

GUEST INFO:
- Name: ${guest.full_name}
- Country hint: ${guest.country || 'Unknown'}

RULES:
1. If you KNOW this person from your training (Wikipedia-level fame), return isCelebrity: true
2. If unsure or the name is too common (e.g. "John Smith"), return isCelebrity: false
3. For entertainment/sports/media: be confident if you recognize the name
4. For business: ONLY true for household-name billionaires/CEOs

Return JSON:
{
  "isCelebrity": true/false,
  "confidence": 0.85-1.0 if you KNOW them, 0.0-0.5 if guessing,
  "category": "entertainment|sports|media|politics|business|null",
  "knownFor": "Their claim to fame in 1-2 sentences, or null",
  "socialMediaPriority": "instagram|twitter|both|null",
  "wikipediaUrl": "https://en.wikipedia.org/wiki/... (if you know it) or null"
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a celebrity identification expert. You have encyclopedic knowledge of famous people worldwide. Answer based on your training data - if you know WHO they are, they are a celebrity. Musicians, athletes, actors, politicians with Wikipedia pages = definitely celebrities.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            }, { timeout: 30000 });

            const result = JSON.parse(response.choices[0].message.content);
            result.source = 'gpt';

            if (result.isCelebrity) {
                console.log(`⭐ CELEBRITY CONFIRMED: ${guest.full_name} - ${result.category} (${Math.round(result.confidence * 100)}%)`);
                console.log(`   → ${result.knownFor}`);
            } else {
                console.log(`👤 Not a celebrity: ${guest.full_name}`);
            }

            // Infer social priority if not set
            if (result.isCelebrity && !result.socialMediaPriority) {
                result.socialMediaPriority = this.inferSocialPriority(result.category);
            }

            return result;
        } catch (error) {
            console.error('Celebrity detection error:', error);
            return { isCelebrity: false, category: null, source: 'error' };
        }
    }

    /**
     * Infer social media priority based on celebrity category
     */
    inferSocialPriority(category) {
        if (category === 'entertainment') return 'instagram';
        if (category === 'sports') return 'instagram';
        if (category === 'politics') return 'twitter';
        if (category === 'business') return 'twitter';
        return 'both';
    }

    /**
     * Determine if we should invest time in social media searches.
     * 
     * BUSINESS RULE:
     * - Celebrities in entertainment/sports/media → YES, search socials
     * - Standard business people → NO, LinkedIn is enough
     * - Unknown (no LinkedIn or celebrity info) → YES, might be influential
     * 
     * This prevents wasting time searching for the personal Instagram of a CEO,
     * which is usually private and not useful for hotel staff.
     */
    shouldSearchSocialMedia(celebrityInfo, linkedinInfo) {
        // If confirmed celebrity in entertainment/sports/media → Always search
        if (celebrityInfo.isCelebrity) {
            const publicCategories = ['entertainment', 'sports', 'media'];
            if (publicCategories.includes(celebrityInfo.category)) {
                console.log(`✅ Social search: Celebrity in ${celebrityInfo.category}`);
                return true;
            }
            // Business/Politics celebrities might still be public figures
            if (celebrityInfo.confidence >= 0.9) {
                console.log(`✅ Social search: High-confidence celebrity (${celebrityInfo.category})`);
                return true;
            }
        }

        // If no LinkedIn found → Search socials as fallback discovery
        if (!linkedinInfo?.bestMatch) {
            console.log(`✅ Social search: No LinkedIn found, using socials as discovery`);
            return true;
        }

        // LinkedIn found for standard business person → Skip personal socials
        console.log(`❌ Social search skipped: Standard business guest with LinkedIn`);
        return false;
    }

    /**
     * Verify if a social media account matches the celebrity status
     * Prevents Jay-Z being matched to an account with 200 followers.
     */
    async verifySocialMediaRelevance(guest, result, celebrityInfo, platform) {
        if (!result || !result.url) return result;

        console.log(`🕵️ Verifying ${platform} for celebrity ${guest.full_name}...`);

        // Rule 1: Verified accounts are usually safe
        // (We can't easily check blue tick without complex scraping, but high followers is a proxy)

        // Rule 2: Follower count sanity check
        const followers = result.followers;

        if (followers !== null) {
            // Thresholds
            const MIN_CELEBRITY_FOLLOWERS = 50000; // 50k
            const SUSPICIOUS_CELEBRITY_FOLLOWERS = 5000; // 5k

            console.log(`📊 Account has ${followers} followers. Celebrity Threshold: ${MIN_CELEBRITY_FOLLOWERS}`);

            if (followers < SUSPICIOUS_CELEBRITY_FOLLOWERS) {
                console.warn(`❌ REJECTED: ${guest.full_name} is a celebrity but this account has only ${followers} followers.`);
                return { url: null, handle: null, followers: null, bio: null };
            }

            if (followers < MIN_CELEBRITY_FOLLOWERS) {
                console.warn(`⚠️ WARNING: Low follower count for a celebrity (${followers}). Keeping but flagging.`);
                // We could ask AI to double check description here if we wanted
            }
        } else {
            // Logic when we couldn't parse followers:
            // If we are SURE it's a huge celebrity (Confidence > 0.9), we might reject unverified/unscraped profiles
            if (celebrityInfo.confidence >= 0.9) {
                console.warn(`⚠️ Could not verify followers for MAJOR celebrity. Proceeding with caution.`);
            }
        }

        return result;
    }

    /**
     * Search for recent news about the guest using SerpAPI
     * Returns relevant news from the last 6 months
     */
    async searchRecentNews(guest) {
        const guestName = guest.full_name;
        try {
            // Try DuckDuckGo first (FREE)
            let articles = await duckDuckGo.search(`"${guestName}" news`);

            if (articles.length === 0) {
                console.log(`📰 No news found via DuckDuckGo, trying Brave fallback...`);
                // Fallback to Brave Search
                articles = await braveSearch.search(`"${guestName}" news`, 5);
            }

            if (articles.length > 0) {
                console.log(`📰 Found ${articles.length} news articles for ${guestName}, verifying relevance...`);

                // VERIFY RELEVANCE WITH AI
                const verifiedArticles = await this.verifyNewsRelevance(guest, articles);

                if (verifiedArticles.length > 0) {
                    console.log(`✅ Verified ${verifiedArticles.length} relevant articles.`);
                    return {
                        articles: verifiedArticles,
                        hasNews: true
                    };
                } else {
                    console.log(`🗑️ All articles discarded as irrelevant to ${guestName}.`);
                }
            }

            console.log(`📰 No verified news articles found for ${guestName}`);
            return { articles: [], hasNews: false };
        } catch (error) {
            console.error('News search error:', error);
            return { articles: [], hasNews: false };
        }
    }

    /**
     * Check if news articles are actually about THIS guest
     */
    async verifyNewsRelevance(guest, articles) {
        const openai = this.getOpenAI();
        if (!openai) return articles; // Fallback if no OpenAI

        try {
            const articlesText = articles.map((a, i) => `[${i}] Title: ${a.title}\nSnippet: ${a.snippet}`).join('\n\n');
            const prompt = `I have found news articles for a guest: "${guest.full_name}".
Help me verify if these articles are about THIS SPECIFIC PERSON or someone else with the same name.

GUEST CONTEXT:
Name: ${guest.full_name}
Company: ${guest.company || 'Unknown'}
Location: ${guest.country || 'Unknown'}
Known Job: ${guest.job_title || 'Unknown'}

ARTICLES FOUND:
${articlesText}

INSTRUCTIONS:
1. Compare the context (company, industry, location) with the article content.
2. If an article is about a crime (fraud, murder, etc.) and the guest context is a reputable business person, ASSUME IT IS A FALSE POSITIVE unless the company/location matches perfectly.
3. Be strict. Better to miss an article than to accuse a guest of a crime.
4. "Leslie Okyere" (Founder NL Connekt) is NOT the "Leslie Okyere" convicted of bank fraud in the US.
5. Return a JSON array of indices that are SAFE and RELEVANT.

Return JSON:
{
  "relevantMetrics": [0, 2] // indices of valid articles
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a strict reputation manager. You filter out news about namesakes.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.0,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            const validIndices = result.relevantMetrics || [];

            return articles.filter((_, i) => validIndices.includes(i));
        } catch (error) {
            console.error('News verification error:', error);
            return []; // Fail safe: return nothing if verification errors
        }
    }


    /**
     * Use AI to select the best match from candidates
     */
    async verifyCandidatesWithAI(guest, candidates) {
        const openai = this.getOpenAI();
        if (!openai || candidates.length === 0) {
            return {
                candidates,
                bestMatch: candidates[0],
                needsReview: candidates.length > 1
            };
        }

        try {
            const candidatesInfo = candidates.map((c, i) =>
                `Candidate ${i}: 
                Name on profile: ${c.profileName || 'Unknown'}
                Title: ${c.title}
                Snippet: ${c.snippet}`
            ).join('\n\n');

            const prompt = `Which of these LinkedIn candidates is the best match for this guest?
            
GUEST INFO:
Name: ${guest.full_name}
Company: ${guest.company || 'Unknown'}
Country: ${guest.country || 'Unknown'}

CANDIDATES:
${candidatesInfo}

INSTRUCTIONS:
1. EXTREEM STRENG OP LOCATIE: Als het land of de regio niet overeenkomt (bijv. Zwitserland vs België), verlaag de confidence direct naar 0, tenzij er expliciet bewijs is van een verhuizing in het profiel.
2. Be EXTREMELY strict. If the company doesn't match and the name is common, it's likely NOT a match.
3. If NOTHING matches perfectly (no company/location match), return bestMatchIndex: null. DO NOT guess based on high status if the location is wrong.
4. CATEGORISCHE AFWIJZING: Als een kandidaat overduidelijk een historisch figuur is (geboren pre-1940), wijs deze dan direct af.
5. If multiple candidates look similar and you are not 90% sure, set bestMatchIndex to null or set matchesIdentity to false so the user MUST review.
6. PREFER SOCIAL PROOF: If one profile has indicators of high status (e.g. "500+ connections", "Director", "Managing Partner") and the other looks junior or incomplete, prefer the high-status one ONLY if the location/company matches.

Return JSON:
{
  "bestMatchIndex": [index of the best match, or null if NO good match],
  "confidence": [0-1 score, be conservative],
  "reason": "short explanation",
  "matchesIdentity": [true if it's almost certainly the same person, false otherwise]
}

NOTE: We are looking for successful business professionals, entrepreneurs, and decision-makers. Priority should be given to candidates whose profile matches the industry or company mentioned.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert at verifying identities across the web. Be strict about matching names and companies.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            const bestIndex = result.bestMatchIndex;

            if (bestIndex !== null && bestIndex >= 0 && bestIndex < candidates.length) {
                const bestMatch = candidates[bestIndex];
                const needsReview = !result.matchesIdentity || result.confidence < 0.8 || candidates.length > 1;

                console.log(`🤖 AI selected Candidate ${bestIndex} with ${Math.round(result.confidence * 100)}% confidence. Reason: ${result.reason}`);

                return {
                    candidates,
                    bestMatch,
                    needsReview,
                    aiVerification: result
                };
            }

            console.log(`🤖 AI found no clear match. Reason: ${result.reason}`);
            return { candidates, bestMatch: null, needsReview: true, aiVerification: result };

        } catch (error) {
            console.error('AI verification error:', error);
            return {
                candidates,
                bestMatch: candidates[0],
                needsReview: candidates.length > 1
            };
        }
    }

    /**
     * Use OpenAI to analyze LinkedIn, News, and Company info to calculate VIP score
     * Generates a comprehensive guest report with confidence levels
     */
    async analyzeWithAI(guest, linkedinInfo, celebrityInfo = null, newsInfo = null, fallbackInfo = null) {
        const openai = this.getOpenAI();
        if (!openai) {
            console.log('OpenAI not configured, using basic scoring');
            return this.basicAnalysis(linkedinInfo, celebrityInfo);
        }

        try {
            // Build context from LinkedIn
            const linkedinContext = linkedinInfo.bestMatch ? `
LINKEDIN DATA:
- Titel: ${linkedinInfo.bestMatch.title}
- Functie: ${linkedinInfo.bestMatch.jobTitle || 'Onbekend'}
- Bedrijf: ${linkedinInfo.bestMatch.company || 'Onbekend'}
- Bio Snippet: ${linkedinInfo.bestMatch.snippet || 'Geen'}` : 'Geen LinkedIn profiel gevonden.';

            // Build context from Fallback (if no LinkedIn)
            let fallbackContext = '';
            if (fallbackInfo) {
                fallbackContext = `
GEVONDEN WEB PROFIEL (AI-geselecteerd):
- Titel: ${fallbackInfo.title}
- Bron: ${fallbackInfo.url}
- Gedetecteerde Functie: ${fallbackInfo.jobTitle || 'Onbekend'}
- Gedetecteerd Bedrijf: ${fallbackInfo.company || 'Onbekend'}
- Snippet: ${fallbackInfo.snippet}`;

                // Include deep-scraped content if available (MUCH RICHER DATA!)
                if (fallbackInfo.deepContent) {
                    fallbackContext += `

VOLLEDIGE WEBSITE INHOUD (Deep Scraped):
${fallbackInfo.deepContent.substring(0, 6000)}`;
                }
            }

            // Build celebrity context
            const celebrityContext = celebrityInfo?.isCelebrity ? `
KNOWLEDGE GRAPH DATA (CELEBRITY):
- Categorie: ${celebrityInfo.category || 'Onbekend'}
- Bekend van: ${celebrityInfo.knownFor || 'Onbekend'}
- Vermelding: ${celebrityInfo.detailedDescription || 'Nvt'}` : '';

            // Build news context
            const newsContext = newsInfo?.hasNews ? `
RECENT NIEUWS (Laatste 6 maanden):
${newsInfo.articles.map(a => `- ${a.title} (${a.source}): ${a.snippet}`).join('\n')}` : 'Geen recent nieuws gevonden.';

            // Build company context
            const companyContext = guest.company_info ? `
BEDRIJFS DATA:
- Naam: ${guest.company_info.name}
- Industry: ${guest.company_info.industry || 'Onbekend'}
- Grootte: ${guest.company_info.size || 'Onbekend'}
- Beschrijving: ${guest.company_info.description || 'Onbekend'}
${guest.company_info.deep_info ? `
WEBSITE ANALYSE:
- Missie: ${guest.company_info.deep_info.mission}
- Diensten: ${guest.company_info.deep_info.products_services?.join(', ')}
- Doelgroep: ${guest.company_info.deep_info.target_market}` : ''}` : '';

            const prompt = `Je bent een VIP-gastanalist voor een 5-sterren luxe hotel. Analyseer de data over "${guest.full_name}" en schrijf een professioneel rapport.

--- STRIKTE REGELS ---
1. GEEN SPECULATIE: Vermeld alleen wat direct uit de data blijkt.
2. GEEN FLUFF: Schrijf feitelijk en zakelijk. Geen standaard openingszinnen of beleefdheidsvormen.
3. NATUURLIJKE TEKST: Vermijd het woord "null" of "onbekend" in de rapport-текsten. Als informatie er niet is, laat het dan gewoon achterwege uit het verhaal. Geen lege plekken of gaten in opsommingen.
4. FORMATTERING: Gebruik voor getallen (zoals volgers) compacte notaties (bijv. 18k in plaats van 18.000).
5. GEPERSONALISEERDE AANBEVELINGEN: Maak de service aanbevelingen echt specifiek voor deze persoon. Geen algemene "wees beleefd" adviezen, maar acties gebaseerd op hun interesses, rol of recente prestaties.
6. CONFIDENCE SCORING: Geef voor elk belangrijk veld een confidence score ("high", "medium", "low").
7. KRITISCHE BLIK & ANTI-HISTORIE: Wees extreem kritisch op de bronnen. Is dit echt de levende persoon die nu in ons hotel verblijft? 
   - HISTORISCHE FIGUREN: Als je data ziet over mensen geboren in de 19e of vroege 20e eeuw (bijv. 1882), of mensen die al lang overleden zijn: NEGEER DEZE COMPLEET. Rapporteer GEEN geschiedenisles.
   - NAAMGENOTEN: Als de naam veelvoorkomend is en er is geen match met land/bedrijf, neem dan aan dat het een naamgenoot is en rapporteer niets. 
   - RESULTAAT BIJ GEEN INFO: Als er geen actuele, relevante informatie is over de gast als levende persoon, zet dan alle velden op "null" of "Geen informatie gevonden" en zet noResultsFound op true. Rapporteer NOOIT over iemand anders alleen omdat de naam hetzelfde is.
8. FOCUS OP VIP STATUS: We zoeken werkervaring, vermogen, titels en invloed van de HUIDIGE persoon.

--- DATA INPUT ---
NAAM: ${guest.full_name}
LAND: ${guest.country || 'Onbekend'}
NOTITIES: ${guest.notes || 'Geen'}

${linkedinContext}
${fallbackContext}
${celebrityContext}
${newsContext}
${companyContext}

--- OUTPUT FORMAT (JSON) ---
{
  "vip_score": { "value": 1-10, "confidence": "high/medium/low", "reason": "..." },
  "industry": { "value": "...", "confidence": "..." },
  "company_size": { "value": "Micro/Klein/Middelgroot/Groot", "confidence": "..." },
  "is_owner": { "value": true/false/null, "confidence": "..." },
  "employment_type": { "value": "...", "confidence": "..." },
  "influence_level": { "value": "Laag/Gemiddeld/Hoog/VIP", "confidence": "..." },
  "net_worth_estimate": { "value": "...", "confidence": "..." },
  "notable_info": "Max 150 tekens samenvatting",
  "full_report": {
    "executive_summary": "Krachtige samenvatting van 2-3 zinnen.",
    "professional_background": {
      "current_role": "Huidige functie en verantwoordelijkheden",
      "career_trajectory": "Korte beschrijving van carrièrepad",
      "industry_expertise": "Expertisegebieden",
      "notable_achievements": "Belangrijke prestaties"
    },
    "company_analysis": {
      "company_name": "Bedrijfsnaam",
      "company_description": "Wat doet het bedrijf",
      "company_position": "Marktpositie",
      "employee_count": "Aantal werknemers indien bekend"
    },
    "vip_indicators": {
      "wealth_signals": "Indicaties van vermogen",
      "influence_factors": "Factoren die invloed aangeven",
      "status_markers": "Statusmarkers zoals titels"
    },
    "service_recommendations": {
      "priority_level": "Standaard/Verhoogd/VIP/Ultra-VIP",
      "quick_win": "De meest impactvolle directe actie (max 100 tekens). Bijv: 'Feliciteer met recente beursgang van [Bedrijf]'.",
      "categories": [
        {
          "title": "Persoonlijke Aandacht",
          "items": ["Concrete tip 1", "Concrete tip 2"]
        },
        {
          "title": "Gespreksonderwerpen & Nieuws",
          "items": ["Refereer aan [Nieuwsfeit]", "Vraag naar [Interesse]"]
        },
        {
          "title": "Gastvrijheid & Attenties",
          "items": ["Suggestie voor drankje/cadeau", "Specifieke kamer-aanpassing"]
        }
      ]
    },
    "additional_notes": "Eventuele extra relevante informatie"
  }
} `;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Je bent een meedogenloos feitelijke VIP-analist. Je haat fluff en speculatie. Je rapporteert alleen wat bewezen is.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 2500,
                response_format: { type: "json_object" }
            }, { timeout: 45000 });

            const content = response.choices[0]?.message?.content;
            if (!content) return this.basicAnalysis(linkedinInfo);

            const result = JSON.parse(content);

            // Flatten generic fields for backward compatibility while keeping confidence data
            return {
                ...result,
                vip_score: result.vip_score.value,
                industry: result.industry.value,
                company_size: result.company_size.value,
                is_owner: result.is_owner.value,
                employment_type: result.employment_type.value,
                influence_level: result.influence_level.value,
                net_worth_estimate: result.net_worth_estimate.value,
                confidence_scores: {
                    vip_score: result.vip_score.confidence,
                    industry: result.industry.confidence,
                    is_owner: result.is_owner.confidence
                }
            };
        } catch (error) {
            console.error('AI analysis error:', error);
            return this.basicAnalysis(linkedinInfo);
        }
    }


    /**
     * Specialized analysis that incorporates manual research findings provided by the user.
     * Combines existing research results with new findings to create a superior report.
     */
    async analyzeWithCustomInput(guest, existingResearch, customInput) {
        const openai = this.getOpenAI();
        if (!openai) {
            console.log('OpenAI not configured for custom analysis');
            return null;
        }

        try {
            // Build context from existing research
            const existingContext = `
BESTAANDE RESEARCH DATA:
- Job Title: ${existingResearch.job_title || 'Onbekend'}
- Bedrijf: ${existingResearch.company_name || 'Onbekend'}
- Industry: ${existingResearch.industry || 'Onbekend'}
- VIP Score: ${existingResearch.vip_score || '5'}
- LinkedIn: ${existingResearch.linkedin_url || 'Niet gevonden'}
- Instagram: ${existingResearch.instagram_handle || 'Niet gevonden'}
- Twitter: ${existingResearch.twitter_handle || 'Niet gevonden'}
- Samenvatting: ${existingResearch.notable_info || 'Geen'}
- Full Report (bestaand): ${existingResearch.full_report ? 'Beschikbaar' : 'Niet beschikbaar'}
`;

            const prompt = `Je bent een VIP-gastanalist voor een 5-sterren luxe hotel. Een collega heeft HANDMATIG aanvullende informatie gevonden over een gast. Jouw taak is om deze nieuwe informatie te combineren met de bestaande research data om een premium rapport te genereren.

GASTINFORMATIE:
Naam: ${guest.full_name}
Land: ${guest.country || 'Onbekend'}
${guest.notes ? `Hotel opmerkingen: ${guest.notes}` : ''}

${existingContext}

NIEUWE HANDMATIG GEVONDEN INFORMATIE (PRIORITEIT):
${customInput}

INSTRUCTIES:
1. De NIEUWE HANDMATIGE INFORMATIE is leidend en vaak actueler of specifieker.
2. Schrijf feitelijk en zakelijk. GEEN SPECULATIE of fluff.
3. GEEN NULL: Gebruik nooit het woord "null" in de beschrijvende teksten. Als informatie ontbreekt, laat het weg uit het verhaal zodat het natuurlijk leest.
4. GETALLEN: Formatteer getallen compact (bijv. 10k, 5m).
5. GEPERSONALISEERDE AANBEVELINGEN: Maak deze zeer specifiek en uitgebreid gebaseerd op alle info.
6. Schrijf in professioneel Nederlands.
7. Het rapport moet zeer gedetailleerd zijn voor hotel management.

Genereer een GEDETAILLEERD JSON-antwoord:
{
  "vip_score": [bijgewerkte 1-10 score],
  "industry": "[sector]",
  "company_size": "[Micro/Klein/Middelgroot/Groot]",
  "is_owner": [true/false/null],
  "employment_type": "[Eigenaar/CEO/Directeur/Manager/etc]",
  "notable_info": "[korte bijgewerkte samenvatting, max 150 tekens]",
  "influence_level": "[Laag/Gemiddeld/Hoog/VIP]",
  "net_worth_estimate": "[bijgewerkt geschat vermogen if applicable]",
  "full_report": {
    "executive_summary": "[nieuwe samenvatting]",
    "professional_background": {
      "current_role": "[details]",
      "career_trajectory": "[details]",
      "industry_expertise": "[details]",
      "notable_achievements": "[details]"
    },
    "company_analysis": {
      "company_name": "[bedrijfsnaam]",
      "company_description": "[details]",
      "company_position": "[details]",
      "estimated_revenue": "[details]",
      "employee_count": "[details]"
    },
    "vip_indicators": {
      "wealth_signals": "[details]",
      "influence_factors": "[details]",
      "status_markers": "[details]"
    },
    "service_recommendations": {
      "priority_level": "[Standaard/Verhoogd/VIP/Ultra-VIP]",
      "quick_win": "[Meest impactvolle directe actie]",
      "categories": [
        {
          "title": "Gecombineerde Inzichten",
          "items": ["[item]", "[item]"]
        },
        {
          "title": "Nieuwe Kansen",
          "items": ["[item]", "[item]"]
        }
      ]
    },
    "additional_notes": "[gecombineerde extra relevante informatie]"
  }
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o', // Use GPT-4o for more critical custom analysis
                messages: [
                    { role: 'system', content: 'Je bent een expert VIP-gastanalist. Je integreert handmatige data met automatische research tot een premium gastrapport.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 2500,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return null;

            return JSON.parse(content);
        } catch (error) {
            console.error('Custom AI analysis error:', error);
            return null;
        }
    }

    /**
     * Basic analysis when AI is not available
     */
    basicAnalysis(linkedinInfo, celebrityInfo = null) {
        // Celebrities get higher base score
        const baseScore = celebrityInfo?.isCelebrity ? 8 : 5;
        const influenceLevel = celebrityInfo?.isCelebrity ? 'VIP' : 'Gemiddeld';

        if (linkedinInfo?.bestMatch) {
            return {
                vip_score: celebrityInfo?.isCelebrity ? 9 : 6,
                industry: celebrityInfo?.category || null,
                notable_info: celebrityInfo?.knownFor || linkedinInfo.bestMatch.snippet?.substring(0, 150),
                influence_level: influenceLevel,
                net_worth_estimate: null
            };
        }
        return {
            vip_score: baseScore,
            industry: celebrityInfo?.category || null,
            notable_info: celebrityInfo?.knownFor || null,
            influence_level: influenceLevel,
            net_worth_estimate: null
        };
    }

    /**
     * Main search function for guest research
     * FREE-FIRST STRATEGY: 
     * 1. Knowledge Graph (Instant Celeb Detection)
     * 2. DuckDuckGo (Free-with-Captcha research)
     * 3. AI Evaluation
     * 4. Brave Search (Premium Fallback)
     */
    async searchGuest(guest) {
        console.log(`🔍 Researching: ${guest.full_name}`);

        // ============================================
        // STEP 1: Knowledge Graph (INSTANT FREE CHECK)
        // ============================================
        console.log('📚 Checking Knowledge Graph for celebrity status...');
        const celebrityInfo = await this.detectCelebrity(guest);

        // If it's a high-confidence celebrity, we still want socials but might skip heavy generic search
        let searchResults = [];
        let aiResult = null;
        let linkedinInfo = { candidates: [], bestMatch: null, needsReview: false };
        let fallbackMatch = null;

        // ============================================
        // CELEBRITY EARLY-EXIT: Skip LinkedIn for entertainment/sports/media
        // These categories don't need professional background - their fame IS the info.
        // Business and politics still get LinkedIn search (professional context is relevant).
        // ============================================
        const skipLinkedInCategories = ['entertainment', 'sports', 'media'];
        if (celebrityInfo.isCelebrity && celebrityInfo.confidence >= 0.85 &&
            skipLinkedInCategories.includes(celebrityInfo.category)) {
            console.log(`🌟 ${celebrityInfo.category.toUpperCase()} celebrity detected: ${celebrityInfo.knownFor}`);
            console.log(`⏭️ Skipping LinkedIn search - celebrity status is sufficient.`);
            // Go directly to finalizeResearch which handles social media for celebrities
            return this.finalizeResearch(guest, linkedinInfo, celebrityInfo, null);
        }

        // ============================================
        // STEP 2: DuckDuckGo Multi-Search (FREE PRIMARY)
        // ============================================
        console.log('🦆 Starting free-tier research (DuckDuckGo)...');
        const ddgResults = await duckDuckGo.multiSearch(guest);

        if (ddgResults.length > 0) {
            console.log(`🔍 Evaluating ${ddgResults.length} DuckDuckGo results via AI...`);
            aiResult = await this.selectBestMatchWithAI(guest, ddgResults);

            if (aiResult && aiResult.confidence >= 0.8) {
                console.log(`✨ Confident match found via DuckDuckGo! (${Math.round(aiResult.confidence * 100)}%)`);
                fallbackMatch = aiResult;

                // Check if it's a LinkedIn profile
                if (aiResult.url?.includes('linkedin.com/in/')) {
                    linkedinInfo.bestMatch = {
                        url: aiResult.url,
                        title: aiResult.title,
                        snippet: aiResult.snippet,
                        jobTitle: aiResult.jobTitle,
                        company: aiResult.company
                    };
                    linkedinInfo.candidates = [linkedinInfo.bestMatch];
                    fallbackMatch = null;
                    console.log('💼 Found LinkedIn profile via DuckDuckGo!');

                    // DEEP SCRAPE LINKEDIN FOR REAL HEADLINE
                    const realHeadline = await duckDuckGo.scrapeLinkedInHeadline(aiResult.url);
                    if (realHeadline) {
                        console.log(`📝 Enriched with real headline: "${realHeadline}"`);
                        // Parse headline into job/company
                        const headlineParts = realHeadline.split(' - ');
                        if (headlineParts.length >= 2) {
                            linkedinInfo.bestMatch.jobTitle = headlineParts[0].trim();
                            linkedinInfo.bestMatch.company = headlineParts.slice(1).join(' - ').trim();
                        } else {
                            linkedinInfo.bestMatch.jobTitle = realHeadline;
                        }
                    }

                    // IF WE HAVE A CONFIDENT MATCH, WE STOP HERE (Cost Control)
                    return this.finalizeResearch(guest, linkedinInfo, celebrityInfo, fallbackMatch);
                }
            }
        }

        // ============================================
        // STEP 3: Brave Search (PREMIUM FALLBACK)
        // ============================================
        // Only run if we don't have a high-confidence LinkedIn match yet
        if (!linkedinInfo.bestMatch) {
            console.log('🔄 No confident match found via DDG, falling back to Brave Search...');
            const braveResults = await braveSearch.multiSearch(guest);

            if (braveResults.length > 0) {
                console.log(`🔍 Evaluating ${braveResults.length} Brave results via AI...`);
                const braveAiMatch = await this.selectBestMatchWithAI(guest, braveResults);

                if (braveAiMatch && (!aiResult || braveAiMatch.confidence > aiResult.confidence)) {
                    console.log(`🦁 Brave found a better match! (${Math.round(braveAiMatch.confidence * 100)}%)`);
                    aiResult = braveAiMatch;
                    fallbackMatch = aiResult;

                    if (aiResult.url?.includes('linkedin.com/in/')) {
                        linkedinInfo.bestMatch = {
                            url: aiResult.url,
                            title: aiResult.title,
                            snippet: aiResult.snippet,
                            jobTitle: aiResult.jobTitle,
                            company: aiResult.company
                        };
                        linkedinInfo.candidates = [linkedinInfo.bestMatch];
                        fallbackMatch = null;
                    }
                }
            }
        }

        return this.finalizeResearch(guest, linkedinInfo, celebrityInfo, fallbackMatch);
    }

    /**
     * Helper to wrap up the research process
     */
    async finalizeResearch(guest, linkedinInfo, celebrityInfo, fallbackMatch) {
        // Deep scrape if it's a fallback match (not LinkedIn)
        if (fallbackMatch && fallbackMatch.url && !fallbackMatch.url.includes('linkedin.com')) {
            const deepContent = await duckDuckGo.fetchPageContent(fallbackMatch.url, 8000);
            if (deepContent) {
                fallbackMatch.deepContent = deepContent;
            }
        }

        // ============================================
        // STEP 3: Email Domain Analysis (BONUS INFO)
        // ============================================
        let emailDomainInfo = null;
        if (guest.email) {
            emailDomainInfo = await this.extractCompanyFromEmail(guest);
        }

        // Note: celebrityInfo is already fetched at the start of searchGuest and passed here


        // Initialize social media results
        let instagramResult = { url: null, handle: null, followers: null };
        let twitterResult = { url: null, handle: null, followers: null };
        // -----------------------------------------------
        // STEP 2: CELEBRITY DETECTION (EARLY EXIT)
        // -----------------------------------------------
        // If we are 100% sure it is a celebrity (e.g. via Knowledge Graph), we might skip detailed LinkedIn hunting
        // or ensure we only accept social accounts that MATCH that celebrity status.

        if (celebrityInfo.isCelebrity && celebrityInfo.confidence >= 0.9) {
            console.log(`🌟 Confirmed Celebrity: ${guest.full_name} (${celebrityInfo.knownFor}). Adjusting search strategy...`);
            // We can still try to find socials, but we must be VERY STRICT.
        }

        // ============================================
        // STEP 3: SOCIAL MEDIA DISCOVERY
        // ============================================
        // BUSINESS RULE: Skip social media for standard business people.
        // Their Instagram/Twitter is likely personal and not useful for hotel staff.
        // Only search socials for:
        // - Confirmed celebrities (entertainment, sports, media)
        // - People with public online presence (high VIP score indicators)

        const shouldSearchSocials = this.shouldSearchSocialMedia(celebrityInfo, linkedinInfo);

        if (shouldSearchSocials) {
            console.log(`🔍 Searching social media presence...`);

            // Determine priority based on celebrity type (or default)
            const priority = celebrityInfo.socialMediaPriority || 'both';

            if (priority === 'instagram' || priority === 'both') {
                instagramResult = await this.searchInstagram(guest);
                // Verify celebrity socials
                if (celebrityInfo.isCelebrity) {
                    instagramResult = await this.verifySocialMediaRelevance(guest, instagramResult, celebrityInfo, 'instagram');
                }
            }

            if (priority === 'twitter' || priority === 'both') {
                twitterResult = await this.searchTwitter(guest);
                // Verify celebrity socials
                if (celebrityInfo.isCelebrity) {
                    twitterResult = await this.verifySocialMediaRelevance(guest, twitterResult, celebrityInfo, 'twitter');
                }
            }

            // If nothing found on priority platform, try the other as fallback
            if (priority === 'instagram' && !instagramResult.url) {
                twitterResult = await this.searchTwitter(guest);
            } else if (priority === 'twitter' && !twitterResult.url) {
                instagramResult = await this.searchInstagram(guest);
            }
        } else {
            console.log(`📋 Skipping social media search for business guest (LinkedIn is sufficient)`);
        }
        // -----------------------------------------------

        // --- NEW: News Research ---
        const newsInfo = await this.searchRecentNews(guest);
        // --------------------------

        // --- Company Research ---
        // SKIP for entertainment/sports/media celebrities - they don't need business data
        let companyInfo = null;
        const skipCompanyCategories = ['entertainment', 'sports', 'media'];
        const shouldSkipCompanyResearch = celebrityInfo.isCelebrity &&
            celebrityInfo.confidence >= 0.85 &&
            skipCompanyCategories.includes(celebrityInfo.category);

        if (shouldSkipCompanyResearch) {
            console.log(`⏭️ Skipping company research for ${celebrityInfo.category} celebrity`);
        } else if (guest.company || (linkedinInfo.bestMatch && linkedinInfo.bestMatch.company)) {
            const targetCompany = guest.company || linkedinInfo.bestMatch.company;
            console.log(`🏢 Researching company: ${targetCompany}`);
            // Pass guest context for regional filtering
            companyInfo = await companyScraper.searchCompany(targetCompany, {
                guestCountry: guest.country,
                guestCity: guest.city || null
            });

            if (companyInfo && companyInfo.website) {
                // Get deeper website info if possible
                const deepInfo = await companyScraper.scrapeWebsite(companyInfo.website);
                if (deepInfo) {
                    companyInfo.deep_info = deepInfo;
                }
            }
        }
        guest.company_info = companyInfo; // Pass to AI analysis
        // -----------------------------

        // Analyze with AI (include celebrity info and news for better context)
        const analysis = await this.analyzeWithAI(guest, linkedinInfo, celebrityInfo, newsInfo, fallbackMatch);
        console.log(`🤖 AI Analysis: VIP Score ${analysis.vip_score}`);

        // Get best LinkedIn data
        const bestMatch = linkedinInfo.bestMatch;

        // 📸 PHOTO SELECTION 
        // Priority: 1. Knowledge Graph (celebrities), 2. Instagram thumbnail, 3. Twitter thumbnail, 4. None
        let profilePhotoUrl = null;

        if (celebrityInfo.isCelebrity && celebrityInfo.officialImage) {
            console.log(`🖼️ Using official Knowledge Graph image for ${guest.full_name}`);
            profilePhotoUrl = celebrityInfo.officialImage;
        } else if (instagramResult.profilePhoto) {
            console.log(`🖼️ Using Instagram profile photo for ${guest.full_name}`);
            profilePhotoUrl = instagramResult.profilePhoto;
        } else if (twitterResult.profilePhoto) {
            console.log(`🖼️ Using Twitter profile photo for ${guest.full_name}`);
            profilePhotoUrl = twitterResult.profilePhoto;
        } else {
            console.log(`🖼️ No profile photo found for ${guest.full_name}`);
        }

        // Calculate total followers for VIP scoring
        const totalFollowers = (instagramResult.followers || 0) + (twitterResult.followers || 0);

        // Prioritize job title and company from social media if LinkedIn not available
        const effectiveJobTitle = bestMatch?.jobTitle ||
            fallbackMatch?.jobTitle ||
            twitterResult.jobTitle ||
            instagramResult.jobTitle ||
            celebrityInfo.knownFor ||
            null;

        const effectiveCompany = bestMatch?.company ||
            fallbackMatch?.company ||
            twitterResult.company ||
            instagramResult.company ||
            guest.company;

        // Combine location info - prefer Twitter which often has location in bio
        const socialMediaLocation = twitterResult.location || instagramResult.location || null;

        // Get website from social media if not found elsewhere, or from company info
        const effectiveWebsite = companyInfo?.website ||
            fallbackMatch?.url ||
            twitterResult.linkedWebsite ||
            instagramResult.linkedWebsite ||
            null;

        // Use linked Instagram from Twitter if we didn't find Instagram directly
        if (!instagramResult.url && twitterResult.linkedInstagram) {
            console.log(`📸 Using Instagram link from Twitter: @${twitterResult.linkedInstagram}`);
            instagramResult = {
                ...instagramResult,
                url: `https://instagram.com/${twitterResult.linkedInstagram}`,
                handle: twitterResult.linkedInstagram
            };
        }

        // Use linked Twitter from Instagram if we didn't find Twitter directly
        if (!twitterResult.url && instagramResult.linkedTwitter) {
            console.log(`🐦 Using Twitter link from Instagram: @${instagramResult.linkedTwitter}`);
            twitterResult = {
                ...twitterResult,
                url: `https://x.com/${instagramResult.linkedTwitter}`,
                handle: instagramResult.linkedTwitter
            };
        }

        // Check if we found ANY significant data
        const noResultsFound = !bestMatch &&
            !celebrityInfo.isCelebrity &&
            newsInfo.articles?.length === 0 &&
            !instagramResult.url &&
            !twitterResult.url &&
            !fallbackMatch &&
            !guest.company_info?.deep_info;

        if (noResultsFound) {
            console.log(`⚠️ No significant information found for ${guest.full_name}`);
        }

        // Build results object with comprehensive social media data
        return {
            profilePhotoUrl: profilePhotoUrl,
            jobTitle: effectiveJobTitle,
            companyName: effectiveCompany,
            companySize: emailDomainInfo?.companySize || analysis.company_size || null,
            isOwner: emailDomainInfo?.isOwner ?? analysis.is_owner,
            ownerReason: emailDomainInfo?.ownerReason || null,
            employmentType: analysis.employment_type || null,
            industry: analysis.industry || celebrityInfo.category,
            linkedinUrl: bestMatch?.url || null,
            linkedinConnections: null,
            linkedinCandidates: linkedinInfo.candidates,
            needsLinkedInReview: linkedinInfo.needsReview,

            // Instagram data
            instagramUrl: instagramResult.url,
            instagramHandle: instagramResult.handle,
            instagramFollowers: instagramResult.followers,
            instagramBio: instagramResult.bio || null,
            instagramLocation: instagramResult.location || null,

            // Twitter data
            twitterUrl: twitterResult.url,
            twitterHandle: twitterResult.handle,
            twitterFollowers: twitterResult.followers,
            twitterBio: twitterResult.bio || null,
            twitterLocation: twitterResult.location || null,
            twitterMemberSince: twitterResult.memberSince || null,

            // Combined/derived data
            socialMediaLocation: socialMediaLocation,

            facebookUrl: null,
            youtubeUrl: null,
            websiteUrl: effectiveWebsite,
            notableInfo: analysis.notable_info,
            fullReport: analysis.full_report || null,
            pressMentions: null,
            netWorthEstimate: analysis.net_worth_estimate,
            followersEstimate: formatNumber(totalFollowers),
            vipScore: analysis.vip_score,
            influenceLevel: analysis.influence_level,
            isCelebrity: celebrityInfo.isCelebrity,
            celebrityCategory: celebrityInfo.category,
            rawResults: [
                { type: 'linkedin_search', data: linkedinInfo },
                { type: 'celebrity_detection', data: celebrityInfo },
                { type: 'news_search', data: newsInfo },
                { type: 'instagram_search', data: instagramResult },
                { type: 'twitter_search', data: twitterResult },
                { type: 'google_fallback', data: fallbackMatch },
                { type: 'email_domain', data: emailDomainInfo },
                { type: 'ai_analysis', data: analysis }
            ],
            emailDomainInfo: emailDomainInfo,
            newsArticles: newsInfo.articles || [],
            confidenceScores: analysis.confidence_scores || null,
            noResultsFound: noResultsFound
        };
    }
}

module.exports = new SmartSearchService();
