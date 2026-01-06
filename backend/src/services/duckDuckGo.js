const { Jimp } = require('jimp');
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

/**
 * DuckDuckGo Search Service
 * Free search engine for guest research - with 2Captcha Grid CAPTCHA solving
 */

class DuckDuckGoService {
    constructor() {
        this.lastRequestTime = 0;
        this.minDelay = 3000; // 3 seconds between requests
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        this.captchaCount = 0;
        this.apiKey = process.env.TWO_CAPTCHA_API_KEY || 'ca40d24c6863014ad509fd0d1fe1db52';
        this.cookies = new Map();

        const proxyUrl = process.env.PROXY_URL;
        this.proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;
        this.currentUserAgent = this.userAgents[0];
    }

    getRandomUserAgent() {
        // Stick to one UA per session if possible to avoid triggering anti-bot
        if (!this.currentUserAgent) {
            this.currentUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        }
        return this.currentUserAgent;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update internal cookie jar from Fetch Response Headers
     */
    updateCookies(headers) {
        const setCookie = headers.get('set-cookie');
        if (setCookie) {
            // Split multiple cookies (comma separated but careful with dates)
            // fetch combines set-cookie into one string with commas usually, or getSetCookie() in newer node
            // For safety, let's try a simple split/parse or array
            let cookiesArray = [];
            if (typeof headers.getSetCookie === 'function') {
                cookiesArray = headers.getSetCookie();
            } else {
                // Fallback for older envs, simple split might fail on dates, but DDG cookies are simple usually
                cookiesArray = [setCookie];
            }

            cookiesArray.forEach(cookieStr => {
                const parts = cookieStr.split(';');
                const [name, value] = parts[0].split('=');
                if (name) {
                    this.cookies.set(name.trim(), value ? value.trim() : '');
                }
            });
        }
    }

    /**
     * Get Cookie header string
     */
    getCookieHeader() {
        if (this.cookies.size === 0) return '';
        return Array.from(this.cookies.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
    }

    /**
     * Perform a single search query with CAPTCHA handling
     */
    async search(query, maxResults = 5, retryCount = 0) {
        try {
            // Rate limiting
            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            if (timeSinceLastRequest < this.minDelay) {
                await this.delay(this.minDelay - timeSinceLastRequest);
            }
            this.lastRequestTime = Date.now();

            const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

            const headers = {
                'User-Agent': this.getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'nl-BE,nl;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://duckduckgo.com/',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            };

            const cookieHeader = this.getCookieHeader();
            if (cookieHeader) {
                headers['Cookie'] = cookieHeader;
            }

            const response = await this.makeRequest(url, { headers });
            this.updateCookies(response.headers);

            const html = await response.text();

            // Check for CAPTCHA
            if (html.includes('anomaly-modal') || html.includes('botnet')) {
                console.log('🔒 DuckDuckGo CAPTCHA detected!');

                if (retryCount < 2) { // Allow 2 retries (original + 2 captcha solves)
                    console.log(`🤖 Attempting to solve CAPTCHA (Account: ...${this.apiKey.slice(-4)})...`);
                    const solved = await this.solveCaptcha(html, response.url); // Pass url for relative paths

                    if (solved) {
                        console.log('✅ CAPTCHA solved! Retrying search...');
                        // Reset delay as we are now "human"
                        this.minDelay = 3000;
                        return this.search(query, maxResults, retryCount + 1);
                    } else {
                        console.log('❌ CAPTCHA solution failed.');
                    }
                }

                // Increase delay if failed
                this.minDelay = Math.min(this.minDelay + 5000, 30000);
                return [];
            }

            // Parse results
            const results = [];
            const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

            let match;
            while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
                const link = this.decodeURL(match[1]);
                if (!results.find(r => r.link === link)) {
                    results.push({
                        link,
                        title: this.cleanHTML(match[2]),
                        snippet: this.cleanHTML(match[3])
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('DuckDuckGo search error:', error);
            return [];
        }
    }

    /**
     * Solve DuckDuckGo Grid CAPTCHA
     */
    async solveCaptcha(html, pageUrl) {
        try {
            // 1. Extract Images
            const imageUrls = this.extractCaptchaImages(html);
            if (imageUrls.length !== 9) {
                console.log(`⚠️ Expected 9 captcha images, found ${imageUrls.length}. Aborting.`);
                return false;
            }

            // 2. Download Images
            console.log('📥 Downloading 9 captcha tiles...');
            const imageBuffers = await Promise.all(imageUrls.map(async (url) => {
                const res = await this.makeRequest(url, {
                    headers: { 'User-Agent': this.currentUserAgent, 'Cookie': this.getCookieHeader() }
                });
                return await res.buffer();
            }));

            // 3. Stitch Images into 3x3 Grid
            // Assuming first image dimensions are representative
            const firstImg = await Jimp.read(imageBuffers[0]);
            const w = firstImg.width;
            const h = firstImg.height;
            console.log(`📥 Captcha tiles are ${w}x${h}px each.`);

            const gridImg = new Jimp({ width: w * 3, height: h * 3 });

            for (let i = 0; i < 9; i++) {
                const img = await Jimp.read(imageBuffers[i]);
                const x = (i % 3) * w;
                const y = Math.floor(i / 3) * h;
                gridImg.composite(img, x, y);
            }

            // Resize if the grid is too large (2Captcha limit is 100KB)
            if (gridImg.width > 500) {
                console.log('📏 Resizing captcha grid to 500px width...');
                gridImg.resize({ width: 500 });
            }

            // Get Base64 of stitched image (Lower quality to stay under 100kB limit)
            const base64Image = await gridImg.quality(50).getBase64("image/jpeg");
            const base64Body = base64Image.replace(/^data:image\/jpeg;base64,/, '');
            console.log(`📸 Stitched image size: ${Math.round(base64Body.length * 0.75 / 1024)} KB`);

            // 4. Send to 2Captcha
            console.log('🚀 Sending grid to 2Captcha...');
            const createTaskUrl = 'https://api.2captcha.com/createTask';
            const createPayload = {
                clientKey: this.apiKey,
                task: {
                    type: "GridTask",
                    body: base64Body,
                    comment: "Select all squares containing a duck",
                    rows: 3,
                    columns: 3
                }
            };

            const createRes = await this.makeRequest(createTaskUrl, {
                method: 'POST',
                body: JSON.stringify(createPayload),
                headers: { 'Content-Type': 'application/json' }
            });
            const createData = await createRes.json();

            if (createData.errorId !== 0) {
                console.error('2Captcha Error:', createData);
                return false;
            }

            const taskId = createData.taskId;
            console.log(`⏳ 2Captcha Task ID: ${taskId}. Waiting for solution...`);

            // 5. Poll for Result
            let solution = null;
            let attempts = 0;
            while (attempts < 20) { // Max 100 seconds
                await this.delay(5000);
                const resultUrl = 'https://api.2captcha.com/getTaskResult';
                const resultRes = await this.makeRequest(resultUrl, {
                    method: 'POST',
                    body: JSON.stringify({ clientKey: this.apiKey, taskId }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const resultData = await resultRes.json();

                if (resultData.status === 'ready') {
                    console.log('🤖 2Captcha raw result:', JSON.stringify(resultData));
                    solution = resultData.solution?.click || resultData.solution?.value;
                    break;
                }
                if (resultData.errorId !== 0) {
                    console.error('2Captcha Result Error:', resultData);
                    return false;
                }
                attempts++;
            }

            if (!solution) {
                console.log('❌ 2Captcha timeout');
                return false;
            }

            console.log('💡 Captcha solved! Selected tiles:', solution);

            // 6. Submit Solution to DuckDuckGo
            // We need to parse the form action and hidden fields
            const formActionMatch = html.match(/action="([^"]+)"/);
            if (!formActionMatch) return false;

            // Handle relative action URL
            let actionUrl = formActionMatch[1];
            if (actionUrl.startsWith('//')) actionUrl = 'https:' + actionUrl;
            else if (actionUrl.startsWith('/')) actionUrl = 'https://duckduckgo.com' + actionUrl;

            // Extract hidden inputs and checkbox names
            // Simple regex to find input checkboxes derived from "image-check_"
            // The logic: 2Captcha gives 1-based indices. DDG form uses 0-based indices for images?
            // In ddg_debug.html: data-index="0"
            // So 2Captcha (1) -> DDG (0)

            // Map solution (1..9) to form fields
            // We need to find the specific field names for indices 0..8
            // Regex to find "image-check_HASH" 
            const checkNames = [];
            const checkRegex = /name="(image-check_[^"]+)"/g;
            let checkMatch;
            while ((checkMatch = checkRegex.exec(html)) !== null) {
                checkNames.push(checkMatch[1]);
            }

            // Also get all hidden inputs from the form?
            // The anomaly.js endpoint usually takes query params from the action URL
            // and the checkbox body.
            // Let's parse query params from action URL
            const actionUrlObj = new URL(actionUrl);
            const params = new URLSearchParams(actionUrlObj.search);

            // Construct multipart or urlencoded body?
            // Form method is usually POST.
            // DDG anomaly form often uses standard form-urlencoded

            const postBody = new URLSearchParams();

            solution.forEach(index => {
                const zeroIndex = index - 1;
                if (checkNames[zeroIndex]) {
                    postBody.append(checkNames[zeroIndex], 'on');
                }
            });

            // Add the button value if present?
            // In HTML: <button ... value="HASH">Submit</button>
            // Sometimes required.
            const buttonMatch = html.match(/<button[^>]+value="([^"]+)"[^>]*>Submit<\/button>/);
            if (buttonMatch) {
                postBody.append('challenge-submit', buttonMatch[1]); // name="challenge-submit"
            }

            console.log(`🚀 Submitting solution to ${actionUrl}...`);

            const submitRes = await this.makeRequest(actionUrl, {
                method: 'POST',
                headers: {
                    'User-Agent': this.currentUserAgent,
                    'Cookie': this.getCookieHeader(),
                    'Referer': pageUrl,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: postBody
            });

            this.updateCookies(submitRes.headers);

            const submitHtml = await submitRes.text();

            if (!submitHtml.includes('anomaly-modal') && !submitHtml.includes('botnet')) {
                console.log('🔓 CAPTCHA verification successful!');
                return true;
            } else {
                console.log('❌ Verification failed (loop?).');
                return false;
            }
        } catch (error) {
            console.error('Captcha solve error:', error);
            return false;
        }
    }

    async makeRequest(url, options = {}) {
        const is2Captcha = url.includes('2captcha.com');
        if (!is2Captcha && this.proxyAgent) {
            options.agent = this.proxyAgent;
        }
        return fetch(url, options);
    }

    /**
     * Extract CAPTCHA image URLs from DDG HTML
     */
    extractCaptchaImages(html) {
        const imageRegex = /src="([^"]+challenge[^"]+\.jpg)"/g;
        const urls = [];
        let match;
        while ((match = imageRegex.exec(html)) !== null) {
            let url = match[1];
            if (url.startsWith('..')) {
                url = 'https://duckduckgo.com' + url.substring(2);
            } else if (!url.startsWith('http')) {
                url = 'https://duckduckgo.com' + url;
            }
            urls.push(url);
        }
        return urls;
    }

    /**
     * Comprehensive multi-query search for complete guest info
     */
    async multiSearch(guest) {
        const name = guest.full_name;
        const country = guest.country || '';
        const company = guest.company || '';

        const queries = [
            `"${name}" ${country}`.trim(),
            `"${name}" linkedin`,
            `"${name}" professional biography ${company}`,
        ];

        if (name.split(' ').length >= 2) {
            queries.push(`"${name}" instagram`);
            queries.push(`"${name}" twitter`);
        }

        console.log(`🦆 DuckDuckGo: Running ${queries.length} searches for ${name}...`);

        const allResults = [];
        const seenUrls = new Set();

        for (const query of queries) {
            const results = await this.search(query, 3);
            for (const result of results) {
                if (!seenUrls.has(result.link)) {
                    seenUrls.add(result.link);
                    allResults.push(result);
                }
            }
        }

        console.log(`🦆 Found ${allResults.length} unique results`);
        return allResults;
    }

    /**
     * Deep scrape a URL for full content
     */
    async fetchPageContent(url, maxLength = 8000) {
        try {
            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            if (timeSinceLastRequest < this.minDelay) {
                await this.delay(this.minDelay - timeSinceLastRequest);
            }
            this.lastRequestTime = Date.now();

            console.log(`📄 Deep scraping: ${url}`);

            // Use same headers/cookies
            const headers = {
                'User-Agent': this.getRandomUserAgent(),
                'Cookie': this.getCookieHeader()
            };

            const response = await this.makeRequest(url, {
                headers,
                timeout: 10000
            });

            if (!response.ok) return null;

            const html = await response.text();

            let text = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
                .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
                .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#[0-9]+;/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (text.length > maxLength) {
                text = text.substring(0, maxLength) + '...';
            }

            return text.length > 100 ? text : null;
        } catch (error) {
            console.error(`Deep scrape failed for ${url}:`, error.message);
            return null;
        }
    }

    decodeURL(url) {
        if (url.includes('uddg=')) {
            const parts = url.split('uddg=');
            if (parts.length > 1) {
                return decodeURIComponent(parts[1].split('&')[0]);
            }
        }
        return url;
    }

    cleanHTML(str) {
        return str
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    /**
     * Scrape the LinkedIn profile page to extract the REAL headline/job title.
     * E.g. "Assistant Front Office - La Réserve Resort"
     */
    async scrapeLinkedInHeadline(linkedInUrl) {
        try {
            console.log(`🔍 Scraping LinkedIn headline: ${linkedInUrl}`);

            const headers = {
                'User-Agent': this.getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
            };

            const response = await this.makeRequest(linkedInUrl, { headers, timeout: 15000 });
            if (!response.ok) {
                console.warn(`⚠️ LinkedIn returned status ${response.status}`);
                return null;
            }

            const html = await response.text();

            // LinkedIn stores the headline in a specific location
            // Method 1: Look for og:description meta tag (often contains headline)
            const ogMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
            if (ogMatch) {
                const ogDesc = ogMatch[1];
                // Parse "Name on LinkedIn: Headline. Location."
                const headlineMatch = ogDesc.match(/on LinkedIn[:\.]?\s*(.+?)(?:\.\s*\d|\.\s*[A-Z]|$)/i);
                if (headlineMatch && headlineMatch[1]) {
                    const headline = headlineMatch[1].trim();
                    console.log(`✅ Extracted headline from OG: "${headline}"`);
                    return headline;
                }
            }

            // Method 2: Look for top-card headline class (less reliable without JS)
            const topCardMatch = html.match(/<div[^>]*class="[^"]*top-card-layout__headline[^"]*"[^>]*>([^<]+)<\/div>/i);
            if (topCardMatch) {
                const headline = topCardMatch[1].trim();
                console.log(`✅ Extracted headline from top-card: "${headline}"`);
                return headline;
            }

            // Method 3: title tag fallback "Name - Headline | LinkedIn"
            const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
            if (titleMatch) {
                const title = titleMatch[1];
                const parts = title.split(' - ');
                if (parts.length >= 2) {
                    // Remove " | LinkedIn" from the end
                    const headline = parts.slice(1).join(' - ').replace(/\s*\|\s*LinkedIn$/i, '').trim();
                    if (headline && !headline.match(/(Belgium|Region|Netherlands|Profile)/i)) {
                        console.log(`✅ Extracted headline from title: "${headline}"`);
                        return headline;
                    }
                }
            }

            console.warn(`⚠️ Could not extract headline from LinkedIn page`);
            return null;
        } catch (error) {
            console.error(`LinkedIn headline scrape failed:`, error.message);
            return null;
        }
    }
}

module.exports = new DuckDuckGoService();
