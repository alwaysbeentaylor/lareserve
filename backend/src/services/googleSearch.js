const puppeteer = require('puppeteer');

/**
 * Google Search service for guest research
 * Uses Puppeteer to search Google and extract LinkedIn/company information
 */

class GoogleSearchService {
    constructor() {
        this.browser = null;
        this.lastSearchTime = 0;
        this.minDelay = 10000; // 10 seconds minimum between searches
    }

    async getBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async ensureDelay() {
        const now = Date.now();
        const elapsed = now - this.lastSearchTime;
        if (elapsed < this.minDelay) {
            await this.delay(this.minDelay - elapsed);
        }
        this.lastSearchTime = Date.now();
    }

    /**
     * Search for guest on Google and extract relevant information
     */
    async searchGuest(guest) {
        await this.ensureDelay();

        const results = {
            profilePhotoUrl: null,
            jobTitle: null,
            companyName: guest.company || null,
            companySize: null,
            industry: null,
            linkedinUrl: null,
            linkedinConnections: null,
            websiteUrl: null,
            notableInfo: null,
            pressMentions: null,
            rawResults: []
        };

        try {
            const browser = await this.getBrowser();
            const page = await browser.newPage();

            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Build search query
            let searchQuery = `"${guest.full_name}"`;
            if (guest.company) {
                searchQuery += ` "${guest.company}"`;
            }
            if (guest.country) {
                searchQuery += ` ${guest.country}`;
            }

            // Search 1: General search
            await this.performSearch(page, searchQuery, results);

            // Search 2: LinkedIn specific search
            await this.delay(5000);
            await this.performLinkedInSearch(page, guest, results);

            // Search 3: Company search (if company provided)
            if (guest.company && !results.industry) {
                await this.delay(5000);
                await this.performCompanySearch(page, guest.company, results);
            }

            await page.close();

        } catch (error) {
            console.error('Google search error:', error);
            results.rawResults.push({ type: 'error', message: error.message });
        }

        return results;
    }

    async performSearch(page, query, results) {
        try {
            const encodedQuery = encodeURIComponent(query);
            await page.goto(`https://www.google.com/search?q=${encodedQuery}&hl=nl`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Handle Cookie Consent if present
            try {
                const buttons = await page.$$('button');
                for (const button of buttons) {
                    const text = await page.evaluate(el => el.textContent, button);
                    if (text.includes('Alles accepteren') || text.includes('Accept all') || text.includes('Ik ga akkoord')) {
                        await button.click();
                        await page.waitForNavigation({ waitUntil: 'networkidle2' });
                        break;
                    }
                }
            } catch (e) {
                // Ignore if no consent page
            }

            // Wait for results with a more flexible selector
            await page.waitForSelector('#search, #topstuff, .g', { timeout: 10000 }).catch(() => { });

            // Extract search results
            const searchResults = await page.evaluate(() => {
                const items = [];
                // More robust selectors for organic results
                const resultElements = document.querySelectorAll('div.g, div.v7W49e > div, div.srK7ed');

                resultElements.forEach((el, index) => {
                    if (index < 10) {
                        const titleEl = el.querySelector('h3');
                        const linkEl = el.querySelector('a');
                        const snippetEl = el.querySelector('div[style*="webkit-line-clamp"], [data-sncf], .VwiC3b');

                        const title = titleEl?.textContent || '';
                        const link = linkEl?.href || '';
                        const snippet = snippetEl?.textContent || '';

                        if (title && link) {
                            items.push({ title, link, snippet });
                        }
                    }
                });

                return items;
            });

            results.rawResults.push({ type: 'general', results: searchResults });

            // Extract LinkedIn URL from results
            const linkedinResult = searchResults.find(r =>
                r.link && r.link.includes('linkedin.com/in/')
            );
            if (linkedinResult && !results.linkedinUrl) {
                results.linkedinUrl = linkedinResult.link;

                // Try to extract job title from snippet
                const titleMatch = linkedinResult.snippet.match(/[-–]\s*([^-–|]*(?:CEO|CTO|CFO|COO|Director|Manager|Founder|Owner|Partner|Head|VP|President|Chief)[^-–|]*)/i);
                if (titleMatch) {
                    results.jobTitle = titleMatch[1].trim();
                }
            }

            // Extract notable information
            const notableItems = searchResults
                .filter(r => r.snippet && r.snippet.length > 50)
                .slice(0, 3)
                .map(r => r.snippet);

            if (notableItems.length > 0) {
                results.notableInfo = notableItems.join(' | ');
            }

        } catch (error) {
            console.error('General search error:', error);
        }
    }

    async performLinkedInSearch(page, guest, results) {
        if (results.linkedinUrl) return; // Already found

        try {
            let query = `site:linkedin.com/in "${guest.full_name}"`;
            if (guest.company) {
                query += ` "${guest.company}"`;
            }

            const encodedQuery = encodeURIComponent(query);
            await page.goto(`https://www.google.com/search?q=${encodedQuery}&hl=nl`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            await page.waitForSelector('#search', { timeout: 10000 }).catch(() => { });

            const linkedinResults = await page.evaluate(() => {
                const items = [];
                const resultElements = document.querySelectorAll('#search .g');

                resultElements.forEach((el, index) => {
                    if (index < 5) {
                        const titleEl = el.querySelector('h3');
                        const linkEl = el.querySelector('a');
                        const snippetEl = el.querySelector('[data-sncf], [style*="line-height"]');

                        if (linkEl?.href?.includes('linkedin.com/in/')) {
                            items.push({
                                title: titleEl?.textContent || '',
                                link: linkEl.href,
                                snippet: snippetEl?.textContent || ''
                            });
                        }
                    }
                });

                return items;
            });

            results.rawResults.push({ type: 'linkedin', results: linkedinResults });

            if (linkedinResults.length > 0) {
                results.linkedinUrl = linkedinResults[0].link;

                // Extract job title from title or snippet
                const titleText = linkedinResults[0].title + ' ' + linkedinResults[0].snippet;
                const titleMatch = titleText.match(/[-–]\s*([^-–|]*(?:CEO|CTO|CFO|COO|Director|Manager|Founder|Owner|Partner|Head|VP|President|Chief|Eigenaar|Directeur|Oprichter)[^-–|]*)/i);
                if (titleMatch && !results.jobTitle) {
                    results.jobTitle = titleMatch[1].trim();
                }
            }

        } catch (error) {
            console.error('LinkedIn search error:', error);
        }
    }

    async performCompanySearch(page, company, results) {
        try {
            const query = `"${company}" bedrijf informatie`;
            const encodedQuery = encodeURIComponent(query);

            await page.goto(`https://www.google.com/search?q=${encodedQuery}&hl=nl`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            await page.waitForSelector('#search', { timeout: 10000 }).catch(() => { });

            const companyInfo = await page.evaluate(() => {
                const info = {};

                // Try to find company info box
                const infoBox = document.querySelector('[data-attrid="kc:/business/business_operation:industry"]');
                if (infoBox) {
                    info.industry = infoBox.textContent;
                }

                // Get first result with company website
                const results = document.querySelectorAll('#search .g a');
                for (const link of results) {
                    const href = link.href;
                    if (href && !href.includes('google.') && !href.includes('linkedin.') &&
                        !href.includes('facebook.') && !href.includes('twitter.')) {
                        info.website = href;
                        break;
                    }
                }

                return info;
            });

            if (companyInfo.industry) {
                results.industry = companyInfo.industry;
            }
            if (companyInfo.website && !results.websiteUrl) {
                results.websiteUrl = companyInfo.website;
            }

            results.rawResults.push({ type: 'company', info: companyInfo });

        } catch (error) {
            console.error('Company search error:', error);
        }
    }
}

module.exports = new GoogleSearchService();
