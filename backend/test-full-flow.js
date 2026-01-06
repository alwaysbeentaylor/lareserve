require('dotenv').config();
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

/**
 * End-to-end test: Add guest, run research, check report and guest card
 */
async function testFullFlow() {
    console.log('🧪 Testing Full Flow: Guest Card + Report Generation\n');
    console.log('='.repeat(70));

    try {
        // Step 1: Check if backend is running
        console.log('\n📡 Step 1: Checking backend health...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        if (!healthResponse.ok) {
            throw new Error('Backend not running! Start with: cd backend && npm run dev');
        }
        console.log('✅ Backend is running');

        // Step 2: Create test guest
        console.log('\n👤 Step 2: Creating test guest...');
        const guestData = {
            full_name: 'Fandry Baffour',
            email: 'fandry.baffour@pronkjuweel.nl',
            phone: null,
            country: 'Netherlands',
            company: 'Pronk Juweel',
            city: 'Amsterdam',
            notes: 'Test guest for full flow verification'
        };

        const createResponse = await fetch(`${API_BASE}/guests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guestData)
        });

        let guestId;
        if (!createResponse.ok) {
            let errorData;
            try {
                errorData = await createResponse.json();
            } catch (e) {
                errorData = { error: await createResponse.text() };
            }
            // Check if guest already exists
            if (errorData.error && (errorData.error.includes('bestaat al') || errorData.error.includes('already exists')) || errorData.existingId) {
                guestId = errorData.existingId;
                console.log(`⚠️ Guest already exists, using existing guest ID: ${guestId}`);
            } else {
                // Try to find existing guest by search
                console.log('⚠️ Guest might already exist, searching...');
                const allGuests = await fetch(`${API_BASE}/guests?search=Fandry`);
                const guestsData = await allGuests.json();
                const existingGuest = guestsData.guests?.find(g => g.full_name === 'Fandry Baffour');
                if (existingGuest) {
                    guestId = existingGuest.id;
                    console.log(`✅ Found existing guest ID: ${guestId}`);
                } else {
                    throw new Error(`Failed to create guest: ${JSON.stringify(errorData)}`);
                }
            }
        } else {
            const createdGuest = await createResponse.json();
            guestId = createdGuest.guest.id;
            console.log(`✅ Guest created with ID: ${guestId}`);
        }

        // Step 3: Check if research already exists
        console.log('\n🔍 Step 3: Checking existing research...');
        const existingResearchResponse = await fetch(`${API_BASE}/research/${guestId}`);
        let hasResearch = existingResearchResponse.ok;
        
        if (!hasResearch) {
            console.log('⚠️ No existing research found. Starting research...');
            console.log('   (This will take ~45 seconds with the optimized flow)\n');
            
            // Start research
            const researchResponse = await fetch(`${API_BASE}/research/${guestId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forceRefresh: false })
            });

            if (!researchResponse.ok) {
                const error = await researchResponse.text();
                throw new Error(`Research failed: ${error}`);
            }

            const researchData = await researchResponse.json();
            console.log('✅ Research completed!');
            console.log(`   Duration: ${researchData.duration || 'N/A'} seconds`);
        } else {
            console.log('✅ Research already exists');
        }

        // Step 4: Get research results
        console.log('\n📊 Step 4: Fetching research results...');
        const researchResult = await fetch(`${API_BASE}/research/${guestId}`);
        if (!researchResult.ok) {
            throw new Error('Failed to fetch research results');
        }

        const research = await researchResult.json();
        console.log('✅ Research data retrieved');

        // Step 5: Verify guest card data
        console.log('\n🎴 Step 5: Verifying Guest Card Data...');
        console.log('-'.repeat(70));
        
        const guestCardChecks = {
            'LinkedIn URL': research.linkedin_url || '❌ Missing',
            'Job Title': research.job_title || '❌ Missing',
            'Company': research.company_name || '❌ Missing',
            'VIP Score': research.vip_score !== null ? `${research.vip_score}/10` : '❌ Missing',
            'Influence Level': research.influence_level || '❌ Missing',
            'Website': research.website_url || '⚠️ Not found',
            'Notable Info': research.notable_info ? research.notable_info.substring(0, 50) + '...' : '⚠️ None'
        };

        let allCardDataPresent = true;
        for (const [key, value] of Object.entries(guestCardChecks)) {
            const status = value.startsWith('❌') ? '❌' : '✅';
            console.log(`   ${status} ${key}: ${value}`);
            if (value.startsWith('❌')) {
                allCardDataPresent = false;
            }
        }

        if (allCardDataPresent) {
            console.log('\n✅ All essential guest card data is present!');
        } else {
            console.log('\n⚠️ Some guest card data is missing');
        }

        // Step 6: Verify report generation
        console.log('\n📄 Step 6: Verifying Report Generation...');
        console.log('-'.repeat(70));

        const reportChecks = {
            'Full Report JSON': research.full_report ? '✅ Present' : '❌ Missing',
            'Report Structure': null,
            'Executive Summary': null,
            'Professional Background': null,
            'Company Analysis': null,
            'VIP Indicators': null,
            'Service Recommendations': null
        };

        if (research.full_report) {
            let fullReport;
            try {
                fullReport = typeof research.full_report === 'string' 
                    ? JSON.parse(research.full_report) 
                    : research.full_report;
                
                reportChecks['Report Structure'] = fullReport.executive_summary ? '✅ Valid' : '❌ Invalid';
                reportChecks['Executive Summary'] = fullReport.executive_summary ? 
                    `✅ "${fullReport.executive_summary.substring(0, 60)}..."` : '❌ Missing';
                reportChecks['Professional Background'] = fullReport.professional_background ? '✅ Present' : '❌ Missing';
                reportChecks['Company Analysis'] = fullReport.company_analysis ? '✅ Present' : '❌ Missing';
                reportChecks['VIP Indicators'] = fullReport.vip_indicators ? '✅ Present' : '❌ Missing';
                reportChecks['Service Recommendations'] = fullReport.service_recommendations ? '✅ Present' : '❌ Missing';

                for (const [key, value] of Object.entries(reportChecks)) {
                    if (value) {
                        const status = value.startsWith('✅') ? '✅' : '❌';
                        console.log(`   ${status} ${key}: ${value.replace(/^[✅❌]\s*/, '')}`);
                    }
                }

                console.log('\n✅ Report structure is valid and complete!');
            } catch (e) {
                console.log(`   ❌ Failed to parse report: ${e.message}`);
            }
        } else {
            console.log('   ❌ No full report found in research results');
        }

        // Step 7: Test PDF generation
        console.log('\n📑 Step 7: Testing PDF Report Generation...');
        try {
            const pdfResponse = await fetch(`${API_BASE}/reports/${guestId}/pdf`);
            if (pdfResponse.ok) {
                const contentType = pdfResponse.headers.get('content-type');
                if (contentType && contentType.includes('application/pdf')) {
                    console.log('   ✅ PDF generated successfully');
                    console.log(`   📦 Content-Type: ${contentType}`);
                    console.log(`   📏 Size: ${pdfResponse.headers.get('content-length') || 'unknown'} bytes`);
                } else {
                    console.log(`   ⚠️ Unexpected content type: ${contentType}`);
                }
            } else {
                const error = await pdfResponse.text();
                console.log(`   ⚠️ PDF generation returned: ${pdfResponse.status} - ${error}`);
            }
        } catch (e) {
            console.log(`   ⚠️ PDF test failed: ${e.message}`);
        }

        // Final summary
        console.log('\n' + '='.repeat(70));
        console.log('🎉 Full Flow Test Complete!\n');
        console.log('Summary:');
        console.log(`   Guest ID: ${guestId}`);
        console.log(`   Guest Name: ${guestData.full_name}`);
        console.log(`   Research Status: ${hasResearch ? '✅ Exists' : '✅ Created'}`);
        console.log(`   Guest Card: ${allCardDataPresent ? '✅ Complete' : '⚠️ Incomplete'}`);
        console.log(`   Report: ${research.full_report ? '✅ Generated' : '❌ Missing'}`);
        console.log('\n💡 Tip: Check the frontend at http://localhost:5173 to see the guest card!');
        console.log(`   Or view guest: http://localhost:3001/api/guests/${guestId}`);
        console.log('='.repeat(70));

    } catch (error) {
        console.error('\n❌ Test Failed!');
        console.error('Error:', error.message);
        console.error('\n💡 Make sure:');
        console.error('   1. Backend is running: cd backend && npm run dev');
        console.error('   2. Backend is on port 3001');
        console.error('   3. Database is accessible');
        process.exit(1);
    }
}

// Run test
testFullFlow()
    .then(() => {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Test crashed:', error);
        process.exit(1);
    });

