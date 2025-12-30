const OpenAI = require('openai');
const companyScraper = require('./companyScraper');

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
            // 1. Initial Strict Search (Name + Company)
            let query = `site:linkedin.com/in "${guest.full_name}"`;
            if (guest.company) query += ` "${guest.company}"`;
            if (guest.country) query += ` ${guest.country}`;

            let candidates = await this.performSerpApiSearch(query, guest.full_name);

            // 2. If no strict match, try Name + Country (no company)
            if (candidates.length === 0 && guest.company) {
                console.log(`🔍 Strict search failed, trying broader search for ${guest.full_name}`);
                query = `site:linkedin.com/in "${guest.full_name}"`;
                if (guest.country) query += ` ${guest.country}`;
                candidates = await this.performSerpApiSearch(query, guest.full_name);
            }

            // 3. If still no candidates, try Name alone but with focus on the person
            if (candidates.length === 0) {
                console.log(`🔍 Broader search failed, trying namespaced search for ${guest.full_name}`);
                query = `site:linkedin.com/in "${guest.full_name}"`;
                candidates = await this.performSerpApiSearch(query, guest.full_name);
            }

            console.log(`📋 Found ${candidates.length} LinkedIn candidate(s)`);

            if (candidates.length === 0) {
                return { candidates: [], bestMatch: null, needsReview: false };
            }

            // 4. Verify candidates with AI for better accuracy
            const verifiedResults = await this.verifyCandidatesWithAI(guest, candidates);

            return verifiedResults;
        } catch (error) {
            console.error('SerpAPI LinkedIn search error:', error);
            return { candidates: [], bestMatch: null, needsReview: false };
        }
    }

    /**
     * Helper to perform the actual SerpAPI search
     */
    async performSerpApiSearch(query, guestName) {
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=8`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();

        if (data.error) {
            console.error('SerpAPI error:', data.error);
            return [];
        }

        const linkedinResults = data.organic_results?.filter(r =>
            r.link?.includes('linkedin.com/in/')
        ) || [];

        // Stricter filtering: Name must be present in title or snippet
        const nameParts = guestName.toLowerCase()
            .split(/[^a-z0-9]+/i)
            .filter(part => part.length > 2); // Only count parts longer than 2 chars to avoid common initials/prepositions

        return linkedinResults
            .filter(result => {
                const text = (result.title + ' ' + result.snippet).toLowerCase();
                // Check if important parts of the name are present
                if (nameParts.length === 0) return true; // Fallback for very short names

                // For better UX, we require at least the first and last "significant" name parts
                const firstPart = nameParts[0];
                const lastPart = nameParts[nameParts.length - 1];

                return text.includes(firstPart) && text.includes(lastPart);
            })
            .map((result, index) => {
                // Extract name from title (LinkedIn titles are usually "Name - Title - Company | LinkedIn")
                const titleParts = result.title?.split(/[–—|]/);
                const profileName = titleParts ? titleParts[0]?.replace(' - LinkedIn', '').trim() : null;

                // Extract job title and company from title
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
                    profileName: profileName,
                    snippet: result.snippet,
                    thumbnail: result.thumbnail || null,
                    jobTitle: jobTitle,
                    company: company
                };
            });
    }

    /**
     * Search for Instagram profile using SerpAPI
     * Prioritizes verified/official accounts for celebrities
     * Returns comprehensive profile data including bio, location, etc.
     */
    async searchInstagram(guest) {
        if (!process.env.SERPAPI_KEY) {
            return { url: null, handle: null, followers: null, bio: null, location: null, linkedTwitter: null };
        }

        try {
            // For celebrities, search with "official" or verified indicators
            const searchQueries = [
                `site:instagram.com "${guest.full_name}" official`,
                `site:instagram.com "${guest.full_name}"`,
                `"${guest.full_name}" instagram official account`
            ];

            for (const query of searchQueries) {
                const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=10`;
                const response = await this.fetchWithTimeout(url);
                const data = await response.json();

                if (data.error) {
                    console.error('SerpAPI Instagram search error:', data.error);
                    continue;
                }

                const instagramResults = data.organic_results?.filter(r =>
                    r.link?.includes('instagram.com/') &&
                    !r.link?.includes('/p/') && // Skip posts
                    !r.link?.includes('/reel/') && // Skip reels
                    !r.link?.includes('/stories/') // Skip stories
                ) || [];

                // Extract handle from URL
                for (const result of instagramResults) {
                    const handleMatch = result.link.match(/instagram\.com\/([^\/\?]+)/);
                    if (handleMatch && handleMatch[1] !== 'explore' && handleMatch[1] !== 'accounts') {
                        const handle = handleMatch[1];

                        // Verify this is the right person with AI
                        const isMatch = await this.verifySocialProfile(guest, {
                            platform: 'Instagram',
                            handle: handle,
                            title: result.title,
                            snippet: result.snippet
                        });

                        if (isMatch) {
                            // Extract comprehensive profile data
                            const profileData = await this.extractInstagramProfileData(handle, result, guest);

                            console.log(`📸 Instagram found: @${handle}`);
                            if (profileData.bio) console.log(`   📝 Bio: ${profileData.bio.substring(0, 50)}...`);
                            if (profileData.location) console.log(`   📍 Location: ${profileData.location}`);

                            return profileData;
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
            // Parse followers from snippet
            const followersMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*[MK]?\s*[Ff]ollowers/i);
            if (followersMatch) {
                profileData.followers = this.parseFollowerCount(followersMatch[0]);
            }

            // Parse following count
            const followingMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*[Ff]ollowing/i);
            if (followingMatch) {
                profileData.following = this.parseFollowerCount(followingMatch[0]);
            }

            // Parse posts count
            const postsMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*[MK]?\s*[Pp]osts/i);
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
        if (!process.env.SERPAPI_KEY) {
            return { url: null, handle: null, followers: null, bio: null, location: null, memberSince: null, linkedInstagram: null };
        }

        try {
            // Search both twitter.com and x.com domains
            const searchQueries = [
                `(site:twitter.com OR site:x.com) "${guest.full_name}" official`,
                `(site:twitter.com OR site:x.com) "${guest.full_name}"`,
                `"${guest.full_name}" twitter official account`
            ];

            for (const query of searchQueries) {
                const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=10`;
                const response = await this.fetchWithTimeout(url);
                const data = await response.json();

                if (data.error) {
                    console.error('SerpAPI Twitter search error:', data.error);
                    continue;
                }

                const twitterResults = data.organic_results?.filter(r =>
                    (r.link?.includes('twitter.com/') || r.link?.includes('x.com/')) &&
                    !r.link?.includes('/status/') && // Skip individual tweets
                    !r.link?.includes('/i/') // Skip internal pages
                ) || [];

                // Extract handle from URL
                for (const result of twitterResults) {
                    const handleMatch = result.link.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
                    if (handleMatch &&
                        handleMatch[1] !== 'search' &&
                        handleMatch[1] !== 'explore' &&
                        handleMatch[1] !== 'home' &&
                        handleMatch[1] !== 'i') {
                        const handle = handleMatch[1];

                        // Verify this is the right person with AI
                        const isMatch = await this.verifySocialProfile(guest, {
                            platform: 'Twitter/X',
                            handle: handle,
                            title: result.title,
                            snippet: result.snippet
                        });

                        if (isMatch) {
                            // Extract comprehensive profile data
                            const profileData = await this.extractTwitterProfileData(handle, result, guest);

                            console.log(`🐦 Twitter/X found: @${handle}`);
                            if (profileData.bio) console.log(`   📝 Bio: ${profileData.bio.substring(0, 50)}...`);
                            if (profileData.location) console.log(`   📍 Location: ${profileData.location}`);
                            if (profileData.linkedInstagram) console.log(`   📸 Linked Instagram: ${profileData.linkedInstagram}`);

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
            // Parse followers from snippet
            const followersMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*[MK]?\s*[Ff]ollowers/i);
            if (followersMatch) {
                profileData.followers = this.parseFollowerCount(followersMatch[0]);
            }

            // Parse following count
            const followingMatch = searchResult.snippet?.match(/(\d+(?:[.,]\d+)?)\s*[MK]?\s*[Ff]ollowing/i);
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

            // Try to get more details with a dedicated Twitter profile search
            const profileSearchUrl = `https://serpapi.com/search.json?engine=google&q=site:x.com/${handle} OR site:twitter.com/${handle}&api_key=${process.env.SERPAPI_KEY}&num=5`;
            const profileResponse = await this.fetchWithTimeout(profileSearchUrl);
            const profileSearchData = await profileResponse.json();

            if (profileSearchData.organic_results?.length > 0) {
                // Look for the main profile result
                const mainProfile = profileSearchData.organic_results.find(r =>
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
     * Parse follower count strings like "10M followers", "5.2K followers"
     */
    parseFollowerCount(str) {
        if (!str) return null;
        const match = str.match(/(\d+(?:[.,]\d+)?)\s*([MKmk])?/);
        if (!match) return null;

        let num = parseFloat(match[1].replace(',', '.'));
        const multiplier = match[2]?.toUpperCase();

        if (multiplier === 'M') num *= 1000000;
        else if (multiplier === 'K') num *= 1000;

        return Math.round(num);
    }

    /**
     * Detect if a person is likely a celebrity (for prioritizing social media search)
     */
    async detectCelebrity(guest, linkedinInfo) {
        const openai = this.getOpenAI();
        if (!openai) return { isCelebrity: false, category: null };

        try {
            const context = linkedinInfo?.bestMatch ?
                `LinkedIn: ${linkedinInfo.bestMatch.title} - ${linkedinInfo.bestMatch.snippet}` :
                'No LinkedIn found';

            const prompt = `Is "${guest.full_name}" a celebrity or public figure? Consider:
- Entertainment (musicians, actors, directors, producers)
- Sports (athletes, coaches)
- Media (TV hosts, journalists, influencers)
- Politics (politicians, diplomats)
- Business (famous CEOs, entrepreneurs like Elon Musk)

Context: ${context}
Country: ${guest.country || 'Unknown'}

Return JSON:
{
  "isCelebrity": true/false,
  "confidence": 0.0-1.0,
  "category": "entertainment|sports|media|politics|business|null",
  "knownFor": "brief description if known, otherwise null",
  "socialMediaPriority": "instagram|twitter|both|null" (which platform they're most known for)
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert at identifying celebrities and public figures. You have knowledge of famous people worldwide.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            }, { timeout: 45000 });

            const result = JSON.parse(response.choices[0].message.content);
            console.log(`⭐ Celebrity detection: ${result.isCelebrity ? `Yes - ${result.category}` : 'No'} (${Math.round(result.confidence * 100)}%)`);

            return result;
        } catch (error) {
            console.error('Celebrity detection error:', error);
            return { isCelebrity: false, category: null };
        }
    }

    /**
     * Try to find a profile photo using Google Images if standard search fails
     */
    async findProfilePhoto(guest, targetUrl = null) {
        if (!process.env.SERPAPI_KEY) return null;

        try {
            // More specific query. If we have a URL, use it directly to find its images
            const query = targetUrl
                ? `site:linkedin.com/in/ "${guest.full_name}" profile photo`
                : `site:linkedin.com/in/ "${guest.full_name}" profile photo`;

            const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}&num=15`;

            const response = await this.fetchWithTimeout(url);
            const data = await response.json();

            if (!data.images_results || data.images_results.length === 0) {
                return null;
            }

            // Look for LinkedIn source and profile-displayphoto in the URL
            // We are MUCH stricter now: must be from LinkedIn domain and look like a profile photo
            const linkedInImages = data.images_results.filter(img => {
                const source = img.source?.toLowerCase() || '';
                const link = img.link?.toLowerCase() || '';
                const original = img.original?.toLowerCase() || '';
                const title = img.title?.toLowerCase() || '';

                const isLinkedInSource = source.includes('linkedin') || link.includes('linkedin.com/in/');
                const isProfilePattern = original.includes('profile-displayphoto') ||
                    original.includes('media.licdn.com/dms/image') ||
                    original.includes('profile-photo') ||
                    original.includes('profile_photo');

                // If we have a target URL, we MUST have a strong match
                let urlMatch = true;
                if (targetUrl) {
                    // Extract ID from target URL (e.g., https://linkedin.com/in/john-doe -> john-doe)
                    const targetId = targetUrl.split('/in/')[1]?.split('/')[0]?.replace(/\/$/, '');

                    // Normalize the link (e.g., remove trailing slashes and query params)
                    const normalizedLink = link.split('?')[0].replace(/\/$/, '');
                    const normalizedTarget = targetUrl.split('?')[0].replace(/\/$/, '');

                    // The image MUST come from the target profile page OR contain the ID in the image URL
                    const isSamePage = normalizedLink === normalizedTarget;
                    const containsId = targetId && (original.includes(targetId) || link.includes(targetId));

                    urlMatch = isSamePage || (isLinkedInSource && containsId && isProfilePattern);
                } else {
                    // If no target URL, we still require it to be from LinkedIn and look like a profile photo
                    urlMatch = isLinkedInSource && isProfilePattern;
                }

                return urlMatch && isProfilePattern;
            });

            if (linkedInImages.length > 0) {
                console.log(`🖼️ Found verified LinkedIn profile photo for ${guest.full_name}`);
                return linkedInImages[0].original;
            }

            console.log(`🖼️ No verified LinkedIn profile photo found for ${guest.full_name}, skipping to avoid incorrect photo`);
            return null;
        } catch (error) {
            console.error('Image search error:', error);
            return null;
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
1. Be EXTREMELY strict. If the company doesn't match and the name is common, it's likely NOT a match.
2. If the name is very unique, you can be slightly more flexible with the company (maybe they switched jobs).
3. If multiple candidates look similar, set matchesIdentity to false so the user can review.
4. If NONE of the candidates are a strong match, set bestMatchIndex to null.

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
     * Use OpenAI to analyze LinkedIn info and calculate VIP score
     * Generates a comprehensive guest report
     */
    async analyzeWithAI(guest, linkedinInfo, celebrityInfo = null) {
        const openai = this.getOpenAI();
        if (!openai) {
            console.log('OpenAI not configured, using basic scoring');
            return this.basicAnalysis(linkedinInfo, celebrityInfo);
        }

        try {
            // Build context from LinkedIn
            const linkedinContext = linkedinInfo.bestMatch ? `
LinkedIn profiel gevonden:
- Titel: ${linkedinInfo.bestMatch.title}
- Snippet: ${linkedinInfo.bestMatch.snippet}
- Functie: ${linkedinInfo.bestMatch.jobTitle || 'Onbekend'}
- Bedrijf: ${linkedinInfo.bestMatch.company || 'Onbekend'}` : 'Geen LinkedIn profiel gevonden.';

            // Build celebrity context
            const celebrityContext = celebrityInfo?.isCelebrity ? `
⭐ BELANGRIJK: Dit is waarschijnlijk een BEROEMDHEID!
- Categorie: ${celebrityInfo.category || 'Onbekend'}
- Bekend van: ${celebrityInfo.knownFor || 'Onbekend'}
- Sociale media prioriteit: ${celebrityInfo.socialMediaPriority || 'Onbekend'}
Dit vereist EXTRA HOGE VIP-behandeling!` : '';

            const prompt = `Je bent een VIP-gastanalist voor een 5-sterren luxe hotel. Schrijf een UITGEBREID professioneel rapport over deze gast.

GASTINFORMATIE:
Naam: ${guest.full_name}
Land: ${guest.country || 'Onbekend'}
${guest.company ? `Bedrijf: ${guest.company}` : ''}
${guest.notes ? `Extra info: ${guest.notes}` : ''}

${linkedinContext}
${celebrityContext}

${guest.company_info ? `
Gedetailleerde bedrijfsinformatie:
- Industry: ${guest.company_info.industry || 'Onbekend'}
- Grootte: ${guest.company_info.size || 'Onbekend'}
- Beschrijving: ${guest.company_info.description || 'Onbekend'}
${guest.company_info.deep_info ? `
Website Analyse:
- Missie: ${guest.company_info.deep_info.mission}
- Diensten: ${guest.company_info.deep_info.products_services?.join(', ')}
- Doelgroep: ${guest.company_info.deep_info.target_market}` : ''}
` : ''}

Genereer een UITGEBREID en GEDETAILLEERD JSON-antwoord met de volgende structuur:
{
  "vip_score": [1-10 getal, waarbij 10 = extreem VIP/CEO's van grote bedrijven/miljardairs],
  "industry": "[sector]",
  "company_size": "[Micro (1-10)/Klein (10-50)/Middelgroot (50-250)/Groot (250+)]",
  "is_owner": [true/false/null],
  "employment_type": "[Eigenaar/Oprichter/CEO/Partner/Directeur/Manager/Werknemer/Zelfstandige]",
  "notable_info": "[korte samenvatting, max 150 tekens]",
  "influence_level": "[Laag/Gemiddeld/Hoog/VIP]",
  "net_worth_estimate": "[geschat vermogen of null]",
  "full_report": {
    "executive_summary": "[2-3 zinnen samenvatting van wie deze persoon is en waarom ze belangrijk zijn]",
    "professional_background": {
      "current_role": "[huidige functie en verantwoordelijkheden]",
      "career_trajectory": "[korte beschrijving van carrièrepad en belangrijke posities]",
      "industry_expertise": "[gebieden van expertise en specialisatie]",
      "notable_achievements": "[belangrijke prestaties, awards, publicaties indien bekend]"
    },
    "company_analysis": {
      "company_name": "[bedrijfsnaam]",
      "company_description": "[wat doet het bedrijf]",
      "company_position": "[marktpositie en reputatie]",
      "estimated_revenue": "[geschatte omzet indien bekend, anders null]",
      "employee_count": "[aantal werknemers indien bekend]"
    },
    "vip_indicators": {
      "wealth_signals": "[indicaties van vermogen zoals bedrijfseigendom, positie, industrie]",
      "influence_factors": "[factoren die invloed aangeven zoals netwerk, media-aandacht]",
      "status_markers": "[statusmarkers zoals titels, lidmaatschappen, exclusieve posities]"
    },
    "service_recommendations": {
      "priority_level": "[Standaard/Verhoogd/VIP/Ultra-VIP]",
      "special_attention": "[speciale aandachtspunten voor het hotelpersoneel]",
      "potential_interests": "[mogelijke interesses en voorkeuren gebaseerd op profiel]",
      "communication_style": "[aanbevolen communicatiestijl: formeel/semi-formeel/informeel]",
      "gift_suggestions": "[suggesties voor attenties of geschenken indien VIP]"
    },
    "additional_notes": "[eventuele extra relevante informatie of waarschuwingen]"
  }
}

BELANGRIJK:
- Wees zo specifiek en gedetailleerd mogelijk gebaseerd op de beschikbare informatie
- Als informatie ontbreekt, geef een weloverwogen inschatting gebaseerd op de context
- Het full_report moet MINIMAAL 400 woorden bevatten
- Focus op bruikbare informatie voor hotelpersoneel
- Schrijf in het Nederlands`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Je bent een expert VIP-gastanalist voor luxehotels. Je schrijft uitgebreide, professionele rapporten die hotelpersoneel helpen om gepersonaliseerde service te bieden. Geef ALLEEN valide JSON terug.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 2000
            }, { timeout: 45000 });

            const content = response.choices[0]?.message?.content;
            if (!content) return this.basicAnalysis(linkedinInfo);

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return this.basicAnalysis(linkedinInfo);

            return JSON.parse(jsonMatch[0]);
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

            const prompt = `Je bent een VIP-gastanalist voor een 5-sterren luxe hotel. Een collega heeft HANDMATIG aanvullende informatie gevonden over een gast. Jouw taak is om deze nieuwe informatie te combineren met de bestaande research data om een INTERACTIEF en UITGEBREIDER rapport te genereren.

GASTINFORMATIE:
Naam: ${guest.full_name}
Land: ${guest.country || 'Onbekend'}
${guest.notes ? `Hotel opmerkingen: ${guest.notes}` : ''}

${existingContext}

NIEUWE HANDMATIG GEVONDEN INFORMATIE (PRIORITEIT):
${customInput}

INSTRUCTIES:
1. De NIEUWE HANDMATIEGE INFORMATIE is leidend en vaak actueler of specifieker dan de automatische research.
2. Schrijf een NIEUW UITGEBREID RAPPORT (full_report) dat alle info integreert.
3. Herbereken de VIP_SCORE (1-10) op basis van de GECOMBINEERDE inzichten.
4. Schrijf in professioneel Nederlands.
5. Het rapport moet MINIMAAL 500 woorden bevatten en zeer gedetailleerd zijn voor hotel management.

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
      "special_attention": "[details]",
      "potential_interests": "[details]",
      "communication_style": "[details]",
      "gift_suggestions": "[details]"
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
     * Focuses on LinkedIn as primary source, but searches social media for celebrities
     */
    async searchGuest(guest) {
        console.log(`🔍 Researching: ${guest.full_name}`);

        // Search LinkedIn via SerpAPI
        const linkedinInfo = await this.searchLinkedIn(guest);
        console.log(`💼 LinkedIn: ${linkedinInfo.bestMatch ? 'Found' : 'Not found'}`);

        // Detect if this is a celebrity - this affects how we search
        const celebrityInfo = await this.detectCelebrity(guest, linkedinInfo);

        // Initialize social media results
        let instagramResult = { url: null, handle: null, followers: null };
        let twitterResult = { url: null, handle: null, followers: null };

        // For celebrities, especially in entertainment, social media is crucial
        if (celebrityInfo.isCelebrity && celebrityInfo.confidence >= 0.7) {
            console.log(`⭐ Celebrity detected: ${celebrityInfo.knownFor || celebrityInfo.category}`);

            // Search based on priority platform
            const priority = celebrityInfo.socialMediaPriority || 'both';

            if (priority === 'instagram' || priority === 'both') {
                instagramResult = await this.searchInstagram(guest);
            }

            if (priority === 'twitter' || priority === 'both') {
                twitterResult = await this.searchTwitter(guest);
            }

            // If nothing found on priority platform, try the other
            if (priority === 'instagram' && !instagramResult.url) {
                twitterResult = await this.searchTwitter(guest);
            } else if (priority === 'twitter' && !twitterResult.url) {
                instagramResult = await this.searchInstagram(guest);
            }
        } else if (!linkedinInfo.bestMatch) {
            // For non-celebrities without LinkedIn, still try to find some social presence
            console.log(`🔍 No LinkedIn found, trying social media search...`);
            twitterResult = await this.searchTwitter(guest);
            if (!twitterResult.url) {
                instagramResult = await this.searchInstagram(guest);
            }
        }

        // --- NEW: Company Research ---
        let companyInfo = null;
        if (guest.company || (linkedinInfo.bestMatch && linkedinInfo.bestMatch.company)) {
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

        // Analyze with AI (include celebrity info for better context)
        const analysis = await this.analyzeWithAI(guest, linkedinInfo, celebrityInfo);
        console.log(`🤖 AI Analysis: VIP Score ${analysis.vip_score}`);

        // Get best LinkedIn data
        const bestMatch = linkedinInfo.bestMatch;

        // Use thumbnail from best match if available - strictly from search results only
        const profilePhotoUrl = bestMatch?.thumbnail || null;




        // Calculate total followers for VIP scoring
        const totalFollowers = (instagramResult.followers || 0) + (twitterResult.followers || 0);

        // Prioritize job title and company from social media if LinkedIn not available
        const effectiveJobTitle = bestMatch?.jobTitle ||
            twitterResult.jobTitle ||
            instagramResult.jobTitle ||
            celebrityInfo.knownFor ||
            null;

        const effectiveCompany = bestMatch?.company ||
            twitterResult.company ||
            instagramResult.company ||
            guest.company;

        // Combine location info - prefer Twitter which often has location in bio
        const socialMediaLocation = twitterResult.location || instagramResult.location || null;

        // Get website from social media if not found elsewhere, or from company info
        const effectiveWebsite = companyInfo?.website || twitterResult.linkedWebsite || instagramResult.linkedWebsite || null;

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

        // Build results object with comprehensive social media data
        return {
            profilePhotoUrl: profilePhotoUrl,
            jobTitle: effectiveJobTitle,
            companyName: effectiveCompany,
            companySize: analysis.company_size || null,
            isOwner: analysis.is_owner,
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
            followersEstimate: totalFollowers > 0 ? totalFollowers : null,
            vipScore: analysis.vip_score,
            influenceLevel: analysis.influence_level,
            isCelebrity: celebrityInfo.isCelebrity,
            celebrityCategory: celebrityInfo.category,
            rawResults: [
                { type: 'linkedin_search', data: linkedinInfo },
                { type: 'celebrity_detection', data: celebrityInfo },
                { type: 'instagram_search', data: instagramResult },
                { type: 'twitter_search', data: twitterResult },
                { type: 'ai_analysis', data: analysis }
            ]
        };
    }
}

module.exports = new SmartSearchService();
