require('dotenv').config();
const smartSearch = require('./src/services/smartSearch');

/**
 * Test the complete search flow for a guest
 */
async function testSearchFlow() {
    console.log('🚀 Testing Complete Search Flow\n');
    console.log('='.repeat(60));
    
    // Test with Lee Hope (email domain should reveal company: Know Your VIP)
    const testGuest = {
        id: 999,
        full_name: 'Lee Hope',
        email: 'info@knowyourvip.com',
        phone: null,
        country: 'Netherlands',
        company: null, // No company provided - should be extracted from email domain
        city: null,
        notes: null,
        created_at: new Date().toISOString()
    };
    
    console.log('\n📋 Test Guest:');
    console.log(`   Name: ${testGuest.full_name}`);
    console.log(`   Company: ${testGuest.company}`);
    console.log(`   Country: ${testGuest.country}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Starting Search Flow...\n');
    
    try {
        const startTime = Date.now();
        
        // This will run the complete flow:
        // 1. Knowledge Graph check
        // 2. Google Search
        // 3. Brave Search (if needed)
        // 4. AI Analysis
        // 5. Social media extraction
        const result = await smartSearch.searchGuest(testGuest);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Search Flow Completed!\n');
        console.log(`⏱️  Duration: ${duration} seconds`);
        console.log('\n📊 Results Summary:');
        console.log('-'.repeat(60));
        
        if (result) {
            console.log(`✅ LinkedIn URL: ${result.linkedinUrl || 'Not found'}`);
            console.log(`✅ LinkedIn Candidates: ${result.linkedinCandidates?.length || 0}`);
            console.log(`✅ Instagram: ${result.instagramHandle || result.instagramUrl || 'Not found'}`);
            console.log(`✅ Twitter: ${result.twitterHandle || result.twitterUrl || 'Not found'}`);
            console.log(`✅ Website: ${result.websiteUrl || 'Not found'}`);
            console.log(`✅ Job Title: ${result.jobTitle || 'Not found'}`);
            console.log(`✅ Company: ${result.companyName || 'Not found'}`);
            console.log(`✅ VIP Score: ${result.vipScore || 'Not calculated'}`);
            console.log(`✅ Influence Level: ${result.influenceLevel || 'Not calculated'}`);
            console.log(`✅ Profile Photo: ${result.profilePhotoUrl ? 'Found' : 'Not found'}`);
            
            if (result.fullReport) {
                const report = typeof result.fullReport === 'string' 
                    ? JSON.parse(result.fullReport) 
                    : result.fullReport;
                console.log(`✅ Full Report: ${report.executive_summary ? 'Generated' : 'Not generated'}`);
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ ALL SYSTEMS WORKING!');
            return true;
        } else {
            console.log('❌ No results returned');
            return false;
        }
        
    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ Search Flow Failed!\n');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run test
testSearchFlow()
    .then(success => {
        if (success) {
            console.log('\n🎉 Test completed successfully!');
            process.exit(0);
        } else {
            console.log('\n⚠️  Test completed with issues');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 Test crashed:', error);
        process.exit(1);
    });

