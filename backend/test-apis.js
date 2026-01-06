require('dotenv').config();
const OpenAI = require('openai');
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Test configuratie
const config = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY || null
    },
    twocaptcha: {
        apiKey: process.env.TWOCAPTCHA_API_KEY || null
    },
    proxy: {
        // Bright Data format - set PROXY_URL in .env
        url: process.env.PROXY_URL || null
    },
    brave: {
        apiKey: process.env.BRAVE_SEARCH_API_KEY || null
    },
    knowledgeGraph: {
        apiKey: process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY || null
    }
};

// Test functies
async function testOpenAI() {
    console.log('\n🧪 Testing OpenAI API...');
    
    if (!config.openai.apiKey) {
        console.log('⚠️  OpenAI API: NOT CONFIGURED');
        console.log('   Set OPENAI_API_KEY in .env to test');
        return null;
    }
    
    try {
        const openai = new OpenAI({ apiKey: config.openai.apiKey });
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "API test successful" in Dutch' }],
            max_tokens: 20
        });
        
        const message = response.choices[0]?.message?.content;
        console.log('✅ OpenAI API: WORKING');
        console.log(`   Response: ${message}`);
        return true;
    } catch (error) {
        console.log('❌ OpenAI API: FAILED');
        console.log(`   Error: ${error.message}`);
        if (error.status === 401) console.log('   → Invalid API key');
        if (error.status === 429) console.log('   → Rate limit exceeded');
        return false;
    }
}

async function test2Captcha() {
    console.log('\n🧪 Testing 2Captcha API...');
    
    if (!config.twocaptcha.apiKey) {
        console.log('⚠️  2Captcha API: NOT CONFIGURED');
        console.log('   Set TWOCAPTCHA_API_KEY in .env to test');
        return null;
    }
    
    try {
        // Test balance check - correct endpoint: res.php?action=getbalance
        const balanceUrl = `https://2captcha.com/res.php?key=${config.twocaptcha.apiKey}&action=getbalance&json=1`;
        const response = await fetch(balanceUrl);
        const data = await response.json();
        
        if (data.status === 1) {
            console.log('✅ 2Captcha API: WORKING');
            console.log(`   Balance: $${data.request}`);
            return true;
        } else {
            console.log('❌ 2Captcha API: FAILED');
            console.log(`   Error: ${data.request}`);
            if (data.error_text) {
                console.log(`   Error Text: ${data.error_text}`);
            }
            return false;
        }
    } catch (error) {
        console.log('❌ 2Captcha API: FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testProxy() {
    console.log('\n🧪 Testing Proxy...');
    
    if (!config.proxy.url) {
        console.log('⚠️  Proxy: NOT CONFIGURED');
        console.log('   Set PROXY_URL in .env to test');
        return null;
    }
    
    try {
        const proxyAgent = new HttpsProxyAgent(config.proxy.url);
        
        // Test with a simple request
        const response = await fetch('https://api.ipify.org?format=json', {
            agent: proxyAgent,
            timeout: 10000
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Proxy: WORKING');
            console.log(`   Your IP via proxy: ${data.ip}`);
            console.log(`   Expected proxy IP: 101.32.255.125`);
            
            // Check if IP matches
            if (data.ip === '101.32.255.125') {
                console.log('   → IP matches proxy!');
            } else {
                console.log('   ⚠️  IP does not match (might be rotating proxy)');
            }
            return true;
        } else {
            console.log('❌ Proxy: FAILED');
            console.log(`   Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Proxy: FAILED');
        console.log(`   Error: ${error.message}`);
        if (error.message.includes('timeout')) {
            console.log('   → Proxy might be slow or blocked');
        }
        if (error.message.includes('ECONNREFUSED')) {
            console.log('   → Cannot connect to proxy server');
        }
        return false;
    }
}

async function testBraveSearch() {
    console.log('\n🧪 Testing Brave Search API...');
    
    if (!config.brave.apiKey) {
        console.log('⚠️  Brave Search API: NOT CONFIGURED');
        console.log('   Set BRAVE_SEARCH_API_KEY in .env to test');
        return null;
    }
    
    try {
        const testQuery = 'test';
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(testQuery)}&count=1`;
        
        const response = await fetch(url, {
            headers: {
                'X-Subscription-Token': config.brave.apiKey,
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Brave Search API: WORKING');
            console.log(`   Found ${data.web?.results?.length || 0} results`);
            return true;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Brave Search API: FAILED');
            console.log(`   Status: ${response.status}`);
            if (errorData.message) console.log(`   Error: ${errorData.message}`);
            if (response.status === 401) console.log('   → Invalid API key');
            return false;
        }
    } catch (error) {
        console.log('❌ Brave Search API: FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testGoogleKnowledgeGraph() {
    console.log('\n🧪 Testing Google Knowledge Graph API...');
    
    if (!config.knowledgeGraph.apiKey) {
        console.log('⚠️  Google Knowledge Graph API: NOT CONFIGURED');
        console.log('   Set GOOGLE_KNOWLEDGE_GRAPH_API_KEY in .env to test');
        return null;
    }
    
    try {
        const testQuery = 'Barack Obama'; // Famous person for testing
        const url = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(testQuery)}&key=${config.knowledgeGraph.apiKey}&limit=1`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.itemListElement && data.itemListElement.length > 0) {
            console.log('✅ Google Knowledge Graph API: WORKING');
            const result = data.itemListElement[0].result;
            console.log(`   Test result: ${result.name} (${result['@type']})`);
            return true;
        } else if (data.error) {
            console.log('❌ Google Knowledge Graph API: FAILED');
            console.log(`   Error: ${data.error.message}`);
            if (data.error.code === 403) console.log('   → Invalid API key or quota exceeded');
            return false;
        } else {
            console.log('⚠️  Google Knowledge Graph API: No results (might be working)');
            return true;
        }
    } catch (error) {
        console.log('❌ Google Knowledge Graph API: FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting API Tests...\n');
    console.log('='.repeat(50));
    
    const results = {
        openai: await testOpenAI(),
        twocaptcha: await test2Captcha(),
        proxy: await testProxy(),
        brave: await testBraveSearch(),
        knowledgeGraph: await testGoogleKnowledgeGraph()
    };
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));
    
    const critical = ['openai', 'twocaptcha', 'proxy'];
    const optional = ['brave', 'knowledgeGraph'];
    
    let allCriticalPassed = true;
    
    critical.forEach(key => {
        const result = results[key];
        const status = result === true ? '✅ PASS' : result === false ? '❌ FAIL' : '⚠️  SKIP';
        console.log(`   ${key.toUpperCase().padEnd(20)} ${status}`);
        if (result === false) allCriticalPassed = false;
    });
    
    optional.forEach(key => {
        const result = results[key];
        const status = result === true ? '✅ PASS' : result === false ? '❌ FAIL' : '⚠️  NOT CONFIGURED';
        console.log(`   ${key.toUpperCase().padEnd(20)} ${status}`);
    });
    
    console.log('='.repeat(50));
    
    if (allCriticalPassed) {
        console.log('\n✅ All critical APIs are working!');
    } else {
        console.log('\n❌ Some critical APIs failed. Please check the errors above.');
    }
    
    return results;
}

// Run tests
runAllTests().catch(console.error);

